// ============================================================
// animation.js — カシャカシャ変換アニメーション
// ============================================================

const CipherAnimation = (() => {
  const CYCLE_INTERVAL = 30;   // ランダム文字の切替間隔(ms)
  const CHAR_DURATION = 280;   // 1文字のスロット回転時間(ms)
  const CHAR_DELAY = 60;       // 文字間の遅延(ms)

  // ランダム文字プール（暗号系: 清音+濁音+半濁音+小書き）
  const KANA_POOL = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽぁぃぅぇぉっゃゅょ';
  // ランダム文字プール（古代文字系）
  const ANCIENT_POOL = '𓄿𓃀𓂧𓆑𓎼𓉔𓇋𓎡𓅓𓈖𓊪𓂋𓋴𓏏𓅱ᚨᛒᚲᛞᛖᚠᚷᚺᛁᛃᚲᛚᛗᚾᛟᛈᚱᛊᛏᚢᚹᛉ';
  const SYMBOL_POOL = '★☆△▽□■◇◆○●◎⊕⊗⊙⊘⊞⊟⊠⊡⊢⊣⊤⊥⊦⊧⊨⊩⊪⊫⊬⊭⊮⊯';
  const DIGIT_POOL = '0123456789';

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // メインアニメーション: スロット式カシャカシャ
  async function animateSlot(outputEl, finalText, options = {}) {
    const pool = options.pool || KANA_POOL;
    const duration = options.duration || CHAR_DURATION;
    const delay = options.delay || CHAR_DELAY;

    // 出力エリアをspan要素で構成
    outputEl.innerHTML = '';
    const chars = [...finalText];
    const spans = chars.map((ch, i) => {
      const span = document.createElement('span');
      span.className = 'cipher-char cycling';
      span.textContent = pool[Math.floor(Math.random() * pool.length)] || ch;
      span.dataset.index = i;
      outputEl.appendChild(span);
      return span;
    });

    // 左から順に確定
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      const finalChar = chars[i];

      // スペースや改行はスキップ
      if (finalChar === ' ' || finalChar === '\n') {
        span.textContent = finalChar;
        span.classList.remove('cycling');
        span.classList.add('settled');
        continue;
      }

      // カシャカシャ回転
      const startTime = Date.now();
      while (Date.now() - startTime < duration) {
        span.textContent = pool[Math.floor(Math.random() * pool.length)] || finalChar;
        await sleep(CYCLE_INTERVAL);
      }

      // 確定
      span.textContent = finalChar;
      span.classList.remove('cycling');
      span.classList.add('settled');

      // 次の文字へ
      if (i < spans.length - 1) {
        await sleep(delay);
      }
    }

    return outputEl.textContent;
  }

  // 転置アニメーション: 文字が位置移動
  async function animateMove(outputEl, inputText, finalText) {
    outputEl.innerHTML = '';
    const inputChars = [...inputText];
    const finalChars = [...finalText];

    // まず入力テキストを表示
    const spans = inputChars.map((ch, i) => {
      const span = document.createElement('span');
      span.className = 'cipher-char';
      span.textContent = ch;
      span.style.display = 'inline-block';
      span.style.transition = 'all 0.4s ease';
      outputEl.appendChild(span);
      return span;
    });

    await sleep(300);

    // フェードアウト
    spans.forEach(s => { s.style.opacity = '0'; s.style.transform = 'translateY(-10px)'; });
    await sleep(400);

    // 結果テキストで再配置
    outputEl.innerHTML = '';
    const resultSpans = finalChars.map((ch, i) => {
      const span = document.createElement('span');
      span.className = 'cipher-char';
      span.textContent = ch;
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateY(10px)';
      span.style.transition = 'all 0.3s ease';
      outputEl.appendChild(span);
      return span;
    });

    // 順番にフェードイン
    for (let i = 0; i < resultSpans.length; i++) {
      resultSpans[i].style.opacity = '1';
      resultSpans[i].style.transform = 'translateY(0)';
      resultSpans[i].classList.add('settled');
      await sleep(50);
    }
  }

  // 変形アニメーション: ひらがなが古代文字に変形
  async function animateMorph(outputEl, inputText, finalText) {
    outputEl.innerHTML = '';
    const inputChars = [...inputText];
    const finalChars = [...finalText];

    // 入力文字で初期化
    const spans = [];
    const maxLen = Math.max(inputChars.length, finalChars.length);
    for (let i = 0; i < maxLen; i++) {
      const span = document.createElement('span');
      span.className = 'cipher-char';
      span.textContent = inputChars[i] || '';
      span.style.display = 'inline-block';
      span.style.transition = 'all 0.3s ease';
      outputEl.appendChild(span);
      spans.push(span);
    }

    await sleep(200);

    // 1文字ずつ変形
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      const finalChar = finalChars[i] || '';

      if (finalChar === ' ' || finalChar === '\n') {
        span.textContent = finalChar;
        span.classList.add('settled');
        continue;
      }

      // フェードスケール（縮小→文字差替→拡大）
      span.style.transform = 'scale(0.3)';
      span.style.opacity = '0.3';
      await sleep(150);

      span.textContent = finalChar;
      span.style.transform = 'scale(1.2)';
      span.style.opacity = '1';
      await sleep(100);

      span.style.transform = 'scale(1)';
      span.classList.add('settled');
      await sleep(40);
    }
  }

  // 豚小屋暗号用: SVG描画アニメーション
  async function animatePigpen(outputEl, pigpenData) {
    outputEl.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'pigpen-container';
    outputEl.appendChild(container);

    for (const item of pigpenData) {
      const svg = createPigpenSVG(item);
      svg.style.opacity = '0';
      svg.style.transform = 'scale(0.5)';
      svg.style.transition = 'all 0.3s ease';
      container.appendChild(svg);

      await sleep(50);
      svg.style.opacity = '1';
      svg.style.transform = 'scale(1)';
      await sleep(100);
    }
  }

  // 豚小屋暗号SVG生成
  function createPigpenSVG(item) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '32');
    svg.setAttribute('height', '32');
    svg.setAttribute('viewBox', '0 0 32 32');
    svg.classList.add('pigpen-glyph');

    const stroke = '#e0e0e0';
    const sw = 2;

    // 格子パターン（0-3: #型の4区画、4-7: X型の4区画）
    const grid = item.grid;
    const pos = item.pos;
    const dot = item.dot;

    let paths = '';

    if (grid < 4) {
      // #型格子
      const walls = [
        // pos 0-8: 3×3格子の各セル
        // 上壁、右壁、下壁、左壁
        [[0,0,1,0],[1,0,1,1],[0,1,1,1],[0,0,0,1]], // 左上
        [[0,0,1,0],[1,0,1,1],[0,1,1,1]],             // 上中（左壁なし）
        [[0,0,1,0],[0,1,1,1]],                         // 右上（右壁なし）
        [[1,0,1,1],[0,1,1,1],[0,0,0,1]],             // 左中（上壁なし）
        [[1,0,1,1],[0,1,1,1]],                         // 中央
        [[0,1,1,1],[0,0,0,1]],                         // 右中
        [[1,0,1,1],[0,0,0,1]],                         // 左下（下壁なし）
        [[1,0,1,1]],                                   // 下中
        []                                             // 右下（角のみ）
      ];

      const cellWalls = [
        {t:true,r:true,b:true,l:true},   // 0: 全囲み
        {t:true,r:true,b:true,l:false},  // 1: 左開き
        {t:true,r:false,b:true,l:false}, // 2: 左右開き
        {t:false,r:true,b:true,l:true},  // 3: 上開き
        {t:false,r:true,b:true,l:false}, // 4: 上左開き
        {t:false,r:false,b:true,l:false},// 5: 上左右開き→下のみ
        {t:false,r:true,b:false,l:true}, // 6: 上下開き
        {t:false,r:true,b:false,l:false},// 7: 右のみ
        {t:false,r:false,b:false,l:false}// 8: なし
      ];

      const w = cellWalls[pos] || cellWalls[0];
      const m = 4, s = 24;
      if (w.t) paths += `<line x1="${m}" y1="${m}" x2="${m+s}" y2="${m}" stroke="${stroke}" stroke-width="${sw}"/>`;
      if (w.r) paths += `<line x1="${m+s}" y1="${m}" x2="${m+s}" y2="${m+s}" stroke="${stroke}" stroke-width="${sw}"/>`;
      if (w.b) paths += `<line x1="${m}" y1="${m+s}" x2="${m+s}" y2="${m+s}" stroke="${stroke}" stroke-width="${sw}"/>`;
      if (w.l) paths += `<line x1="${m}" y1="${m}" x2="${m}" y2="${m+s}" stroke="${stroke}" stroke-width="${sw}"/>`;
    } else {
      // X型格子
      const m = 4, c = 16, s = 12;
      const xWalls = [
        {tl:true, tr:true},  // 上三角
        {tr:true, br:true},  // 右三角
        {bl:true, br:true},  // 下三角
        {tl:true, bl:true},  // 左三角
      ];
      const xw = xWalls[pos % 4] || xWalls[0];
      if (xw.tl) paths += `<line x1="${m}" y1="${m}" x2="${c}" y2="${c}" stroke="${stroke}" stroke-width="${sw}"/>`;
      if (xw.tr) paths += `<line x1="${m+s*2}" y1="${m}" x2="${c}" y2="${c}" stroke="${stroke}" stroke-width="${sw}"/>`;
      if (xw.bl) paths += `<line x1="${m}" y1="${m+s*2}" x2="${c}" y2="${c}" stroke="${stroke}" stroke-width="${sw}"/>`;
      if (xw.br) paths += `<line x1="${m+s*2}" y1="${m+s*2}" x2="${c}" y2="${c}" stroke="${stroke}" stroke-width="${sw}"/>`;
    }

    // ドット（格子種別の区別）
    if (dot) {
      paths += `<circle cx="16" cy="16" r="3" fill="${stroke}"/>`;
    }

    svg.innerHTML = paths;
    return svg;
  }

  // グリフ（架空文字）用: SVG描画アニメーション
  async function animateGlyph(outputEl, glyphData) {
    outputEl.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'glyph-container';
    outputEl.appendChild(container);

    for (const item of glyphData) {
      let el;
      if (item.space) {
        el = document.createElement('span');
        el.className = 'glyph-space';
      } else if (item.passthrough) {
        el = document.createElement('span');
        el.className = 'glyph-passthrough';
        el.textContent = item.letter;
      } else {
        el = createGlyphSVG(item);
      }
      el.style.opacity = '0';
      el.style.transform = 'scale(0.5) rotate(-30deg)';
      el.style.transition = 'all 0.3s ease';
      container.appendChild(el);

      await sleep(40);
      el.style.opacity = '1';
      el.style.transform = 'scale(1) rotate(0deg)';
      await sleep(80);
    }
  }

  // グリフSVG生成
  function createGlyphSVG(item) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '36');
    svg.setAttribute('height', '36');
    svg.setAttribute('viewBox', '0 0 32 32');
    svg.classList.add('glyph-char');

    const stroke = '#c9a84c'; // accent color
    let html = `<path d="${item.path}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

    if (item.dots) {
      for (const [cx, cy] of item.dots) {
        html += `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${stroke}"/>`;
      }
    }

    svg.innerHTML = html;
    return svg;
  }

  // 統合アニメーション関数
  async function animate(outputEl, inputText, finalText, type, options = {}) {
    // テキストが長すぎる場合はアニメーション短縮
    const len = finalText.length;
    const adjustedOpts = { ...options };
    if (len > 30) {
      adjustedOpts.duration = Math.max(100, CHAR_DURATION - len * 3);
      adjustedOpts.delay = Math.max(15, CHAR_DELAY - len);
    }
    if (len > 100 && type !== 'pigpen' && type !== 'glyph') {
      // 100文字超はアニメーションスキップ（SVG系は除く）
      outputEl.textContent = finalText;
      return;
    }

    switch (type) {
      case 'slot':
        // 出力に数字が多い場合はプールを変更
        if (/^\d+[\s\d]*$/.test(finalText)) {
          adjustedOpts.pool = DIGIT_POOL + KANA_POOL.slice(0, 10);
        }
        // 記号が多い場合
        if (/[★☆△▽□■◇◆○●◎⊕⊗]/.test(finalText)) {
          adjustedOpts.pool = SYMBOL_POOL;
        }
        // 古代文字
        if (/[\u{13000}-\u{1342F}\u{16A0}-\u{16FF}\u{10000}-\u{100FF}]/u.test(finalText)) {
          adjustedOpts.pool = ANCIENT_POOL;
        }
        await animateSlot(outputEl, finalText, adjustedOpts);
        break;
      case 'move':
        await animateMove(outputEl, inputText, finalText);
        break;
      case 'morph':
        await animateMorph(outputEl, inputText, finalText);
        break;
      case 'pigpen':
        await animatePigpen(outputEl, finalText);
        break;
      case 'glyph':
        await animateGlyph(outputEl, finalText);
        break;
      default:
        outputEl.textContent = finalText;
    }
  }

  // アニメーションなしで即座に表示
  function setImmediate(outputEl, text) {
    outputEl.textContent = text;
  }

  return { animate, setImmediate, createPigpenSVG };
})();
