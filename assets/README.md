# イラストレーター用画像差し替えガイド (`assets/`)

このゲームのグラフィックは、デフォルトではプログラム描画のドット絵（初期状態）で動作しますが、後からイラストレーターが作成した画像ファイル（透過PNG / WebPなど）に**1パーツずつ、または全体を一括で差し替える**ことができます。

---

## 1. 差し替え手順

1. 作成した画像ファイルをこの `assets/` フォルダに配置します。
2. [`js/sprites.js`](../js/sprites.js) の先頭にある `CUSTOM_ASSETS` オブジェクトで、差し替えたい項目の `null` を画像パス（例: `'assets/player_1.png'`）に変更します。
   - `null` のままにした項目は、現在のデフォルトのドット絵がそのまま表示されます。

```js
const CUSTOM_ASSETS = {
  PLAYER_1: 'assets/player_1.png', // ← 差し替えたいものだけパスを指定
  PLAYER_2: 'assets/player_2.png',
  DEF_RUN_1: null,                 // ← null のままならデフォルトのドット絵
  ...
};
```

---

## 2. 画像サイズ・仕様一覧（基準解像度: `320 × 180 px`）

ゲーム画面全体の内部キャンバス解像度は **`320 × 180 px`（16:9）** です。
ドット絵の場合は等倍（1×）、高解像度イラストの場合は同じ縦横比（2×〜4×など）の透過PNGで作成してください。

### キャラクター・アイテム・UI（透過PNG）

| キー名 (`CUSTOM_ASSETS`) | 推奨ファイル名 | ゲーム内表示サイズ (px) | 内容・備考 |
| :--- | :--- | :--- | :--- |
| `PLAYER_1` | `assets/player_1.png` | `14 × 16` | プレイヤー走りアニメーション 1コマ目（右向き） |
| `PLAYER_2` | `assets/player_2.png` | `14 × 16` | プレイヤー走り/キック 2コマ目（右向き） |
| `DEF_RUN_1` | `assets/def_run_1.png` | `14 × 16` | 相手DF 走りアニメーション 1コマ目（左向き） |
| `DEF_RUN_2` | `assets/def_run_2.png` | `14 × 16` | 相手DF 走りアニメーション 2コマ目（左向き） |
| `DEF_SLIDE` | `assets/def_slide.png` | `18 × 12` | 相手DF スライディングタックル（左向き） |
| `BALL_1` | `assets/ball_1.png` | `7 × 7` | サッカーボール 回転1コマ目 |
| `BALL_2` | `assets/ball_2.png` | `7 × 7` | サッカーボール 回転2コマ目 |
| `STAR_BALL` | `assets/star_ball.png` | `7 × 7` | フィーバー用ゴールデンスターボール |
| `CONE` | `assets/cone.png` | `10 × 11` | 障害物のカラーコーン |
| `COIN_1` | `assets/coin_1.png` | `7 × 8` | コイン 回転1コマ目 |
| `COIN_2` | `assets/coin_2.png` | `7 × 8` | コイン 回転2コマ目（横向き） |
| `LIFE_CROWN` | `assets/life_crown.png` | `8 × 6` | 画面右下のライフアイコン |

### 背景・タイトル画面レイヤー

| キー名 (`CUSTOM_ASSETS`) | 推奨ファイル名 | ゲーム内表示サイズ (px) | 内容・備考 |
| :--- | :--- | :--- | :--- |
| `TITLE_BG` | `assets/title_bg.png` | `320 × 180` | タイトル画面の背景イラスト全体 |
| `TITLE_LOGO` | `assets/title_logo.png` | `160 × 40` | タイトル画面上部の「STRIKER」ロゴ画像（透過PNG） |
| `BG_SKY` | `assets/bg_sky.png` | `320 × 26` | プレイ画面上部の空・雲の背景 |
| `BG_STADIUM` | `assets/bg_stadium.png` | `64 × 12` | 空と芝生の境界の看板・観客席（横方向にシームレスループ） |
| `BG_PITCH` | `assets/bg_pitch.png` | `320 × 114` | 芝生フィールド背景（横方向にシームレスループ） |
