// ============================================================
// app.js — Cipher Museum メインコントローラー
// ============================================================

const App = (() => {
  let currentEngine = null;
  let isAnimating = false;
  let allEngines = [];

  // カテゴリ定義
  const CATEGORIES = {
    substitution: { label: '置換暗号', icon: '🔄' },
    transposition: { label: '転置暗号', icon: '🔀' },
    mechanical: { label: '機械式暗号', icon: '⚙️' },
    japanese: { label: '日本の暗号', icon: '🏯' },
    modern: { label: '近代暗号', icon: '💻' },
    ancient: { label: '古代文字', icon: '🏛️' },
    fictional: { label: '架空文字', icon: '✨' },
    symbol: { label: '符号・記号', icon: '📡' },
    decoration: { label: '装飾変換', icon: '🎨' }
  };

  function init() {
    // 全エンジンを結合
    allEngines = [
      ...(typeof CipherEngines !== 'undefined' ? CipherEngines : []),
      ...(typeof ScriptEngines !== 'undefined' ? ScriptEngines : [])
    ];

    renderSidebar();
    bindEvents();
    showWelcome();

    // URLパラメータから復元
    const params = new URLSearchParams(location.search);
    if (params.get('id')) {
      const engine = allEngines.find(e => e.id === params.get('id'));
      if (engine) selectEngine(engine);
    }
  }

  // ---- サイドバー描画 ----
  function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    const grouped = {};

    for (const engine of allEngines) {
      const cat = engine.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(engine);
    }

    let html = '';
    const catOrder = ['substitution','transposition','mechanical','japanese','modern','ancient','fictional','symbol','decoration'];

    for (const cat of catOrder) {
      if (!grouped[cat]) continue;
      const catInfo = CATEGORIES[cat] || { label: cat, icon: '📁' };
      html += `<div class="sidebar-category">
        <div class="sidebar-category-header">${catInfo.icon} ${catInfo.label}</div>`;

      for (const engine of grouped[cat]) {
        const stars = '★'.repeat(engine.difficulty) + '☆'.repeat(3 - engine.difficulty);
        html += `<div class="sidebar-item" data-id="${engine.id}">
          <span class="sidebar-item-icon">${engine.icon}</span>
          <span class="sidebar-item-name">${engine.name}</span>
          <span class="sidebar-item-difficulty">${stars}</span>
        </div>`;
      }
      html += '</div>';
    }

    sidebar.innerHTML = html;
  }

  // ---- ウェルカム画面 ----
  function showWelcome() {
    const converter = document.getElementById('converter');
    const picks = [...allEngines].sort(() => Math.random() - 0.5).slice(0, 8);

    converter.innerHTML = `
      <div class="welcome">
        <div class="welcome-icon">🏛️</div>
        <div class="welcome-title">Cipher Museum</div>
        <div class="welcome-desc">
          古今東西の暗号と文字を体験する博物館。<br>
          左のメニューから方式を選んでください。
        </div>
        <div class="welcome-grid">
          ${picks.map(e => `
            <div class="welcome-card" data-id="${e.id}">
              <div class="welcome-card-icon">${e.icon}</div>
              <div class="welcome-card-name">${e.name}</div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  // ---- ウェルカム解説パネル ----
  function renderWelcomeInfo() {
    const panel = document.getElementById('infoPanel');
    panel.innerHTML = `<div class="info-section">
      <div class="info-section-title">📖 Cipher Museum</div>
      <div class="info-section-content">
        <p>古今東西の暗号と古代文字を体験する博物館です。</p>
        <p>左のメニューから方式を選んで、テキストを変換してみましょう。</p>
        <p>各方式の歴史や仕組みもこのパネルに表示されます。</p>
      </div>
    </div>`;
  }

  // ---- エンジン選択 ----
  function selectEngine(engine) {
    currentEngine = engine;

    // サイドバーのアクティブ状態
    document.querySelectorAll('.sidebar-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === engine.id);
    });

    // モバイルサイドバーを閉じる
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');

    renderConverter(engine);
    renderInfoPanel(engine);
  }

  // ---- 変換エリア描画 ----
  function renderConverter(engine) {
    const isScript = ['ancient','fictional','symbol','decoration'].includes(engine.category);
    const converter = document.getElementById('converter');

    let keyConfigHtml = '';
    if (engine.keyConfig && engine.keyConfig.length > 0) {
      keyConfigHtml = '<div class="key-config">';
      for (const cfg of engine.keyConfig) {
        keyConfigHtml += `<div class="key-field"><label>${cfg.label}</label>`;
        if (cfg.type === 'number') {
          keyConfigHtml += `<input type="number" id="key-${cfg.id}" min="${cfg.min}" max="${cfg.max}" value="${cfg.default}">`;
        } else if (cfg.type === 'select') {
          keyConfigHtml += `<select id="key-${cfg.id}">`;
          for (const opt of cfg.options) {
            const val = typeof opt === 'object' ? opt.value : opt;
            const label = typeof opt === 'object' ? opt.label : opt;
            keyConfigHtml += `<option value="${val}" ${val === cfg.default ? 'selected' : ''}>${label}</option>`;
          }
          keyConfigHtml += '</select>';
        } else {
          keyConfigHtml += `<input type="text" id="key-${cfg.id}" value="${cfg.default || ''}" placeholder="${cfg.placeholder || ''}">`;
        }
        keyConfigHtml += '</div>';
      }
      keyConfigHtml += '</div>';
    }

    converter.innerHTML = `
      <div class="converter-header">
        <span class="converter-icon">${engine.icon}</span>
        <div>
          <div class="converter-title">${engine.name}</div>
          <span class="converter-era">${engine.era}</span>
        </div>
      </div>
      <div class="converter-desc">${engine.description || ''}</div>

      <div class="input-section">
        <div class="input-label">入力テキスト</div>
        <textarea class="input-textarea" id="inputText" placeholder="${isScript ? 'テキストを入力...' : '暗号化: かなで入力 / 復号: 暗号文を貼り付け'}">${getDefaultText()}</textarea>
      </div>

      ${keyConfigHtml}

      <div class="action-bar">
        <button class="btn-convert" id="btnEncrypt">
          ${isScript ? '🔮 変換' : '🔐 暗号化'}
        </button>
        ${!isScript && engine.decrypt ? '<button class="btn-swap" id="btnDecrypt">🔓 復号</button>' : ''}
        ${isScript && engine.reversible ? '<button class="btn-swap" id="btnDecrypt">🔄 逆変換</button>' : ''}
      </div>

      <div class="output-section">
        <div class="output-label">出力</div>
        <div class="output-area" id="outputArea"></div>
        <div class="output-toolbar">
          <button class="btn-copy" id="btnCopy">📋 コピー</button>
          ${((!isScript && engine.decrypt) || (isScript && engine.reversible)) && engine.outputType !== 'pigpen' ? '<button class="btn-copy" id="btnToInput">↑ 入力に送る</button>' : ''}
          ${engine.outputType === 'pigpen' ? '<span class="pigpen-note">※ 図形出力のためコピー・転送不可。復号は入力テキストから直接実行できます</span>' : ''}
          <span class="copy-feedback" id="copyFeedback">コピーしました</span>
        </div>
      </div>`;
  }

  function getDefaultText() {
    return 'ひみつのあんごう';
  }

  // ---- 鍵値取得 ----
  function getKeys() {
    if (!currentEngine || !currentEngine.keyConfig) return {};
    const keys = {};
    for (const cfg of currentEngine.keyConfig) {
      const el = document.getElementById(`key-${cfg.id}`);
      if (!el) continue;
      if (cfg.type === 'number') {
        const parsed = parseInt(el.value, 10);
        keys[cfg.id] = isNaN(parsed) ? (cfg.default || 0) : parsed;
      } else {
        keys[cfg.id] = el.value;
      }
    }
    return keys;
  }

  // ---- 暗号化/復号実行 ----
  async function executeConvert(mode) {
    if (isAnimating || !currentEngine) return;

    const inputEl = document.getElementById('inputText');
    const outputEl = document.getElementById('outputArea');
    const text = inputEl.value;
    if (!text.trim()) return;

    isAnimating = true;
    document.getElementById('btnEncrypt').disabled = true;
    const btnDecrypt = document.getElementById('btnDecrypt');
    if (btnDecrypt) btnDecrypt.disabled = true;

    // 前回のエラー表示をリセット
    outputEl.style.color = '';

    try {
      const keys = getKeys();
      let result;
      const isScript = ['ancient','fictional','symbol','decoration'].includes(currentEngine.category);

      if (isScript) {
        if (mode === 'decrypt' && currentEngine.reverse) {
          result = currentEngine.reverse(text, keys);
        } else {
          result = currentEngine.convert(text, keys);
        }
      } else if (mode === 'decrypt' && currentEngine.decrypt) {
        result = currentEngine.decrypt(text, keys);
      } else {
        result = currentEngine.encrypt(text, keys);
      }

      // OTP: 自動生成された鍵をUI入力欄に書き戻す
      if (keys._generatedKey) {
        const keyInput = document.getElementById('key-key');
        if (keyInput) keyInput.value = keys._generatedKey;
      }

      // 豚小屋暗号の特殊処理
      if (currentEngine.outputType === 'pigpen' && Array.isArray(result)) {
        await CipherAnimation.animate(outputEl, text, result, 'pigpen');
      } else {
        // フォントベース出力
        outputEl.className = 'output-area';
        if (currentEngine.outputType === 'font' && currentEngine.fontClass) {
          outputEl.classList.add(currentEngine.fontClass);
        }

        const animType = currentEngine.animationType || 'slot';
        await CipherAnimation.animate(outputEl, text, result, animType);
      }
    } catch (e) {
      outputEl.textContent = 'エラー: ' + e.message;
      outputEl.style.color = 'var(--red)';
    }

    isAnimating = false;
    document.getElementById('btnEncrypt').disabled = false;
    if (btnDecrypt) btnDecrypt.disabled = false;
  }

  // ---- 解説パネル描画 ----
  function renderInfoPanel(engine) {
    const panel = document.getElementById('infoPanel');
    const ep = (typeof Episodes !== 'undefined') ? Episodes[engine.id] : null;

    if (!ep) {
      panel.innerHTML = `<div class="info-section">
        <div class="info-section-title">📖 解説</div>
        <div class="info-section-content"><p>解説データを準備中です。</p></div>
      </div>`;
      return;
    }

    let html = '';

    if (ep.overview) {
      html += `<div class="info-section">
        <div class="info-section-title">📋 概要</div>
        <div class="info-section-content"><p>${ep.overview}</p></div>
      </div>`;
    }

    if (ep.mechanism) {
      html += `<div class="info-section">
        <div class="info-section-title">⚙️ 仕組み</div>
        <div class="info-section-content"><p>${ep.mechanism}</p></div>
      </div>`;
    }

    if (ep.history) {
      html += `<div class="info-section">
        <div class="info-section-title">📜 歴史</div>
        <div class="info-section-content"><p>${ep.history}</p></div>
      </div>`;
    }

    if (ep.broken) {
      html += `<div class="info-section">
        <div class="info-section-title">💥 いかにして破られたか</div>
        <div class="info-section-content"><p>${ep.broken}</p></div>
      </div>`;
    }

    if (ep.trivia) {
      html += `<div class="info-section">
        <div class="info-section-title">💡 豆知識</div>
        <div class="info-section-content"><p>${ep.trivia}</p></div>
      </div>`;
    }

    if (ep.related && ep.related.length > 0) {
      html += `<div class="info-section">
        <div class="info-section-title">🔗 関連</div>
        <div class="info-related">
          ${ep.related.map(rid => {
            const re = allEngines.find(e => e.id === rid);
            return re ? `<span class="info-related-chip" data-id="${rid}">${re.icon} ${re.name}</span>` : '';
          }).join('')}
        </div>
      </div>`;
    }

    panel.innerHTML = html;
  }

  // ---- コピー機能 ----
  function copyOutput() {
    const outputEl = document.getElementById('outputArea');
    const text = outputEl.textContent || outputEl.innerText;
    if (!text.trim()) return;

    const showFeedback = (msg) => {
      const fb = document.getElementById('copyFeedback');
      if (fb) {
        fb.textContent = msg || 'コピーしました';
        fb.classList.add('show');
        setTimeout(() => { fb.classList.remove('show'); fb.textContent = 'コピーしました'; }, 1500);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showFeedback()).catch(() => fallbackCopy(text, showFeedback));
    } else {
      fallbackCopy(text, showFeedback);
    }
  }

  function fallbackCopy(text, callback) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      callback('コピーしました');
    } catch (e) {
      callback('コピーに失敗しました');
    }
    document.body.removeChild(ta);
  }

  // ---- 出力→入力転送 ----
  function sendOutputToInput() {
    const outputEl = document.getElementById('outputArea');
    const inputEl = document.getElementById('inputText');
    if (!outputEl || !inputEl) return;
    const text = outputEl.textContent || outputEl.innerText;
    if (!text.trim()) return;
    inputEl.value = text;
    inputEl.focus();
    // 入力欄ハイライト
    inputEl.style.borderColor = 'var(--green)';
    inputEl.style.boxShadow = '0 0 0 3px rgba(63, 185, 80, 0.2)';
    setTimeout(() => { inputEl.style.borderColor = ''; inputEl.style.boxShadow = ''; }, 1200);
    // フィードバック
    const fb = document.getElementById('copyFeedback');
    if (fb) {
      fb.textContent = '入力に送りました';
      fb.classList.add('show');
      setTimeout(() => {
        fb.classList.remove('show');
        fb.textContent = 'コピーしました';
      }, 1500);
    }
  }

  // ---- イベントバインド ----
  function bindEvents() {
    // サイドバー・ウェルカムカードのクリック
    document.addEventListener('click', e => {
      const item = e.target.closest('[data-id]');
      if (item) {
        const engine = allEngines.find(eng => eng.id === item.dataset.id);
        if (engine) selectEngine(engine);
      }

      // 暗号化ボタン
      if (e.target.closest('#btnEncrypt')) {
        executeConvert('encrypt');
      }
      // 復号ボタン
      if (e.target.closest('#btnDecrypt')) {
        executeConvert('decrypt');
      }
      // 入力に送るボタン
      if (e.target.closest('#btnToInput')) {
        sendOutputToInput();
      }
      // コピーボタン
      if (e.target.closest('#btnCopy') && !e.target.closest('#btnToInput')) {
        copyOutput();
      }
      // ヘッダーロゴ→トップ
      if (e.target.closest('#headerHome')) {
        currentEngine = null;
        document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
        showWelcome();
        renderWelcomeInfo();
      }
      // モバイルサイドバートグル
      if (e.target.closest('#sidebarToggle')) {
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('sidebarOverlay').classList.toggle('show');
      }
      // サイドバーオーバーレイ
      if (e.target.closest('#sidebarOverlay')) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('show');
      }
      // モバイルタブ
      if (e.target.closest('.mobile-tab')) {
        const tab = e.target.closest('.mobile-tab').dataset.tab;
        switchMobileTab(tab);
      }
    });

    // キーボードショートカット
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        executeConvert('encrypt');
      }
    });
  }

  // ---- モバイルタブ切替 ----
  function switchMobileTab(tab) {
    document.querySelectorAll('.mobile-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tab);
    });

    const sidebar = document.getElementById('sidebar');
    const converter = document.getElementById('converter');
    const infoPanel = document.getElementById('infoPanel');

    if (tab === 'list') {
      sidebar.classList.add('open');
      document.getElementById('sidebarOverlay').classList.add('show');
    } else {
      sidebar.classList.remove('open');
      document.getElementById('sidebarOverlay').classList.remove('show');
    }

    if (tab === 'info') {
      infoPanel.classList.remove('hidden');
      infoPanel.style.display = '';
    } else {
      if (window.innerWidth <= 900) {
        infoPanel.classList.add('hidden');
      }
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
