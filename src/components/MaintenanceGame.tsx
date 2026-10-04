/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Sparkles, RefreshCw, CheckCircle, Flame } from 'lucide-react';
import { MaintenanceTool, BREATHING_DATA } from '../domain/types';
import { SwordAggregate } from '../domain/models/Sword';
import { MaintenanceDomainService } from '../domain/services/MaintenanceService';
import { soundFX } from '../services/audio';

interface MaintenanceGameProps {
  currentSword: SwordAggregate;
  onUpdateSword: (sword: SwordAggregate) => void;
  onSelectAnotherSword?: () => void;
}

export const MaintenanceGame: React.FC<MaintenanceGameProps> = ({
  currentSword,
  onUpdateSword,
}) => {
  const [selectedTool, setSelectedTool] = useState<MaintenanceTool>('WHETSTONE');
  const [message, setMessage] = useState<string>('砥石で刀身の赤錆をこすり落とせ！');
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [finishRank, setFinishRank] = useState<{ rank: string; score: number; comment: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isScratching = useRef<boolean>(false);
  const strokeCounter = useRef<number>(0);

  // Canvas に初期のサビレイヤーを描画
  const initRustCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);

    if (currentSword.rustLevel <= 0) return;

    // 赤錆・血糊レイヤーの描画
    const rustGradient = ctx.createLinearGradient(0, 0, w, 0);
    rustGradient.addColorStop(0, '#5c1d11');
    rustGradient.addColorStop(0.3, '#7f1d1d');
    rustGradient.addColorStop(0.6, '#450a0a');
    rustGradient.addColorStop(1, '#991b1b');

    ctx.fillStyle = rustGradient;
    ctx.fillRect(0, 0, w, h);

    // 斑点状の腐食・サビ斑
    for (let i = 0; i < 220; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      const radius = Math.random() * 18 + 4;
      ctx.beginPath();
      ctx.arc(rx, ry, radius, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(67, 20, 16, 0.85)' : 'rgba(127, 29, 29, 0.7)';
      ctx.fill();
    }
  };

  useEffect(() => {
    initRustCanvas();
    setIsFinished(false);
    setFinishRank(null);
  }, [currentSword.id]);

  // マウス/タッチによるスクラッチ処理
  const handleScratch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || isFinished) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    // 道具に応じた消しゴム効果（サビ落とし）
    ctx.globalCompositeOperation = 'destination-out';
    const radius = selectedTool === 'WHETSTONE' ? 28 : selectedTool === 'CHOJI_OIL' ? 36 : 22;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    strokeCounter.current += 1;

    // サウンド再生＆ドメイン更新（間引き）
    if (strokeCounter.current % 4 === 0) {
      if (selectedTool === 'WHETSTONE') soundFX.playWhetstoneScrape();
      else if (selectedTool === 'UCHIKO') soundFX.playUchikoPat();
      else soundFX.playOilWipe();

      const feedback = MaintenanceDomainService.applyToolStroke(currentSword, selectedTool, 1.2);
      setMessage(feedback.message);
      onUpdateSword(currentSword);

      // サビが完全に落ちて極上光沢になったら完了判定
      if (currentSword.rustLevel <= 0 && currentSword.shineLevel >= 90) {
        soundFX.playBladeAwaken();
        const evalRes = MaintenanceDomainService.evaluateFinish(currentSword);
        setFinishRank(evalRes);
        setIsFinished(true);
      }
    }
  };

  const handleFinishCheck = () => {
    const evalRes = MaintenanceDomainService.evaluateFinish(currentSword);
    setFinishRank(evalRes);
    setIsFinished(true);
    if (evalRes.rank === '國宝級' || evalRes.rank === '業物') {
      soundFX.playBladeAwaken();
    }
  };

  const handleResetRust = () => {
    currentSword.corrode(80);
    onUpdateSword(currentSword);
    initRustCanvas();
    setIsFinished(false);
    setFinishRank(null);
    setMessage('死闘により再び赤サビが付着した！もう一度研ぎ直せ！');
  };

  const meta = BREATHING_DATA[currentSword.breathing];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* タイトル＆説明 */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <span>刀鍛冶の里</span>
            <span aria-hidden="true">·</span>
            <span>研磨場</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-400">{meta.nameJa}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 font-['Shippori_Mincho']">
            日輪刀のお手入れ・サビ研磨
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            刀身の赤錆や血糊を画面をこすって研ぎ落とし、鏡面光沢と「惡鬼滅殺」の刃文を蘇らせろ。
          </p>
        </div>

        {/* 刀ステータス */}
        <div className="flex items-center gap-4 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-xs">
          <div>
            <div className="text-neutral-400">所有者</div>
            <div className="font-semibold text-neutral-200">{currentSword.swordsmanName}</div>
          </div>
          <div className="w-px h-6 bg-neutral-800" />
          <div>
            <div className="text-neutral-400">サビ度</div>
            <div className="font-mono tabular-nums font-semibold text-rose-400">{currentSword.rustLevel}%</div>
          </div>
          <div className="w-px h-6 bg-neutral-800" />
          <div>
            <div className="text-neutral-400">光沢度</div>
            <div className="font-mono tabular-nums font-semibold text-amber-400">{currentSword.shineLevel}%</div>
          </div>
        </div>
      </div>

      {/* 道具選択ツールバー (Interactive Segmented Control) */}
      <div className="flex items-center justify-between gap-2 p-1.5 bg-neutral-900 border border-neutral-800 rounded-lg mb-6">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              soundFX.playUchikoPat();
              setSelectedTool('UCHIKO');
              setMessage('打ち粉を選択した。ポンポンと叩いて古い油とサビを浮かせろ！');
            }}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              selectedTool === 'UCHIKO'
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            ① 打ち粉（ポンポン叩く）
          </button>

          <button
            onClick={() => {
              soundFX.playWhetstoneScrape();
              setSelectedTool('WHETSTONE');
              setMessage('水研ぎ砥石を選択した。激しくこすって赤サビを削り落とせ！');
            }}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              selectedTool === 'WHETSTONE'
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            ② 砥石（水研ぎでサビ落とし）
          </button>

          <button
            onClick={() => {
              soundFX.playOilWipe();
              setSelectedTool('CHOJI_OIL');
              setMessage('丁子油布を選択した。仕上げに拭き上げ鏡面の輝きを引き出せ！');
            }}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              selectedTool === 'CHOJI_OIL'
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            ③ 丁子油布（鏡面仕上げ）
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetRust}
            title="再び刀をサビさせる"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-950/60 border border-neutral-800 rounded-md transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>再腐食</span>
          </button>

          <button
            onClick={handleFinishCheck}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors cursor-pointer shadow-sm"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>仕上がり鑑定</span>
          </button>
        </div>
      </div>

      {/* ガイドメッセージ */}
      <div className="mb-4 text-xs font-medium text-amber-300 bg-amber-950/30 border border-amber-900/50 rounded-lg px-4 py-2 flex items-center justify-between">
        <span>{message}</span>
        <span className="text-neutral-400">※刀身をマウスや指でなぞると研磨できます</span>
      </div>

      {/* 刀身スクラッチキャンバス・メインエリア */}
      <div className="relative w-full h-64 md:h-80 bg-neutral-900/90 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center p-6 select-none">
        {/* 背景の木製研ぎ台＆畳模様 */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#444_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* 刀の全体コンテナ */}
        <div className="relative w-full max-w-4xl h-36 flex items-center">
          {/* 柄（Tsuka） */}
          <div className="relative w-28 md:w-36 h-10 bg-neutral-950 border-2 border-neutral-700 rounded-l-md flex items-center justify-center shadow-lg shrink-0">
            {/* 柄巻き菱形パターン */}
            <div className="absolute inset-0 flex items-center justify-around opacity-75">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-6 border border-neutral-600 rotate-45 bg-neutral-800/40" />
              ))}
            </div>
            <span className="relative z-10 text-[10px] text-neutral-400 font-mono">柄巻</span>
          </div>

          {/* 鍔（Tsuba） */}
          <div className="relative w-4 md:w-5 h-20 bg-amber-700 border-2 border-amber-900 rounded-sm shadow-md shrink-0 -mx-0.5 z-20 flex items-center justify-center">
            <div className="w-2 h-8 bg-neutral-950 rounded-xs" />
          </div>

          {/* 下地: 研ぎ澄まされた日輪刀身 (Underlying Polished Blade) */}
          <div
            className="relative flex-1 h-12 rounded-r-full overflow-hidden shadow-inner flex items-center transition-all duration-300"
            style={{
              backgroundColor: meta.bladeColorHex,
              boxShadow: currentSword.shineLevel >= 80 ? `0 0 25px ${meta.bladeGlowHex}` : 'none',
            }}
          >
            {/* 刃文（波紋・炎紋・稲妻紋） */}
            <div className="absolute inset-0 opacity-40 mix-blend-screen bg-gradient-to-t from-white/30 via-transparent to-white/10" />

            {/* 鏡面ハイライトスウィープ */}
            {currentSword.shineLevel >= 70 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-45 animate-pulse" />
            )}

            {/* 刻印「惡鬼滅殺」 */}
            <div className="relative z-10 pl-6 text-sm md:text-base font-bold tracking-[0.3em] text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-['Shippori_Mincho']">
              {currentSword.engraving}
            </div>

            {/* 刃先の切っ先カーブ */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />

            {/* 上にかぶさるサビのスクラッチキャンバス (Scratchable Rust Mask Canvas) */}
            <canvas
              ref={canvasRef}
              width={700}
              height={100}
              className="absolute inset-0 w-full h-full cursor-crosshair z-30 touch-none"
              onMouseDown={(e) => {
                isScratching.current = true;
                handleScratch(e);
              }}
              onMouseMove={(e) => {
                if (isScratching.current) handleScratch(e);
              }}
              onMouseUp={() => {
                isScratching.current = false;
              }}
              onMouseLeave={() => {
                isScratching.current = false;
              }}
              onTouchStart={(e) => {
                isScratching.current = true;
                handleScratch(e);
              }}
              onTouchMove={(e) => {
                if (isScratching.current) handleScratch(e);
              }}
              onTouchEnd={() => {
                isScratching.current = false;
              }}
            />
          </div>
        </div>
      </div>

      {/* 鑑定評価結果モーダル */}
      {finishRank && (
        <div className="mt-6 p-5 bg-neutral-900 border border-amber-600/50 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-amber-400 font-['Shippori_Mincho']">
                  仕上がり評価：{finishRank.rank}
                </span>
                <span className="text-xs text-neutral-400">（総合得点: {finishRank.score}点）</span>
              </div>
              <p className="text-sm text-neutral-300 mt-1">{finishRank.comment}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFX.playBladeAwaken();
                setFinishRank(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
            >
              研ぎを完了して納刀
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
