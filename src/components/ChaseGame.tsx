/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Flame, Play, RotateCcw, Award, Zap } from 'lucide-react';
import { ChaseDomainService, ChaseEntityState } from '../domain/services/ChaseService';
import { soundFX } from '../services/audio';

export const ChaseGame: React.FC = () => {
  const [gameState, setGameState] = useState<ChaseEntityState>(
    ChaseDomainService.createInitialState('竈門炭治郎')
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [dialogue, setDialogue] = useState<string>('「よくも…俺の打った日輪刀を折りやがったなァァァ！！」');
  const [bannerAlert, setBannerAlert] = useState<string>('');
  const lastTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // ゲームループ
  useEffect(() => {
    if (!isPlaying || gameState.isGameOver) return;

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaSec = Math.min(0.05, (timestamp - lastTimeRef.current) / 1000);
      lastTimeRef.current = timestamp;

      setGameState((prev) => {
        const next = { ...prev };
        const result = ChaseDomainService.updatePhysics(next, deltaSec);

        if (result.event === 'DANGO_EATEN') {
          soundFX.playDangoEat();
          setBannerAlert('【みたらし団子獲得！】「うめえええ！超加速発動！！」');
          setTimeout(() => setBannerAlert(''), 2500);
        } else if (result.event === 'COLLIDED') {
          soundFX.playPunishHit();
          setBannerAlert('【障害物につまずいた！】');
          setTimeout(() => setBannerAlert(''), 1200);
        } else if (result.event === 'CAUGHT') {
          soundFX.playBladeAwaken();
          setDialogue('「捕まえたぞォォ！お仕置きの時間だァ！画面を連打しろォ！」');
        }

        return next;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = 0;
    };
  }, [isPlaying, gameState.isGameOver]);

  // ジャンプ
  const handleJump = useCallback(() => {
    if (!isPlaying || gameState.isCaught) return;
    soundFX.playWhetstoneScrape();
    setGameState((prev) => {
      const next = { ...prev };
      ChaseDomainService.jump(next);
      return next;
    });

    // 0.45秒後に着地
    setTimeout(() => {
      setGameState((prev) => {
        const next = { ...prev };
        ChaseDomainService.land(next);
        return next;
      });
    }, 450);
  }, [isPlaying, gameState.isCaught]);

  // お仕置き連打タップ
  const handlePunishTap = useCallback(() => {
    if (!gameState.isCaught || gameState.isGameOver) return;
    soundFX.playPunishHit();

    setGameState((prev) => {
      const next = { ...prev };
      const res = ChaseDomainService.applyPunishHit(next);
      setDialogue(res.dialogue);
      return next;
    });
  }, [gameState.isCaught, gameState.isGameOver]);

  // キーボード操作（スペース・上矢印でジャンプ）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (isPlaying && !gameState.isCaught) {
          handleJump();
        } else if (gameState.isCaught && !gameState.isGameOver) {
          handlePunishTap();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameState.isCaught, gameState.isGameOver, handleJump, handlePunishTap]);

  const handleStartGame = () => {
    setGameState(ChaseDomainService.createInitialState('竈門炭治郎'));
    setIsPlaying(true);
    setDialogue('「待てえええ！逃げるんじゃねえええ！」');
    setBannerAlert('');
  };

  const handleResetGame = () => {
    setIsPlaying(false);
    setGameState(ChaseDomainService.createInitialState('竈門炭治郎'));
    setDialogue('「よくも…俺の打った日輪刀を折りやがったなァァァ！！」');
    setBannerAlert('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 md:py-6 select-none touch-manipulation">
      {/* ヘッダー */}
      <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-0.5">
            <span>刀鍛冶の里</span>
            <span aria-hidden="true">·</span>
            <span>激走チェイス</span>
            <span aria-hidden="true">·</span>
            <span className="text-rose-400">折った奴にお仕置きだ！</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 font-['Shippori_Mincho']">
            折った鬼殺隊士を追いかけ回す！
          </h2>
          <p className="text-xs md:text-sm text-neutral-400 mt-0.5">
            画面タップで障害物を跳び越え、好物のみたらし団子🍡を食べて超加速！逃げ惑う隊士を追い詰めろ！
          </p>
        </div>

        {/* 状態HUD */}
        <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-xs shrink-0">
          <div>
            <div className="text-neutral-400">標的</div>
            <div className="font-semibold text-neutral-200">竈門炭治郎</div>
          </div>
          <div className="w-px h-6 bg-neutral-800" />
          <div>
            <div className="text-neutral-400">距離</div>
            <div className="font-mono tabular-nums font-bold text-rose-400 text-sm">
              {gameState.distance.toFixed(1)} m
            </div>
          </div>
          <div className="w-px h-6 bg-neutral-800" />
          <div>
            <div className="text-neutral-400">団子</div>
            <div className="font-mono tabular-nums font-bold text-amber-400 text-sm">
              🍡 × {gameState.dangoCount}
            </div>
          </div>
        </div>
      </div>

      {/* アラートバナー */}
      {bannerAlert && (
        <div className="mb-3 text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-500 rounded-xl px-4 py-2.5 text-center animate-bounce shadow-lg">
          {bannerAlert}
        </div>
      )}

      {/* ゲームステージ（タップでジャンプ可能 & タブレット最適化） */}
      <div
        onClick={() => {
          if (isPlaying && !gameState.isCaught) {
            handleJump();
          }
        }}
        className="relative w-full h-72 md:h-88 bg-neutral-950 border-2 border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-end select-none cursor-pointer"
        style={{
          touchAction: 'none',
          overscrollBehavior: 'none',
        }}
      >
        {/* 背景: 里の山道・竹林と月夜 */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-amber-950/30 opacity-90" />
        <div className="absolute top-4 right-10 w-20 h-20 rounded-full bg-amber-100/10 blur-sm pointer-events-none" />

        {/* 団子ブースト演出 */}
        {gameState.dangoBoostTimer > 0 && (
          <div className="absolute inset-0 bg-rose-500/15 animate-pulse pointer-events-none border-4 border-rose-500/50 rounded-2xl flex items-start justify-end p-4">
            <div className="bg-rose-950/90 border border-rose-500 text-rose-300 font-bold px-3 py-1 rounded-full text-xs animate-bounce shadow-lg">
              🔥 団子超加速中！ 残り {gameState.dangoBoostTimer.toFixed(1)}s
            </div>
          </div>
        )}

        {/* 逃走隊士のセリフ吹き出し */}
        <div className="absolute top-3 left-4 right-4 flex justify-center pointer-events-none z-30">
          <div className="max-w-md px-4 py-2 bg-neutral-900/90 border border-neutral-700 rounded-full text-xs text-amber-300 text-center font-medium shadow-lg backdrop-blur">
            {dialogue}
          </div>
        </div>

        {/* 地面ライン */}
        <div className="relative w-full h-16 bg-neutral-900 border-t-4 border-amber-900/60 flex items-center">
          <div className="w-full h-2 bg-amber-950/80" />
        </div>

        {/* 走るスプライト: 鍛冶師（鋼鐵塚風ひょっとこ面） */}
        <div
          className="absolute transition-transform duration-100 flex flex-col items-center z-20 pointer-events-none"
          style={{
            left: `${gameState.playerX}px`,
            bottom: `${64 + gameState.playerY}px`,
          }}
        >
          {/* 怒りの湯気・炎 */}
          <div className="w-8 h-4 flex justify-center">
            <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
          </div>

          {/* ひょっとこ鍛冶師 */}
          <div className="relative w-16 h-20 bg-neutral-800 border-2 border-amber-600 rounded-t-xl flex flex-col items-center justify-between p-1 shadow-lg">
            <div className="w-10 h-10 rounded-full bg-amber-100 border border-neutral-800 flex flex-col items-center justify-center text-[10px] font-bold text-neutral-900 shadow">
              <span>( ﾟ口ﾟ)</span>
              <div className="text-[8px] -mt-1 text-rose-600 font-bold">怒</div>
            </div>
            <div className="flex justify-between w-full px-1 text-[11px]">
              <span title="包丁">🔪</span>
              <span title="金槌">🔨</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-400 mt-0.5">鋼鐵塚</span>
        </div>

        {/* 走るスプライト: 逃げる隊士（炭治郎） */}
        {!gameState.isCaught && (
          <div
            className="absolute transition-all duration-100 flex flex-col items-center z-20 pointer-events-none"
            style={{
              left: `${Math.min(720, gameState.playerX + gameState.distance * 12 + 80)}px`,
              bottom: '64px',
            }}
          >
            <div className="text-xs text-neutral-400 animate-bounce">💦</div>
            <div className="w-14 h-18 bg-emerald-950 border-2 border-emerald-500 rounded-t-xl flex flex-col items-center justify-center p-1 shadow-lg">
              <div className="grid grid-cols-2 gap-0.5 w-8 h-8">
                <div className="bg-emerald-500" />
                <div className="bg-black" />
                <div className="bg-black" />
                <div className="bg-emerald-500" />
              </div>
              <span className="text-[9px] text-white mt-1">(＞＜;)</span>
            </div>
            <span className="text-[10px] font-medium text-emerald-400 mt-0.5">炭治郎</span>
          </div>
        )}

        {/* 障害物 */}
        {gameState.obstacles.map((obs) => {
          if (obs.cleared) return null;
          return (
            <div
              key={obs.id}
              className="absolute z-10 flex flex-col items-center justify-center pointer-events-none"
              style={{
                left: `${obs.x}px`,
                bottom: '64px',
                width: `${obs.width}px`,
                height: `${obs.height}px`,
              }}
            >
              {obs.type === 'DANGO' ? (
                <div className="text-2xl animate-bounce drop-shadow" title="みたらし団子">
                  🍡
                </div>
              ) : obs.type === 'ROCK' ? (
                <div className="w-8 h-7 bg-neutral-600 border border-neutral-500 rounded-md shadow flex items-center justify-center text-[9px] text-neutral-300">
                  岩
                </div>
              ) : (
                <div className="w-9 h-8 bg-amber-950 border border-amber-800 rounded-sm shadow flex items-center justify-center text-[9px] text-amber-200">
                  丸太
                </div>
              )}
            </div>
          );
        })}

        {/* 捕獲時のお仕置きオーバーレイ（タップ連打モード） */}
        {gameState.isCaught && !gameState.isGameOver && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handlePunishTap();
            }}
            className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 cursor-pointer"
          >
            <span className="text-xs text-rose-400 font-bold tracking-widest uppercase">
              Punishment Time!
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-neutral-100 font-['Shippori_Mincho'] mt-1">
              捕獲！画面を連打してお仕置きしろ！
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md">
              「俺の打った刀を折るとはどういう度胸だァ！こちょこちょの刑だァ！！」
            </p>

            <div className="my-4">
              <div className="text-3xl md:text-4xl font-extrabold text-amber-400 font-mono tabular-nums">
                {gameState.punishHits} / 25 発
              </div>
              <div className="w-72 h-3.5 bg-neutral-900 rounded-full border border-neutral-800 overflow-hidden mx-auto mt-2">
                <div
                  className="h-full bg-rose-500 transition-all duration-75"
                  style={{ width: `${(gameState.punishHits / 25) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePunishTap();
              }}
              className="px-8 py-5 text-lg font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-2xl transition-transform active:scale-90 cursor-pointer shadow-2xl flex items-center gap-2 min-h-[56px]"
            >
              <span>👊 画面を連打！（タップ！）</span>
            </button>
          </div>
        )}

        {/* ゲームクリア・隊士大反省モーダル */}
        {gameState.isGameOver && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300"
          >
            <Award className="w-14 h-14 text-amber-400 mb-2" />
            <h3 className="text-2xl md:text-3xl font-bold text-amber-400 font-['Shippori_Mincho']">
              お仕置き完了！刀鍛冶の威厳を守り抜いた！
            </h3>
            <p className="text-xs md:text-sm text-neutral-300 mt-2 max-w-md">
              炭治郎「もう二度と折りません！死んでも折らせません！！許してください鋼鐵塚さーーん！！」
            </p>
            <div className="mt-4 p-3 bg-neutral-900 border border-amber-600/40 rounded-xl text-xs text-amber-300">
              報酬：【職人の極意】＆【特製みたらし団子 3本】を獲得！
            </div>
            <button
              onClick={handleStartGame}
              className="mt-5 px-6 py-3 text-xs md:text-sm font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer min-h-[46px]"
            >
              もう一度追いかける！
            </button>
          </div>
        )}
      </div>

      {/* ゲームコントローラーバー（タブレット操作用に大ボタン化） */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="flex items-center gap-3 flex-1">
          {!isPlaying ? (
            <button
              onClick={handleStartGame}
              className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-md min-h-[48px] flex-1 sm:flex-none"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>チェイス開始！（追走）</span>
            </button>
          ) : (
            <button
              onClick={handleJump}
              disabled={gameState.isCaught}
              className="flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-40 rounded-xl transition-transform active:scale-95 cursor-pointer shadow-md min-h-[52px] flex-1"
            >
              <Zap className="w-5 h-5" />
              <span>ジャンプ！（画面タップでもOK）</span>
            </button>
          )}

          <button
            onClick={handleResetGame}
            className="flex items-center gap-1.5 px-4 py-3 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-950 border border-neutral-800 rounded-xl transition-colors cursor-pointer min-h-[48px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>リセット</span>
          </button>
        </div>

        <div className="text-xs text-neutral-400 hidden lg:block">
          ※画面のどこをタップしてもジャンプ可能。みたらし団子🍡を取って一気に追いつけ！
        </div>
      </div>
    </div>
  );
};
