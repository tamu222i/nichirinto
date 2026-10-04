/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

// ==========================================
// 1. 呼吸の型・系統 (Breathing Types)
// ==========================================
export const BreathingTypeSchema = z.enum([
  'WATER',   // 水: 蒼色
  'FLAME',   // 炎: 深紅
  'THUNDER', // 雷: 黄金
  'WIND',    // 風: 翠緑
  'STONE',   // 岩: 灰色・鈍色
  'MIST',    // 霞: 白銀・淡青
  'BEAST',   // 獣: 藍鼠
  'INSECT',  // 蟲: 薄紫
  'LOVE',    // 恋: 桜色
  'SERPENT', // 蛇: 菫白
  'SUN',     // 日: 漆黒
  'MOON',    // 月: 黄紫
]);
export type BreathingType = z.infer<typeof BreathingTypeSchema>;

export interface BreathingMeta {
  type: BreathingType;
  nameJa: string;
  colorName: string;
  bladeColorHex: string;
  bladeGlowHex: string;
  hamonPattern: 'straight' | 'wave' | 'flame' | 'lightning' | 'serrated';
  representative: string;
  description: string;
}

export const BREATHING_DATA: Record<BreathingType, BreathingMeta> = {
  WATER: {
    type: 'WATER',
    nameJa: '水の呼吸',
    colorName: '蒼碧（そうへき）',
    bladeColorHex: '#1e40af',
    bladeGlowHex: '#38bdf8',
    hamonPattern: 'wave',
    representative: '冨岡義勇 / 竈門炭治郎（初期）',
    description: 'どんな形にもなれる柔軟性と清流の如き澄み切った蒼。',
  },
  FLAME: {
    type: 'FLAME',
    nameJa: '炎の呼吸',
    colorName: '深紅（しんく）',
    bladeColorHex: '#991b1b',
    bladeGlowHex: '#f97316',
    hamonPattern: 'flame',
    representative: '煉獄杏寿郎',
    description: '熱く燃え滾る焔の如き赤。心を燃やせ。',
  },
  THUNDER: {
    type: 'THUNDER',
    nameJa: '雷の呼吸',
    colorName: '黄金（こがね）',
    bladeColorHex: '#854d0e',
    bladeGlowHex: '#facc15',
    hamonPattern: 'lightning',
    representative: '我妻善逸',
    description: '一閃の迅雷の如き輝き。稲妻の刃文が走る。',
  },
  WIND: {
    type: 'WIND',
    nameJa: '風の呼吸',
    colorName: '翠緑（すいりょく）',
    bladeColorHex: '#166534',
    bladeGlowHex: '#4ade80',
    hamonPattern: 'wave',
    representative: '不死川実弥',
    description: '猛り狂う暴風の緑。鬼を切り裂く烈風。',
  },
  STONE: {
    type: 'STONE',
    nameJa: '岩の呼吸',
    colorName: '玄武灰（げんぶはい）',
    bladeColorHex: '#374151',
    bladeGlowHex: '#9ca3af',
    hamonPattern: 'straight',
    representative: '悲鳴嶼行冥',
    description: '不動の巌の如き重厚な鋼灰色。比類なき剛性。',
  },
  MIST: {
    type: 'MIST',
    nameJa: '霞の呼吸',
    colorName: '白藍（しらあい）',
    bladeColorHex: '#0e7490',
    bladeGlowHex: '#67e8f9',
    hamonPattern: 'wave',
    representative: '時透無一郎',
    description: '霞のたなびく幽玄なる淡青。幻惑の太刀筋。',
  },
  BEAST: {
    type: 'BEAST',
    nameJa: '獣の呼吸',
    colorName: '藍鼠（あいねず）',
    bladeColorHex: '#334155',
    bladeGlowHex: '#94a3b8',
    hamonPattern: 'serrated',
    representative: '嘴平伊之助',
    description: '野性の牙の如き藍灰色。自ら石で刃こぼれを作った二刀流。',
  },
  INSECT: {
    type: 'INSECT',
    nameJa: '蟲の呼吸',
    colorName: '藤紫（ふじむらさき）',
    bladeColorHex: '#581c87',
    bladeGlowHex: '#c084fc',
    hamonPattern: 'straight',
    representative: '胡蝶しのぶ',
    description: '藤の花の毒を帯びた優美な紫。突きに特化した針のような刀。',
  },
  LOVE: {
    type: 'LOVE',
    nameJa: '恋の呼吸',
    colorName: '桜桃（おうとう）',
    bladeColorHex: '#9d174d',
    bladeGlowHex: '#f472b6',
    hamonPattern: 'wave',
    representative: '甘露寺蜜璃',
    description: 'リボンのようにしなる極薄刃。華やかな桃色の光彩。',
  },
  SERPENT: {
    type: 'SERPENT',
    nameJa: '蛇の呼吸',
    colorName: '白蛇紫（はくじゃし）',
    bladeColorHex: '#475569',
    bladeGlowHex: '#cbd5e1',
    hamonPattern: 'wave',
    representative: '伊黒小芭内',
    description: '蛇のようにうねる波打つ刀身。隙間を縫う変幻自在の太刀。',
  },
  SUN: {
    type: 'SUN',
    nameJa: '日の呼吸',
    colorName: '漆黒（しっこく）',
    bladeColorHex: '#09090b',
    bladeGlowHex: '#e11d48',
    hamonPattern: 'flame',
    representative: '竈門炭治郎 / 継国縁壱',
    description: 'すべての呼吸の始原。光を呑み込む漆黒に深紅の熱が宿る。',
  },
  MOON: {
    type: 'MOON',
    nameJa: '月の呼吸',
    colorName: '黄紫宵（こうししょう）',
    bladeColorHex: '#3b0764',
    bladeGlowHex: '#fbbf24',
    hamonPattern: 'lightning',
    representative: '黒死牟',
    description: '無数の三日月刃をまとう妖美なる紫金。',
  },
};

// ==========================================
// 2. 刀身・日輪刀集約のスキーマ (Nichirin Sword Schema)
// ==========================================
export const SwordConditionSchema = z.enum([
  'PRISTINE', // 完全無欠・極上の輝き
  'RUSTED',   // 激戦による赤錆び
  'CHIPPED',  // 刃こぼれ
  'BROKEN',   // 真っ二つに折損
]);
export type SwordCondition = z.infer<typeof SwordConditionSchema>;

export const NichirinSwordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  swordsmanName: z.string().min(1),
  breathing: BreathingTypeSchema,
  condition: SwordConditionSchema,
  rustLevel: z.number().min(0).max(100),       // 0% = ピカピカ, 100% = 激サビ
  shineLevel: z.number().min(0).max(100),      // 0〜100%
  integrityLevel: z.number().min(0).max(100),  // 0% = 折損, 100% = 健全
  sharpness: z.number().min(0).max(100),       // 切れ味
  isAwakened: z.boolean(),                     // 抜刀時に色変わり覚醒済みか
  forgedAt: z.number(),                        // タイムスタンプ
  repairedCount: z.number().min(0),            // 修理回数
  maintenanceCount: z.number().min(0),         // お手入れ回数
  engraving: z.string().default('惡鬼滅殺'),   // 刀身の刻印
});
export type NichirinSword = z.infer<typeof NichirinSwordSchema>;

// ==========================================
// 3. お手入れツールとアクション (Maintenance Action)
// ==========================================
export const MaintenanceToolSchema = z.enum([
  'UCHIKO',   // 打ち粉（古い油とサビの浮かし）
  'WHETSTONE',// 砥石（水研ぎ・赤サビ削り落とし）
  'CHOJI_OIL',// 丁子油（油布による拭き上げ・鏡面防錆）
]);
export type MaintenanceTool = z.infer<typeof MaintenanceToolSchema>;

// ==========================================
// 4. 鍛造素材・プロセス (Forging Domain)
// ==========================================
export const ForgingMaterialSchema = z.object({
  ironSandRatio: z.number().min(0).max(100), // 猩々緋砂鉄 (推奨: 40%)
  ironOreRatio: z.number().min(0).max(100),  // 猩々緋鉱石 (推奨: 60%)
});
export type ForgingMaterial = z.infer<typeof ForgingMaterialSchema>;

export const ForgingPhaseSchema = z.enum([
  'SELECT_MATERIALS', // 鉱石と砂鉄の選定
  'HEAT_FURNACE',    // ふいご（鞴）での火おこし
  'HAMMER_RHYTHM',   // 金床での槌打ち鍛錬
  'QUENCHING',       // 焼き入れ（急冷）
  'UNSHEATHE_COLOR', // 抜刀＆色変わり覚醒
]);
export type ForgingPhase = z.infer<typeof ForgingPhaseSchema>;

// ==========================================
// 5. 追走・お仕置きミニゲーム (Chase Game Domain)
// ==========================================
export const SlayerTargetSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  avatar: stringOrSvg(),
  brokenSwordCount: z.number().min(1),
  dialogues: z.array(z.string()),
});
function stringOrSvg() {
  return z.string();
}
export type SlayerTarget = z.infer<typeof SlayerTargetSchema>;

export const ChaseActionSchema = z.enum([
  'RUN',
  'JUMP',
  'SLIDE',
  'EAT_DANGO',
  'PUNISH_COMBO',
]);
export type ChaseAction = z.infer<typeof ChaseActionSchema>;
