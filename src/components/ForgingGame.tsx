/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Flame, Hammer, Droplets, Sparkles, Wind, Check, ChevronRight } from 'lucide-react';
import { BreathingType, BREATHING_DATA } from '../domain/types';
import { SwordAggregate } from '../domain/models/Sword';
import { ForgingDomainService, ForgingSessionState } from '../domain/services/ForgingService';
import { soundFX } from '../services/audio';

interface ForgingGameProps {
  onSwordForged: (newSword: SwordAggregate) => void;
}

type Step = 'MATERIALS' | 'HEATING' | 'HAMMERING' | 'QUENCHING' | 'AWAKENING';

export const ForgingGame: React.FC<ForgingGameProps> = ({ onSwordForged }) => {
  const [step, setStep] = useState<Step>('MATERIALS');
  const [sandRatio, setSandRatio] = useState<number>(40);
  const [temperature, setTemperature] = useState<number>(500);
  const [selectedBreathing, setSelectedBreathing] = useState<BreathingType>('SUN');
  const [swordsmanName, setSwordsmanName] = useState<string>('竈門炭治郎');
  const [hammerHits, setHammerHits] = useState<number>(0);
  const [hammerCombo, setHammerCombo] = useState<number>(0);
  const [sparkKey, setSparkKey] = useState<number>(0);
  const [quenchSuccess, setQuenchSuccess] = useState<boolean | null>(null);
  const [quenchMessage, setQuenchMessage] = useState<string>('');
  const [awakenedSword, setAwakenedSword] = useState<SwordAggregate | null>(null);
  const [revealColorProgress, setRevealColorProgress] = useState<number>(0); // 0〜100%

  // 自然放熱タイマー（HEATINGステップ中）
  useEffect(() => {
    if (step !== 'HEATING') return;
    const interval = setInterval(() => {
      setTemperature((prev) => ForgingDomainService.coolFurnace(prev, 0.2));
    }, 200);
    return () => clearInterval(interval);
  }, [step]);

  // 色変わりアニメーション
  useEffect(() => {
    if (step === 'AWAKENING') {
      setRevealColorProgress(0);
      const timer = setInterval(() => {
        setRevealColorProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + 5;
        });
      }, 70);
      return () => clearInterval(timer);
    }
  }, [step]);

  // 1. ふいごプッシュ
  const handlePumpBellows = () => {
    soundFX.playWhetstoneScrape();
    const res = ForgingDomainService.pumpBellows(temperature);
    setTemperature(res.newTemp);
  };

  // 2. 槌打ち
  const handleStrikeHammer = () => {
    soundFX.playHammerStrike(1.0 + Math.random() * 0.2);
    setSparkKey(Date.now());

    const mockState: ForgingSessionState = {
      sandRatio,
      oreRatio: 100 - sandRatio,
      temperature,
      hammerHits,
      hammerCombo,
      maxHammerHits: 12,
      quenched: false,
      quenchScore: 0,
      targetBreathing: selectedBreathing,
      swordsmanName,
    };

    const res = ForgingDomainService.strikeHammer(mockState, 'PERFECT');
    setHammerHits(mockState.hammerHits);
    setHammerCombo(mockState.hammerCombo);

    if (mockState.hammerHits >= 12) {
      setTimeout(() => {
        setStep('QUENCHING');
      }, 500);
    }
  };

  // 3. 焼き入れ
  const handleQuench = () => {
    soundFX.playQuenchHiss();

    const mockState: ForgingSessionState = {
      sandRatio,
      oreRatio: 100 - sandRatio,
      temperature,
      hammerHits,
      hammerCombo,
      maxHammerHits: 12,
      quenched: false,
      quenchScore: 0,
      targetBreathing: selectedBreathing,
      swordsmanName,
    };

    const res = ForgingDomainService.quenchBlade(mockState);
    setQuenchSuccess(res.success);
    setQuenchMessage(res.message);

    const sword = ForgingDomainService.awakenForgedSword(mockState);
    setAwakenedSword(sword);

    setTimeout(() => {
      soundFX.playBladeAwaken();
      setStep('AWAKENING');
    }, 1200);
  };

  const handleFinishForging = () => {
    if (awakenedSword) {
      onSwordForged(awakenedSword);
    }
  };

  const meta = BREATHING_DATA[selectedBreathing];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* タイトル */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
          <span>刀鍛冶の里</span>
          <span aria-hidden="true">·</span>
          <span>たたら製鉄炉</span>
          <span aria-hidden="true">·</span>
          <span className="text-amber-400">猩々緋鉱石と砂鉄</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 font-['Shippori_Mincho']">
          日輪刀の鍛造（石から刀へ）
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          太陽に一番近い山で採れる猩々緋砂鉄と鉱石を選定し、火床で熱し、槌で鍛え、焼き入れを経て魂の色を宿せ。
        </p>
      </div>

      {/* 鍛造ステップインジケーター */}
      <div className="flex items-center justify-between gap-1 p-2 bg-neutral-900 border border-neutral-800 rounded-lg mb-8 text-xs font-medium overflow-x-auto">
        <div className={`px-3 py-1.5 rounded-md whitespace-nowrap ${step === 'MATERIALS' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-neutral-400'}`}>
          ① 鉱石選定と調合
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
        <div className={`px-3 py-1.5 rounded-md whitespace-nowrap ${step === 'HEATING' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-neutral-400'}`}>
          ② 鞴（ふいご）火起こし
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
        <div className={`px-3 py-1.5 rounded-md whitespace-nowrap ${step === 'HAMMERING' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-neutral-400'}`}>
          ③ 金床槌打ち鍛錬
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
        <div className={`px-3 py-1.5 rounded-md whitespace-nowrap ${step === 'QUENCHING' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-neutral-400'}`}>
          ④ 焼き入れ（急冷）
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
        <div className={`px-3 py-1.5 rounded-md whitespace-nowrap ${step === 'AWAKENING' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-neutral-400'}`}>
          ⑤ 抜刀・色変わり覚醒
        </div>
      </div>

      {/* ステップ1: 鉱石と砂鉄の調合＆呼吸の適性選択 */}
      {step === 'MATERIALS' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 md:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-neutral-200 font-['Shippori_Mincho'] mb-2">
              原材料の選定と配合比率
            </h3>
            <p className="text-xs text-neutral-400">
              猩々緋砂鉄（硬度）と猩々緋鉱石（粘りと強度）を調合します。理想比率は砂鉄40% : 鉱石60%です。
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>猩々緋砂鉄: <strong className="text-amber-400">{sandRatio}%</strong></span>
                <span>猩々緋鉱石: <strong className="text-amber-400">{100 - sandRatio}%</strong></span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={sandRatio}
                onChange={(e) => setSandRatio(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">刀を託す鬼殺隊士の名</label>
                <input
                  type="text"
                  value={swordsmanName}
                  onChange={(e) => setSwordsmanName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-md text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">隊士の呼吸の系統</label>
                <select
                  value={selectedBreathing}
                  onChange={(e) => setSelectedBreathing(e.target.value as BreathingType)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-md text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  {Object.values(BREATHING_DATA).map((b) => (
                    <option key={b.type} value={b.type}>
                      {b.nameJa}（{b.colorName}） - 代表: {b.representative}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                soundFX.playHammerStrike(1.0);
                setStep('HEATING');
              }}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
            >
              <span>たたら炉に火を入れる</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ステップ2: 鞴（ふいご）火起こし */}
      {step === 'HEATING' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 md:p-8 space-y-6 text-center">
          <div>
            <h3 className="text-lg font-bold text-neutral-200 font-['Shippori_Mincho'] mb-1">
              鞴（ふいご）で風を送り、最適温度（950〜1100℃）を保て！
            </h3>
            <p className="text-xs text-neutral-400">
              放っておくと冷めてしまいます。ふいごをタップして炭火を煽り、白熱状態に到達させましょう。
            </p>
          </div>

          {/* 温度メーター */}
          <div className="relative w-full max-w-md mx-auto h-12 bg-neutral-950 rounded-full border-2 border-neutral-700 overflow-hidden flex items-center p-1">
            <div
              className="h-full rounded-full transition-all duration-200 bg-gradient-to-r from-amber-600 via-orange-500 to-rose-500"
              style={{ width: `${Math.min(100, (temperature / 1300) * 100)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-white drop-shadow">
              {Math.round(temperature)} ℃
              {temperature >= 950 && temperature <= 1100 && (
                <span className="ml-2 text-emerald-400">【鍛造最適ゾーン！】</span>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={handlePumpBellows}
              className="flex items-center gap-2 px-6 py-4 text-sm font-bold text-amber-200 bg-gradient-to-b from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 border border-amber-600 rounded-xl transition-transform active:scale-95 cursor-pointer shadow-lg"
            >
              <Wind className="w-5 h-5" />
              <span>鞴（ふいご）を押す！</span>
            </button>

            {temperature >= 920 && (
              <button
                onClick={() => {
                  soundFX.playHammerStrike(1.2);
                  setStep('HAMMERING');
                }}
                className="flex items-center gap-2 px-6 py-4 text-sm font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-lg animate-pulse"
              >
                <Hammer className="w-5 h-5" />
                <span>赤熱した鋼を金床へ！</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ステップ3: 金床槌打ち鍛錬 */}
      {step === 'HAMMERING' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 md:p-8 space-y-6 text-center">
          <div>
            <h3 className="text-lg font-bold text-neutral-200 font-['Shippori_Mincho'] mb-1">
              大槌で熱い鋼を叩き鍛えろ！（目標: 12回）
            </h3>
            <p className="text-xs text-neutral-400">
              打てば打つほど玉鋼の不純物が飛び散り、頑強な日輪刀の形が現れます。
            </p>
          </div>

          {/* 鍛錬進行度 */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-xs text-neutral-400 mb-1">
              <span>鍛錬進捗</span>
              <span className="font-mono tabular-nums text-amber-400">{hammerHits} / 12 回</span>
            </div>
            <div className="w-full h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="h-full bg-amber-500 transition-all duration-150"
                style={{ width: `${(hammerHits / 12) * 100}%` }}
              />
            </div>
          </div>

          {/* 金床＆鋼のビジュアル */}
          <div className="relative w-72 h-44 mx-auto bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-center overflow-hidden">
            {/* 赤熱したインゴット */}
            <div
              key={sparkKey}
              className="w-48 h-8 rounded-sm transition-all duration-150 flex items-center justify-center font-mono text-[10px] text-black/60 font-bold"
              style={{
                backgroundColor: hammerHits >= 10 ? '#fdba74' : '#ea580c',
                boxShadow: '0 0 30px #f97316',
                transform: sparkKey ? 'scale(0.96)' : 'scale(1)',
              }}
            >
              鋼材成形中
            </div>

            {/* 火花エフェクト */}
            {sparkKey > 0 && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-24 h-24 bg-amber-300/30 rounded-full blur-xl animate-ping" />
              </div>
            )}
          </div>

          <div>
            <button
              onClick={handleStrikeHammer}
              className="px-8 py-5 text-base font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-transform active:scale-90 cursor-pointer shadow-xl flex items-center gap-2 mx-auto"
            >
              <Hammer className="w-6 h-6" />
              <span>槌で打つ！（カーン！）</span>
            </button>
          </div>
        </div>
      )}

      {/* ステップ4: 焼き入れ（急冷） */}
      {step === 'QUENCHING' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 md:p-8 space-y-6 text-center">
          <div>
            <h3 className="text-lg font-bold text-neutral-200 font-['Shippori_Mincho'] mb-1">
              焼き入れ（運命の一瞬）
            </h3>
            <p className="text-xs text-neutral-400">
              熱した刀身を一気に水桶に沈めて急冷し、極限の硬度と美しい刃文を定着させます。
            </p>
          </div>

          <div className="w-64 h-36 mx-auto bg-blue-950/40 border border-blue-900/50 rounded-xl flex items-center justify-center relative overflow-hidden">
            <Droplets className="w-12 h-12 text-blue-400 animate-bounce" />
            <div className="absolute bottom-2 text-xs text-blue-300">銘水が満たされた水桶</div>
          </div>

          <div>
            <button
              onClick={handleQuench}
              disabled={quenchSuccess !== null}
              className="px-8 py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-2 mx-auto"
            >
              <Droplets className="w-5 h-5" />
              <span>水桶に沈めて焼き入れ！（ジュワァッ）</span>
            </button>
          </div>

          {quenchMessage && (
            <p className="text-sm font-medium text-amber-300 animate-pulse">{quenchMessage}</p>
          )}
        </div>
      )}

      {/* ステップ5: 抜刀・色変わり覚醒 */}
      {step === 'AWAKENING' && awakenedSword && (
        <div className="bg-neutral-900 border border-amber-600/40 rounded-xl p-6 md:p-8 space-y-6 text-center animate-in zoom-in-95 duration-500">
          <div>
            <span className="text-xs text-amber-400 font-bold tracking-widest uppercase">
              Awakening Ceremony
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-neutral-100 font-['Shippori_Mincho'] mt-1">
              抜刀！刀身の色変わり
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              {swordsmanName} が柄を握った瞬間、その呼吸の素質に応じた色が刀身に宿る…！
            </p>
          </div>

          {/* 刀身の色変わりアニメーション表示 */}
          <div className="relative w-full max-w-3xl mx-auto h-28 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center p-6 shadow-2xl overflow-hidden">
            <div className="relative w-full h-8 rounded-r-full overflow-hidden flex items-center bg-neutral-800">
              {/* 色変わりグラデーション */}
              <div
                className="h-full rounded-r-full transition-all duration-300 flex items-center px-4"
                style={{
                  width: `${revealColorProgress}%`,
                  backgroundColor: meta.bladeColorHex,
                  boxShadow: `0 0 35px ${meta.bladeGlowHex}`,
                }}
              >
                <span className="text-xs font-bold text-white drop-shadow font-['Shippori_Mincho']">
                  {revealColorProgress >= 90 ? '惡鬼滅殺' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* 覚醒した色の詳細 */}
          <div className="max-w-md mx-auto p-4 bg-neutral-950/80 border border-neutral-800 rounded-lg text-left">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-neutral-400">覚醒した色彩</span>
              <strong className="text-amber-400">{meta.colorName}</strong>
            </div>
            <div className="text-xs text-neutral-300">{meta.description}</div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleFinishForging}
              className="px-6 py-3 text-sm font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-lg flex items-center gap-2 mx-auto"
            >
              <Check className="w-4 h-4" />
              <span>鍛造完了！名刀録（図鑑）に登録</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
