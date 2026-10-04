/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SwordAggregate } from '../models/Sword';

export interface BladePiece {
  id: string;
  name: string;
  targetSlot: number;
  currentSlot: number | null; // null = 未配置
  isCorrect: boolean;
  angle: number;
}

export class RepairDomainService {
  /**
   * 折損刀から修復パズル用の破片を生成
   */
  static generateBrokenPieces(): BladePiece[] {
    return [
      { id: 'piece_hilt', name: '刀身根元（元幅）', targetSlot: 0, currentSlot: null, isCorrect: false, angle: 0 },
      { id: 'piece_mid', name: '刀身中央（身幅・しのぎ）', targetSlot: 1, currentSlot: null, isCorrect: false, angle: 0 },
      { id: 'piece_tip', name: '切っ先（鋒・帽子）', targetSlot: 2, currentSlot: null, isCorrect: false, angle: 0 },
    ];
  }

  /**
   * 破片をスロットに配置したときの整合性判定
   */
  static placePiece(pieces: BladePiece[], pieceId: string, slotIndex: number): BladePiece[] {
    return pieces.map((p) => {
      if (p.id === pieceId) {
        return {
          ...p,
          currentSlot: slotIndex,
          isCorrect: p.targetSlot === slotIndex,
        };
      }
      // もし既にそのスロットにあった別の破片があれば外す
      if (p.currentSlot === slotIndex && p.id !== pieceId) {
        return {
          ...p,
          currentSlot: null,
          isCorrect: false,
        };
      }
      return p;
    });
  }

  /**
   * 全ての破片が正しく組み合わさったか判定
   */
  static isBladeAligned(pieces: BladePiece[]): boolean {
    return pieces.length > 0 && pieces.every((p) => p.isCorrect);
  }

  /**
   * 鍛錬接合の実行（折れた刀を再鍛錬して蘇らせる）
   */
  static reforgeBrokenSword(
    sword: SwordAggregate,
    weldQuality: number // 0-100 (接合加熱と槌打ちの精度)
  ): {
    success: boolean;
    restoredIntegrity: number;
    awakenedBuff: string;
  } {
    if (sword.condition !== 'BROKEN') {
      // 壊れていない場合は通常強化
    }

    const restoredIntegrity = Math.min(100, Math.round(50 + weldQuality * 0.5));
    sword.repair(restoredIntegrity);
    sword.applyMaintenance(20, 30);

    const buffs = [
      '不屈の剛刃（耐久力 +30%）',
      '怒りの業火（切れ味 +20%）',
      '鋼鐵塚の執念（鬼への威圧感UP）',
    ];
    const awakenedBuff = buffs[Math.floor(Math.random() * buffs.length)];

    return {
      success: true,
      restoredIntegrity,
      awakenedBuff,
    };
  }
}
