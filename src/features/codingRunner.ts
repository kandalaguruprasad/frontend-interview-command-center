import type { CodingProblem, CodingTest } from '../types';
import { deepEqual } from '../lib/dates';

const TIMEOUT_MS = 5000;

export interface TestResult {
  desc: string;
  pass: boolean;
  error?: string;
  actual?: unknown;
  expected?: unknown;
}

export async function runCodingTests(
  problem: CodingProblem,
  code: string,
  usedHints: boolean,
): Promise<{
  results: TestResult[];
  progress: 'tests_partial' | 'solved_no_help' | 'solved_with_hints' | 'attempted';
}> {
  const results: TestResult[] = [];

  for (const test of problem.tests) {
    try {
      const actual = await runSingle(problem.functionName, code, test);
      const pass = deepEqual(actual, test.expected);
      results.push({ desc: test.desc, pass, actual, expected: test.expected });
    } catch (e) {
      results.push({
        desc: test.desc,
        pass: false,
        error: e instanceof Error ? e.message : String(e),
        expected: test.expected,
      });
    }
  }

  const passed = results.filter((r) => r.pass).length;
  if (passed === 0) return { results, progress: 'attempted' };
  if (passed < results.length) return { results, progress: 'tests_partial' };
  return {
    results,
    progress: usedHints ? 'solved_with_hints' : 'solved_no_help',
  };
}

function runSingle(fnName: string, code: string, test: CodingTest): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const workerCode = `
      self.onmessage = function(e) {
        try {
          var code = e.data.code;
          var fnName = e.data.fnName;
          var args = e.data.args;
          var fn = new Function(code + ";\\nif (typeof " + fnName + " !== 'function') throw new Error('Define function " + fnName + "');\\nreturn " + fnName + ";")();
          var result = fn.apply(null, args);
          self.postMessage({ ok: true, result: result });
        } catch (err) {
          self.postMessage({ ok: false, error: String(err && err.message ? err.message : err) });
        }
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    const timer = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error('Timed out'));
    }, TIMEOUT_MS);

    worker.onmessage = (e: MessageEvent<{ ok: boolean; result?: unknown; error?: string }>) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      if (e.data.ok) resolve(e.data.result);
      else reject(new Error(e.data.error || 'Error'));
    };
    worker.onerror = (err) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error(err.message || 'Worker error'));
    };
    worker.postMessage({ code, fnName, args: test.args });
  });
}
