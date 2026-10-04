/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MaintenanceTool } from '../types';
import { SwordAggregate } from '../models/Sword';

export interface MaintenanceActionFeedback {
  cleanedPoints: number;
  newRustLevel: number;
  newShineLevel: number;
  soundCue: 'dust_pat' | 'stone_grind' | 'oil_wipe' | 'blade_shine';
  sparkCount: number;
  message: string;
}

export class MaintenanceDomainService {
  /**
   * 道具と摩擦量に基づいて研磨・清掃効果を計算
   */
  static applyToolStroke(
    sword: SwordAggregate,
    tool: MaintenanceTool,
    intensity: number = 1 // 擦った強さ・ストローク数
  ): MaintenanceActionFeedback {
    let cleanDelta = 0;
    let shineBonus = 0;
    let soundCue: MaintenanceActionFeedback['soundCue'] = 'stone_grind';
    let message = '';
    let sparkCount = 0;

    switch (tool) {
      case 'UCHIKO':
        // 打ち粉: サビ落とし効率を上げ、初期の汚れを吸着
        cleanDelta = Math.min(sword.rustLevel, intensity * 2);
        shineBonus = intensity * 0.5;
        soundCue = 'dust_pat';
        sparkCount = Math.floor(intensity * 1.5);
        message = '打ち粉をポンポンと叩き、古い脂と汚れを浮かせた！';
        break;

      case 'WHETSTONE':
        // 砥石: 赤サビを強力に研ぎ落とす
        cleanDelta = Math.min(sword.rustLevel, intensity * 5);
        shineBonus = intensity * 1.5;
        soundCue = 'stone_grind';
        sparkCount = Math.floor(intensity * 4);
        message = '水砥石で丁寧に研ぎ込み、頑固な赤錆を削り落とした！';
        break;

      case 'CHOJI_OIL':
        // 丁子油: 仕上げ布で拭き上げ、鏡面光沢を極限まで引き上げる
        if (sword.rustLevel > 30) {
          // サビが残っていると油が濁る
          cleanDelta = 0.5;
          shineBonus = intensity * 1;
          soundCue = 'oil_wipe';
          message = 'まだサビが残っている！先に砥石で研ぎ落とすべし！';
        } else {
          cleanDelta = Math.min(sword.rustLevel, intensity * 1);
          shineBonus = intensity * 4;
          soundCue = sword.shineLevel >= 90 ? 'blade_shine' : 'oil_wipe';
          sparkCount = Math.floor(intensity * 2);
          message = '丁子油を含ませた布で拭き上げ、見事な鏡面光沢が宿った！';
        }
        break;
    }

    sword.applyMaintenance(cleanDelta, shineBonus);

    return {
      cleanedPoints: cleanDelta,
      newRustLevel: sword.rustLevel,
      newShineLevel: sword.shineLevel,
      soundCue,
      sparkCount,
      message,
    };
  }

  /**
   * お手入れ完了時の評価ランク判定
   */
  static evaluateFinish(sword: SwordAggregate): {
    rank: '國宝級' | '業物' | '良作' | '修行が足りぬ';
    score: number;
    comment: string;
  } {
    const score = Math.round(
      (100 - sword.rustLevel) * 0.5 + sword.shineLevel * 0.4 + sword.sharpness * 0.1
    );

    if (sword.rustLevel === 0 && sword.shineLevel >= 95) {
      return {
        rank: '國宝級',
        score,
        comment: 'これぞ至高の鏡面仕上げ！鬼の首も易々と両断できよう！',
      };
    } else if (sword.rustLevel <= 5 && sword.shineLevel >= 80) {
      return {
        rank: '業物',
        score,
        comment: '見事な研ぎ上がり。隊士も存分に腕を振るえよう。',
      };
    } else if (sword.rustLevel <= 25) {
      return {
        rank: '良作',
        score,
        comment: '実戦に耐えうる仕上がり。もう一息磨けばさらに輝く。',
      };
    } else {
      return {
        rank: '修行が足りぬ',
        score,
        comment: 'まだ赤サビが残っておる！これでは刀が泣くぞ！',
      };
    }
  }
}
