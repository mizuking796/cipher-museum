// ============================================================
// ciphers.js — 12種類の暗号エンジン定義
// 前提: gojuon.js (Gojuon) が先に読み込まれていること
// ============================================================

const CipherEngines = (() => {

  // ============================================================
  // 共通ヘルパー
  // ============================================================

  /** 文字単位の置換暗号の共通処理（濁音保持） */
  function substituteEachChar(text, fn) {
    const h = Gojuon.toHiragana(text);
    let result = '';
    let kanaIdx = 0;
    for (const ch of h) {
      if (Gojuon.isKana(ch) && Gojuon.charToIndex(ch) !== -1) {
        const { base, type } = Gojuon.preserveDakuten(ch);
        const transformed = fn(base, kanaIdx);
        result += Gojuon.restoreDakuten(transformed, type);
        kanaIdx++;
      } else {
        result += ch;
      }
    }
    return result;
  }

  /** 転置暗号用: ひらがなだけを抽出し、変換後に元の位置に戻す */
  function transposeKana(text, fn) {
    const h = Gojuon.toHiragana(text);
    const kanaChars = [];
    const positions = [];
    const chars = [...h];
    for (let i = 0; i < chars.length; i++) {
      if (Gojuon.isKana(chars[i]) && (Gojuon.charToIndex(chars[i]) !== -1 ||
          Gojuon.DAKUTEN_MAP[chars[i]])) {
        kanaChars.push(chars[i]);
        positions.push(i);
      }
    }
    const transformed = fn(kanaChars);
    const result = [...chars];
    for (let i = 0; i < positions.length; i++) {
      result[positions[i]] = transformed[i];
    }
    return result.join('');
  }

  // ============================================================
  // エニグマ用ローター定義
  // ============================================================

  // 46文字用固定配線テーブル（5種）
  // 各ローターは0-45のシャッフル順列
  const ENIGMA_ROTORS = [
    // Rotor I
    [4,10,12,5,11,6,3,16,21,25,13,19,14,22,24,7,27,2,20,9,18,15,17,28,8,26,30,1,23,29,0,34,36,31,42,38,37,39,33,43,44,32,35,40,41,45],
    // Rotor II
    [0,9,3,14,28,18,23,1,5,24,10,15,33,8,31,2,26,41,25,6,35,22,7,30,11,40,27,16,42,29,38,19,43,20,37,34,4,44,36,12,39,45,17,21,32,13],
    // Rotor III
    [1,3,5,7,9,2,0,4,6,8,11,13,15,17,19,10,12,14,16,18,21,23,25,20,22,24,27,29,31,33,35,26,28,30,32,34,37,36,39,38,41,40,43,42,45,44],
    // Rotor IV
    [25,17,36,2,38,13,40,8,30,20,42,0,44,5,34,10,32,22,28,15,26,7,37,3,39,14,41,9,31,21,43,1,45,6,35,11,33,23,29,16,27,18,24,4,19,12],
    // Rotor V
    [21,25,2,17,10,36,30,8,42,5,13,0,44,15,34,20,22,38,28,7,40,3,26,14,39,9,41,1,37,11,43,6,32,16,45,23,29,18,35,4,27,12,33,19,24,31]
  ];

  // ローターノッチ位置（この位置を超えると次のローターが回転）
  const ENIGMA_NOTCHES = [21, 4, 25, 17, 12];

  // リフレクター: 23ペア（46文字÷2）
  const ENIGMA_REFLECTOR = (() => {
    const pairs = [
      [0,24],[1,17],[2,20],[3,22],[4,9],[5,14],[6,16],[7,25],
      [8,23],[10,19],[11,18],[12,15],[13,21],[26,45],[27,44],
      [28,43],[29,42],[30,41],[31,40],[32,39],[33,38],[34,37],[35,36]
    ];
    const ref = new Array(46);
    for (const [a, b] of pairs) {
      ref[a] = b;
      ref[b] = a;
    }
    return ref;
  })();

  /** ローターの逆配線テーブルを作成 */
  function invertRotor(rotor) {
    const inv = new Array(rotor.length);
    for (let i = 0; i < rotor.length; i++) {
      inv[rotor[i]] = i;
    }
    return inv;
  }

  // ============================================================
  // 忍びいろは 記号マッピング
  // ============================================================

  // いろは歌の順番
  const IROHA_ORDER = [
    'い','ろ','は','に','ほ','へ','と','ち','り','ぬ',
    'る','を','わ','か','よ','た','れ','そ','つ','ね',
    'な','ら','む','う','ゐ','の','お','く','や','ま',
    'け','ふ','こ','え','て','あ','さ','き','ゆ','め',
    'み','し','ゑ','ひ','も','せ','す'
  ];

  const IROHA_SYMBOLS = [
    '☆','△','□','◇','○','◎','★','▽','◆','●',
    '▲','■','♦','♠','♣','♥','⊕','⊗','⊙','⊘',
    '⊞','⊟','⊠','⊡','⊢','⊣','⊤','⊥','⊦','⊧',
    '⊨','⊩','⊪','⊫','⊬','⊭','⊮','⊯','⊰','⊱',
    '⊲','⊳','⊴','⊵','⊶','⊷','⊸'
  ];

  // ひらがな→記号 / 記号→ひらがな のルックアップ
  const SHINOBI_ENCRYPT = {};
  const SHINOBI_DECRYPT = {};
  for (let i = 0; i < IROHA_ORDER.length; i++) {
    SHINOBI_ENCRYPT[IROHA_ORDER[i]] = IROHA_SYMBOLS[i];
    SHINOBI_DECRYPT[IROHA_SYMBOLS[i]] = IROHA_ORDER[i];
  }

  // ============================================================
  // 豚小屋暗号のグリッド定義
  // ============================================================

  // 46文字を4つの格子に分配
  // grid 0: ♯格子（ドットなし）9文字
  // grid 1: ♯格子（ドットあり）9文字
  // grid 2: ×格子（ドットなし）9文字
  // grid 3: ×格子（ドットあり）9文字
  // 残り10文字は grid 4 として扱う（ドット有無で5+5）
  // → 合計 9+9+9+9+5+5 = 46
  const PIGPEN_MAP = {};
  for (let i = 0; i < Gojuon.SIZE; i++) {
    const ch = Gojuon.KANA[i];
    if (i < 9) {
      PIGPEN_MAP[ch] = { grid: 0, pos: i, dot: false };
    } else if (i < 18) {
      PIGPEN_MAP[ch] = { grid: 0, pos: i - 9, dot: true };
    } else if (i < 27) {
      PIGPEN_MAP[ch] = { grid: 1, pos: i - 18, dot: false };
    } else if (i < 36) {
      PIGPEN_MAP[ch] = { grid: 1, pos: i - 27, dot: true };
    } else if (i < 41) {
      PIGPEN_MAP[ch] = { grid: 2, pos: i - 36, dot: false };
    } else {
      PIGPEN_MAP[ch] = { grid: 2, pos: i - 41, dot: true };
    }
  }

  // 逆引き
  const PIGPEN_REVERSE = {};
  for (const [ch, info] of Object.entries(PIGPEN_MAP)) {
    PIGPEN_REVERSE[`${info.grid}-${info.pos}-${info.dot}`] = ch;
  }

  // ============================================================
  // 12種の暗号エンジン
  // ============================================================

  return [

    // -------------------------------------------------------
    // 1. シーザー暗号
    // -------------------------------------------------------
    {
      id: 'caesar',
      name: 'シーザー暗号',
      nameEn: 'Caesar Cipher',
      category: 'substitution',
      era: '紀元前1世紀',
      difficulty: 1,
      icon: '\u{1F3DB}\uFE0F',
      description: '五十音表を一定数シフトして文字を入れ替える最古の暗号',
      keyConfig: [
        { id: 'shift', label: 'シフト数', type: 'number', min: 1, max: 45, default: 3 }
      ],
      animationType: 'slot',

      encrypt(text, keys) {
        const shift = keys.shift || 3;
        return substituteEachChar(text, (base) => {
          const idx = Gojuon.charToIndex(base);
          return Gojuon.indexToChar(idx + shift);
        });
      },

      decrypt(text, keys) {
        const shift = keys.shift || 3;
        return substituteEachChar(text, (base) => {
          const idx = Gojuon.charToIndex(base);
          return Gojuon.indexToChar(idx - shift);
        });
      }
    },

    // -------------------------------------------------------
    // 2. アトバシュ暗号
    // -------------------------------------------------------
    {
      id: 'atbash',
      name: 'アトバシュ暗号',
      nameEn: 'Atbash Cipher',
      category: 'substitution',
      era: '紀元前500年頃',
      difficulty: 1,
      icon: '\u{1F50D}',
      description: '五十音の順序を反転させて置換する対称暗号',
      keyConfig: [],
      animationType: 'slot',

      encrypt(text) {
        return substituteEachChar(text, (base) => {
          const idx = Gojuon.charToIndex(base);
          return Gojuon.indexToChar(Gojuon.SIZE - 1 - idx);
        });
      },

      decrypt(text) {
        // アトバシュは対称: encrypt === decrypt
        return this.encrypt(text);
      }
    },

    // -------------------------------------------------------
    // 3. ヴィジュネル暗号
    // -------------------------------------------------------
    {
      id: 'vigenere',
      name: 'ヴィジュネル暗号',
      nameEn: 'Vigen\u00e8re Cipher',
      category: 'substitution',
      era: '16世紀',
      difficulty: 2,
      icon: '\u{1F510}',
      description: 'キーワードの各文字でシフト量を変える多表式暗号',
      keyConfig: [
        { id: 'keyword', label: 'キーワード', type: 'text', default: '\u3055\u304F\u3089' }
      ],
      animationType: 'slot',

      encrypt(text, keys) {
        const kw = Gojuon.toHiragana(keys.keyword || 'さくら');
        const kwIndices = [];
        for (const ch of kw) {
          const idx = Gojuon.charToIndex(ch);
          if (idx !== -1) kwIndices.push(idx);
        }
        if (kwIndices.length === 0) kwIndices.push(0);

        return substituteEachChar(text, (base, kanaIdx) => {
          const idx = Gojuon.charToIndex(base);
          const shift = kwIndices[kanaIdx % kwIndices.length];
          return Gojuon.indexToChar(idx + shift);
        });
      },

      decrypt(text, keys) {
        const kw = Gojuon.toHiragana(keys.keyword || 'さくら');
        const kwIndices = [];
        for (const ch of kw) {
          const idx = Gojuon.charToIndex(ch);
          if (idx !== -1) kwIndices.push(idx);
        }
        if (kwIndices.length === 0) kwIndices.push(0);

        return substituteEachChar(text, (base, kanaIdx) => {
          const idx = Gojuon.charToIndex(base);
          const shift = kwIndices[kanaIdx % kwIndices.length];
          return Gojuon.indexToChar(idx - shift);
        });
      }
    },

    // -------------------------------------------------------
    // 4. ポリュビオス暗号
    // -------------------------------------------------------
    {
      id: 'polybius',
      name: 'ポリュビオス暗号',
      nameEn: 'Polybius Cipher',
      category: 'substitution',
      era: '紀元前2世紀',
      difficulty: 1,
      icon: '\u{1F4CA}',
      description: '五十音表の行列座標で文字を数字に変換する暗号',
      keyConfig: [],
      animationType: 'slot',

      encrypt(text) {
        const h = Gojuon.toHiragana(text);
        let result = '';
        for (const ch of h) {
          if (Gojuon.isKana(ch)) {
            const { base, type } = Gojuon.preserveDakuten(ch);
            const grid = Gojuon.charToGrid(base);
            if (grid) {
              // 行列座標を2桁の数字に（1始まり）
              result += (grid.row + 1) + '' + (grid.col + 1);
            } else {
              result += ch;
            }
          } else {
            result += ch;
          }
        }
        return result;
      },

      decrypt(text) {
        let result = '';
        let i = 0;
        while (i < text.length) {
          // 連続する2桁の数字を座標として解釈
          if (i + 1 < text.length &&
              text[i] >= '1' && text[i] <= '9' &&
              text[i + 1] >= '1' && text[i + 1] <= '5') {
            const row = parseInt(text[i]) - 1;
            const col = parseInt(text[i + 1]) - 1;
            // 行は0-9（10行: 最大2桁で10を表現するため特別処理）
            if (row < 10) {
              const ch = Gojuon.gridToChar(row, col);
              if (ch) {
                result += ch;
                i += 2;
                continue;
              }
            }
          }
          // 10行目の処理: "10" で始まる場合
          if (i + 2 < text.length && text[i] === '1' && text[i + 1] === '0' &&
              text[i + 2] >= '1' && text[i + 2] <= '5') {
            const col = parseInt(text[i + 2]) - 1;
            const ch = Gojuon.gridToChar(9, col);
            if (ch) {
              result += ch;
              i += 3;
              continue;
            }
          }
          result += text[i];
          i++;
        }
        return result;
      }
    },

    // -------------------------------------------------------
    // 5. 豚小屋暗号
    // -------------------------------------------------------
    {
      id: 'pigpen',
      name: '豚小屋暗号',
      nameEn: 'Pigpen Cipher',
      category: 'substitution',
      era: '18世紀',
      difficulty: 1,
      icon: '\u{1F410}',
      description: '格子模様の記号で文字を表す秘密結社の暗号',
      outputType: 'pigpen',
      keyConfig: [],
      animationType: 'slot',

      encrypt(text) {
        const h = Gojuon.toHiragana(text);
        const result = [];
        for (const ch of h) {
          if (Gojuon.isKana(ch)) {
            const { base } = Gojuon.preserveDakuten(ch);
            const info = PIGPEN_MAP[base];
            if (info) {
              result.push({ ...info, original: ch });
            } else {
              result.push({ type: 'passthrough', char: ch });
            }
          } else {
            result.push({ type: 'passthrough', char: ch });
          }
        }
        return result;
      },

      decrypt(data) {
        // data は [{grid, pos, dot}] の配列、またはテキスト
        if (typeof data === 'string') return data;
        let result = '';
        for (const item of data) {
          if (item.type === 'passthrough') {
            result += item.char;
          } else {
            const key = `${item.grid}-${item.pos}-${item.dot}`;
            result += PIGPEN_REVERSE[key] || '?';
          }
        }
        return result;
      }
    },

    // -------------------------------------------------------
    // 6. レールフェンス暗号
    // -------------------------------------------------------
    {
      id: 'railfence',
      name: 'レールフェンス暗号',
      nameEn: 'Rail Fence Cipher',
      category: 'transposition',
      era: '古代ギリシャ',
      difficulty: 1,
      icon: '\u{1F682}',
      description: 'ジグザグに書いた文字を段ごとに読み出す転置暗号',
      keyConfig: [
        { id: 'rails', label: 'レール数', type: 'number', min: 2, max: 10, default: 3 }
      ],
      animationType: 'move',

      encrypt(text, keys) {
        const rails = keys.rails || 3;
        return transposeKana(text, (kana) => {
          if (kana.length <= 1 || rails <= 1) return kana;

          const fence = Array.from({ length: rails }, () => []);
          let rail = 0;
          let direction = 1;

          for (const ch of kana) {
            fence[rail].push(ch);
            if (rail === 0) direction = 1;
            if (rail === rails - 1) direction = -1;
            rail += direction;
          }

          return fence.flat();
        });
      },

      decrypt(text, keys) {
        const rails = keys.rails || 3;
        return transposeKana(text, (kana) => {
          const n = kana.length;
          if (n <= 1 || rails <= 1) return kana;

          // 各レールに何文字入るか計算
          const railLengths = new Array(rails).fill(0);
          let rail = 0;
          let direction = 1;
          for (let i = 0; i < n; i++) {
            railLengths[rail]++;
            if (rail === 0) direction = 1;
            if (rail === rails - 1) direction = -1;
            rail += direction;
          }

          // 各レールの文字を分配
          const fence = [];
          let idx = 0;
          for (let r = 0; r < rails; r++) {
            fence.push(kana.slice(idx, idx + railLengths[r]));
            idx += railLengths[r];
          }

          // ジグザグ順に読み出し
          const result = [];
          const railIdx = new Array(rails).fill(0);
          rail = 0;
          direction = 1;
          for (let i = 0; i < n; i++) {
            result.push(fence[rail][railIdx[rail]]);
            railIdx[rail]++;
            if (rail === 0) direction = 1;
            if (rail === rails - 1) direction = -1;
            rail += direction;
          }

          return result;
        });
      }
    },

    // -------------------------------------------------------
    // 7. 列転置暗号
    // -------------------------------------------------------
    {
      id: 'columnar',
      name: '列転置暗号',
      nameEn: 'Columnar Transposition',
      category: 'transposition',
      era: '第一次世界大戦',
      difficulty: 2,
      icon: '\u{1F4DD}',
      description: 'キーワードのアルファベット順で列の読み出し順を変える',
      keyConfig: [
        { id: 'keyword', label: 'キーワード', type: 'text', default: '\u3072\u307F\u3064' }
      ],
      animationType: 'move',

      encrypt(text, keys) {
        const kw = Gojuon.toHiragana(keys.keyword || 'ひみつ');
        return transposeKana(text, (kana) => {
          const cols = [...kw].length || 1;
          // キーワードの各文字を五十音順でソートし列順を決定
          const order = getColumnOrder(kw);

          // 行に分割
          const rows = [];
          for (let i = 0; i < kana.length; i += cols) {
            rows.push(kana.slice(i, i + cols));
          }

          // 列順に読み出し
          const result = [];
          for (const colIdx of order) {
            for (const row of rows) {
              if (colIdx < row.length) {
                result.push(row[colIdx]);
              }
            }
          }

          return result;
        });
      },

      decrypt(text, keys) {
        const kw = Gojuon.toHiragana(keys.keyword || 'ひみつ');
        return transposeKana(text, (kana) => {
          const cols = [...kw].length || 1;
          const order = getColumnOrder(kw);
          const n = kana.length;
          const fullRows = Math.floor(n / cols);
          const remainder = n % cols;

          // 各列に何文字あるか計算
          const colLengths = new Array(cols).fill(fullRows);
          for (let i = 0; i < remainder; i++) {
            colLengths[i]++;
          }

          // 列順にデータを分配
          const columns = new Array(cols);
          let idx = 0;
          for (const colIdx of order) {
            columns[colIdx] = kana.slice(idx, idx + colLengths[colIdx]);
            idx += colLengths[colIdx];
          }

          // 行順に読み出し
          const result = [];
          const colIdx2 = new Array(cols).fill(0);
          for (let r = 0; r < fullRows + (remainder > 0 ? 1 : 0); r++) {
            for (let c = 0; c < cols; c++) {
              if (colIdx2[c] < columns[c].length) {
                result.push(columns[c][colIdx2[c]]);
                colIdx2[c]++;
              }
            }
          }

          return result;
        });
      }
    },

    // -------------------------------------------------------
    // 8. 忍びいろは
    // -------------------------------------------------------
    {
      id: 'shinobi',
      name: '忍びいろは',
      nameEn: 'Shinobi Iroha',
      category: 'japanese',
      era: '戦国時代',
      difficulty: 1,
      icon: '\u{1F977}',
      description: 'いろは歌の順番で記号に置き換える忍者の暗号',
      keyConfig: [],
      animationType: 'slot',

      encrypt(text) {
        const h = Gojuon.toHiragana(text);
        let result = '';
        for (const ch of h) {
          if (Gojuon.isKana(ch)) {
            const { base, type } = Gojuon.preserveDakuten(ch);
            const sym = SHINOBI_ENCRYPT[base];
            if (sym) {
              // 濁音の場合は記号の後に濁点マーカーを付加
              result += sym;
              if (type === 'dakuten') result += '\u3099';
              else if (type === 'handakuten') result += '\u309A';
            } else {
              result += ch;
            }
          } else {
            result += ch;
          }
        }
        return result;
      },

      decrypt(text) {
        let result = '';
        const chars = [...text];
        for (let i = 0; i < chars.length; i++) {
          const ch = chars[i];
          if (SHINOBI_DECRYPT[ch]) {
            let base = SHINOBI_DECRYPT[ch];
            // 次の文字が濁点/半濁点結合文字か確認
            if (i + 1 < chars.length) {
              if (chars[i + 1] === '\u3099') {
                base = Gojuon.restoreDakuten(base, 'dakuten');
                i++;
              } else if (chars[i + 1] === '\u309A') {
                base = Gojuon.restoreDakuten(base, 'handakuten');
                i++;
              }
            }
            result += base;
          } else {
            result += ch;
          }
        }
        return result;
      }
    },

    // -------------------------------------------------------
    // 9. エニグマ暗号機
    // -------------------------------------------------------
    {
      id: 'enigma',
      name: 'エニグマ暗号機',
      nameEn: 'Enigma Machine',
      category: 'mechanical',
      era: '第二次世界大戦',
      difficulty: 3,
      icon: '\u{2699}\uFE0F',
      description: '複数の回転ローターとリフレクターで暗号化する機械式暗号',
      keyConfig: [
        { id: 'rotor1', label: 'ローター1', type: 'select', options: ['I','II','III','IV','V'], default: 'I' },
        { id: 'rotor2', label: 'ローター2', type: 'select', options: ['I','II','III','IV','V'], default: 'II' },
        { id: 'rotor3', label: 'ローター3', type: 'select', options: ['I','II','III','IV','V'], default: 'III' },
        { id: 'startPos', label: '開始位置 (3文字)', type: 'text', default: 'あああ' }
      ],
      animationType: 'slot',

      encrypt(text, keys) {
        const rotorIds = [
          romanToIndex(keys.rotor1 || 'I'),
          romanToIndex(keys.rotor2 || 'II'),
          romanToIndex(keys.rotor3 || 'III')
        ];
        const startPosStr = Gojuon.toHiragana(keys.startPos || 'あああ');
        const startChars = [...startPosStr].filter(c => Gojuon.charToIndex(c) !== -1);
        const positions = [
          startChars[0] ? Gojuon.charToIndex(startChars[0]) : 0,
          startChars[1] ? Gojuon.charToIndex(startChars[1]) : 0,
          startChars[2] ? Gojuon.charToIndex(startChars[2]) : 0
        ];

        const rotors = rotorIds.map(id => ENIGMA_ROTORS[id]);
        const invRotors = rotors.map(r => invertRotor(r));
        const notches = rotorIds.map(id => ENIGMA_NOTCHES[id]);

        const h = Gojuon.toHiragana(text);
        let result = '';

        for (const ch of h) {
          if (Gojuon.isKana(ch) && Gojuon.charToIndex(ch) !== -1) {
            const { base, type } = Gojuon.preserveDakuten(ch);

            // ローター回転（入力前に回転）
            // 右ローター（index 2）は毎回回転
            const midRotate = positions[2] === notches[2];
            const leftRotate = midRotate && positions[1] === notches[1];
            positions[2] = (positions[2] + 1) % Gojuon.SIZE;
            if (midRotate) positions[1] = (positions[1] + 1) % Gojuon.SIZE;
            if (leftRotate) positions[0] = (positions[0] + 1) % Gojuon.SIZE;

            let signal = Gojuon.charToIndex(base);

            // 右→中→左 順方向
            for (let r = 2; r >= 0; r--) {
              signal = Gojuon.mod(signal + positions[r], Gojuon.SIZE);
              signal = rotors[r][signal];
              signal = Gojuon.mod(signal - positions[r], Gojuon.SIZE);
            }

            // リフレクター
            signal = ENIGMA_REFLECTOR[signal];

            // 左→中→右 逆方向
            for (let r = 0; r <= 2; r++) {
              signal = Gojuon.mod(signal + positions[r], Gojuon.SIZE);
              signal = invRotors[r][signal];
              signal = Gojuon.mod(signal - positions[r], Gojuon.SIZE);
            }

            const encrypted = Gojuon.indexToChar(signal);
            result += Gojuon.restoreDakuten(encrypted, type);
          } else {
            result += ch;
          }
        }

        return result;
      },

      decrypt(text, keys) {
        // エニグマはリフレクターの性質上、暗号化=復号
        return this.encrypt(text, keys);
      }
    },

    // -------------------------------------------------------
    // 10. ワンタイムパッド
    // -------------------------------------------------------
    {
      id: 'otp',
      name: 'ワンタイムパッド',
      nameEn: 'One-Time Pad',
      category: 'modern',
      era: '1882年',
      difficulty: 2,
      icon: '\u{1F512}',
      description: '平文と同じ長さのランダム鍵で理論上解読不可能な暗号',
      keyConfig: [
        { id: 'key', label: '鍵 (ひらがな/空欄で自動生成)', type: 'text', default: '' }
      ],
      animationType: 'slot',

      encrypt(text, keys) {
        const h = Gojuon.toHiragana(text);
        // 平文中のひらがな文字数をカウント
        let kanaCount = 0;
        for (const ch of h) {
          if (Gojuon.isKana(ch) && Gojuon.charToIndex(ch) !== -1) kanaCount++;
        }

        // 鍵を準備
        let keyStr = keys.key ? Gojuon.toHiragana(keys.key) : '';
        const keyChars = [...keyStr].filter(c => Gojuon.charToIndex(c) !== -1);

        // 鍵が空または不足の場合はランダム生成
        while (keyChars.length < kanaCount) {
          keyChars.push(Gojuon.randomKana());
        }

        // 生成した鍵を keys に書き戻す（UIが表示できるように）
        keys._generatedKey = keyChars.map(c => c).join('');

        return substituteEachChar(text, (base, kanaIdx) => {
          const idx = Gojuon.charToIndex(base);
          const keyIdx = Gojuon.charToIndex(keyChars[kanaIdx]);
          return Gojuon.indexToChar(idx + keyIdx);
        });
      },

      decrypt(text, keys) {
        const keyStr = Gojuon.toHiragana(keys.key || keys._generatedKey || '');
        const keyChars = [...keyStr].filter(c => Gojuon.charToIndex(c) !== -1);

        return substituteEachChar(text, (base, kanaIdx) => {
          const idx = Gojuon.charToIndex(base);
          const keyIdx = kanaIdx < keyChars.length ? Gojuon.charToIndex(keyChars[kanaIdx]) : 0;
          return Gojuon.indexToChar(idx - keyIdx);
        });
      }
    },

    // -------------------------------------------------------
    // 11. タップコード
    // -------------------------------------------------------
    {
      id: 'tapcode',
      name: 'タップコード',
      nameEn: 'Tap Code',
      category: 'modern',
      era: '第一次世界大戦',
      difficulty: 1,
      icon: '\u{1F44A}',
      description: '五十音グリッドの座標をタップ数で伝える暗号',
      keyConfig: [],
      animationType: 'slot',

      encrypt(text) {
        const h = Gojuon.toHiragana(text);
        const parts = [];
        for (const ch of h) {
          if (Gojuon.isKana(ch)) {
            const { base } = Gojuon.preserveDakuten(ch);
            const grid = Gojuon.charToGrid(base);
            if (grid) {
              // 行+1回タップ、間隔、列+1回タップ
              const rowTaps = '\u30FB'.repeat(grid.row + 1);
              const colTaps = '\u30FB'.repeat(grid.col + 1);
              parts.push(rowTaps + ' ' + colTaps);
            } else {
              parts.push(ch);
            }
          } else {
            parts.push(ch);
          }
        }
        return parts.join(' / ');
      },

      decrypt(text) {
        const parts = text.split(' / ');
        let result = '';
        for (const part of parts) {
          const taps = part.trim().split(/\s+/);
          if (taps.length === 2) {
            const row = (taps[0].match(/\u30FB/g) || []).length - 1;
            const col = (taps[1].match(/\u30FB/g) || []).length - 1;
            if (row >= 0 && col >= 0) {
              const ch = Gojuon.gridToChar(row, col);
              if (ch) {
                result += ch;
                continue;
              }
            }
          }
          result += part;
        }
        return result;
      }
    },

    // -------------------------------------------------------
    // 12. XOR暗号
    // -------------------------------------------------------
    {
      id: 'xor',
      name: 'XOR暗号',
      nameEn: 'XOR Cipher',
      category: 'modern',
      era: '20世紀',
      difficulty: 2,
      icon: '\u{1F4BB}',
      description: '文字コードの排他的論理和(XOR)で暗号化。出力は16進数、同じ鍵で復号すると元のひらがなに戻ります。',
      keyConfig: [
        { id: 'key', label: 'キーワード', type: 'text', default: '\u3072\u307F\u3064' }
      ],
      animationType: 'slot',

      encrypt(text, keys) {
        const h = Gojuon.toHiragana(text);
        const kw = Gojuon.toHiragana(keys.key || 'ひみつ');
        const kwCodes = [];
        for (const ch of kw) {
          if (Gojuon.isKana(ch)) kwCodes.push(ch.charCodeAt(0));
        }
        if (kwCodes.length === 0) kwCodes.push(0x3042);

        const parts = [];
        let ki = 0;
        for (const ch of h) {
          if (Gojuon.isKana(ch)) {
            const xored = ch.charCodeAt(0) ^ kwCodes[ki % kwCodes.length];
            parts.push(xored.toString(16).toUpperCase().padStart(4, '0'));
            ki++;
          } else {
            parts.push(ch);
          }
        }
        return parts.join(' ');
      },

      decrypt(text, keys) {
        const kw = Gojuon.toHiragana(keys.key || 'ひみつ');
        const kwCodes = [];
        for (const ch of kw) {
          if (Gojuon.isKana(ch)) kwCodes.push(ch.charCodeAt(0));
        }
        if (kwCodes.length === 0) kwCodes.push(0x3042);

        const tokens = text.trim().split(/\s+/);
        let result = '';
        let ki = 0;
        for (const token of tokens) {
          if (/^[0-9A-Fa-f]{4}$/.test(token)) {
            const val = parseInt(token, 16);
            result += String.fromCharCode(val ^ kwCodes[ki % kwCodes.length]);
            ki++;
          } else {
            result += token;
          }
        }
        return result;
      }
    }

  ];

  // ============================================================
  // 内部ヘルパー関数
  // ============================================================

  /** ローマ数字→ローターインデックス */
  function romanToIndex(roman) {
    const map = { 'I': 0, 'II': 1, 'III': 2, 'IV': 3, 'V': 4 };
    return map[roman] ?? 0;
  }

  /** キーワードから列の読み出し順を算出 */
  function getColumnOrder(keyword) {
    const chars = [...keyword];
    const indexed = chars.map((ch, i) => ({
      ch,
      idx: Gojuon.charToIndex(ch),
      pos: i
    }));
    // 五十音順でソート（安定ソート）
    indexed.sort((a, b) => {
      if (a.idx !== b.idx) return a.idx - b.idx;
      return a.pos - b.pos;
    });
    return indexed.map(item => item.pos);
  }

})();
