import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  CodeQualityResultSchema,
  TestCoverageResultSchema,
  RefactoringSuggestionSchema,
  ReviewReportSchema,
  CodeQualityResultJSONSchema,
  TestCoverageResultJSONSchema,
  RefactoringSuggestionJSONSchema,
  ReviewReportJSONSchema
} from '../src/types/index.js';
import {
  ReviewError,
  ErrorCodes,
  withRetry,
  withTimeout,
  isReviewError,
  formatError
} from '../src/utils/error-handler.js';
import { RateLimiter } from '../src/utils/rate-limiter.js';
import { CodeReviewOrchestrator } from '../src/orchestrator.js';

// ─── Schema Validation Tests ────────────────────────────────────────────────

describe('CodeQualityResultSchema', () => {
  const validData = {
    file: 'src/app.ts',
    issues: [
      {
        line: 10,
        severity: 'high' as const,
        category: 'security' as const,
        description: 'Hardcoded secret found',
        suggestion: 'Use environment variables'
      }
    ],
    overallScore: 75,
    summary: 'Generally good code quality'
  };

  it('should accept valid data', () => {
    expect(() => CodeQualityResultSchema.parse(validData)).not.toThrow();
  });

  it('should accept empty issues array', () => {
    const data = { ...validData, issues: [] };
    expect(() => CodeQualityResultSchema.parse(data)).not.toThrow();
  });

  it('should accept boundary scores', () => {
    expect(() => CodeQualityResultSchema.parse({ ...validData, overallScore: 0 })).not.toThrow();
    expect(() => CodeQualityResultSchema.parse({ ...validData, overallScore: 100 })).not.toThrow();
  });

  it('should reject score out of range', () => {
    expect(() => CodeQualityResultSchema.parse({ ...validData, overallScore: -1 })).toThrow();
    expect(() => CodeQualityResultSchema.parse({ ...validData, overallScore: 101 })).toThrow();
  });

  it('should reject invalid severity', () => {
    const bad = {
      ...validData,
      issues: [{ ...validData.issues[0], severity: 'extreme' }]
    };
    expect(() => CodeQualityResultSchema.parse(bad)).toThrow();
  });

  it('should reject missing required fields', () => {
    expect(() => CodeQualityResultSchema.parse({})).toThrow();
    expect(() => CodeQualityResultSchema.parse({ file: 'x' })).toThrow();
  });
});

describe('TestCoverageResultSchema', () => {
  const validData = {
    file: 'src/utils.ts',
    hasTests: true,
    testFiles: ['tests/utils.test.ts'],
    untestedPaths: [
      {
        type: 'function' as const,
        location: 'parseInput()',
        priority: 'high' as const,
        reasoning: 'Core parsing logic has no tests',
        suggestedTest: 'it("should parse valid input", () => { ... })'
      }
    ],
    coverageEstimate: 60,
    summary: 'Partial coverage'
  };

  it('should accept valid data', () => {
    expect(() => TestCoverageResultSchema.parse(validData)).not.toThrow();
  });

  it('should accept empty arrays', () => {
    const data = { ...validData, testFiles: [], untestedPaths: [] };
    expect(() => TestCoverageResultSchema.parse(data)).not.toThrow();
  });

  it('should reject invalid type enum', () => {
    const bad = {
      ...validData,
      untestedPaths: [{ ...validData.untestedPaths[0], type: 'module' }]
    };
    expect(() => TestCoverageResultSchema.parse(bad)).toThrow();
  });
});

describe('RefactoringSuggestionSchema', () => {
  const validData = {
    file: 'src/handler.ts',
    suggestions: [
      {
        type: 'modernize' as const,
        location: 'fetchData()',
        impact: 'high' as const,
        description: 'Replace callbacks with async/await',
        before: 'fetch(url, (err, res) => { ... })',
        after: 'const res = await fetch(url);',
        benefits: 'Improved readability and error handling'
      }
    ],
    summary: 'Several modernization opportunities'
  };

  it('should accept valid data', () => {
    expect(() => RefactoringSuggestionSchema.parse(validData)).not.toThrow();
  });

  it('should accept empty suggestions', () => {
    const data = { ...validData, suggestions: [] };
    expect(() => RefactoringSuggestionSchema.parse(data)).not.toThrow();
  });

  it('should reject invalid type', () => {
    const bad = {
      ...validData,
      suggestions: [{ ...validData.suggestions[0], type: 'rewrite' }]
    };
    expect(() => RefactoringSuggestionSchema.parse(bad)).toThrow();
  });
});

describe('ReviewReportSchema', () => {
  const validReport = {
    pullRequest: { owner: 'test', repo: 'repo', number: 1 },
    fileReviews: [
      {
        file: 'src/app.ts',
        codeQuality: {
          file: 'src/app.ts',
          issues: [],
          overallScore: 85,
          summary: 'Good'
        },
        testCoverage: {
          file: 'src/app.ts',
          hasTests: true,
          testFiles: ['tests/app.test.ts'],
          untestedPaths: [],
          coverageEstimate: 80,
          summary: 'Well tested'
        },
        refactorings: {
          file: 'src/app.ts',
          suggestions: [],
          summary: 'Clean code'
        }
      }
    ],
    summary: {
      totalFiles: 1,
      overallScore: 85,
      criticalIssues: 0,
      highPriorityTests: 0,
      refactoringOpportunities: 0
    },
    recommendations: [
      {
        priority: 'low' as const,
        category: 'maintenance',
        description: 'Add more inline docs',
        files: ['src/app.ts']
      }
    ],
    metadata: {
      analyzedAt: '2025-01-15T10:00:00Z',
      duration: 5000,
      agentVersions: {
        orchestrator: '1.0.0',
        'code-quality-analyzer': '1.0.0'
      }
    }
  };

  it('should accept valid report', () => {
    expect(() => ReviewReportSchema.parse(validReport)).not.toThrow();
  });

  it('should reject missing pullRequest', () => {
    const { pullRequest, ...rest } = validReport;
    expect(() => ReviewReportSchema.parse(rest)).toThrow();
  });

  it('should reject invalid priority enum', () => {
    const bad = {
      ...validReport,
      recommendations: [{ ...validReport.recommendations[0], priority: 'urgent' }]
    };
    expect(() => ReviewReportSchema.parse(bad)).toThrow();
  });
});

// ─── JSON Schema Export Tests ───────────────────────────────────────────────

describe('JSON Schema exports', () => {
  it('should produce valid JSON schema for CodeQualityResult', () => {
    expect(CodeQualityResultJSONSchema).toBeDefined();
    expect(typeof CodeQualityResultJSONSchema).toBe('object');
    expect(CodeQualityResultJSONSchema).toHaveProperty('type');
  });

  it('should produce valid JSON schema for TestCoverageResult', () => {
    expect(TestCoverageResultJSONSchema).toBeDefined();
    expect(typeof TestCoverageResultJSONSchema).toBe('object');
  });

  it('should produce valid JSON schema for RefactoringSuggestion', () => {
    expect(RefactoringSuggestionJSONSchema).toBeDefined();
    expect(typeof RefactoringSuggestionJSONSchema).toBe('object');
  });

  it('should produce valid JSON schema for ReviewReport', () => {
    expect(ReviewReportJSONSchema).toBeDefined();
    expect(typeof ReviewReportJSONSchema).toBe('object');
    expect(ReviewReportJSONSchema).toHaveProperty('type');
  });
});

// ─── Error Handler Tests ────────────────────────────────────────────────────

describe('withRetry', () => {
  it('should return result on first success', async () => {
    const result = await withRetry(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it('should retry and succeed', async () => {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts++;
      if (attempts < 3) throw new Error('fail');
      return 'ok';
    }, 3, 10);
    expect(result).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('should throw RETRY_EXHAUSTED after max retries', async () => {
    await expect(
      withRetry(() => Promise.reject(new Error('always fails')), 2, 10)
    ).rejects.toThrow(/failed after 2 retries/);
  });
});

describe('withTimeout', () => {
  it('should return result before timeout', async () => {
    const result = await withTimeout(() => Promise.resolve('fast'), 1000);
    expect(result).toBe('fast');
  });

  it('should throw on timeout', async () => {
    await expect(
      withTimeout(
        () => new Promise(resolve => setTimeout(resolve, 5000)),
        50,
        'Too slow'
      )
    ).rejects.toThrow('Too slow');
  });
});

describe('Error utilities', () => {
  it('isReviewError identifies ReviewError', () => {
    const err = new ReviewError('test', ErrorCodes.UNKNOWN_ERROR);
    expect(isReviewError(err)).toBe(true);
    expect(isReviewError(new Error('nope'))).toBe(false);
  });

  it('formatError formats ReviewError', () => {
    const err = new ReviewError('bad', ErrorCodes.AGENT_TIMEOUT);
    expect(formatError(err)).toBe('[AGENT_TIMEOUT] bad');
  });

  it('formatError handles plain errors', () => {
    expect(formatError(new Error('oops'))).toBe('oops');
    expect(formatError('string error')).toBe('string error');
  });
});

// ─── Rate Limiter Tests ─────────────────────────────────────────────────────

describe('RateLimiter', () => {
  it('canProceed returns true when under limits', () => {
    const limiter = new RateLimiter({ maxConcurrent: 5, maxRequestsPerMinute: 50, maxTokensPerMinute: 100000 });
    expect(limiter.canProceed(1000)).toBe(true);
  });

  it('acquire and release cycle works', async () => {
    const limiter = new RateLimiter({ maxConcurrent: 1, maxRequestsPerMinute: 50, maxTokensPerMinute: 100000 });
    await limiter.acquire(500);
    const status = limiter.getStatus();
    expect(status.activeRequests).toBe(1);
    expect(status.requestsInWindow).toBe(1);
    limiter.release();
    expect(limiter.getStatus().activeRequests).toBe(0);
  });

  it('getStatus reports correct values', async () => {
    const limiter = new RateLimiter();
    await limiter.acquire(2000);
    const status = limiter.getStatus();
    expect(status.requestsInWindow).toBe(1);
    expect(status.tokensInWindow).toBe(2000);
    limiter.release();
  });
});

// ─── Orchestrator Tests ─────────────────────────────────────────────────────

describe('CodeReviewOrchestrator', () => {
  it('should initialize with default options', () => {
    const orchestrator = new CodeReviewOrchestrator();
    expect(orchestrator).toBeDefined();
  });

  it('should accept custom options', () => {
    const orchestrator = new CodeReviewOrchestrator({ maxTurns: 50 });
    expect(orchestrator).toBeDefined();
  });

  describe('Integration', () => {
    it.skip('should review a real small PR', async () => {
      // Requires valid API keys — run manually
      const orchestrator = new CodeReviewOrchestrator();
      const report = await orchestrator.reviewPullRequest('octocat', 'Hello-World', 1);
      expect(report).toBeDefined();
      expect(report.pullRequest.number).toBe(1);
    });
  });
});
