import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { TEST_COVERAGE_ANALYZER_PROMPT } from '../prompts/index.js';

/**
 * Test Coverage Analyzer subagent
 * Evaluates test completeness and suggests specific test cases.
 */
export const testCoverageAnalyzer: AgentDefinition = {
  description:
    'Evaluates test completeness by comparing source files with test files, identifies untested code paths, and suggests specific test cases. Use this agent to analyze test coverage.',
  model: 'inherit',
  tools: ['Read', 'Grep', 'Glob', 'Skill'],
  prompt: TEST_COVERAGE_ANALYZER_PROMPT
};
