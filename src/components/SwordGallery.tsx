/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SwordAggregate } from '../domain/models/Sword';
import { BREATHING_DATA } from '../domain/types';
import { Sparkles, Hammer, Wrench, ShieldAlert } from 'lucide-react';
import { soundFX } from '../services/audio';

interface SwordGalleryProps {
  swords: SwordAggregate[];
  onSelectSwordForMaintenance: (sword: SwordAggregate) => void;
  onSelectSwordForRepair: (sword: SwordAggregate) => void;
  onBreakSword: (sword: SwordAggregate) => void;
}

export const SwordGallery: React.FC<SwordGalleryProps> = ({
  swords,
  onSelectSwordForMaintenance,
  onSelectSwordForRepair,
  onBreakSword,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <span>刀鍛冶の里</span>
            <span aria-hidden="true">·</span>
            <span>名刀納刀所</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-400">名刀録（図鑑）</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 font-['Shippori_Mincho']">
            鍛えし日輪刀の名刀録
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            あなたが鍛造・修復・手入れを施した日輪刀のコレクション。刀身の波紋や色変わりを鑑賞できます。
          </p>
        </div>

        <div className="text-xs text-neutral-400 font-mono">
          登録本数: <span className="text-amber-400 font-bold">{swords.length}</span> 振
        </div>
      </div>

      {/* 刀カードグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {swords.map((sword) => {
          const meta = BREATHING_DATA[sword.breathing];
          return (
            <div
              key={sword.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div>
                {/* 刀ヘッダー（Zero-pill: クリーンなインラインメタデータ） */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span className="font-semibold text-neutral-200">{sword.swordsmanName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{meta.nameJa}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-400">{meta.colorName}</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-neutral-400">
                    健全度: {sword.integrityLevel}%
                  </div>
                </div>

                <h3 className="text-lg font-bold text-neutral-100 font-['Shippori_Mincho'] mb-3">
                  {sword.name}
                </h3>

                {/* 刀身ミニビジュアル */}
                <div
                  className="w-full h-8 rounded-md mb-4 flex items-center px-3 relative overflow-hidden shadow-inner"
                  style={{
                    backgroundColor: meta.bladeColorHex,
                    boxShadow: sword.shineLevel >= 80 ? `0 0 15px ${meta.bladeGlowHex}` : 'none',
                  }}
                >
                  <span className="text-xs font-bold text-white/90 drop-shadow font-['Shippori_Mincho']">
                    {sword.engraving}
                  </span>
                  {sword.rustLevel > 0 && (
                    <div
                      className="absolute inset-0 bg-red-950/70"
                      style={{ opacity: sword.rustLevel / 100 }}
                    />
                  )}
                  {sword.condition === 'BROKEN' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] text-rose-400 font-bold">
                      ⚡ 【激戦により折損中】
                    </div>
                  )}
                </div>

                {/* ステータスリスト */}
                <div className="grid grid-cols-3 gap-2 text-xs bg-neutral-950/50 p-2.5 rounded-lg border border-neutral-800/80 mb-4">
                  <div>
                    <span className="text-neutral-500 block">サビ度</span>
                    <span className="font-mono tabular-nums font-semibold text-rose-400">{sword.rustLevel}%</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">鏡面光沢</span>
                    <span className="font-mono tabular-nums font-semibold text-amber-400">{sword.shineLevel}%</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">切れ味</span>
                    <span className="font-mono tabular-nums font-semibold text-emerald-400">{sword.sharpness}</span>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                <button
                  onClick={() => {
                    soundFX.playWhetstoneScrape();
                    onSelectSwordForMaintenance(sword);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>お手入れする</span>
                </button>

                {sword.condition === 'BROKEN' ? (
                  <button
                    onClick={() => {
                      soundFX.playHammerStrike(1.0);
                      onSelectSwordForRepair(sword);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-rose-400 hover:bg-rose-300 rounded-md transition-colors cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>折れた刀を直す</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      soundFX.playPunishHit();
                      onBreakSword(sword);
                    }}
                    title="激戦で刀を折る（修復テスト用）"
                    className="px-3 py-1.5 text-xs text-neutral-400 hover:text-rose-400 bg-neutral-950 border border-neutral-800 rounded-md transition-colors cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
