/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundFX } from '../services/audio';

export type ActiveTab = 'MAINTENANCE' | 'FORGING' | 'REPAIR' | 'CHASE' | 'GALLERY';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  isMuted,
  onToggleMute,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => onSelectTab('MAINTENANCE')}
        className="text-lg font-bold tracking-tight text-amber-500 hover:text-amber-400 transition-colors cursor-pointer text-left font-['Shippori_Mincho']"
      >
        日輪刀鍛冶工房
      </button>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
        <button
          onClick={() => { soundFX.playHammerStrike(1.2); onSelectTab('MAINTENANCE'); }}
          className={`hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer pb-1 ${
            activeTab === 'MAINTENANCE' ? 'text-amber-400 border-b-2 border-amber-500 font-bold' : ''
          }`}
        >
          サビ落とし・手入れ
        </button>
        <button
          onClick={() => { soundFX.playHammerStrike(1.0); onSelectTab('FORGING'); }}
          className={`hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer pb-1 ${
            activeTab === 'FORGING' ? 'text-amber-400 border-b-2 border-amber-500 font-bold' : ''
          }`}
        >
          日輪刀の鍛造
        </button>
        <button
          onClick={() => { soundFX.playHammerStrike(0.9); onSelectTab('REPAIR'); }}
          className={`hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer pb-1 ${
            activeTab === 'REPAIR' ? 'text-amber-400 border-b-2 border-amber-500 font-bold' : ''
          }`}
        >
          折れた刀の修理
        </button>
        <button
          onClick={() => { soundFX.playPunishHit(); onSelectTab('CHASE'); }}
          className={`hover:text-rose-400 transition-colors whitespace-nowrap cursor-pointer pb-1 ${
            activeTab === 'CHASE' ? 'text-rose-400 border-b-2 border-rose-500 font-bold' : ''
          }`}
        >
          折った隊士を追走！
        </button>
        <button
          onClick={() => { soundFX.playBladeAwaken(); onSelectTab('GALLERY'); }}
          className={`hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer pb-1 ${
            activeTab === 'GALLERY' ? 'text-amber-400 border-b-2 border-amber-500 font-bold' : ''
          }`}
        >
          名刀録（図鑑）
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMute}
          title={isMuted ? '音声を有効化' : '音声をミュート'}
          className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
          aria-label={isMuted ? '音声を有効化' : '音声をミュート'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-neutral-500" /> : <Volume2 className="w-5 h-5 text-amber-500" />}
        </button>
      </div>
    </header>
  );
};
