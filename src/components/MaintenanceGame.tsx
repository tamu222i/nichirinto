/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, CheckCircle, Hand } from 'lucide-react';
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
  const selectedToolRef = useRef<MaintenanceTool>(selectedTool);
  selectedToolRef.current = selectedTool;

  // Canvas に初期のサビレイヤーを描画
  const initRustCanvas = useCallback(() => {
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
    for (let i = 0; i < 240; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      const radius = Math.random() * 20 + 6;
      ctx.beginPath();
      ctx.arc(rx, ry, radius, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(67, 20, 16, 0.88)' : 'rgba(127, 29, 29, 0.75)';
      ctx.fill();
    }
  }, [currentSword.rustLevel]);

  useEffect(() => {
    initRustCanvas();
    setIsFinished(false);
    setFinishRank(null);
  }, [currentSword.id, initRustCanvas]);

  // スクラッチコア処理
  const performScratchAt = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isFinished) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    // 道具に応じた消しゴム効果（タブレット用に半径を拡大）
    ctx.globalCompositeOperation = 'destination-out';
    const tool = selectedToolRef.current;
    const radius = tool === 'WHETSTONE' ? 44 : tool === 'CHOJI_OIL' ? 52 : 36;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    strokeCounter.current += 1;

    // サウンド再生＆ドメイン更新
    if (strokeCounter.current % 3 === 0) {
      if (tool === 'WHETSTONE') soundFX.playWhetstoneScrape();
      else if (tool === 'UCHIKO') soundFX.playUchikoPat();
      else soundFX.playOilWipe();

      const feedback = MaintenanceDomainService.applyToolStroke(currentSword, tool, 1.5);
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
  }, [currentSword, isFinished, onUpdateSword]);

  // ネイティブタッチイベントリスナーの登録（passive: false でスクロール・グラつきを完全ブロック）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isScratching.current = true;
      if (e.touches.length > 0) {
        performScratchAt(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isScratching.current) return;
      if (e.touches.length > 0) {
        performScratchAt(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isScratching.current = false;
    };

    // passive: false でブラウザのプルリフレッシュや画面のグラつきスクロールを完全無効化
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [performScratchAt]);

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
    <div className="max-w-5xl mx-auto px-4 py-4 md:py-6 select-none touch-manipulation">
      {/* タイトル＆説明 */}
      <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-0.5">
            <span>刀鍛冶の里</span>
            <span aria-hidden="true">·</span>
            <span>研磨場</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-400">{meta.nameJa}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 font-['Shippori_Mincho']">
            日輪刀のお手入れ・サビ研磨
          </h2>
          <p className="text-xs md:text-sm text-neutral-400 mt-0.5">
            刀身の赤錆を指やマウスでこすって研ぎ落とし、鏡面光沢と「惡鬼滅殺」の刃文を蘇らせろ。
          </p>
        </div>

        {/* 刀ステータス（タブレットで視認しやすいゲージ付き） */}
        <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-xs shrink-0">
          <div>
            <div className="text-neutral-400">所有者</div>
            <div className="font-semibold text-neutral-200">{currentSword.swordsmanName}</div>
          </div>
          <div className="w-px h-6 bg-neutral-800" />
          <div>
            <div className="text-neutral-400 flex justify-between gap-2">
              <span>サビ度</span>
              <span className="font-mono tabular-nums text-rose-400 font-bold">{currentSword.rustLevel}%</span>
            </div>
            <div className="w-16 h-1.5 bg-neutral-950 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-rose-500 transition-all duration-150" style={{ width: `${currentSword.rustLevel}%` }} />
            </div>
          </div>
          <div className="w-px h-6 bg-neutral-800" />
          <div>
            <div className="text-neutral-400 flex justify-between gap-2">
              <span>光沢度</span>
              <span className="font-mono tabular-nums text-amber-400 font-bold">{currentSword.shineLevel}%</span>
            </div>
            <div className="w-16 h-1.5 bg-neutral-950 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-amber-400 transition-all duration-150" style={{ width: `${currentSword.shineLevel}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 道具選択ツールバー (タブレット用 押しやすいボタン幅) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-neutral-900 border border-neutral-800 rounded-xl mb-4">
        <div className="flex items-center gap-1.5 flex-1 min-w-[280px]">
          <button
            onClick={() => {
              soundFX.playUchikoPat();
              setSelectedTool('UCHIKO');
              setMessage('打ち粉を選択した。ポンポンと叩いて古い油とサビを浮かせろ！');
            }}
            className={`flex-1 py-3 px-3 text-xs md:text-sm font-semibold rounded-lg transition-all cursor-pointer min-h-[46px] ${
              selectedTool === 'UCHIKO'
                ? 'bg-neutral-800 text-amber-400 border border-amber-500/50 shadow-md scale-102'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-950/40'
            }`}
          >
            ① 打ち粉
          </button>

          <button
            onClick={() => {
              soundFX.playWhetstoneScrape();
              setSelectedTool('WHETSTONE');
              setMessage('水研ぎ砥石を選択した。刀身を大きく擦って赤サビを削り落とせ！');
            }}
            className={`flex-1 py-3 px-3 text-xs md:text-sm font-semibold rounded-lg transition-all cursor-pointer min-h-[46px] ${
              selectedTool === 'WHETSTONE'
                ? 'bg-neutral-800 text-amber-400 border border-amber-500/50 shadow-md scale-102'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-950/40'
            }`}
          >
            ② 砥石（水研ぎ）
          </button>

          <button
            onClick={() => {
              soundFX.playOilWipe();
              setSelectedTool('CHOJI_OIL');
              setMessage('丁子油布を選択した。仕上げに拭き上げ極上の鏡面光沢を引き出せ！');
            }}
            className={`flex-1 py-3 px-3 text-xs md:text-sm font-semibold rounded-lg transition-all cursor-pointer min-h-[46px] ${
              selectedTool === 'CHOJI_OIL'
                ? 'bg-neutral-800 text-amber-400 border border-amber-500/50 shadow-md scale-102'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-950/40'
            }`}
          >
            ③ 丁子油布
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetRust}
            title="再び刀をサビさせる"
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-950 border border-neutral-800 rounded-lg transition-colors cursor-pointer min-h-[46px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>再腐食</span>
          </button>

          <button
            onClick={handleFinishCheck}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs md:text-sm font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-md min-h-[46px]"
          >
            <CheckCircle className="w-4 h-4" />
            <span>仕上がり鑑定</span>
          </button>
        </div>
      </div>

      {/* ガイドメッセージ */}
      <div className="mb-3 text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-900/60 rounded-xl px-4 py-2.5 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Hand className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{message}</span>
        </span>
        <span className="text-neutral-400 text-[11px] hidden sm:inline">
          ※タブレット画面のグラつきを防止済み。指で直接こすれます
        </span>
      </div>

      {/* 刀身スクラッチキャンバス・メインエリア（グラつき完全防止 touch-action: none） */}
      <div
        className="relative w-full h-64 md:h-84 bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-4 md:p-6"
        style={{
          touchAction: 'none',
          overscrollBehavior: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* 背景の木製研ぎ台＆畳模様 */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#555_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* 刀の全体コンテナ */}
        <div className="relative w-full max-w-4xl h-40 flex items-center">
          {/* 柄（Tsuka） */}
          <div className="relative w-24 md:w-36 h-12 bg-neutral-950 border-2 border-neutral-700 rounded-l-md flex items-center justify-center shadow-lg shrink-0">
            <div className="absolute inset-0 flex items-center justify-around opacity-75">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-7 border border-neutral-600 rotate-45 bg-neutral-800/40" />
              ))}
            </div>
            <span className="relative z-10 text-[10px] text-neutral-400 font-mono">柄巻</span>
          </div>

          {/* 鍔（Tsuba） */}
          <div className="relative w-4 md:w-6 h-24 bg-amber-700 border-2 border-amber-900 rounded-sm shadow-md shrink-0 -mx-0.5 z-20 flex items-center justify-center">
            <div className="w-2 h-10 bg-neutral-950 rounded-xs" />
          </div>

          {/* 下地: 研ぎ澄まされた日輪刀身 */}
          <div
            className="relative flex-1 h-14 md:h-16 rounded-r-full overflow-hidden shadow-inner flex items-center transition-all duration-300"
            style={{
              backgroundColor: meta.bladeColorHex,
              boxShadow: currentSword.shineLevel >= 80 ? `0 0 25px ${meta.bladeGlowHex}` : 'none',
            }}
          >
            {/* 刃文（波紋・炎紋・稲妻紋） */}
            <div className="absolute inset-0 opacity-45 mix-blend-screen bg-gradient-to-t from-white/35 via-transparent to-white/15" />

            {/* 鏡面ハイライト */}
            {currentSword.shineLevel >= 70 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-45 animate-pulse" />
            )}

            {/* 刻印「惡鬼滅殺」 */}
            <div className="relative z-10 pl-6 text-base md:text-lg font-bold tracking-[0.3em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-['Shippori_Mincho']">
              {currentSword.engraving}
            </div>

            {/* 刃先カーブ */}
            <div className="absolute right-0 top-0 bottom-0 w-14 bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />

            {/* 上にかぶさるサビのスクラッチキャンバス (グラつきゼロ・完全固定) */}
            <canvas
              ref={canvasRef}
              width={750}
              height={120}
              className="absolute inset-0 w-full h-full cursor-crosshair z-30"
              style={{
                touchAction: 'none',
                overscrollBehavior: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
              onMouseDown={(e) => {
                isScratching.current = true;
                performScratchAt(e.clientX, e.clientY);
              }}
              onMouseMove={(e) => {
                if (isScratching.current) {
                  performScratchAt(e.clientX, e.clientY);
                }
              }}
              onMouseUp={() => {
                isScratching.current = false;
              }}
              onMouseLeave={() => {
                isScratching.current = false;
              }}
            />
          </div>
        </div>
      </div>

      {/* 鑑定評価結果モーダル */}
      {finishRank && (
        <div className="mt-4 p-5 bg-neutral-900 border border-amber-600/50 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
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
              className="px-5 py-3 text-sm font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer min-h-[46px]"
            >
              研ぎを完了して納刀
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
