// Plain script (not a module) so the app also works when index.html is opened
// straight from disk. Everything is shared through one global: window.PickColor.
(function () {
  "use strict";
  const PickColor = (globalThis.PickColor = globalThis.PickColor || {});

  /**
   * A tiny test harness with no dependencies. The same test files run in the
   * browser (tests/index.html) and in Node (node tests/run.mjs).
   */

  const registered = [];

  function test(name, fn) {
    registered.push({ name, fn });
  }

  class AssertionError extends Error {}

  function assert(condition, message = "Expected condition to be true") {
    if (!condition) throw new AssertionError(message);
  }

  function equal(actual, expected, message) {
    if (!Object.is(actual, expected)) {
      throw new AssertionError(
        `${message ? message + ": " : ""}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      );
    }
  }

  function deepEqual(actual, expected, message) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) throw new AssertionError(`${message ? message + ": " : ""}expected ${b}, got ${a}`);
  }

  async function run() {
    const results = [];
    for (const { name, fn } of registered) {
      try {
        await fn();
        results.push({ name, ok: true });
      } catch (error) {
        results.push({ name, ok: false, message: error?.message ?? String(error) });
      }
    }
    return results;
  }

  PickColor.testHarness = {
    test,
    AssertionError,
    assert,
    equal,
    deepEqual,
    run,
  };
})();
