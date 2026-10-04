/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  NichirinSword,
  NichirinSwordSchema,
  BreathingType,
  SwordCondition,
  BREATHING_DATA,
} from '../types';

export class SwordAggregate {
  private sword: NichirinSword;

  constructor(data: NichirinSword) {
    // スキーマによる不変条件バリデーション
    this.sword = NichirinSwordSchema.parse(data);
  }

  static create(params: {
    id?: string;
    name: string;
    swordsmanName: string;
    breathing: BreathingType;
    condition?: SwordCondition;
    rustLevel?: number;
    shineLevel?: number;
    integrityLevel?: number;
    sharpness?: number;
    isAwakened?: boolean;
    engraving?: string;
  }): SwordAggregate {
    const raw: NichirinSword = {
      id: params.id || `sword_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: params.name,
      swordsmanName: params.swordsmanName,
      breathing: params.breathing,
      condition: params.condition || 'PRISTINE',
      rustLevel: Math.max(0, Math.min(100, params.rustLevel ?? 0)),
      shineLevel: Math.max(0, Math.min(100, params.shineLevel ?? 100)),
      integrityLevel: Math.max(0, Math.min(100, params.integrityLevel ?? 100)),
      sharpness: Math.max(0, Math.min(100, params.sharpness ?? 100)),
      isAwakened: params.isAwakened ?? true,
      forgedAt: Date.now(),
      repairedCount: 0,
      maintenanceCount: 0,
      engraving: params.engraving || '惡鬼滅殺',
    };
    return new SwordAggregate(raw);
  }

  // Getters
  get id(): string { return this.sword.id; }
  get name(): string { return this.sword.name; }
  get swordsmanName(): string { return this.sword.swordsmanName; }
  get breathing(): BreathingType { return this.sword.breathing; }
  get condition(): SwordCondition { return this.sword.condition; }
  get rustLevel(): number { return this.sword.rustLevel; }
  get shineLevel(): number { return this.sword.shineLevel; }
  get integrityLevel(): number { return this.sword.integrityLevel; }
  get sharpness(): number { return this.sword.sharpness; }
  get isAwakened(): boolean { return this.sword.isAwakened; }
  get repairedCount(): number { return this.sword.repairedCount; }
  get maintenanceCount(): number { return this.sword.maintenanceCount; }
  get engraving(): string { return this.sword.engraving; }

  get meta() {
    return BREATHING_DATA[this.sword.breathing];
  }

  toData(): NichirinSword {
    return { ...this.sword };
  }

  // ドメイン操作: サビの付加（激戦後など）
  corrode(amount: number): void {
    const newRust = Math.min(100, this.sword.rustLevel + amount);
    const newShine = Math.max(0, this.sword.shineLevel - amount * 0.8);
    this.sword.rustLevel = Math.round(newRust);
    this.sword.shineLevel = Math.round(newShine);
    if (this.sword.rustLevel > 30 && this.sword.condition === 'PRISTINE') {
      this.sword.condition = 'RUSTED';
    }
  }

  // ドメイン操作: サビ落とし・研ぎ澄まし
  applyMaintenance(cleanedAmount: number, shineBonus: number): void {
    this.sword.rustLevel = Math.max(0, Math.round(this.sword.rustLevel - cleanedAmount));
    this.sword.shineLevel = Math.min(100, Math.round(this.sword.shineLevel + shineBonus));
    this.sword.sharpness = Math.min(100, Math.round(this.sword.sharpness + shineBonus * 0.5));
    this.sword.maintenanceCount += 1;

    if (this.sword.rustLevel === 0 && this.sword.shineLevel >= 80 && this.sword.integrityLevel >= 90) {
      this.sword.condition = 'PRISTINE';
    }
  }

  // ドメイン操作: 破損（激戦による折損）
  breakSword(): void {
    this.sword.integrityLevel = 10;
    this.sword.condition = 'BROKEN';
    this.sword.sharpness = 20;
  }

  // ドメイン操作: 修理完了
  repair(restoredIntegrity: number): void {
    this.sword.integrityLevel = Math.min(100, restoredIntegrity);
    this.sword.repairedCount += 1;
    if (this.sword.integrityLevel >= 90) {
      this.sword.condition = this.sword.rustLevel > 20 ? 'RUSTED' : 'PRISTINE';
    }
  }

  // ドメイン操作: 抜刀色変わり
  awaken(): void {
    this.sword.isAwakened = true;
  }
}
