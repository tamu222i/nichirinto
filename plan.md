# 日輪刀鍛冶工房 開発計画書 (plan.md)

## 1. プロジェクト概要
刀鍛冶の里の凄腕職人（ひょっとこ面の鍛冶師）となり、日輪刀のお手入れ、鉱石からの鍛造、折れた刀の修復、そして愛刀を折った鬼殺隊士を怒りの爆走で追いかけ回す痛快職人シミュレーションゲーム。

---

## 2. アーキテクチャ設計 (スキーマ駆動 ＆ 簡易DDD)

### 2.1 ドメイン層 (Domain Layer)
- **値オブジェクト (Value Objects)**
  - `BreathingType`: 呼吸の系統（水、炎、雷、風、岩、霞、獣、蟲、恋、蛇、日、月）
  - `BladeColor`: 刀身の色（漆黒、深紅、蒼玉、黄金、白銀、翡翠など）と色彩コード・特殊能力
  - `RustLevel`: サビ度（0〜100%）
  - `ShineLevel`: 光沢度（0〜100%）
  - `HeatZone`: 鍛造温度（冷・適正 900-1100℃・過熱）
  - `QualityGrade`: 品質等級（国宝級、業物、良業物、並）
- **エンティティ & 集約 (Entities & Aggregates)**
  - `NichirinSwordAggregate`: 刀の固有ID、刀銘、所有者、呼吸、刀身色、サビ度、光沢度、健全度、鍛造履歴
  - `ForgingSessionAggregate`: 鉱石配合、温度状態、鍛錬打撃スコア、焼き入れ成否、覚醒色
  - `ChaseSessionAggregate`: 鍛冶師の怒りゲージ、標的隊士、距離、障害物、みたらし団子ブースト、お仕置き回数
- **ドメインサービス (Domain Services)**
  - `MaintenanceService`: 打ち粉・水研ぎ・丁子油拭きによるサビ除去と光沢度算出ロジック
  - `ForgingService`: 猩々緋鉱石と砂鉄の選定・ふいご加熱・リズム槌打ち・焼き入れ・色変わり覚醒判定
  - `RepairService`: 折損刀の破片接合・加熱再鍛造・刃文復元
  - `ChaseService`: 追走物理演算、みたらし団子加速判定、お仕置きコンボ判定
- **リポジトリ (Repository Interfaces)**
  - `ISwordRepository`: 名刀録（刀コレクション）の保存・取得（LocalStorage永続化）
  - `IBlacksmithRepository`: 職人レベル・称号・みたらし団子所持数の永続化

### 2.2 スキーマ駆動 (Schema-Driven)
- `zod` スキーマによる各ドメインモデルの厳格なバリデーション定義
  - `NichirinSwordSchema`
  - `ForgingSessionSchema`
  - `MaintenanceActionSchema`
  - `ChaseStateSchema`

---

## 3. テスト駆動開発 (TDD) ＆ 振る舞い駆動開発 (BDD) 計画

### 3.1 BDD 仕様体系 (Given - When - Then)
1. **刀のお手入れ仕様 (Maintenance Feature)**
   - Given: サビ率80%の赤錆びた日輪刀
   - When: 打ち粉を叩き、水研ぎ砥石でこすり、丁子油布で拭き上げたとき
   - Then: サビ率が0%になり、鏡面光沢度が100%に達し、「滅」の銘が輝くこと
2. **日輪刀の鍛造仕様 (Forging Feature)**
   - Given: 猩々緋鉱石と猩々緋砂鉄を黄金比（6:4）で配合し炉に入れた状態
   - When: ふいごで1000℃を維持し、リズムに合わせて適正回数槌打ちして急冷焼き入れしたとき
   - Then: 刀身が完成し、隊士の呼吸属性に応じた固有の色変わり（例: 水なら青、炎なら赤、日なら黒）が覚醒すること
3. **折れた刀の修理仕様 (Repair Feature)**
   - Given: 激戦で真っ二つに折れた健全度20%の日輪刀
   - When: 破片を正確に合わせ、接合部に玉鋼を流し込んで再鍛錬したとき
   - Then: 健全度が100%に復元され、研ぎ澄まされた刃文が再生すること
4. **折った隊士の追走・お仕置き仕様 (Chase Feature)**
   - Given: 刀を折った隊士を追走する怒りゲージMAXの鍛冶師
   - When: 障害物を跳び越え、好物のみたらし団子を食べて超加速し追いついたとき
   - Then: お仕置き（こちょこちょ/包丁威嚇）コンボが決まり、刀鍛冶の尊厳が保たれること

### 3.2 TDD サイクル計画 (Red -> Green -> Refactor -> Commit)
- **Cycle 1**: 値オブジェクトとスキーマの定義 (Red -> Green -> Refactor -> Commit #1)
- **Cycle 2**: 刀のお手入れドメイン＆Canvasスクラッチ研磨ロジック (Red -> Green -> Refactor -> Commit #2)
- **Cycle 3**: 鉱石からの鍛造＆色変わり覚醒ドメイン (Red -> Green -> Refactor -> Commit #3)
- **Cycle 4**: 折れた刀の修復・接合ドメイン (Red -> Green -> Refactor -> Commit #4)
- **Cycle 5**: 隊士お仕置きチェイス物理＆団子加速ゲームループ (Red -> Green -> Refactor -> Commit #5)
- **Cycle 6**: 名刀録（ギャラリー）＆総合UI統合・Web Audio和風サウンド (Red -> Green -> Refactor -> Commit #6)

---

## 4. UI/UX デザインガイドライン準拠
- 和風鍛冶場テイスト: 漆黒（#0a0a0a）、深い木炭色（#1c1917）、火床の燃える橙朱色（#ea580c / #f97316）、研ぎ澄まされた鋼銀（#e2e8f0）
- フォント: `Shippori Mincho`（タイトル・毛筆調）、`Yuji Boku`、`system-ui`
- Web Audio API による完全合成の爽快和風サウンド（鍛冶槌のカーン！、砥石のシャッシャッ、焼き入れジュワァァ、怒りの鍛冶師SE）
- アプリ内に「BDD/TDD 検証ラボ」を常設し、テストの実行状況とコミットログを可視化
