/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NichirinSword, NichirinSwordSchema } from '../types';
import { SwordAggregate } from '../models/Sword';

const STORAGE_KEY = 'nichirin_forge_swords_v1';

export class SwordRepository {
  static getInitialPresets(): SwordAggregate[] {
    return [
      SwordAggregate.create({
        id: 'preset_tanjiro',
        name: '日輪刀・漆黒',
        swordsmanName: '竈門炭治郎',
        breathing: 'SUN',
        condition: 'RUSTED',
        rustLevel: 75,
        shineLevel: 25,
        integrityLevel: 100,
        sharpness: 60,
        isAwakened: true,
      }),
      SwordAggregate.create({
        id: 'preset_zenitsu',
        name: '日輪刀・雷光刃',
        swordsmanName: '我妻善逸',
        breathing: 'THUNDER',
        condition: 'PRISTINE',
        rustLevel: 0,
        shineLevel: 98,
        integrityLevel: 100,
        sharpness: 95,
        isAwakened: true,
      }),
      SwordAggregate.create({
        id: 'preset_giyu',
        name: '日輪刀・水波',
        swordsmanName: '冨岡義勇',
        breathing: 'WATER',
        condition: 'PRISTINE',
        rustLevel: 10,
        shineLevel: 90,
        integrityLevel: 100,
        sharpness: 90,
        isAwakened: true,
      }),
      SwordAggregate.create({
        id: 'preset_rengoku',
        name: '日輪刀・炎刃',
        swordsmanName: '煉獄杏寿郎',
        breathing: 'FLAME',
        condition: 'BROKEN',
        rustLevel: 20,
        shineLevel: 40,
        integrityLevel: 15,
        sharpness: 30,
        isAwakened: true,
      }),
    ];
  }

  static loadAll(): SwordAggregate[] {
    if (typeof window === 'undefined') return this.getInitialPresets();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const presets = this.getInitialPresets();
        this.saveAll(presets);
        return presets;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => new SwordAggregate(NichirinSwordSchema.parse(item)));
      }
    } catch (e) {
      console.error('Failed to load swords from storage:', e);
    }
    return this.getInitialPresets();
  }

  static saveAll(swords: SwordAggregate[]): void {
    if (typeof window === 'undefined') return;
    try {
      const data = swords.map((s) => s.toData());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save swords to storage:', e);
    }
  }

  static save(sword: SwordAggregate): void {
    const list = this.loadAll();
    const index = list.findIndex((s) => s.id === sword.id);
    if (index >= 0) {
      list[index] = sword;
    } else {
      list.unshift(sword);
    }
    this.saveAll(list);
  }
}
