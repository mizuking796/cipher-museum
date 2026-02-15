// ============================================================
// gojuon.js — 五十音ユーティリティ（全暗号エンジンの共通基盤）
// ============================================================

const Gojuon = (() => {
  // 清音46文字
  const KANA = [
    'あ','い','う','え','お',
    'か','き','く','け','こ',
    'さ','し','す','せ','そ',
    'た','ち','つ','て','と',
    'な','に','ぬ','ね','の',
    'は','ひ','ふ','へ','ほ',
    'ま','み','む','め','も',
    'や','ゆ','よ',
    'ら','り','る','れ','ろ',
    'わ','を','ん'
  ];

  const SIZE = KANA.length; // 46

  // 五十音表グリッド（10行×5列）— ポリュビオス/タップコード用
  const GRID = [
    ['あ','い','う','え','お'],
    ['か','き','く','け','こ'],
    ['さ','し','す','せ','そ'],
    ['た','ち','つ','て','と'],
    ['な','に','ぬ','ね','の'],
    ['は','ひ','ふ','へ','ほ'],
    ['ま','み','む','め','も'],
    ['や','ゆ','よ','ー','ー'],
    ['ら','り','る','れ','ろ'],
    ['わ','を','ん','ー','ー']
  ];

  // 濁音・半濁音マップ
  const DAKUTEN_MAP = {
    'が':'か','ぎ':'き','ぐ':'く','げ':'け','ご':'こ',
    'ざ':'さ','じ':'し','ず':'す','ぜ':'せ','ぞ':'そ',
    'だ':'た','ぢ':'ち','づ':'つ','で':'て','ど':'と',
    'ば':'は','び':'ひ','ぶ':'ふ','べ':'へ','ぼ':'ほ',
    'ぱ':'は','ぴ':'ひ','ぷ':'ふ','ぺ':'へ','ぽ':'ほ'
  };
  const DAKUTEN_REVERSE = {};
  const HANDAKUTEN_REVERSE = {};
  for (const [d, c] of Object.entries(DAKUTEN_MAP)) {
    if (d.charCodeAt(0) >= 'ぱ'.charCodeAt(0) && d.charCodeAt(0) <= 'ぽ'.charCodeAt(0)) {
      if (!HANDAKUTEN_REVERSE[c]) HANDAKUTEN_REVERSE[c] = d;
    } else {
      if (!DAKUTEN_REVERSE[c]) DAKUTEN_REVERSE[c] = d;
    }
  }

  // ローマ字変換テーブル（ヘボン式）
  const KANA_TO_ROMAJI = {
    'あ':'a','い':'i','う':'u','え':'e','お':'o',
    'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
    'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
    'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
    'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
    'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
    'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
    'や':'ya','ゆ':'yu','よ':'yo',
    'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
    'わ':'wa','を':'wo','ん':'n',
    'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
    'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
    'だ':'da','ぢ':'di','づ':'du','で':'de','ど':'do',
    'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
    'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
    'きゃ':'kya','きゅ':'kyu','きょ':'kyo',
    'しゃ':'sha','しゅ':'shu','しょ':'sho',
    'ちゃ':'cha','ちゅ':'chu','ちょ':'cho',
    'にゃ':'nya','にゅ':'nyu','にょ':'nyo',
    'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo',
    'みゃ':'mya','みゅ':'myu','みょ':'myo',
    'りゃ':'rya','りゅ':'ryu','りょ':'ryo',
    'ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
    'じゃ':'ja','じゅ':'ju','じょ':'jo',
    'びゃ':'bya','びゅ':'byu','びょ':'byo',
    'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
    'ー':'-','っ':''
  };

  // カタカナ→ひらがな変換
  function toHiragana(text) {
    return text.replace(/[\u30A1-\u30F6]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    ).replace(/\u30FC/g, 'ー');
  }

  // ひらがな→カタカナ変換
  function toKatakana(text) {
    return text.replace(/[\u3041-\u3096]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) + 0x60)
    );
  }

  // 文字→インデックス（清音ベース。濁音/半濁音は清音に正規化）
  function charToIndex(ch) {
    let c = DAKUTEN_MAP[ch] || ch;
    return KANA.indexOf(c);
  }

  // インデックス→文字
  function indexToChar(idx) {
    return KANA[((idx % SIZE) + SIZE) % SIZE];
  }

  // mod演算（負数対応）
  function mod(a, m) {
    return ((a % m) + m) % m;
  }

  // 文字がひらがな（清音/濁音/半濁音/小書き含む）か判定
  function isKana(ch) {
    const code = ch.charCodeAt(0);
    return (code >= 0x3041 && code <= 0x3096) || ch === 'ー';
  }

  // 文字がカタカナか判定
  function isKatakana(ch) {
    const code = ch.charCodeAt(0);
    return (code >= 0x30A1 && code <= 0x30F6) || ch === '\u30FC';
  }

  // 濁音情報を保持して清音化→変換後に復元するヘルパー
  function preserveDakuten(ch) {
    if (DAKUTEN_MAP[ch]) {
      const base = DAKUTEN_MAP[ch];
      const isDakuten = ch.charCodeAt(0) < 'ぱ'.charCodeAt(0) ||
                        ch.charCodeAt(0) > 'ぽ'.charCodeAt(0);
      return { base, type: isDakuten ? 'dakuten' : 'handakuten' };
    }
    return { base: ch, type: 'none' };
  }

  // 清音に濁点/半濁点を復元
  function restoreDakuten(ch, type) {
    if (type === 'dakuten' && DAKUTEN_REVERSE[ch]) return DAKUTEN_REVERSE[ch];
    if (type === 'handakuten' && HANDAKUTEN_REVERSE[ch]) return HANDAKUTEN_REVERSE[ch];
    return ch;
  }

  // テキスト→ローマ字変換
  function toRomaji(text) {
    const h = toHiragana(text);
    let result = '';
    for (let i = 0; i < h.length; i++) {
      // 拗音チェック（2文字結合）
      if (i + 1 < h.length) {
        const pair = h[i] + h[i + 1];
        if (KANA_TO_ROMAJI[pair]) {
          result += KANA_TO_ROMAJI[pair];
          i++;
          continue;
        }
      }
      // 促音
      if (h[i] === 'っ' && i + 1 < h.length) {
        const next = KANA_TO_ROMAJI[h[i + 1]];
        if (next) {
          result += next[0]; // 子音を重ねる
          continue;
        }
      }
      const r = KANA_TO_ROMAJI[h[i]];
      if (r !== undefined) {
        result += r;
      } else {
        result += h[i]; // そのまま（漢字、記号等）
      }
    }
    return result;
  }

  // ランダムなひらがな（アニメーション用）
  function randomKana() {
    return KANA[Math.floor(Math.random() * SIZE)];
  }

  // グリッド座標取得（ポリュビオス/タップコード用）
  function charToGrid(ch) {
    const c = DAKUTEN_MAP[ch] || ch;
    for (let r = 0; r < GRID.length; r++) {
      const col = GRID[r].indexOf(c);
      if (col !== -1) return { row: r, col };
    }
    return null;
  }

  function gridToChar(row, col) {
    if (row >= 0 && row < GRID.length && col >= 0 && col < GRID[row].length) {
      const ch = GRID[row][col];
      return ch === 'ー' ? null : ch;
    }
    return null;
  }

  return {
    KANA, SIZE, GRID,
    DAKUTEN_MAP, KANA_TO_ROMAJI,
    toHiragana, toKatakana,
    charToIndex, indexToChar, mod,
    isKana, isKatakana,
    preserveDakuten, restoreDakuten,
    toRomaji, randomKana,
    charToGrid, gridToChar
  };
})();
