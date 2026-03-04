import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

import { CodeReviewOrchestrator } from './orchestrator.js';
import { ReportGenerator } from './utils/report-generator.js';
import { formatError } from './utils/error-handler.js';

/**
 * Main entry point for the Claude Multi-Agent Code Review System
 * Usage: npm run dev -- <owner> <repo> <pr-number>
 */
async function main() {
  const [owner, repo, prStr] = process.argv.slice(2);

  // Validate command-line arguments
  if (!owner || !repo || !prStr) {
    console.error('Usage: npm run dev -- <owner> <repo> <pr-number>');
    console.error('Example: npm run dev -- airaamane simple-todo-app 1');
    process.exit(1);
  }

  const prNumber = parseInt(prStr, 10);
  if (isNaN(prNumber) || prNumber <= 0) {
    console.error('Error: PR number must be a positive integer');
    console.error(`Received: "${prStr}"`);
    process.exit(1);
  }

  // Validate authentication
  const hasAnthropicAPI = !!process.env.ANTHROPIC_API_KEY;
  const hasAWSCredentials = !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );

  if (!hasAnthropicAPI && !hasAWSCredentials) {
    console.error('Authentication required. Set one of:');
    console.error('  - ANTHROPIC_API_KEY, or');
    console.error('  - AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY + AWS_REGION');
    process.exit(1);
  }

  if (hasAWSCredentials && !process.env.AWS_REGION) {
    console.error('Error: AWS_REGION is required when using AWS credentials');
    process.exit(1);
  }

  console.log(
    `🔐 Using ${hasAnthropicAPI ? 'Anthropic API' : 'AWS Bedrock'} authentication`
  );

  // Validate model
  if (!process.env.ANTHROPIC_MODEL) {
    console.error('Error: ANTHROPIC_MODEL environment variable is required');
    console.error('Examples:');
    console.error('  For Anthropic API: ANTHROPIC_MODEL=claude-sonnet-4-5-20250929');
    console.error(
      '  For AWS Bedrock:  ANTHROPIC_MODEL=us.anthropic.claude-sonnet-4-5-20250929-v1:0'
    );
    process.exit(1);
  }

  console.log(`📋 Reviewing PR #${prNumber} in ${owner}/${repo}...`);
  console.log(`🤖 Model: ${process.env.ANTHROPIC_MODEL}`);

  try {
    const orchestrator = new CodeReviewOrchestrator();
    const report = await orchestrator.reviewPullRequest(owner, repo, prNumber);

    // Generate reports
    const generator = new ReportGenerator();
    const reportsDir = path.resolve('reports');

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const baseName = `${owner}_${repo}_${prNumber}`;

    const jsonPath = path.join(reportsDir, `${baseName}.json`);
    fs.writeFileSync(jsonPath, generator.generateJSONReport(report), 'utf-8');
    console.log(`✅ JSON report saved: ${jsonPath}`);

    const mdPath = path.join(reportsDir, `${baseName}.md`);
    fs.writeFileSync(mdPath, generator.generateMarkdownReport(report), 'utf-8');
    console.log(`✅ Markdown report saved: ${mdPath}`);

    const htmlPath = path.join(reportsDir, `${baseName}.html`);
    fs.writeFileSync(htmlPath, generator.generateHTMLReport(report), 'utf-8');
    console.log(`✅ HTML report saved: ${htmlPath}`);

    console.log(`\n🎉 Review complete! Overall score: ${report.summary.overallScore}/100`);
  } catch (error) {
    console.error(`\n❌ Review failed: ${formatError(error)}`);
    process.exit(1);
  }
}

main();
