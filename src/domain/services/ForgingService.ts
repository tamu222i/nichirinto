/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BreathingType, BREATHING_DATA } from '../types';
import { SwordAggregate } from '../models/Sword';

export interface ForgingSessionState {
  sandRatio: number;      // 0-100 (目標: 40)
  oreRatio: number;       // 0-100 (目標: 60)
  temperature: number;    // 0-1300℃ (適正: 950-1100℃)
  hammerHits: number;     // 槌打ち回数 (目標: 15回)
  hammerCombo: number;    // パーフェクトリズムコンボ
  maxHammerHits: number;
  quenched: boolean;      // 焼き入れ済みか
  quenchScore: number;    // 焼き入れ評価 (0-100)
  targetBreathing: BreathingType;
  swordsmanName: string;
}

export class ForgingDomainService {
  /**
   * 鞴（ふいご）で風を送り温度を上昇させる
   */
  static pumpBellows(currentTemp: number): {
    newTemp: number;
    heatState: 'COLD' | 'OPTIMAL' | 'OVERHEATED';
  } {
    // 1回のポンプで +45℃、自然放熱で少し下がる
    const newTemp = Math.min(1300, currentTemp + 55);
    let heatState: 'COLD' | 'OPTIMAL' | 'OVERHEATED' = 'OPTIMAL';
    if (newTemp < 900) {
      heatState = 'COLD';
    } else if (newTemp > 1150) {
      heatState = 'OVERHEATED';
    }
    return { newTemp, heatState };
  }

  /**
   * 自然放熱（炉の温度低下）
   */
  static coolFurnace(currentTemp: number, deltaSeconds: number = 0.1): number {
    return Math.max(300, Math.round(currentTemp - deltaSeconds * 20));
  }

  /**
   * 金床で槌打ち（タイミング判定）
   */
  static strikeHammer(
    state: ForgingSessionState,
    timingAccuracy: 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS'
  ): {
    scoreAdded: number;
    sparkIntensity: number;
    isShaped: boolean;
  } {
    if (state.temperature < 800) {
      // 冷めると鋼が割れる・打てない
      return { scoreAdded: 0, sparkIntensity: 1, isShaped: false };
    }

    let multiplier = 1;
    if (timingAccuracy === 'PERFECT') multiplier = 3;
    else if (timingAccuracy === 'GREAT') multiplier = 2;
    else if (timingAccuracy === 'GOOD') multiplier = 1;
    else multiplier = 0.2;

    state.hammerHits = Math.min(state.maxHammerHits, state.hammerHits + 1);
    if (multiplier >= 2) {
      state.hammerCombo += 1;
    } else {
      state.hammerCombo = 0;
    }

    const isShaped = state.hammerHits >= state.maxHammerHits;
    return {
      scoreAdded: Math.round(10 * multiplier),
      sparkIntensity: Math.round(5 * multiplier),
      isShaped,
    };
  }

  /**
   * 焼き入れ処理
   */
  static quenchBlade(state: ForgingSessionState): {
    success: boolean;
    quenchScore: number;
    message: string;
  } {
    state.quenched = true;
    // 最適温度帯(950-1100℃)で水に入れたか判定
    if (state.temperature >= 920 && state.temperature <= 1120) {
      const score = Math.round(90 + Math.random() * 10);
      state.quenchScore = score;
      return {
        success: true,
        quenchScore: score,
        message: '見事な一瞬の焼き入れ！鋼が締まり、強靭な刃文が浮かび上がった！',
      };
    } else if (state.temperature < 920) {
      const score = 40;
      state.quenchScore = score;
      return {
        success: false,
        quenchScore: score,
        message: '温度が低すぎた！鋼の硬度が不足し鈍刀になってしまうぞ！',
      };
    } else {
      const score = 50;
      state.quenchScore = score;
      return {
        success: false,
        quenchScore: score,
        message: '過熱しすぎていた！危うく刃が割れるところだった！',
      };
    }
  }

  /**
   * 抜刀による色変わり覚醒（完成した日輪刀の生成）
   */
  static awakenForgedSword(state: ForgingSessionState): SwordAggregate {
    const meta = BREATHING_DATA[state.targetBreathing];
    const isRatioOptimal = Math.abs(state.sandRatio - 40) <= 10 && Math.abs(state.oreRatio - 60) <= 10;
    const initialSharpness = isRatioOptimal && state.quenchScore >= 80 ? 100 : 85;

    return SwordAggregate.create({
      name: `${meta.nameJa}の日輪刀`,
      swordsmanName: state.swordsmanName,
      breathing: state.targetBreathing,
      condition: 'PRISTINE',
      rustLevel: 0,
      shineLevel: 95,
      integrityLevel: 100,
      sharpness: initialSharpness,
      isAwakened: true,
      engraving: '惡鬼滅殺',
    });
  }
}
