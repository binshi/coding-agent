import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { CODE_QUALITY_ANALYZER_PROMPT } from '../prompts/index.js';

/**
 * Code Quality Analyzer subagent
 * Analyzes code for security, performance, maintainability, and best practices.
 * Includes the Skill tool to leverage Claude Skills for specialized analysis.
 */
export const codeQualityAnalyzer: AgentDefinition = {
  description:
    'Analyzes code for security vulnerabilities, performance issues, maintainability concerns, and best practice violations. Use this agent to review source code files for quality issues.',
  model: 'inherit',
  tools: ['Read', 'Grep', 'Glob', 'Skill'],
  prompt: CODE_QUALITY_ANALYZER_PROMPT
};
