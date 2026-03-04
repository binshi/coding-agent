import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { REFACTORING_SUGGESTER_PROMPT } from '../prompts/index.js';

/**
 * Refactoring Suggester subagent
 * Identifies opportunities to improve code structure and modernize patterns.
 */
export const refactoringSuggester: AgentDefinition = {
  description:
    'Identifies opportunities to improve code structure, modernize patterns, and enhance readability. Use this agent to suggest refactoring improvements with before/after examples.',
  model: 'inherit',
  tools: ['Read', 'Grep', 'Glob', 'Skill'],
  prompt: REFACTORING_SUGGESTER_PROMPT
};
