# Cipher Museum（暗号博物館）

## 概要
古今東西の暗号と古代文字を体験する博物館アプリ。日本語テキスト（ひらがな・カタカナ）を20種の暗号・文字体系に変換し、各方式の歴史・仕組み・破られ方を解説する教育コンテンツ付き。

- **URL**: `https://mizuking796.github.io/cipher-museum/`
- **GitHub**: `mizuking796/cipher-museum`（public）
- **ソース**: `/Users/mizukishirai/claude/services/cipher-museum/`
- **更新時はgit pushまで実施すること**

## 技術構成
- 静的HTML/CSS/JS（ビルドツールなし）
- GitHub Pages デプロイ
- 全処理クライアント完結（API不使用）
- IIFE パターンでモジュール分離

## ファイル構成（8ファイル / 3,638行）

```
cipher-museum/
├── index.html          (65行)   — SPA構造、3カラムレイアウト
├── css/
│   └── style.css       (651行)  — ダーク博物館テーマ
├── js/
│   ├── gojuon.js       (210行)  — 五十音ユーティリティ（全エンジンの共通基盤）
│   ├── ciphers.js      (925行)  — 暗号エンジン12種
│   ├── scripts.js      (550行)  — 文字変換エンジン8種
│   ├── episodes.js     (465行)  — 教育コンテンツ20方式分
│   ├── animation.js    (316行)  — カシャカシャ変換アニメーション4種
│   └── app.js          (456行)  — メインコントローラー
└── REFERENCE.md
```

### 読み込み順序（依存関係あり）
```
gojuon.js → ciphers.js → scripts.js → episodes.js → animation.js → app.js
```

## アーキテクチャ

### グローバルモジュール（IIFE）
| モジュール | 型 | 説明 |
|---|---|---|
| `Gojuon` | Object | 五十音46文字操作ユーティリティ |
| `CipherEngines` | Array[12] | 暗号エンジン配列 |
| `ScriptEngines` | Array[8] | 文字変換エンジン配列 |
| `Episodes` | Object{20} | 教育コンテンツ（id→記事） |
| `CipherAnimation` | Object | アニメーション制御 |
| `App` | Object | メインコントローラー（`init`のみ公開） |

### UI構成（3カラム）
```
┌──────────────────────────────────────────────┐
│  ヘッダー（ロゴクリックでトップに戻る）        │
├──────────┬───────────────┬───────────────────┤
│ サイドバー │   変換エリア   │   解説パネル      │
│ 260px     │   1fr (中央)   │   320px           │
│           │               │                   │
│ カテゴリ別 │ ・入力テキスト │ ・概要/仕組み     │
│ 方式一覧  │ ・鍵設定       │ ・歴史/破り方     │
│ (難易度付) │ ・暗号化/復号  │ ・豆知識/関連     │
│           │ ・出力+コピー  │                   │
└──────────┴───────────────┴───────────────────┘
```

### モバイル対応（900px以下）
- サイドバー: スライドイン（左から）
- ボトムタブ: 一覧 / 変換 / 解説 の3タブ切替
- 600px以下: フォントサイズ縮小、サブタイトル非表示

## 暗号エンジン一覧（20方式）

### 暗号系（ciphers.js — 12種）

| ID | 名称 | カテゴリ | 難易度 | 鍵 | 復号 |
|---|---|---|---|---|---|
| `caesar` | シーザー暗号 | substitution | ★☆☆ | シフト数(1-45) | OK |
| `atbash` | アトバシュ暗号 | substitution | ★☆☆ | なし（対称） | OK |
| `vigenere` | ヴィジュネル暗号 | substitution | ★★☆ | キーワード | OK |
| `polybius` | ポリュビオス暗号 | substitution | ★☆☆ | なし | OK |
| `pigpen` | 豚小屋暗号 | substitution | ★☆☆ | なし | OK (SVG出力) |
| `railfence` | レールフェンス暗号 | transposition | ★☆☆ | レール数(2-10) | OK |
| `columnar` | 列転置暗号 | transposition | ★★☆ | キーワード | OK |
| `shinobi` | 忍びいろは | japanese | ★☆☆ | なし | OK |
| `enigma` | エニグマ暗号機 | mechanical | ★★★ | ローター3+開始位置 | OK（対称） |
| `otp` | ワンタイムパッド | modern | ★★☆ | 鍵（空なら自動生成） | OK |
| `tapcode` | タップコード | modern | ★☆☆ | なし | OK |
| `xor` | XOR暗号 | modern | ★★☆ | キーワード | OK |

### 文字変換系（scripts.js — 8種）

| ID | 名称 | カテゴリ | 変換方式 | 出力形式 |
|---|---|---|---|---|
| `hieroglyph` | ヒエログリフ | ancient | ローマ字→Unicode Egyptian | text |
| `rune` | ルーン文字 | ancient | ローマ字→Elder Futhark | text |
| `linearb` | 線文字B | ancient | ローマ字→音節文字 | text |
| `braille` | 点字 | symbol | かな→六点点字 | text |
| `aurebesh` | オーレベシュ | fictional | ローマ字→フォント表示 | font |
| `sga` | 銀河標準文字 | fictional | ローマ字→フォント表示 | font |
| `mathsymbols` | 数学用記号文字 | decoration | ローマ字→13書体変種 | text |
| `upsidedown` | 逆さ文字 | decoration | ローマ字→IPA文字+逆順 | text |

### カテゴリ定義（9種）
```
substitution(置換暗号), transposition(転置暗号), mechanical(機械式暗号),
japanese(日本の暗号), modern(近代暗号), ancient(古代文字),
fictional(架空文字), symbol(符号・記号), decoration(装飾変換)
```

## Gojuon（五十音ユーティリティ）

### 基盤データ
- **KANA**: 清音46文字配列（あ〜ん）
- **GRID**: 10行x5列の五十音表（ポリュビオス/タップコード用）
- **DAKUTEN_MAP**: 濁音・半濁音→清音マッピング（20文字）
- **KANA_TO_ROMAJI**: ひらがな→ヘボン式ローマ字（拗音含む）

### 主要API
| 関数 | 説明 |
|---|---|
| `toHiragana(text)` | カタカナ→ひらがな変換 |
| `toKatakana(text)` | ひらがな→カタカナ変換 |
| `charToIndex(ch)` | 文字→インデックス（濁音は清音に正規化） |
| `indexToChar(idx)` | インデックス→文字（mod 46で循環） |
| `preserveDakuten(ch)` | 濁音情報を保持して清音化 |
| `restoreDakuten(ch, type)` | 清音に濁点/半濁点を復元 |
| `toRomaji(text)` | テキスト→ローマ字変換（拗音・促音対応） |
| `charToGrid(ch)` / `gridToChar(r,c)` | 五十音表の座標変換 |
| `isKana(ch)` / `isKatakana(ch)` | 文字種判定 |
| `randomKana()` | ランダムひらがな（アニメーション用） |

## アニメーション（4種）

| type | 名称 | 用途 | 動作 |
|---|---|---|---|
| `slot` | スロット式 | 置換暗号 | ランダム文字カシャカシャ→左から順に確定 |
| `move` | 位置移動 | 転置暗号 | フェードアウト→位置入替→フェードイン |
| `morph` | 変形 | 古代文字 | 縮小→文字差替→拡大 |
| `pigpen` | SVG描画 | 豚小屋暗号 | SVGグリフを順次アニメ表示 |

### パフォーマンス調整
- 30文字超: アニメーション時間短縮
- 100文字超: アニメーションスキップ（即時表示）

## 暗号エンジン共通パターン

### 置換暗号ヘルパー
```javascript
substituteEachChar(text, fn)
// text をひらがな化→1文字ずつ fn(base, kanaIdx) で変換
// 濁音は preserveDakuten→変換→restoreDakuten で保持
```

### 転置暗号ヘルパー
```javascript
transposeKana(text, fn)
// ひらがな文字のみ抽出→fn(kanaChars)で並替→元の位置に戻す
```

### エニグマ実装
- 5種ローター（46文字シャッフル順列）
- ノッチ位置による段階的回転
- 23ペアリフレクター（対合: 暗号化=復号）
- 順方向(右→左) → リフレクター → 逆方向(左→右)

### XOR暗号
- Unicodeコードポイント同士のXOR
- 出力: 4桁大文字16進数（スペース区切り）
- 復号: 16進トークンをパース → XOR → String.fromCharCode

## 教育コンテンツ構造（episodes.js）

各方式に以下のセクションを収録:
- **overview**: 概要（1-2文の導入）
- **mechanism**: 仕組み（技術的解説）
- **history**: 歴史（エピソード付き）
- **broken**: いかにして破られたか（暗号系のみ）
- **trivia**: 豆知識
- **related**: 関連方式ID配列（リンクチップ表示）

## 既知の制限事項

### 濁音保持の限界
- アトバシュ/エニグマ: 変換先の行が濁音をサポートしない場合、濁点が黙って落ちる
  - 例: ご→(変換)→や行の文字 → 濁点復元不可
- ポリュビオス/タップコード: 座標エンコードで清音のみ保持（濁音情報消失）

### 豚小屋暗号の出力
- SVG出力のため `textContent` が取得できない
- 「入力に送る」ボタンは非表示（`outputType === 'pigpen'` で判定）
- コピーボタンもSVGの場合は空文字になる

### フォント依存（オーレベシュ/SGA）
- Webフォント未搭載のため、現状はローマ字テキスト表示
- `fontClass` プロパティでCSS切替準備済み
- fallbackConvert() でCircled文字（Ⓐ-Ⓩ）代替可能

## CSSテーマ変数
```css
--bg-primary:   #0d1117  /* 最暗背景 */
--bg-secondary: #161b22  /* サイドバー/パネル背景 */
--bg-tertiary:  #21262d  /* ボタン/入力背景 */
--bg-card:      #1c2128  /* カード/出力背景 */
--accent:       #c9a84c  /* ゴールド（博物館テーマ色） */
--accent-dim:   #a68a3a  /* アクセント暗色 */
--accent-glow:  rgba(201,168,76,0.15)  /* アクセント発光 */
--text-primary: #e6edf3  /* 本文 */
--text-secondary: #8b949e /* 補助テキスト */
--text-muted:   #6e7681  /* ミュートテキスト */
```

## バージョン履歴

### v1.0 (2026-02-15)
- 初版リリース
- 暗号12種 + 文字変換8種 = 20方式
- 教育コンテンツ20方式分
- アニメーション4種（slot/move/morph/pigpen）
- 3カラムレスポンシブレイアウト
- モバイル対応（サイドバースライドイン + ボトムタブ）
- XOR暗号をコードポイントXOR方式に修正（mod 46 非全単射バグ修正）
- 復号フロー改善（「入力に送る」ボタン追加）
- ヘッダーロゴクリックでトップ画面復帰
- Pigpen SVG出力で「入力に送る」非表示化
- プレースホルダー改善（暗号化/復号のヒント表示）
