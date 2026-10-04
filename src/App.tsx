/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navigation, ActiveTab } from './components/Navigation';
import { MaintenanceGame } from './components/MaintenanceGame';
import { ForgingGame } from './components/ForgingGame';
import { RepairGame } from './components/RepairGame';
import { ChaseGame } from './components/ChaseGame';
import { SwordGallery } from './components/SwordGallery';
import { SwordAggregate } from './domain/models/Sword';
import { SwordRepository } from './domain/repositories/SwordRepository';
import { soundFX } from './services/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('MAINTENANCE');
  const [swords, setSwords] = useState<SwordAggregate[]>([]);
  const [currentSwordIndex, setCurrentSwordIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // 初期ロード
  useEffect(() => {
    const loaded = SwordRepository.loadAll();
    setSwords(loaded);
  }, []);

  const currentSword = swords[currentSwordIndex] || swords[0];

  // 刀の更新（手入れや修理など）
  const handleUpdateSword = (updated: SwordAggregate) => {
    setSwords((prev) => {
      const next = prev.map((s) => (s.id === updated.id ? updated : s));
      SwordRepository.saveAll(next);
      return next;
    });
  };

  // 新規鍛造した刀の追加
  const handleSwordForged = (newSword: SwordAggregate) => {
    setSwords((prev) => {
      const next = [newSword, ...prev];
      SwordRepository.saveAll(next);
      return next;
    });
    setCurrentSwordIndex(0);
    setActiveTab('MAINTENANCE');
  };

  // 激戦による刀の折損（修復テスト用）
  const handleBreakSword = (target: SwordAggregate) => {
    target.breakSword();
    handleUpdateSword(target);
    setActiveTab('REPAIR');
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFX.isMuted = next;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-600 selection:text-white">
      {/* 3-zone Top Bar Contract Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* メインゲームビュー */}
      <main className="flex-1 pb-16">
        {activeTab === 'MAINTENANCE' && currentSword && (
          <MaintenanceGame
            currentSword={currentSword}
            onUpdateSword={handleUpdateSword}
          />
        )}

        {activeTab === 'FORGING' && (
          <ForgingGame onSwordForged={handleSwordForged} />
        )}

        {activeTab === 'REPAIR' && (
          <RepairGame
            swords={swords}
            onSwordRepaired={handleUpdateSword}
          />
        )}

        {activeTab === 'CHASE' && <ChaseGame />}

        {activeTab === 'GALLERY' && (
          <SwordGallery
            swords={swords}
            onSelectSwordForMaintenance={(sword) => {
              const idx = swords.findIndex((s) => s.id === sword.id);
              if (idx >= 0) setCurrentSwordIndex(idx);
              setActiveTab('MAINTENANCE');
            }}
            onSelectSwordForRepair={(sword) => {
              const idx = swords.findIndex((s) => s.id === sword.id);
              if (idx >= 0) setCurrentSwordIndex(idx);
              setActiveTab('REPAIR');
            }}
            onBreakSword={handleBreakSword}
          />
        )}
      </main>

      {/* フッター */}
      <footer className="border-t border-neutral-900 px-6 py-6 text-center text-xs text-neutral-500">
        <div className="flex items-center justify-center gap-2">
          <span>刀鍛冶の里</span>
          <span aria-hidden="true">·</span>
          <span>鋼鐵塚工房</span>
          <span aria-hidden="true">·</span>
          <span>日輪刀お手入れ・鍛造・修復・追走録</span>
        </div>
      </footer>
    </div>
  );
}
