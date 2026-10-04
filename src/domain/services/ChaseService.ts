/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChaseEntityState {
  playerX: number;          // 鍛冶師のX位置
  slayerX: number;          // 隊士のX位置 (初期 280〜350)
  playerY: number;          // 0 = 地上, >0 = ジャンプ中
  isJumping: boolean;
  isSliding: boolean;
  rageLevel: number;        // 怒りゲージ 0-100
  dangoBoostTimer: number;  // 団子ブースト残り時間(秒)
  dangoCount: number;       // 拾ったみたらし団子
  distance: number;         // 隊士との残り距離 (m)
  isCaught: boolean;        // 捕獲してお仕置き中か
  punishHits: number;       // お仕置き連打数
  isGameOver: boolean;
  gameTime: number;         // 経過時間
  obstacles: ChaseObstacle[];
}

export interface ChaseObstacle {
  id: string;
  type: 'ROCK' | 'LOG' | 'DANGO';
  x: number;
  width: number;
  height: number;
  cleared: boolean;
}

export class ChaseDomainService {
  /**
   * 初期状態の生成
   */
  static createInitialState(targetName: string = '竈門炭治郎'): ChaseEntityState {
    return {
      playerX: 60,
      slayerX: 340,
      playerY: 0,
      isJumping: false,
      isSliding: false,
      rageLevel: 80,
      dangoBoostTimer: 0,
      dangoCount: 0,
      distance: 30, // 30mからスタート（すぐ追いつける）
      isCaught: false,
      punishHits: 0,
      isGameOver: false,
      gameTime: 0,
      obstacles: [
        { id: 'obs_1', type: 'DANGO', x: 200, width: 28, height: 28, cleared: false },
        { id: 'obs_2', type: 'ROCK', x: 380, width: 28, height: 24, cleared: false },
        { id: 'obs_3', type: 'DANGO', x: 520, width: 28, height: 28, cleared: false },
        { id: 'obs_4', type: 'LOG', x: 680, width: 30, height: 26, cleared: false },
      ],
    };
  }

  /**
   * フレーム毎の物理更新
   */
  static updatePhysics(
    state: ChaseEntityState,
    deltaSec: number
  ): {
    event?: 'CAUGHT' | 'COLLIDED' | 'DANGO_EATEN';
    message?: string;
  } {
    if (state.isCaught || state.isGameOver) {
      return {};
    }

    state.gameTime += deltaSec;

    // 速度計算: 通常速度 25m/s、団子ブースト中 45m/s
    let playerSpeed = 25;
    if (state.dangoBoostTimer > 0) {
      state.dangoBoostTimer = Math.max(0, state.dangoBoostTimer - deltaSec);
      playerSpeed = 46; // 怒濤の超猛ダッシュ
    }

    const slayerSpeed = 15; // 逃げる隊士の速度

    // 距離の短縮
    const relativeSpeed = playerSpeed - slayerSpeed;
    state.distance = Math.max(0, Number((state.distance - relativeSpeed * deltaSec).toFixed(1)));

    // 障害物のスクロール (左へ流れる)
    const scrollDelta = playerSpeed * deltaSec * 16;
    for (const obs of state.obstacles) {
      obs.x -= scrollDelta;

      // 衝突判定
      if (!obs.cleared && obs.x <= state.playerX + 32 && obs.x + obs.width >= state.playerX) {
        if (obs.type === 'DANGO') {
          obs.cleared = true;
          state.dangoCount += 1;
          state.dangoBoostTimer = 7.0; // 7秒間ロングブースト
          state.rageLevel = Math.min(100, state.rageLevel + 15);
          return {
            event: 'DANGO_EATEN',
            message: 'みたらし団子を頬張った！「うめええええ！許さんぞおおお！」超加速発動！',
          };
        } else if (obs.type === 'ROCK' || obs.type === 'LOG') {
          if (!state.isJumping) {
            obs.cleared = true;
            // つまずいて距離が少し離れる（以前の+12から+3に大幅緩和）
            state.distance = Math.min(60, state.distance + 3);
            state.rageLevel = Math.min(100, state.rageLevel + 10);
            return {
              event: 'COLLIDED',
              message: '障害物につまずいた！「ぐぬぬ…！待てええええ！」',
            };
          }
        }
      }
    }

    // 追いついたか判定
    if (state.distance <= 0) {
      state.isCaught = true;
      return {
        event: 'CAUGHT',
        message: '捕まえたあああ！「よくも刀を折りやがったなァ！お仕置きの時間だァ！」',
      };
    }

    // 障害物の無限生成リサイクル
    const lastObsX = Math.max(...state.obstacles.map((o) => o.x));
    if (lastObsX < 600) {
      const types: ('ROCK' | 'LOG' | 'DANGO')[] = ['DANGO', 'ROCK', 'LOG', 'DANGO'];
      const nextType = types[Math.floor(Math.random() * types.length)];
      state.obstacles.push({
        id: `obs_${Date.now()}_${Math.random()}`,
        type: nextType,
        x: lastObsX + 220 + Math.random() * 80,
        width: nextType === 'DANGO' ? 24 : 32,
        height: nextType === 'DANGO' ? 24 : 28,
        cleared: false,
      });
    }

    // 画面外の障害物を削除
    state.obstacles = state.obstacles.filter((o) => o.x > -60);

    return {};
  }

  /**
   * ジャンプ
   */
  static jump(state: ChaseEntityState): boolean {
    if (state.isJumping || state.isCaught) return false;
    state.isJumping = true;
    state.playerY = 40;
    return true;
  }

  /**
   * 着地
   */
  static land(state: ChaseEntityState): void {
    state.isJumping = false;
    state.playerY = 0;
  }

  /**
   * お仕置き連打（タップ）
   */
  static applyPunishHit(state: ChaseEntityState): {
    hits: number;
    dialogue: string;
    isFinished: boolean;
  } {
    if (!state.isCaught) return { hits: 0, dialogue: '', isFinished: false };

    state.punishHits += 1;

    const dialogues = [
      '「ひいいい！すいません鋼鐵塚さん！！」',
      '「悪気はなかったんです！上弦が強すぎて…！！」',
      '「ぎゃああ！脇腹を突かないでえええ！」',
      '「包丁をしまってください！！危ないです！！」',
      '「もう二度と折りません！大事にしますからあああ！」',
    ];
    const dialogue = dialogues[Math.min(dialogues.length - 1, Math.floor(state.punishHits / 4))];
    const isFinished = state.punishHits >= 25;

    if (isFinished) {
      state.isGameOver = true;
    }

    return {
      hits: state.punishHits,
      dialogue,
      isFinished,
    };
  }
}
