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
- CSP（Content Security Policy）設定済み

## ファイル構成（10ファイル / 3,829行）

```
cipher-museum/
├── index.html          (67行)   — SPA構造、3カラムレイアウト
├── css/
│   └── style.css       (665行)  — ダーク博物館テーマ
├── js/
│   ├── gojuon.js       (244行)  — 五十音80文字ユーティリティ（全エンジンの共通基盤）
│   ├── ciphers.js      (913行)  — 暗号エンジン12種
│   ├── scripts.js      (661行)  — 文字変換エンジン8種（逆変換対応）
│   ├── episodes.js     (465行)  — 教育コンテンツ20方式分
│   ├── animation.js    (316行)  — カシャカシャ変換アニメーション4種
│   └── app.js          (498行)  — メインコントローラー
├── favicon.svg                  — SVGファビコン
├── favicon.png                  — PNGファビコン（192x192）
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
| `Gojuon` | Object | 五十音80文字操作ユーティリティ |
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
| `caesar` | シーザー暗号 | substitution | ★☆☆ | シフト数(1-79) | OK |
| `atbash` | アトバシュ暗号 | substitution | ★☆☆ | なし（対称） | OK |
| `vigenere` | ヴィジュネル暗号 | substitution | ★★☆ | キーワード | OK |
| `polybius` | ポリュビオス暗号 | substitution | ★☆☆ | なし | OK |
| `pigpen` | 豚小屋暗号 | substitution | ★☆☆ | なし | OK (SVG出力) |
| `railfence` | レールフェンス暗号 | transposition | ★☆☆ | レール数(2-10) | OK |
| `columnar` | 列転置暗号 | transposition | ★★☆ | キーワード | OK |
| `shinobi` | 忍びいろは | japanese | ★☆☆ | なし | OK |
| `enigma` | エニグマ暗号機 | mechanical | ★★★ | ローター3+開始位置 | OK（対称） |
| `otp` | ワンタイムパッド | modern | ★★☆ | 鍵（空なら自動生成→UI書き戻し） | OK |
| `tapcode` | タップコード | modern | ★☆☆ | なし | OK |
| `xor` | XOR暗号 | modern | ★★☆ | キーワード | OK |

### 文字変換系（scripts.js — 8種）

| ID | 名称 | カテゴリ | 変換方式 | 出力形式 | 逆変換 |
|---|---|---|---|---|---|
| `hieroglyph` | ヒエログリフ | ancient | ローマ字→Unicode Egyptian | text | OK |
| `rune` | ルーン文字 | ancient | ローマ字→Elder Futhark | text | OK（c/k,j/y補正付） |
| `linearb` | 線文字B | ancient | ローマ字→音節文字 | text | OK（da/za,ta/wa衝突あり） |
| `braille` | 点字 | symbol | かな→六点点字 | text | OK |
| `aurebesh` | オーレベシュ | fictional | ローマ字→フォント表示 | font | OK |
| `sga` | 銀河標準文字 | fictional | ローマ字→フォント表示 | font | OK |
| `mathsymbols` | 数学用記号文字 | decoration | ローマ字→13書体変種 | text | OK（全13書体対応） |
| `upsidedown` | 逆さ文字 | decoration | ローマ字→IPA文字+逆順 | text | OK |

### カテゴリ定義（9種）
```
substitution(置換暗号), transposition(転置暗号), mechanical(機械式暗号),
japanese(日本の暗号), modern(近代暗号), ancient(古代文字),
fictional(架空文字), symbol(符号・記号), decoration(装飾変換)
```

## Gojuon（五十音ユーティリティ）

### 基盤データ
- **KANA**: 80文字配列（清音46 + 濁音20 + 半濁音5 + 小書き9）
  - Index 0-45: あ〜ん（清音）
  - Index 46-65: が〜ぼ（濁音）
  - Index 66-70: ぱ〜ぽ（半濁音）
  - Index 71-79: ぁ〜ょ（小書き）
- **SIZE**: 80（KANA配列長）
- **GRID**: 16行×5列の五十音表（KANA配列から自動生成、ポリュビオス/タップコード用）
- **GRID_COLS**: 5
- **KANA_TO_ROMAJI**: ひらがな→ヘボン式ローマ字（拗音含む）

### 主要API
| 関数 | 説明 |
|---|---|
| `toHiragana(text)` | カタカナ→ひらがな変換 |
| `toKatakana(text)` | ひらがな→カタカナ変換 |
| `charToIndex(ch)` | 文字→インデックス（KANA.indexOf直引き） |
| `indexToChar(idx)` | インデックス→文字（mod 80で循環） |
| `toRomaji(text)` | テキスト→ローマ字変換（拗音・促音対応） |
| `fromRomaji(text)` | ローマ字→ひらがな変換（最長一致・促音・撥音対応） |
| `charToGrid(ch)` / `gridToChar(r,c)` | 五十音表の座標変換 |
| `isKana(ch)` / `isKatakana(ch)` | 文字種判定 |
| `randomKana()` | ランダムひらがな（アニメーション用） |
| `mod(a, m)` | 負数対応mod演算 |

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
// text をひらがな化→1文字ずつ fn(ch, kanaIdx) で変換
// 全80文字が独立エントリのため濁音・小書きも直接変換
```

### 転置暗号ヘルパー
```javascript
transposeKana(text, fn)
// ひらがな文字のみ抽出→fn(kanaChars)で並替→元の位置に戻す
```

### エニグマ実装
- 5種ローター（80文字シャッフル順列、LCG PRNGで生成）
- ノッチ位置 [39, 8, 47, 33, 23] による段階的回転
- 40ペアリフレクター（対合: 暗号化=復号）
- 順方向(右→左) → リフレクター → 逆方向(左→右)

### 豚小屋暗号
- 80文字を5格子に分配: #型×4（各18文字）+ ×型×1（8文字）
- 各格子で位置(pos)×ドット有無(dot)の2値で区別
- SVG出力（テキストコピー不可、「入力に送る」非表示）

### XOR暗号
- Unicodeコードポイント同士のXOR
- 出力: 4桁大文字16進数（スペース区切り）
- 復号: 16進トークンをパース → XOR → String.fromCharCode

## 逆変換（外国文字→日本語）

### 変換フロー
```
順変換: 日本語テキスト → toRomaji() → 文字マップ → 外国文字
逆変換: 外国文字 → 逆引きマップ → ローマ字 → fromRomaji() → ひらがな
```

### fromRomaji() アルゴリズム
1. 促音: 同一子音連続（`kk`, `tt` 等、`nn`除く）→ っ
2. 撥音: `n` + 子音/末尾 → ん（`nn` もここでカバー: 最初のnがん、次のnは次の音節の頭）
3. 最長一致: `ROMAJI_KEYS`（長い順ソート）で照合（`sha`→しゃ が `s`+`ha` より優先）

### 逆引きマップの衝突解決
- `buildReverseMap()`: 最初の登録を優先（`{a:'X', b:'X'}` → `{'X':'a'}`）
- ルーン: 衝突ルーンに対しローマ字として適切な文字を手動指定（k/f/y優先）+ 後処理補正
- ヒエログリフ: 衝突していたe/u/w, f/vを固有グリフに変更して根本解決
- 数学記号: Unicode offset逆算（コードポイント範囲判定→ASCII復元）

## 教育コンテンツ構造（episodes.js）

各方式に以下のセクションを収録:
- **overview**: 概要（1-2文の導入）
- **mechanism**: 仕組み（技術的解説）
- **history**: 歴史（エピソード付き）
- **broken**: いかにして破られたか（暗号系のみ）
- **trivia**: 豆知識
- **related**: 関連方式ID配列（リンクチップ表示）

## 既知の制限事項

### 豚小屋暗号の出力
- SVG出力のため `textContent` が取得できない
- 「入力に送る」ボタンは非表示（`outputType === 'pigpen'` で判定）
- コピーボタンもSVGの場合は空文字になる

### フォント依存（オーレベシュ/SGA）
- Webフォント未搭載のため、現状はローマ字テキスト表示
- `fontClass` プロパティでCSS切替準備済み
- fallbackConvert() でCircled文字（Ⓐ-Ⓩ）代替可能

### 点字の小書きかな
- ぁぃぅぇぉっゃゅょは点字マッピング未対応（パスルー）
- 実際の日本語点字では専用マーカーがあるが未実装

### 逆変換（外国文字→日本語）の制限
- **ローマ字の曖昧性**: ん+母音始まりの音（例: きんえん）はローマ字では区別不能（kinen = きねん or きんえん）
- **ルーン文字**: c/k/q が同一ルーン。`kh→ch`, `yi→ji` の補正あり。`j/y` の曖昧性は残る（じゃ/や）
- **線文字B**: da/za, ta/wa, de/ze, du/zu, te/we, ti/wi, to/wo が同一音節文字（Linear B の音節体系の制限）
- **オーレベシュ/SGA**: Webフォント未搭載のためローマ字テキストを逆変換（表示上のグリフは逆変換不可）

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

### v1.2 (2026-02-15)
- 全8文字変換エンジンに逆変換（外国文字→日本語）を追加
- gojuon.js: `fromRomaji()` 追加（ローマ字→ひらがな、最長一致/促音/撥音対応）
- scripts.js: 逆引きマップ + `reverse()` メソッド + `reversible: true` を全エンジンに設定
- ヒエログリフ: e/u/w グリフ衝突を解消（固有コードポイント割当）
- ルーン: `kh→ch`, `yi→ji` の後処理補正
- 数学記号: Unicode offset 逆算で全13書体の逆変換対応
- 逆さ文字: `reverse()` を `fromRomaji()` 経由に修正（ひらがな出力）
- `fromRomaji`: `nn` 特殊ルール削除（`n`+子音→ん 規則でカバー）

### v1.1 (2026-02-15)
- KANA配列を46→80文字に拡張（濁音20+半濁音5+小書き9を直接サポート）
- preserveDakuten/restoreDakuten パターン廃止（全文字が独立エントリ）
- ポリュビオス暗号: スペース区切り出力（16行×5列の行番号2桁対応）
- 豚小屋暗号: 80文字対応（5格子分配、dakutenプロパティ廃止）
- 忍びいろは: 80文字対応（IROHA_ORDER/IROHA_SYMBOLS拡張）
- エニグマ: 80文字ローター5種+40ペアリフレクター再生成
- 包括バグ修正8件:
  - showWelcome()の破壊的ソート修正
  - parseInt NaN フォールバック
  - エラー表示色リセット
  - OTP自動生成鍵のUI書き戻し
  - 可逆ScriptEngine(点字/逆さ文字)の逆変換ボタン追加
  - btn-swap:disabled スタイル追加
  - CSP メタタグ追加
- ファビコン追加（PNG 192x192 + SVG）

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
