/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { feature, scenario, given, when, then, expect } from './bddRunner';
import { SwordAggregate } from '../domain/models/Sword';
import { RepairDomainService } from '../domain/services/RepairService';

export function runRepairTests() {
  feature(
    '折れた日輪刀の修復・接合再鍛錬仕様',
    'Cycle 4: 破片位置合わせパズル・接合鍛錬・刃文復元',
    'commit-c4-repair-service',
    () => {
      scenario('真っ二つに折れた刀の破片パズルと再接合', () => {
        let sword = SwordAggregate.create({
          name: '折れた日の呼吸刀',
          swordsmanName: '竈門炭治郎',
          breathing: 'SUN',
          integrityLevel: 10,
          condition: 'BROKEN',
        });

        let pieces = RepairDomainService.generateBrokenPieces();

        given('刀身が折損して3つに分かれた破片がある', () => {
          expect(pieces.length).toBe(3);
          expect(sword.condition).toBe('BROKEN');
          expect(sword.integrityLevel).toBe(10);
        });

        when('根元、身幅、切っ先の順に正しいスロットに配置したとき', () => {
          pieces = RepairDomainService.placePiece(pieces, 'piece_hilt', 0);
          pieces = RepairDomainService.placePiece(pieces, 'piece_mid', 1);
          pieces = RepairDomainService.placePiece(pieces, 'piece_tip', 2);
        });

        then('破片の整合判定が完了し、再鍛錬の接合が可能になること', () => {
          const isAligned = RepairDomainService.isBladeAligned(pieces);
          expect(isAligned).toBeTruthy();
        });

        then('高精度の再鍛造を実行すると健全度が100%に修復され、不屈のバフが宿ること', () => {
          const result = RepairDomainService.reforgeBrokenSword(sword, 100);
          expect(result.success).toBeTruthy();
          expect(sword.integrityLevel).toBe(100);
          expect(sword.repairedCount).toBe(1);
          expect(sword.condition).toBe('PRISTINE');
        });
      });
    }
  );
}
