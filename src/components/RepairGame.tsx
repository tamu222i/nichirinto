/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Hammer, Sparkles, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { SwordAggregate } from '../domain/models/Sword';
import { RepairDomainService, BladePiece } from '../domain/services/RepairService';
import { soundFX } from '../services/audio';

interface RepairGameProps {
  swords: SwordAggregate[];
  onSwordRepaired: (sword: SwordAggregate) => void;
}

export const RepairGame: React.FC<RepairGameProps> = ({ swords, onSwordRepaired }) => {
  // 折れた刀または修復対象を選択
  const brokenSwords = swords.filter((s) => s.condition === 'BROKEN' || s.integrityLevel < 90);
  const [selectedSword, setSelectedSword] = useState<SwordAggregate>(
    brokenSwords[0] ||
      SwordAggregate.create({
        id: 'broken_tanjiro_sample',
        name: '折れた日の呼吸刀',
        swordsmanName: '竈門炭治郎',
        breathing: 'SUN',
        condition: 'BROKEN',
        integrityLevel: 15,
        rustLevel: 30,
      })
  );

  const [pieces, setPieces] = useState<BladePiece[]>(RepairDomainService.generateBrokenPieces());
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [reforgeProgress, setReforgeProgress] = useState<number>(0);
  const [repairCompleteResult, setRepairCompleteResult] = useState<{
    restoredIntegrity: number;
    awakenedBuff: string;
  } | null>(null);

  const isAligned = RepairDomainService.isBladeAligned(pieces);

  // 破片をスロットに配置
  const handleSlotClick = (slotIndex: number) => {
    if (!selectedPieceId) return;
    soundFX.playWhetstoneScrape();
    const updated = RepairDomainService.placePiece(pieces, selectedPieceId, slotIndex);
    setPieces(updated);
    setSelectedPieceId(null);

    if (RepairDomainService.isBladeAligned(updated)) {
      soundFX.playBladeAwaken();
    }
  };

  // 接合槌打ち
  const handleReforgeHammer = () => {
    soundFX.playHammerStrike(1.1);
    const newProgress = Math.min(100, reforgeProgress + 25);
    setReforgeProgress(newProgress);

    if (newProgress >= 100) {
      soundFX.playBladeAwaken();
      const result = RepairDomainService.reforgeBrokenSword(selectedSword, 95);
      setRepairCompleteResult(result);
      onSwordRepaired(selectedSword);
    }
  };

  const handleResetPuzzle = () => {
    setPieces(RepairDomainService.generateBrokenPieces());
    setReforgeProgress(0);
    setRepairCompleteResult(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
          <span>刀鍛冶の里</span>
          <span aria-hidden="true">·</span>
          <span>接合工房</span>
          <span aria-hidden="true">·</span>
          <span className="text-rose-400">折損刀の蘇生</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 font-['Shippori_Mincho']">
          折れた刀の修復・再鍛錬
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          激戦で叩き折られた刀の破片を正しく接合し、特殊玉鋼を流し込んで熱打ちし、頑強な日輪刀として蘇らせろ！
        </p>
      </div>

      {/* 対象刀の選択 */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-200">
              修復対象：{selectedSword.name}（所持者: {selectedSword.swordsmanName}）
            </div>
            <div className="text-xs text-neutral-400">
              健全度: <span className="font-mono text-rose-400 font-bold">{selectedSword.integrityLevel}%</span> · 状態: 折損（BROKEN）
            </div>
          </div>
        </div>

        <button
          onClick={handleResetPuzzle}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-950 border border-neutral-800 rounded-md transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>破片を戻す</span>
        </button>
      </div>

      {/* パズル接合台（メインエリア） */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-base font-bold text-neutral-200 font-['Shippori_Mincho'] mb-1">
            ① 破片を選び、刀台の正しい位置（スロット）に配置せよ
          </h3>
          <p className="text-xs text-neutral-400">
            下の破片をクリックで選択し、上の空き枠をクリックして並べ替えます。
          </p>
        </div>

        {/* 接合スロット刀台 */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-neutral-950 rounded-xl border-2 border-dashed border-neutral-800 min-h-28 items-center">
          {[0, 1, 2].map((slotIdx) => {
            const placedPiece = pieces.find((p) => p.currentSlot === slotIdx);
            return (
              <button
                key={slotIdx}
                onClick={() => handleSlotClick(slotIdx)}
                className={`h-20 rounded-lg border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  placedPiece
                    ? placedPiece.isCorrect
                      ? 'bg-amber-950/40 border-amber-500/80 text-amber-300'
                      : 'bg-rose-950/40 border-rose-500/80 text-rose-300'
                    : 'bg-neutral-900/50 border-neutral-700 text-neutral-500 hover:border-neutral-500'
                }`}
              >
                {placedPiece ? (
                  <>
                    <span className="text-xs font-bold font-['Shippori_Mincho']">{placedPiece.name}</span>
                    <span className="text-[10px] text-neutral-400 mt-1">
                      {placedPiece.isCorrect ? '✓ 接合部一致' : '✕ 位置が合わない'}
                    </span>
                  </>
                ) : (
                  <span className="text-xs">スロット {slotIdx + 1}（枠）</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 破片インベントリ */}
        <div>
          <div className="text-xs text-neutral-400 mb-2">手元の破片（クリックして選択）：</div>
          <div className="flex flex-wrap gap-3">
            {pieces.map((piece) => (
              <button
                key={piece.id}
                onClick={() => {
                  soundFX.playUchikoPat();
                  setSelectedPieceId(piece.id);
                }}
                className={`px-4 py-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  selectedPieceId === piece.id
                    ? 'bg-amber-400 text-neutral-950 border-amber-300 font-bold scale-105 shadow-md'
                    : piece.currentSlot !== null
                    ? 'bg-neutral-950 text-neutral-500 border-neutral-800'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                }`}
              >
                {piece.name}
              </button>
            ))}
          </div>
        </div>

        {/* ② 接合後の再鍛錬セクション */}
        {isAligned && !repairCompleteResult && (
          <div className="pt-6 border-t border-neutral-800 space-y-4 animate-in fade-in duration-300">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mb-1">
                <CheckCircle className="w-4 h-4" />
                <span>全破片の接合ラインが完璧に一致した！</span>
              </div>
              <p className="text-xs text-neutral-400">
                特殊玉鋼を接合部に流し込み、槌で熱打ちして一体化させましょう。
              </p>
            </div>

            <div className="max-w-md">
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>再鍛錬接合度</span>
                <span className="font-mono tabular-nums text-amber-400">{reforgeProgress}%</span>
              </div>
              <div className="w-full h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-150"
                  style={{ width: `${reforgeProgress}%` }}
                />
              </div>
            </div>

            <div>
              <button
                onClick={handleReforgeHammer}
                className="px-6 py-3 text-sm font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-transform active:scale-95 cursor-pointer shadow-lg flex items-center gap-2"
              >
                <Hammer className="w-4 h-4" />
                <span>接合部を槌で熱打ち！（カーン！）</span>
              </button>
            </div>
          </div>
        )}

        {/* 修復完了カード */}
        {repairCompleteResult && (
          <div className="p-5 bg-neutral-950 border-2 border-emerald-500/50 rounded-xl space-y-3 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-neutral-100 font-['Shippori_Mincho']">
                  修復完了！刀が完全復活した！
                </h4>
                <div className="text-xs text-neutral-400">
                  健全度: 100% · 付与された特性: <strong className="text-amber-400">{repairCompleteResult.awakenedBuff}</strong>
                </div>
              </div>
            </div>
            <p className="text-xs text-neutral-300">
              「これでもう二度と折るなよ…！次に折ったらタダじゃおかねえぞ…！」
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
