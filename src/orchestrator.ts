import { query } from '@anthropic-ai/claude-agent-sdk';
import { ReviewReportSchema, ReviewReportJSONSchema } from './types/index.js';
import type { ReviewReport } from './types/index.js';
import { mcpServersConfig } from './config/mcp.config.js';
import { buildOrchestratorPrompt } from './prompts/index.js';
import {
  codeQualityAnalyzer,
  testCoverageAnalyzer,
  refactoringSuggester
} from './agents/index.js';
import { logger } from './utils/index.js';
import { withRetry, withTimeout } from './utils/error-handler.js';

/**
 * Orchestrator configuration options
 */
export interface OrchestratorOptions {
  maxTurns?: number;
}

/**
 * Main Code Review Orchestrator
 * Coordinates subagents to analyze pull requests and generate comprehensive reports
 */
export class CodeReviewOrchestrator {
  private maxTurns: number;

  constructor(options: OrchestratorOptions = {}) {
    this.maxTurns = options.maxTurns ?? 75;
  }

  /**
   * Review a pull request using parallel subagent analysis
   */
  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    const model = process.env.ANTHROPIC_MODEL;
    if (!model) {
      throw new Error('ANTHROPIC_MODEL environment variable is required');
    }

    logger.info('Starting PR review', { owner, repo, prNumber, model });

    const prompt = buildOrchestratorPrompt(owner, repo, prNumber);

    const report = await withRetry(
      () => withTimeout(
        () => this.executeReview(prompt, model),
        600000,
        `Review of ${owner}/${repo}#${prNumber} timed out`
      ),
      2,
      5000
    );

    logger.info('PR review completed', {
      owner,
      repo,
      prNumber,
      score: report.summary.overallScore
    });

    return report;
  }

  /**
   * Execute the actual review query against the SDK
   */
  private async executeReview(prompt: string, model: string): Promise<ReviewReport> {    const result = query({
      prompt,
      options: {
        model,
        mcpServers: mcpServersConfig,
        agents: {
          'code-quality-analyzer': codeQualityAnalyzer,
          'test-coverage-analyzer': testCoverageAnalyzer,
          'refactoring-suggester': refactoringSuggester
        },
        allowedTools: [
          'Task',
          'mcp__github__get_pull_request',
          'mcp__github__list_pull_request_files',
          'mcp__github__get_file_contents',
          'mcp__eslint__lint'
        ],
        maxTurns: this.maxTurns,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        outputFormat: {
          type: 'json_schema',
          schema: ReviewReportJSONSchema
        }
      }
    });

    let report: ReviewReport | undefined;

    for await (const message of result) {
      if (message.type === 'result') {
        if (message.subtype === 'success' && message.structured_output) {
          const parsed = ReviewReportSchema.safeParse(message.structured_output);
          if (parsed.success) {
            report = parsed.data;
          } else {
            logger.error('Zod validation failed', {
              errors: parsed.error.issues
            });
            throw new Error(
              `Structured output validation failed: ${parsed.error.issues.map(i => i.message).join(', ')}`
            );
          }
        } else if (message.subtype !== 'success') {
          const errors = 'errors' in message ? message.errors : [];
          throw new Error(
            `Orchestrator failed (${message.subtype}): ${errors.join(', ')}`
          );
        }
      }
    }

    if (!report) {
      throw new Error('No structured output received from orchestrator');
    }

    return report;
  }
}
