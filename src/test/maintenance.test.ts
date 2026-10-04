/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { feature, scenario, given, when, then, expect } from './bddRunner';
import { SwordAggregate } from '../domain/models/Sword';
import { MaintenanceDomainService } from '../domain/services/MaintenanceService';

export function runMaintenanceTests() {
  feature(
    '日輪刀のお手入れ・サビ落とし機能仕様',
    'Cycle 2: お手入れドメイン＆研磨ロジック',
    'commit-c2-maintenance-service',
    () => {
      scenario('砥石による赤サビの削り落とし', () => {
        let sword: SwordAggregate;
        let initialRust = 80;

        given('赤サビ率80%の激戦を経た日輪刀がある', () => {
          sword = SwordAggregate.create({
            name: '霞の呼吸刀',
            swordsmanName: '時透無一郎',
            breathing: 'MIST',
            rustLevel: initialRust,
            shineLevel: 10,
          });
          expect(sword.rustLevel).toBe(80);
        });

        when('水研ぎ砥石（WHETSTONE）で画面をこすってストロークを加えたとき', () => {
          MaintenanceDomainService.applyToolStroke(sword, 'WHETSTONE', 10);
        });

        then('サビ率が大幅に減少し、光沢度が向上すること', () => {
          expect(sword.rustLevel).toBeLessThan(initialRust);
          expect(sword.shineLevel).toBeGreaterThan(10);
        });
      });

      scenario('打ち粉→砥石→丁子油の三段仕上げによる國宝級ランク達成', () => {
        let sword = SwordAggregate.create({
          name: '炎の呼吸刀',
          swordsmanName: '煉獄杏寿郎',
          breathing: 'FLAME',
          rustLevel: 50,
          shineLevel: 20,
        });

        given('サビた刀に打ち粉を叩き汚れを浮かす', () => {
          MaintenanceDomainService.applyToolStroke(sword, 'UCHIKO', 10);
        });

        when('砥石で完全にサビを落としきり（rustLevel = 0）、丁子油布で磨き上げたとき', () => {
          // サビを研ぎ落とす
          MaintenanceDomainService.applyToolStroke(sword, 'WHETSTONE', 20);
          // 丁子油で光沢を最大化
          MaintenanceDomainService.applyToolStroke(sword, 'CHOJI_OIL', 30);
        });

        then('サビ率が0%になり、鏡面光沢が95%以上に達し、國宝級の仕上がり評価を受けること', () => {
          expect(sword.rustLevel).toBe(0);
          expect(sword.shineLevel).toBeGreaterThanOrEqual(95);
          const evaluation = MaintenanceDomainService.evaluateFinish(sword);
          expect(evaluation.rank).toBe('國宝級');
        });
      });
    }
  );
}
