// ============================================================
// scripts.js — 8種類の文字変換エンジン（Script Engines）
// 依存: gojuon.js（グローバル変数 Gojuon）
// ============================================================

const ScriptEngines = (() => {

  // ----------------------------------------------------------
  // ヘルパー: テキスト→ローマ字（正規化付き）
  // ----------------------------------------------------------
  function textToRomaji(text) {
    const normalized = Gojuon.toHiragana(text);
    return Gojuon.toRomaji(normalized);
  }

  // ----------------------------------------------------------
  // ヘルパー: ローマ字をマッピング表で1文字ずつ変換
  // ----------------------------------------------------------
  function mapRomaji(romaji, table) {
    let result = '';
    for (const ch of romaji) {
      const lower = ch.toLowerCase();
      result += table[lower] !== undefined ? table[lower] : ch;
    }
    return result;
  }

  // ----------------------------------------------------------
  // 1. ヒエログリフ (Egyptian Hieroglyphs)
  // ----------------------------------------------------------
  const HIEROGLYPH_MAP = {
    a: '\u{1317F}', b: '\u{130C0}', d: '\u{130A7}', e: '\u{13171}',
    f: '\u{13191}', g: '\u{133BC}', h: '\u{13254}', i: '\u{131CB}',
    j: '\u{13193}', k: '\u{133A1}', l: '\u{130ED}', m: '\u{13153}',
    n: '\u{13216}', o: '\u{1336F}', p: '\u{132AA}', q: '\u{1320E}',
    r: '\u{1308B}', s: '\u{132F4}', t: '\u{1340F}', u: '\u{130B8}',
    v: '\u{13060}', w: '\u{1301C}', x: '\u{1339D}', y: '\u{131CC}',
    z: '\u{13283}'
  };

  // 逆引きマップ生成ヘルパー（衝突時は最初の登録を優先）
  function buildReverseMap(map) {
    const rev = {};
    for (const [key, val] of Object.entries(map)) {
      if (val && !rev[val]) rev[val] = key;
    }
    return rev;
  }

  // 外国文字→ローマ字→ひらがな変換ヘルパー
  function reverseViaRomaji(text, reverseMap) {
    const chars = [...text];
    let romaji = '';
    for (const ch of chars) {
      romaji += reverseMap[ch] !== undefined ? reverseMap[ch] : ch;
    }
    return Gojuon.fromRomaji(romaji);
  }

  const HIEROGLYPH_REVERSE = buildReverseMap(HIEROGLYPH_MAP);

  const hieroglyph = {
    id: 'hieroglyph',
    name: 'ヒエログリフ',
    nameEn: 'Egyptian Hieroglyphs',
    category: 'ancient',
    era: '紀元前3200年\u301C',
    difficulty: 2,
    icon: '\u{1F3FA}',
    description: '古代エジプトの神聖文字。ローマ字を24単子音記号に変換します。',
    keyConfig: [],
    convert(text) {
      const romaji = textToRomaji(text);
      return mapRomaji(romaji, HIEROGLYPH_MAP);
    },
    reverse(text) {
      return reverseViaRomaji(text, HIEROGLYPH_REVERSE);
    },
    reversible: true,
    animationType: 'morph',
    outputType: 'text'
  };

  // ----------------------------------------------------------
  // 2. ルーン文字 (Elder Futhark Runes)
  // ----------------------------------------------------------
  const RUNE_MAP = {
    a: '\u16A8', b: '\u16D2', c: '\u16B2', d: '\u16DE', e: '\u16D6',
    f: '\u16A0', g: '\u16B7', h: '\u16BA', i: '\u16C1', j: '\u16C3',
    k: '\u16B2', l: '\u16DA', m: '\u16D7', n: '\u16BE', o: '\u16DF',
    p: '\u16C8', q: '\u16B2', r: '\u16B1', s: '\u16CA', t: '\u16CF',
    u: '\u16A2', v: '\u16A0', w: '\u16B9', x: '\u16B2\u16CA',
    y: '\u16C3', z: '\u16C9'
  };

  const RUNE_REVERSE = (() => {
    const rev = buildReverseMap(RUNE_MAP);
    // 衝突するルーンはローマ字として適切な文字を優先
    rev['\u16B2'] = 'k'; // c/k/q → k（ka,ki,ku,ke,ko が標準ローマ字）
    rev['\u16A0'] = 'f'; // f/v → f（fu が標準ローマ字）
    rev['\u16C3'] = 'y'; // j/y → y（ya,yu,yo が標準ローマ字）
    return rev;
  })();

  const rune = {
    id: 'rune',
    name: 'ルーン文字',
    nameEn: 'Elder Futhark Runes',
    category: 'ancient',
    era: '2世紀\u301C',
    difficulty: 1,
    icon: '\u16B1',
    description: 'ゲルマン民族が用いた古代文字。エルダーフサルク24文字に変換します。',
    keyConfig: [],
    convert(text) {
      const romaji = textToRomaji(text);
      return mapRomaji(romaji, RUNE_MAP);
    },
    reverse(text) {
      // 文字ごとにローマ字逆変換
      const chars = [...text];
      let romaji = '';
      for (const ch of chars) {
        romaji += RUNE_REVERSE[ch] !== undefined ? RUNE_REVERSE[ch] : ch;
      }
      // ルーン衝突の補正: 標準ローマ字に存在しない組合せを修正
      romaji = romaji.replace(/kh/g, 'ch');  // c/k衝突: 'kh'→'ch'（chi,cha等）
      romaji = romaji.replace(/yi/g, 'ji');  // j/y衝突: 'yi'→'ji'（ji=じ）
      return Gojuon.fromRomaji(romaji);
    },
    reversible: true,
    animationType: 'morph',
    outputType: 'text'
  };

  // ----------------------------------------------------------
  // 3. 線文字B (Linear B)
  // ----------------------------------------------------------
  const LINEAR_B_MAP = {
    // 母音のみ
    'a':  '\u{10000}', 'e':  '\u{10001}', 'i':  '\u{10002}',
    'o':  '\u{10003}', 'u':  '\u{10004}',
    // d行
    'da': '\u{10005}', 'de': '\u{10006}', 'di': '\u{10007}',
    'do': '\u{10008}', 'du': '\u{10009}',
    // j行
    'ja': '\u{1000A}', 'je': '\u{1000B}',
    // k行
    'ka': '\u{1000F}', 'ke': '\u{10010}', 'ki': '\u{10011}',
    'ko': '\u{10012}', 'ku': '\u{10013}',
    // m行
    'ma': '\u{10014}', 'me': '\u{10015}', 'mi': '\u{10016}',
    'mo': '\u{10017}', 'mu': '\u{10018}',
    // n行
    'na': '\u{10019}', 'ne': '\u{1001A}', 'ni': '\u{1001B}',
    'no': '\u{1001C}', 'nu': '\u{1001D}',
    // p行
    'pa': '\u{1001E}', 'pe': '\u{1001F}', 'pi': '\u{10020}',
    'po': '\u{10021}', 'pu': '\u{10022}',
    // r行
    'ra': '\u{1002D}', 're': '\u{1002E}', 'ri': '\u{1002F}',
    'ro': '\u{10030}', 'ru': '\u{10031}',
    // s行
    'sa': '\u{10032}', 'se': '\u{10033}', 'si': '\u{10034}',
    'so': '\u{10035}', 'su': '\u{10036}',
    // t行
    'ta': '\u{10037}', 'te': '\u{10038}', 'ti': '\u{10039}',
    'to': '\u{1003A}', 'tu': '\u{1002A}',
    // w行
    'wa': '\u{10037}', 'we': '\u{10038}', 'wi': '\u{10039}',
    'wo': '\u{1003A}',
    // z行
    'za': '\u{10005}', 'ze': '\u{10006}', 'zu': '\u{10009}'
  };

  // 線文字B逆引き（音節文字→ローマ字、衝突時は最初の登録優先）
  const LINEAR_B_REVERSE = (() => {
    const rev = {};
    for (const [key, val] of Object.entries(LINEAR_B_MAP)) {
      if (val && !rev[val]) rev[val] = key;
    }
    return rev;
  })();

  const linearb = {
    id: 'linearb',
    name: '線文字B',
    nameEn: 'Linear B',
    category: 'ancient',
    era: '紀元前1450年\u301C',
    difficulty: 2,
    icon: '\u{10000}',
    description: '古代ギリシャの音節文字。日本語の音節構造と相性の良い文字体系です。',
    keyConfig: [],
    convert(text) {
      const romaji = textToRomaji(text).toLowerCase();
      let result = '';
      let i = 0;
      while (i < romaji.length) {
        // 2文字の音節（CV）を先にチェック
        if (i + 1 < romaji.length) {
          const pair = romaji[i] + romaji[i + 1];
          if (LINEAR_B_MAP[pair] !== undefined) {
            result += LINEAR_B_MAP[pair];
            i += 2;
            continue;
          }
        }
        // 1文字（母音）をチェック
        if (LINEAR_B_MAP[romaji[i]] !== undefined) {
          result += LINEAR_B_MAP[romaji[i]];
          i++;
          continue;
        }
        // 対応なし: そのまま出力
        result += romaji[i];
        i++;
      }
      return result;
    },
    reverse(text) {
      const chars = [...text];
      let romaji = '';
      for (const ch of chars) {
        romaji += LINEAR_B_REVERSE[ch] !== undefined ? LINEAR_B_REVERSE[ch] : ch;
      }
      return Gojuon.fromRomaji(romaji);
    },
    reversible: true,
    animationType: 'morph',
    outputType: 'text'
  };

  // ----------------------------------------------------------
  // 4. 点字 (Japanese Braille)
  // ----------------------------------------------------------
  const BRAILLE_KANA_MAP = {
    'あ': '\u2801', 'い': '\u2803', 'う': '\u2809', 'え': '\u280B', 'お': '\u280A',
    'か': '\u2821', 'き': '\u2823', 'く': '\u2829', 'け': '\u282B', 'こ': '\u282A',
    'さ': '\u2831', 'し': '\u2833', 'す': '\u2839', 'せ': '\u283B', 'そ': '\u283A',
    'た': '\u2815', 'ち': '\u2817', 'つ': '\u281D', 'て': '\u281F', 'と': '\u281E',
    'な': '\u2805', 'に': '\u2807', 'ぬ': '\u280D', 'ね': '\u280F', 'の': '\u280E',
    'は': '\u2825', 'ひ': '\u2827', 'ふ': '\u282D', 'へ': '\u282F', 'ほ': '\u282E',
    'ま': '\u2835', 'み': '\u2837', 'む': '\u283D', 'め': '\u283F', 'も': '\u283E',
    'や': '\u280C', 'ゆ': '\u282C', 'よ': '\u281C',
    'ら': '\u2811', 'り': '\u2813', 'る': '\u2819', 'れ': '\u281B', 'ろ': '\u281A',
    'わ': '\u2804', 'を': '\u2814', 'ん': '\u2834'
  };

  // 濁音: 清音のマッピングを利用
  const DAKUTEN_TO_SEION = {
    'が': 'か', 'ぎ': 'き', 'ぐ': 'く', 'げ': 'け', 'ご': 'こ',
    'ざ': 'さ', 'じ': 'し', 'ず': 'す', 'ぜ': 'せ', 'ぞ': 'そ',
    'だ': 'た', 'ぢ': 'ち', 'づ': 'つ', 'で': 'て', 'ど': 'と',
    'ば': 'は', 'び': 'ひ', 'ぶ': 'ふ', 'べ': 'へ', 'ぼ': 'ほ'
  };
  const HANDAKUTEN_TO_SEION = {
    'ぱ': 'は', 'ぴ': 'ひ', 'ぷ': 'ふ', 'ぺ': 'へ', 'ぽ': 'ほ'
  };

  const BRAILLE_DAKUTEN = '\u2810';    // 濁点符 (dots 5)
  const BRAILLE_HANDAKUTEN = '\u2820'; // 半濁点符 (dots 6)

  // 逆引きマップ（点字→ひらがな）
  const BRAILLE_REVERSE = {};
  for (const [kana, braille] of Object.entries(BRAILLE_KANA_MAP)) {
    BRAILLE_REVERSE[braille] = kana;
  }

  const braille = {
    id: 'braille',
    name: '点字',
    nameEn: 'Japanese Braille',
    category: 'symbol',
    era: '1890年\u301C',
    difficulty: 1,
    icon: '\u2803',
    description: '日本語点字（六点点字）に変換します。濁音・半濁音にも対応。',
    keyConfig: [],
    convert(text) {
      const hiragana = Gojuon.toHiragana(text);
      let result = '';
      for (const ch of hiragana) {
        // 半濁音チェック
        if (HANDAKUTEN_TO_SEION[ch]) {
          const seion = HANDAKUTEN_TO_SEION[ch];
          result += BRAILLE_HANDAKUTEN + BRAILLE_KANA_MAP[seion];
          continue;
        }
        // 濁音チェック
        if (DAKUTEN_TO_SEION[ch]) {
          const seion = DAKUTEN_TO_SEION[ch];
          result += BRAILLE_DAKUTEN + BRAILLE_KANA_MAP[seion];
          continue;
        }
        // 清音
        if (BRAILLE_KANA_MAP[ch] !== undefined) {
          result += BRAILLE_KANA_MAP[ch];
          continue;
        }
        // スペース
        if (ch === ' ' || ch === '\u3000') {
          result += ' ';
          continue;
        }
        // 対応なし: そのまま
        result += ch;
      }
      return result;
    },
    reverse(text) {
      let result = '';
      const chars = [...text];
      let i = 0;
      while (i < chars.length) {
        // 濁点符 + 点字
        if (chars[i] === BRAILLE_DAKUTEN && i + 1 < chars.length && BRAILLE_REVERSE[chars[i + 1]]) {
          const seion = BRAILLE_REVERSE[chars[i + 1]];
          // 清音→濁音
          let found = false;
          for (const [dakuon, s] of Object.entries(DAKUTEN_TO_SEION)) {
            if (s === seion) { result += dakuon; found = true; break; }
          }
          if (!found) result += seion;
          i += 2;
          continue;
        }
        // 半濁点符 + 点字
        if (chars[i] === BRAILLE_HANDAKUTEN && i + 1 < chars.length && BRAILLE_REVERSE[chars[i + 1]]) {
          const seion = BRAILLE_REVERSE[chars[i + 1]];
          let found = false;
          for (const [handakuon, s] of Object.entries(HANDAKUTEN_TO_SEION)) {
            if (s === seion) { result += handakuon; found = true; break; }
          }
          if (!found) result += seion;
          i += 2;
          continue;
        }
        // 通常の点字
        if (BRAILLE_REVERSE[chars[i]]) {
          result += BRAILLE_REVERSE[chars[i]];
          i++;
          continue;
        }
        // その他
        result += chars[i];
        i++;
      }
      return result;
    },
    reversible: true,
    animationType: 'morph',
    outputType: 'text'
  };

  // ----------------------------------------------------------
  // 5. オーレベシュ (Aurebesh)
  // ----------------------------------------------------------
  const CIRCLED_UPPER = {};
  const CIRCLED_LOWER = {};
  for (let i = 0; i < 26; i++) {
    const upper = String.fromCharCode(0x41 + i); // A-Z
    const lower = String.fromCharCode(0x61 + i); // a-z
    CIRCLED_UPPER[upper] = String.fromCodePoint(0x24B6 + i); // Ⓐ-Ⓩ
    CIRCLED_LOWER[lower] = String.fromCodePoint(0x24D0 + i); // ⓐ-ⓩ
  }
  const CIRCLED_MAP = { ...CIRCLED_UPPER, ...CIRCLED_LOWER };

  const aurebesh = {
    id: 'aurebesh',
    name: 'オーレベシュ',
    nameEn: 'Aurebesh',
    category: 'fictional',
    era: 'スター・ウォーズ銀河',
    difficulty: 1,
    icon: '\u2B50',
    description: 'スター・ウォーズ世界の公用文字。Webフォントで表示します。',
    keyConfig: [],
    convert(text) {
      const romaji = textToRomaji(text);
      // フォントベースの表示: ローマ字をそのまま返す
      // Webフォントが利用できない場合のfallback用に丸囲み文字も用意
      return romaji;
    },
    fallbackConvert(text) {
      const romaji = textToRomaji(text);
      return mapRomaji(romaji, CIRCLED_MAP);
    },
    reverse(text) {
      return Gojuon.fromRomaji(text);
    },
    reversible: true,
    animationType: 'morph',
    outputType: 'font',
    fontClass: 'aurebesh-font'
  };

  // ----------------------------------------------------------
  // 6. 銀河標準文字 SGA (Standard Galactic Alphabet)
  // ----------------------------------------------------------
  const sga = {
    id: 'sga',
    name: '銀河標準文字',
    nameEn: 'Standard Galactic Alphabet',
    category: 'fictional',
    era: 'Commander Keen / Minecraft',
    difficulty: 1,
    icon: '\u2694',
    description: 'Minecraftのエンチャントテーブルでおなじみの架空文字。',
    keyConfig: [],
    convert(text) {
      const romaji = textToRomaji(text);
      return romaji;
    },
    fallbackConvert(text) {
      const romaji = textToRomaji(text);
      return mapRomaji(romaji, CIRCLED_MAP);
    },
    reverse(text) {
      return Gojuon.fromRomaji(text);
    },
    reversible: true,
    animationType: 'morph',
    outputType: 'font',
    fontClass: 'sga-font'
  };

  // ----------------------------------------------------------
  // 7. 数学用記号文字 (Mathematical Symbols)
  // ----------------------------------------------------------
  const MATH_VARIANTS = {
    bold:                  { upper: 0x1D400, lower: 0x1D41A, digit: 0x1D7CE },
    italic:                { upper: 0x1D434, lower: 0x1D44E, digit: null },
    boldItalic:            { upper: 0x1D468, lower: 0x1D482, digit: null },
    script:                { upper: 0x1D49C, lower: 0x1D4B6, digit: null },
    boldScript:            { upper: 0x1D4D0, lower: 0x1D4EA, digit: null },
    fraktur:               { upper: 0x1D504, lower: 0x1D51E, digit: null },
    boldFraktur:           { upper: 0x1D56C, lower: 0x1D586, digit: null },
    doubleStruck:          { upper: 0x1D538, lower: 0x1D552, digit: 0x1D7D8 },
    sansSerif:             { upper: 0x1D5A0, lower: 0x1D5BA, digit: 0x1D7E2 },
    sansSerifBold:         { upper: 0x1D5D4, lower: 0x1D5EE, digit: 0x1D7EC },
    sansSerifItalic:       { upper: 0x1D608, lower: 0x1D622, digit: null },
    sansSerifBoldItalic:   { upper: 0x1D63C, lower: 0x1D656, digit: 0x1D7F6 },
    monospace:             { upper: 0x1D670, lower: 0x1D68A, digit: 0x1D7F6 }
  };

  const MATH_VARIANT_LABELS = {
    bold: 'Bold (太字)',
    italic: 'Italic (斜体)',
    boldItalic: 'Bold Italic (太字斜体)',
    script: 'Script (筆記体)',
    boldScript: 'Bold Script (太字筆記体)',
    fraktur: 'Fraktur (フラクトゥール)',
    boldFraktur: 'Bold Fraktur (太字フラクトゥール)',
    doubleStruck: 'Double-Struck (二重線)',
    sansSerif: 'Sans-Serif',
    sansSerifBold: 'Sans-Serif Bold',
    sansSerifItalic: 'Sans-Serif Italic',
    sansSerifBoldItalic: 'Sans-Serif Bold Italic',
    monospace: 'Monospace (等幅)'
  };

  // Unicode上の例外文字（特定の変種で個別コードポイントが割り当てられている文字）
  const MATH_EXCEPTIONS = {
    script: {
      'B': '\u212C', 'E': '\u2130', 'F': '\u2131', 'H': '\u210B',
      'I': '\u2110', 'L': '\u2112', 'M': '\u2133', 'R': '\u211B',
      'e': '\u212F', 'g': '\u210A', 'o': '\u2134'
    },
    fraktur: {
      'C': '\u212D', 'H': '\u210C', 'I': '\u2111', 'R': '\u211C', 'Z': '\u2128'
    },
    doubleStruck: {
      'C': '\u2102', 'H': '\u210D', 'N': '\u2115', 'P': '\u2119',
      'Q': '\u211A', 'R': '\u211D', 'Z': '\u2124'
    },
    italic: {
      'h': '\u210E'
    }
  };

  const mathsymbols = {
    id: 'mathsymbols',
    name: '数学用記号文字',
    nameEn: 'Mathematical Symbols',
    category: 'decoration',
    era: 'Unicode 3.1\u301C',
    difficulty: 1,
    icon: '\u{1D504}',
    description: '13種類のUnicode数学記号書体に変換。フラクトゥール、筆記体など。',
    keyConfig: [
      {
        id: 'variant',
        label: '書体',
        type: 'select',
        options: Object.entries(MATH_VARIANT_LABELS).map(([value, label]) => ({ value, label })),
        default: 'fraktur'
      }
    ],
    convert(text, config = {}) {
      const variant = config.variant || 'fraktur';
      const offsets = MATH_VARIANTS[variant];
      if (!offsets) return text;

      const romaji = textToRomaji(text);
      const exceptions = MATH_EXCEPTIONS[variant] || {};
      let result = '';

      for (const ch of romaji) {
        // 例外文字チェック
        if (exceptions[ch]) {
          result += exceptions[ch];
          continue;
        }

        const code = ch.charCodeAt(0);

        // 大文字 A-Z
        if (code >= 0x41 && code <= 0x5A) {
          result += String.fromCodePoint(offsets.upper + (code - 0x41));
          continue;
        }
        // 小文字 a-z
        if (code >= 0x61 && code <= 0x7A) {
          result += String.fromCodePoint(offsets.lower + (code - 0x61));
          continue;
        }
        // 数字 0-9
        if (code >= 0x30 && code <= 0x39 && offsets.digit) {
          result += String.fromCodePoint(offsets.digit + (code - 0x30));
          continue;
        }

        // 対応なし: そのまま
        result += ch;
      }
      return result;
    },
    reverse(text, config = {}) {
      const variant = config.variant || 'fraktur';
      const offsets = MATH_VARIANTS[variant];
      if (!offsets) return text;

      // 例外文字の逆引きマップ生成
      const exceptions = MATH_EXCEPTIONS[variant] || {};
      const excReverse = {};
      for (const [ascii, uni] of Object.entries(exceptions)) {
        excReverse[uni] = ascii;
      }

      const chars = [...text];
      let romaji = '';
      for (const ch of chars) {
        // 例外文字チェック
        if (excReverse[ch] !== undefined) {
          romaji += excReverse[ch];
          continue;
        }

        const cp = ch.codePointAt(0);

        // 大文字判定
        if (offsets.upper && cp >= offsets.upper && cp < offsets.upper + 26) {
          romaji += String.fromCharCode(0x41 + (cp - offsets.upper));
          continue;
        }
        // 小文字判定
        if (offsets.lower && cp >= offsets.lower && cp < offsets.lower + 26) {
          romaji += String.fromCharCode(0x61 + (cp - offsets.lower));
          continue;
        }
        // 数字判定
        if (offsets.digit && cp >= offsets.digit && cp < offsets.digit + 10) {
          romaji += String.fromCharCode(0x30 + (cp - offsets.digit));
          continue;
        }

        romaji += ch;
      }
      return Gojuon.fromRomaji(romaji);
    },
    reversible: true,
    animationType: 'morph',
    outputType: 'text'
  };

  // ----------------------------------------------------------
  // 8. 逆さ文字 (Upside Down Text)
  // ----------------------------------------------------------
  const UPSIDE_DOWN_MAP = {
    'a': '\u0250', 'b': 'q', 'c': '\u0254', 'd': 'p', 'e': '\u01DD',
    'f': '\u025F', 'g': '\u0183', 'h': '\u0265', 'i': '\u1D09', 'j': '\u027E',
    'k': '\u029E', 'l': '\u05DF', 'm': '\u026F', 'n': 'u', 'o': 'o',
    'p': 'd', 'q': 'b', 'r': '\u0279', 's': 's', 't': '\u0287',
    'u': 'n', 'v': '\u028C', 'w': '\u028D', 'x': 'x', 'y': '\u028E',
    'z': 'z',
    'A': '\u2200', 'B': '\uA4ED', 'C': '\u0186', 'D': '\uA4F7', 'E': '\u018E',
    'F': '\u2132', 'G': '\u2141', 'H': 'H', 'I': 'I', 'J': '\uA4E9',
    'K': '\uA4D8', 'L': '\u02E5', 'M': 'W', 'N': 'N', 'O': 'O',
    'P': '\u0500', 'Q': '\uA779', 'R': '\uA4E4', 'S': 'S', 'T': '\u22A5',
    'U': '\u2229', 'V': '\u039B', 'W': 'M', 'X': 'X', 'Y': '\u2144',
    'Z': 'Z'
  };

  // 逆変換マップ
  const UPSIDE_DOWN_REVERSE = {};
  for (const [original, flipped] of Object.entries(UPSIDE_DOWN_MAP)) {
    // 衝突を避ける: 複数の元文字が同じ反転文字にマッピングされる場合は小文字を優先
    if (!UPSIDE_DOWN_REVERSE[flipped] || original === original.toLowerCase()) {
      UPSIDE_DOWN_REVERSE[flipped] = original;
    }
  }

  const upsidedown = {
    id: 'upsidedown',
    name: '逆さ文字',
    nameEn: 'Upside Down Text',
    category: 'decoration',
    era: 'Unicode',
    difficulty: 1,
    icon: '\u{1F643}',
    description: '文字を上下反転させたUnicode文字に変換し、文字列を逆順に並べます。',
    keyConfig: [],
    convert(text) {
      const romaji = textToRomaji(text);
      let result = '';
      for (const ch of romaji) {
        result += UPSIDE_DOWN_MAP[ch] !== undefined ? UPSIDE_DOWN_MAP[ch] : ch;
      }
      // 文字列全体を逆順にして出力（ひっくり返した効果）
      return [...result].reverse().join('');
    },
    reverse(text) {
      // まず逆順に戻す
      const reversed = [...text].reverse().join('');
      let romaji = '';
      for (const ch of reversed) {
        romaji += UPSIDE_DOWN_REVERSE[ch] !== undefined ? UPSIDE_DOWN_REVERSE[ch] : ch;
      }
      return Gojuon.fromRomaji(romaji);
    },
    reversible: true,
    animationType: 'morph',
    outputType: 'text'
  };

  // ----------------------------------------------------------
  // エンジン配列を返す
  // ----------------------------------------------------------
  return [
    hieroglyph,
    rune,
    linearb,
    braille,
    aurebesh,
    sga,
    mathsymbols,
    upsidedown
  ];

})();
