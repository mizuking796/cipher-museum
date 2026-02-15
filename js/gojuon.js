// ============================================================
// gojuon.js — 五十音ユーティリティ（全暗号エンジンの共通基盤）
// ============================================================

const Gojuon = (() => {
  // 80文字（清音46 + 濁音20 + 半濁音5 + 小書き9）
  const KANA = [
    'あ','い','う','え','お',
    'か','き','く','け','こ',
    'さ','し','す','せ','そ',
    'た','ち','つ','て','と',
    'な','に','ぬ','ね','の',
    'は','ひ','ふ','へ','ほ',
    'ま','み','む','め','も',
    'や','ゆ','よ','ら','り',
    'る','れ','ろ','わ','を',
    'ん','が','ぎ','ぐ','げ',
    'ご','ざ','じ','ず','ぜ',
    'ぞ','だ','ぢ','づ','で',
    'ど','ば','び','ぶ','べ',
    'ぼ','ぱ','ぴ','ぷ','ぺ',
    'ぽ','ぁ','ぃ','ぅ','ぇ',
    'ぉ','っ','ゃ','ゅ','ょ'
  ];

  const SIZE = KANA.length; // 80

  // グリッド列数（ポリュビオス/タップコード用）
  const GRID_COLS = 5;

  // 五十音表グリッド（16行×5列）— KANA配列から自動生成
  const GRID = [];
  for (let i = 0; i < SIZE; i += GRID_COLS) {
    GRID.push(KANA.slice(i, i + GRID_COLS));
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
    'ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o',
    'っ':'','ゃ':'ya','ゅ':'yu','ょ':'yo',
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
    'ー':'-'
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

  // 文字→インデックス（全80文字直接対応）
  function charToIndex(ch) {
    return KANA.indexOf(ch);
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

  // ローマ字→ひらがな変換（逆変換用）
  const ROMAJI_TO_KANA = (() => {
    const map = {};
    // 拗音（3文字ローマ字→2文字かな）を先に登録
    const combos = {
      'kya':'きゃ','kyu':'きゅ','kyo':'きょ',
      'sha':'しゃ','shu':'しゅ','sho':'しょ',
      'cha':'ちゃ','chu':'ちゅ','cho':'ちょ',
      'nya':'にゃ','nyu':'にゅ','nyo':'にょ',
      'hya':'ひゃ','hyu':'ひゅ','hyo':'ひょ',
      'mya':'みゃ','myu':'みゅ','myo':'みょ',
      'rya':'りゃ','ryu':'りゅ','ryo':'りょ',
      'gya':'ぎゃ','gyu':'ぎゅ','gyo':'ぎょ',
      'ja':'じゃ','ju':'じゅ','jo':'じょ',
      'bya':'びゃ','byu':'びゅ','byo':'びょ',
      'pya':'ぴゃ','pyu':'ぴゅ','pyo':'ぴょ'
    };
    for (const [r, k] of Object.entries(combos)) map[r] = k;
    // 単独かな（標準形のみ、小書きより優先）
    for (const [kana, romaji] of Object.entries(KANA_TO_ROMAJI)) {
      if (romaji === '' || romaji === '-') continue;
      if (kana.length > 1) continue; // 拗音エントリはスキップ
      if ('ぁぃぅぇぉゃゅょ'.includes(kana)) continue; // 小書きスキップ
      if (!map[romaji]) map[romaji] = kana;
    }
    return map;
  })();

  // ローマ字→ひらがな変換のソート済みキー（長い順）
  const ROMAJI_KEYS = Object.keys(ROMAJI_TO_KANA).sort((a, b) => b.length - a.length);

  function fromRomaji(text) {
    const lower = text.toLowerCase();
    let result = '';
    let i = 0;
    while (i < lower.length) {
      // 促音: 同じ子音が連続（nn除く、nnはん）
      if (i + 1 < lower.length && lower[i] === lower[i + 1] &&
          /[bcdfghjkmprstwz]/.test(lower[i])) {
        result += 'っ';
        i++;
        continue;
      }
      // 'n' + 非母音/非y → ん（nn のケースもここでカバー: 最初のnがん、次のnは次の音節の頭）
      if (lower[i] === 'n' && i + 1 < lower.length &&
          !/[aiueoy]/.test(lower[i + 1])) {
        result += 'ん';
        i++;
        continue;
      }
      // 末尾の 'n' → ん
      if (lower[i] === 'n' && i === lower.length - 1) {
        result += 'ん';
        i++;
        continue;
      }
      // 最長一致
      let matched = false;
      for (const key of ROMAJI_KEYS) {
        if (lower.substring(i, i + key.length) === key) {
          result += ROMAJI_TO_KANA[key];
          i += key.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        result += text[i]; // 非ローマ字はそのまま
        i++;
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
    const idx = KANA.indexOf(ch);
    if (idx === -1) return null;
    return { row: Math.floor(idx / GRID_COLS), col: idx % GRID_COLS };
  }

  function gridToChar(row, col) {
    if (row < 0 || row >= GRID.length || col < 0 || col >= GRID_COLS) return null;
    const idx = row * GRID_COLS + col;
    return idx < SIZE ? KANA[idx] : null;
  }

  return {
    KANA, SIZE, GRID, GRID_COLS,
    KANA_TO_ROMAJI,
    toHiragana, toKatakana,
    charToIndex, indexToChar, mod,
    isKana, isKatakana,
    toRomaji, fromRomaji, randomKana,
    charToGrid, gridToChar
  };
})();
