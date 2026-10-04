# 変更履歴 (changelog.md)

本プロジェクトはスキーマ駆動型簡易DDD、BDD（振る舞い駆動開発）、TDD（テスト駆動開発: Red → Green → Refactor → 1サイクル1commit）に基づき開発されました。

---

## [0.1.0] - 初期環境構築＆ドキュメント策定
- **Commit**: `feat(init): plan.md, changelog.md, and project metadata setup` (hash: `9a4f21b`)
- **内容**:
  - `plan.md` 作成（スキーマ駆動・簡易DDD・BDD/TDD設計、ゲームモード定義）
  - `changelog.md` 作成（TDDサイクル記録形式の策定）
  - `metadata.json` および `index.html` の更新（和風書体・メタデータ・タイトル設定）
  - `zod` パッケージの導入

---

## [0.2.0] - Cycle 1: ドメインコア＆スキーマバリデーション
- **Commit**: `feat(domain): core value objects, entities, and zod schemas` (hash: `3e81c0d`)
- **TDDサイクル**:
  - **Red**: `domainCore.test.ts` で不変条件・日輪刀集約の生成・範囲外サビ率バリデーションの失敗テストを定義
  - **Green**: `types.ts` (BreathingType, NichirinSwordSchema, MaintenanceTool, etc.) と `SwordAggregate` を実装しパス
  - **Refactor**: ドメインメソッド（corrode, applyMaintenance, breakSword, repair）を集約ルートへカプセル化

---

## [0.3.0] - Cycle 2: 日輪刀のお手入れ・サビ研磨
- **Commit**: `feat(maintenance): sword rust cleaning & polish domain with BDD tests` (hash: `5d92f8a`)
- **TDDサイクル**:
  - **Red**: `maintenance.test.ts` で打ち粉・砥石水研ぎ・丁子油拭きによるサビ低減と光沢度・國宝級ランク判定の仕様を定義
  - **Green**: `MaintenanceDomainService` を実装し、道具毎の研磨係数・音響・火花エフェクト算出を完成
  - **Refactor**: Canvasリアルタイムスクラッチ研磨UIと連動するクリーンなインターフェースへリファクタリング

---

## [0.4.0] - Cycle 3: 石からの鍛造＆色変わり覚醒
- **Commit**: `feat(forging): stone selection, furnace heating, rhythm hammering & color awakening domain` (hash: `7c40e11`)
- **TDDサイクル**:
  - **Red**: `forging.test.ts` で猩々緋鉱石配合・ふいご加熱・リズム槌打ち・焼き入れ急冷・抜刀色変わり覚醒の仕様を定義
  - **Green**: `ForgingDomainService` を実装し、最適温度判定（950-1100℃）や呼吸属性ごとの色変わり覚醒ロジックを完成
  - **Refactor**: 5段階の鍛造ステップ（鉱石→ふいご→槌打ち→焼き入れ→抜刀式）を分離

---

## [0.5.0] - Cycle 4: 折れた刀の修復・接合再鍛錬
- **Commit**: `feat(repair): broken blade puzzle, re-welding & tempering domain` (hash: `1b89ef4`)
- **TDDサイクル**:
  - **Red**: `repair.test.ts` で折損破片（元幅・身幅・切っ先）の位置合わせパズルと接合再鍛造の仕様を定義
  - **Green**: `RepairDomainService` を実装し、破片の配置判定と「不屈の剛刃」等の覚醒バフ付与を完成
  - **Refactor**: 直感的なスロット配置パズルUIと統合

---

## [0.6.0] - Cycle 5: 隊士追走お仕置きチェイス
- **Commit**: `feat(chase): slayer punishment chase action mechanics & dango boost domain` (hash: `4d32a90`)
- **TDDサイクル**:
  - **Red**: `chase.test.ts` で追走物理、障害物回避ジャンプ、みたらし団子超加速、お仕置きタップコンボの仕様を定義
  - **Green**: `ChaseDomainService` を実装し、相対速度演算・団子ターボタイマー・連打お仕置きセリフ進行を完成
  - **Refactor**: requestAnimationFrameによる滑らかな2Dゲームループへリファクタリング

---

## [0.7.0] - Cycle 6: 職人工房UI統合＆和風WebAudio合成音
- **Commit**: `feat(ui-audio): full interactive craftsman hub, canvas scratch polish, audio synthesizer, and BDD test runner` (hash: `6e21b7f`)
- **内容**:
  - Web Audio APIによる和風効果音（金床のカーン！、砥石のシャッシャッ、焼き入れジュワァァ、抜刀音、団子音）を完全合成実装
  - 3ゾーンTop Bar Contract準拠のナビゲーション
  - 名刀録（図鑑）コレクション機能
  - ブラウザ内で Given-When-Then 仕様とTDDコミット履歴をリアルタイム検証できる「BDD/TDD 検証ラボ」を搭載
