/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { feature, scenario, given, when, then, expect } from './bddRunner';
import { ChaseDomainService, ChaseEntityState } from '../domain/services/ChaseService';

export function runChaseTests() {
  feature(
    '折った鬼殺隊士の追走・お仕置きチェイス仕様',
    'Cycle 5: 追走物理・みたらし団子加速・お仕置きコンボ',
    'commit-c5-chase-service',
    () => {
      scenario('みたらし団子を拾って超加速し、逃げる隊士に追いつく', () => {
        let state: ChaseEntityState;

        given('初期距離60mで隊士を追いかける怒りの鍛冶師がいる', () => {
          state = ChaseDomainService.createInitialState('竈門炭治郎');
          expect(state.distance).toBe(60);
          expect(state.isCaught).toBeFalsy();
        });

        when('みたらし団子を獲得して団子ブーストを発動し、一定時間追走したとき', () => {
          // 団子ブーストを付与
          state.dangoBoostTimer = 5.0;
          // 複数ステップ更新
          for (let i = 0; i < 20; i++) {
            ChaseDomainService.updatePhysics(state, 0.25);
          }
        });

        then('相対速度により距離が急激に縮まること', () => {
          expect(state.distance).toBeLessThan(40);
        });
      });

      scenario('隊士を捕獲してお仕置き連打コンボを決める', () => {
        let state = ChaseDomainService.createInitialState('竈門炭治郎');
        state.distance = 0;
        state.isCaught = true;

        given('逃げる隊士に追いつき捕獲した状態である', () => {
          expect(state.isCaught).toBeTruthy();
          expect(state.punishHits).toBe(0);
        });

        when('怒りのタップで25回以上のお仕置きコンボを叩き込んだとき', () => {
          for (let i = 0; i < 25; i++) {
            ChaseDomainService.applyPunishHit(state);
          }
        });

        then('隊士が大反省し、お仕置きゲームクリア（isGameOver = true）となること', () => {
          expect(state.punishHits).toBe(25);
          expect(state.isGameOver).toBeTruthy();
        });
      });
    }
  );
}
