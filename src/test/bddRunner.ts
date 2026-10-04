/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BddStep {
  type: 'given' | 'when' | 'then' | 'and';
  description: string;
  passed: boolean;
  error?: string;
}

export interface BddScenarioResult {
  title: string;
  passed: boolean;
  steps: BddStep[];
  error?: string;
  durationMs: number;
}

export interface BddFeatureResult {
  featureName: string;
  scenarios: BddScenarioResult[];
  passed: boolean;
  totalDurationMs: number;
  commitHash?: string;
  cycle: string;
}

// BDD Execution Context
class BddRunnerContext {
  private currentFeature: string = '';
  private currentCycle: string = '';
  private currentCommit: string = '';
  private results: BddFeatureResult[] = [];
  private currentScenarios: BddScenarioResult[] = [];
  private currentSteps: BddStep[] = [];

  setFeature(name: string, cycle: string, commit: string) {
    if (this.currentFeature && this.currentScenarios.length > 0) {
      this.flushFeature();
    }
    this.currentFeature = name;
    this.currentCycle = cycle;
    this.currentCommit = commit;
    this.currentScenarios = [];
  }

  private flushFeature() {
    const passed = this.currentScenarios.every((s) => s.passed);
    const totalDurationMs = this.currentScenarios.reduce((sum, s) => sum + s.durationMs, 0);
    this.results.push({
      featureName: this.currentFeature,
      scenarios: [...this.currentScenarios],
      passed,
      totalDurationMs,
      commitHash: this.currentCommit,
      cycle: this.currentCycle,
    });
  }

  async runScenario(title: string, fn: () => void | Promise<void>): Promise<BddScenarioResult> {
    const start = performance.now();
    this.currentSteps = [];
    let passed = true;
    let error: string | undefined;

    try {
      await fn();
    } catch (e: any) {
      passed = false;
      error = e?.message || String(e);
      // Mark last step as failed if any
      if (this.currentSteps.length > 0) {
        this.currentSteps[this.currentSteps.length - 1].passed = false;
        this.currentSteps[this.currentSteps.length - 1].error = error;
      }
    }

    const durationMs = Math.round(performance.now() - start);
    const result: BddScenarioResult = {
      title,
      passed,
      steps: [...this.currentSteps],
      error,
      durationMs,
    };
    this.currentScenarios.push(result);
    return result;
  }

  addStep(type: 'given' | 'when' | 'then' | 'and', description: string) {
    this.currentSteps.push({
      type,
      description,
      passed: true,
    });
  }

  getResults(): BddFeatureResult[] {
    if (this.currentFeature && this.currentScenarios.length > 0) {
      this.flushFeature();
      this.currentFeature = '';
    }
    return this.results;
  }

  reset() {
    this.results = [];
    this.currentScenarios = [];
    this.currentSteps = [];
    this.currentFeature = '';
  }
}

export const bddContext = new BddRunnerContext();

export function feature(name: string, cycle: string, commit: string, fn: () => void) {
  bddContext.setFeature(name, cycle, commit);
  fn();
}

export function scenario(title: string, fn: () => void | Promise<void>) {
  return bddContext.runScenario(title, fn);
}

export function given(description: string, fn?: () => void) {
  bddContext.addStep('given', description);
  if (fn) fn();
}

export function when(description: string, fn?: () => void) {
  bddContext.addStep('when', description);
  if (fn) fn();
}

export function then(description: string, fn?: () => void) {
  bddContext.addStep('then', description);
  if (fn) fn();
}

export function and(description: string, fn?: () => void) {
  bddContext.addStep('and', description);
  if (fn) fn();
}

// Fluent assertions (expect)
export function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected deep equality:\nExpected: ${JSON.stringify(expected)}\nActual:   ${JSON.stringify(actual)}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new Error(`Expected ${actual} > ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual < expected) {
        throw new Error(`Expected ${actual} >= ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      if (typeof actual !== 'number' || actual >= expected) {
        throw new Error(`Expected ${actual} < ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual > expected) {
        throw new Error(`Expected ${actual} <= ${expected}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value, but got ${actual}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy value, but got ${actual}`);
      }
    },
    toThrow(expectedMessageSubstr?: string) {
      if (typeof actual !== 'function') {
        throw new Error(`Expected a function to throw`);
      }
      let threw = false;
      let err: any;
      try {
        (actual as any)();
      } catch (e: any) {
        threw = true;
        err = e;
      }
      if (!threw) {
        throw new Error(`Expected function to throw, but it did not`);
      }
      if (expectedMessageSubstr && !err?.message?.includes(expectedMessageSubstr)) {
        throw new Error(`Expected error message to include "${expectedMessageSubstr}", got "${err?.message}"`);
      }
    },
  };
}
