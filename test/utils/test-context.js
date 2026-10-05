/**
 * Test Context & Runner Core
 * Manages test suite registration, filtering, execution, and reporting
 */

export class TestRegistry {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
  }

  describe(name, fn, options = {}) {
    const suite = {
      name,
      options,
      tests: [],
      beforeAll: [],
      afterAll: [],
      beforeEach: [],
      afterEach: []
    };
    this.suites.push(suite);
    const prevSuite = this.currentSuite;
    this.currentSuite = suite;
    try {
      fn();
    } finally {
      this.currentSuite = prevSuite;
    }
  }

  test(name, fn, options = {}) {
    if (!this.currentSuite) {
      this.describe('Default Suite', () => {
        this.test(name, fn, options);
      });
      return;
    }
    this.currentSuite.tests.push({
      name,
      fn,
      options: {
        tier: options.tier || 1,
        milestone: options.milestone || 'M1',
        featureId: options.featureId || 'General',
        ...options
      }
    });
  }

  beforeAll(fn) {
    if (this.currentSuite) this.currentSuite.beforeAll.push(fn);
  }

  afterAll(fn) {
    if (this.currentSuite) this.currentSuite.afterAll.push(fn);
  }

  beforeEach(fn) {
    if (this.currentSuite) this.currentSuite.beforeEach.push(fn);
  }

  afterEach(fn) {
    if (this.currentSuite) this.currentSuite.afterEach.push(fn);
  }

  async run(filters = {}) {
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      durationMs: 0,
      suites: []
    };

    const startTime = Date.now();

    for (const suite of this.suites) {
      // Filter suite by name if filter provided (normalize spaces/hyphens)
      if (filters.suite) {
        const normSuite = suite.name.toLowerCase().replace(/[-_]/g, ' ');
        const normFilter = filters.suite.toLowerCase().replace(/[-_]/g, ' ');
        const keywords = normFilter.split(/\s+/).filter(Boolean);
        const matches = keywords.every(kw => normSuite.includes(kw));
        if (!matches) {
          continue;
        }
      }

      const suiteResult = {
        name: suite.name,
        tests: [],
        passed: 0,
        failed: 0,
        skipped: 0,
        durationMs: 0
      };

      const suiteStart = Date.now();

      // Run beforeAll
      for (const hook of suite.beforeAll) {
        await hook();
      }

      for (const t of suite.tests) {
        // Check tier filter
        if (filters.tier && Number(t.options.tier) !== Number(filters.tier)) {
          continue;
        }
        // Check milestone filter
        if (filters.milestone && t.options.milestone.toUpperCase() !== filters.milestone.toUpperCase()) {
          continue;
        }
        // Check featureId filter
        if (filters.featureId && t.options.featureId.toUpperCase() !== filters.featureId.toUpperCase()) {
          continue;
        }

        results.total++;
        const testRecord = {
          name: t.name,
          tier: t.options.tier,
          milestone: t.options.milestone,
          featureId: t.options.featureId,
          status: 'pending',
          durationMs: 0,
          error: null
        };

        const testStart = Date.now();
        try {
          for (const hook of suite.beforeEach) {
            await hook();
          }

          await t.fn();

          for (const hook of suite.afterEach) {
            await hook();
          }

          testRecord.status = 'passed';
          results.passed++;
          suiteResult.passed++;
        } catch (err) {
          testRecord.status = 'failed';
          testRecord.error = {
            message: err.message,
            stack: err.stack,
            expected: err.expected,
            actual: err.actual,
            featureId: t.options.featureId,
            milestone: t.options.milestone
          };
          results.failed++;
          suiteResult.failed++;
        } finally {
          testRecord.durationMs = Date.now() - testStart;
          suiteResult.tests.push(testRecord);
        }
      }

      // Run afterAll
      for (const hook of suite.afterAll) {
        await hook();
      }

      suiteResult.durationMs = Date.now() - suiteStart;
      if (suiteResult.tests.length > 0) {
        results.suites.push(suiteResult);
      }
    }

    results.durationMs = Date.now() - startTime;
    return results;
  }
}

// Global default registry singleton
export const defaultRegistry = new TestRegistry();
export const describe = defaultRegistry.describe.bind(defaultRegistry);
export const it = defaultRegistry.test.bind(defaultRegistry);
export const test = defaultRegistry.test.bind(defaultRegistry);
export const beforeAll = defaultRegistry.beforeAll.bind(defaultRegistry);
export const afterAll = defaultRegistry.afterAll.bind(defaultRegistry);
export const beforeEach = defaultRegistry.beforeEach.bind(defaultRegistry);
export const afterEach = defaultRegistry.afterEach.bind(defaultRegistry);
