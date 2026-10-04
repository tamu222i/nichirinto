/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { bddContext, BddFeatureResult } from './bddRunner';
import { runDomainCoreTests } from './domainCore.test';
import { runMaintenanceTests } from './maintenance.test';
import { runForgingTests } from './forging.test';
import { runRepairTests } from './repair.test';
import { runChaseTests } from './chase.test';

export async function runAllBddTests(): Promise<BddFeatureResult[]> {
  bddContext.reset();

  runDomainCoreTests();
  runMaintenanceTests();
  runForgingTests();
  runRepairTests();
  runChaseTests();

  return bddContext.getResults();
}
