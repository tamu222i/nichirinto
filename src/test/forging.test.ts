/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { feature, scenario, given, when, then, expect } from './bddRunner';
import { ForgingDomainService, ForgingSessionState } from '../domain/services/ForgingService';

export function runForgingTests() {
  feature(
    '日輪刀の鍛造・石から刀を作る工程仕様',
    'Cycle 3: 鉱石配合・ふいご加熱・槌打ち・焼き入れ・色変わり覚醒',
    'commit-c3-forging-service',
    () => {
      scenario('鞴（ふいご）による炉の加熱と適正温度維持', () => {
        let currentTemp = 700;

        given('火床の温度が700℃（まだ冷たい状態）である', () => {
          expect(currentTemp).toBe(700);
        });

        when('鞴を複数回ポンピングして風を送り込んだとき', () => {
          for (let i = 0; i < 6; i++) {
            const res = ForgingDomainService.pumpBellows(currentTemp);
            currentTemp = res.newTemp;
          }
        });

        then('炉の温度が1000℃前後の鍛造最適ゾーンに到達すること', () => {
          expect(currentTemp).toBeGreaterThanOrEqual(950);
          expect(currentTemp).toBeLessThanOrEqual(1150);
        });
      });

      scenario('適正温度での焼き入れと隊士の呼吸属性による色変わり覚醒', () => {
        let state: ForgingSessionState = {
          sandRatio: 40,
          oreRatio: 60,
          temperature: 1020,
          hammerHits: 15,
          hammerCombo: 5,
          maxHammerHits: 15,
          quenched: false,
          quenchScore: 0,
          targetBreathing: 'WATER',
          swordsmanName: '竈門炭治郎',
        };

        given('黄金比（4:6）で配合し、最適温度1020℃で槌打ちを終えた刀身がある', () => {
          expect(state.hammerHits).toBe(15);
        });

        when('一瞬の判断で水桶に浸して焼き入れし、隊士が抜刀したとき', () => {
          const quenchRes = ForgingDomainService.quenchBlade(state);
          expect(quenchRes.success).toBeTruthy();
        });

        then('水の呼吸に応じた蒼碧の刀身が覚醒し、完全無欠な日輪刀が生成されること', () => {
          const sword = ForgingDomainService.awakenForgedSword(state);
          expect(sword.condition).toBe('PRISTINE');
          expect(sword.breathing).toBe('WATER');
          expect(sword.meta.colorName).toBe('蒼碧（そうへき）');
          expect(sword.isAwakened).toBeTruthy();
        });
      });
    }
  );
}
