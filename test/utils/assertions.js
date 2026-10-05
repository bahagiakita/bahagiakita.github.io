/**
 * E2E Test Suite Assertions Helper
 * Provides strict, self-documenting assertions with diagnostic metadata
 */

export class AssertionError extends Error {
  constructor(message, { expected, actual, featureId, milestone, tier } = {}) {
    super(message);
    this.name = 'AssertionError';
    this.expected = expected;
    this.actual = actual;
    this.featureId = featureId;
    this.milestone = milestone;
    this.tier = tier;
  }
}

export function assert(condition, message = 'Assertion failed', meta = {}) {
  if (!condition) {
    throw new AssertionError(message, {
      expected: true,
      actual: Boolean(condition),
      ...meta
    });
  }
}

export function assertEqual(actual, expected, message, meta = {}) {
  if (actual !== expected) {
    const msg = message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`;
    throw new AssertionError(msg, { expected, actual, ...meta });
  }
}

export function assertDeepEqual(actual, expected, message, meta = {}) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    const msg = message || `Deep equal mismatch:\nExpected: ${expectedStr}\nActual:   ${actualStr}`;
    throw new AssertionError(msg, { expected, actual, ...meta });
  }
}

export function assertIncludes(haystack, needle, message, meta = {}) {
  const contains = Array.isArray(haystack) || typeof haystack === 'string'
    ? haystack.includes(needle)
    : false;
  if (!contains) {
    const msg = message || `Expected target to include ${JSON.stringify(needle)}`;
    throw new AssertionError(msg, { expected: `include(${needle})`, actual: haystack, ...meta });
  }
}

export function assertNotIncludes(haystack, needle, message, meta = {}) {
  const contains = Array.isArray(haystack) || typeof haystack === 'string'
    ? haystack.includes(needle)
    : false;
  if (contains) {
    const msg = message || `Expected target NOT to include ${JSON.stringify(needle)}`;
    throw new AssertionError(msg, { expected: `not_include(${needle})`, actual: haystack, ...meta });
  }
}

export function assertMatches(str, regex, message, meta = {}) {
  if (typeof str !== 'string' || !regex.test(str)) {
    const msg = message || `Expected string to match ${regex}`;
    throw new AssertionError(msg, { expected: regex.toString(), actual: str, ...meta });
  }
}

export function assertGreaterThanOrEqual(actual, expected, message, meta = {}) {
  if (typeof actual !== 'number' || actual < expected) {
    const msg = message || `Expected ${actual} >= ${expected}`;
    throw new AssertionError(msg, { expected: `>= ${expected}`, actual, ...meta });
  }
}

export function assertThrows(fn, expectedRegexOrType, message, meta = {}) {
  let threw = false;
  let errorCaught = null;
  try {
    fn();
  } catch (err) {
    threw = true;
    errorCaught = err;
  }
  if (!threw) {
    throw new AssertionError(message || 'Expected function to throw an error', {
      expected: 'throw',
      actual: 'no throw',
      ...meta
    });
  }
  if (expectedRegexOrType instanceof RegExp) {
    if (!expectedRegexOrType.test(errorCaught.message)) {
      throw new AssertionError(
        message || `Expected error message to match ${expectedRegexOrType}, got "${errorCaught.message}"`,
        { expected: expectedRegexOrType.toString(), actual: errorCaught.message, ...meta }
      );
    }
  }
}
