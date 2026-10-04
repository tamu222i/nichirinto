/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { feature, scenario, given, when, then, expect } from './bddRunner';
import { SwordAggregate } from '../domain/models/Sword';
import { NichirinSwordSchema } from '../domain/types';

export function runDomainCoreTests() {
  feature(
    '日輪刀のドメイン不変条件とエンティティライフサイクル',
    'Cycle 1: ドメインコア＆スキーマバリデーション',
    'commit-c1-core-domain',
    () => {
      scenario('日輪刀集約の生成とスキーマバリデーション', () => {
        let sword: SwordAggregate;

        given('竈門炭治郎の日輪刀（日の呼吸・漆黒）のパラメータを用意する', () => {
          sword = SwordAggregate.create({
            name: '日輪刀・漆黒の刃',
            swordsmanName: '竈門炭治郎',
            breathing: 'SUN',
            rustLevel: 10,
            shineLevel: 90,
            integrityLevel: 100,
          });
        });

        when('ドメインモデルとしてインスタンス化されたとき', () => {
          // instantiated in given
        });

        then('属性値が正常に設定され、日の呼吸（漆黒）のメタ情報が取得できること', () => {
          expect(sword.name).toBe('日輪刀・漆黒の刃');
          expect(sword.swordsmanName).toBe('竈門炭治郎');
          expect(sword.breathing).toBe('SUN');
          expect(sword.meta.colorName).toBe('漆黒（しっこく）');
          expect(sword.rustLevel).toBe(10);
        });

        then('不正な値（範囲外のサビ率など）はZodスキーマによって弾かれること', () => {
          expect(() => {
            new SwordAggregate({
              id: 'invalid-sword',
              name: '不正な刀',
              swordsmanName: '不明',
              breathing: 'SUN',
              condition: 'PRISTINE',
              rustLevel: 150, // 範囲外(>100)
              shineLevel: 50,
              integrityLevel: 100,
              sharpness: 100,
              isAwakened: true,
              forgedAt: Date.now(),
              repairedCount: 0,
              maintenanceCount: 0,
              engraving: '惡鬼滅殺',
            });
          }).toThrow();
        });
      });

      scenario('激戦による刀のサビと腐食の進行', () => {
        let sword = SwordAggregate.create({
          name: '水の呼吸刀',
          swordsmanName: '冨岡義勇',
          breathing: 'WATER',
          rustLevel: 0,
          shineLevel: 100,
        });

        given('手入れの行き届いた日輪刀（サビ0%、光沢100%）がある', () => {
          expect(sword.rustLevel).toBe(0);
          expect(sword.condition).toBe('PRISTINE');
        });

        when('鬼との死闘で血糊と雨水によりサビが50付加されたとき', () => {
          sword.corrode(50);
        });

        then('サビ率が50%に増加し、光沢が低下し、状態がRUSTEDに変化すること', () => {
          expect(sword.rustLevel).toBe(50);
          expect(sword.condition).toBe('RUSTED');
          expect(sword.shineLevel).toBeLessThan(100);
        });
      });
    }
  );
}
