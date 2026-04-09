//@name MemoPlus
//@display-name 📝 MemoPlus
//@api 3.0
//@version 1.0.0
//@update-url https://host-ashen.vercel.app/MemoPlus.js

(async () => {
  try {
    const PLUGIN_NAME = '[MemoPlus v1.0.0]';

    // === Storage Keys ===
    const SK_DATA = 'memoplus_data';
    const SK_THEME = 'memoplus_theme';
    const SK_WIN_VISIBLE = 'memoplus_win_visible';
    const SK_ACTIVE_FOLDER = 'memoplus_active_folder';
    const SK_ACTIVE_TAB = 'memoplus_active_tab';
    const SK_BTN_POS = 'memoplus_btn_pos';
    const SK_QM_POS = 'memoplus_qm_pos';
    const SK_QM_SIZE = 'memoplus_qm_size';
    const SK_WIDGET_SIZE = 'memoplus_widget_size';
    const SK_ALWAYS_SHOW = 'memoplus_always_show';

    // === Widget Attribute (ScrollPlus pattern) ===
    const WIDGET_ATTR_KEY = 'x-memoplus-widget';
    const WIDGET_ATTR_VAL = 'btn';
    const SETTINGS_ATTR_KEY = 'x-memoplus-settings';
    const QUICKMEMO_ATTR_KEY = 'x-memoplus-quickmemo';

    // === Widget Size Config ===
    const SIZE_CONFIG = {
      small:   { container: 44, btn: 36, handle: 18, handleH: 5, icon: 20, gap: 3, pad: 3, radius: 22 },
      default: { container: 52, btn: 48, handle: 24, handleH: 6, icon: 24, gap: 4, pad: 4, radius: 26 },
      large:   { container: 64, btn: 56, handle: 30, handleH: 8, icon: 30, gap: 6, pad: 6, radius: 32 },
    };

    // === Theme Definitions ===
    const THEMES = {
      MIDNIGHT: {
        name: 'Midnight',
        bgMain: '#0f172a',
        bgHeader: 'transparent',
        textMain: '#e2e8f0',
        textSub: '#94a3b8',
        accent: '#06b6d4',
        accentText: '#67e8f9',
        border: 'rgba(148, 163, 184, 0.1)',
        btnBg: 'rgba(148, 163, 184, 0.08)',
        btnHover: 'rgba(148, 163, 184, 0.16)',
        folderBg: 'rgba(148, 163, 184, 0.06)',
        folderActiveBg: 'rgba(6, 182, 212, 0.15)',
        tabBg: 'rgba(148, 163, 184, 0.06)',
        tabActiveBg: 'rgba(6, 182, 212, 0.15)',
        inputBorder: 'rgba(6, 182, 212, 0.3)',
        menuBg: '#1e293b',
        menuHover: 'rgba(148, 163, 184, 0.1)',
        saveBg: 'rgba(34, 197, 94, 0.25)',
        deleteBg: 'rgba(239, 68, 68, 0.25)',
        copyBg: 'rgba(96, 165, 250, 0.25)',
        widgetHandle: 'rgba(0, 0, 0, 0.4)',
        widgetHandleActive: 'rgba(0, 0, 0, 0.8)',
        widgetBtnBg: 'rgba(0, 0, 0, 0.3)',
        widgetBtnBorder: 'rgba(0, 0, 0, 0.3)',
        widgetBtnColor: 'rgba(0, 0, 0, 0.8)',
      },
      LATTE: {
        name: 'Latte',
        bgMain: '#faf7f2',
        bgHeader: 'transparent',
        textMain: '#1c1917',
        textSub: '#78716c',
        accent: '#059669',
        accentText: '#059669',
        border: 'rgba(0, 0, 0, 0.06)',
        btnBg: 'rgba(0, 0, 0, 0.04)',
        btnHover: 'rgba(0, 0, 0, 0.08)',
        folderBg: 'rgba(0, 0, 0, 0.03)',
        folderActiveBg: 'rgba(5, 150, 105, 0.12)',
        tabBg: 'rgba(0, 0, 0, 0.03)',
        tabActiveBg: 'rgba(5, 150, 105, 0.12)',
        inputBorder: 'rgba(5, 150, 105, 0.3)',
        menuBg: '#ffffff',
        menuHover: 'rgba(0, 0, 0, 0.04)',
        saveBg: '#059669',
        deleteBg: '#dc2626',
        copyBg: '#2563eb',
        widgetHandle: 'rgba(255, 255, 255, 0.3)',
        widgetHandleActive: 'rgba(255, 255, 255, 0.8)',
        widgetBtnBg: 'rgba(255, 255, 255, 0.05)',
        widgetBtnBorder: 'rgba(255, 255, 255, 0.2)',
        widgetBtnColor: 'rgba(255, 255, 255, 0.9)',
      }
    };

    // === State ===
    let folders = [];
    let activeFolderIndex = 0;
    let activeTabIndex = 0;
    let currentTheme = 'LATTE';
    let hasUnsavedChanges = false;
    let isNotepadOpen = false;
    let widgetElement = null;
    let globalPointerMoveId = null;
    let globalPointerUpId = null;
    let isDragging = false;
    let dragShiftX = 0;
    let dragShiftY = 0;
    let isWidgetVisible = false;
    let widgetSize = 'default';
    let alwaysShow = false;
    let btnRef = null;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pressedMemoBtn = false;
    let quickMemoPanel = null;
    let quickMemoEditor = null;
    let quickMemoTitle = null;
    let qmDragging = false;
    let qmDragShiftX = 0;
    let qmDragShiftY = 0;
    let qmPointerMoveId = null;
    let qmPointerUpId = null;
    let qmJustDragged = false;
    let qmBuffer = '';
    let isQuickEditOpen = false;
    let qmResizing = false;
    let qmResizeStartX = 0;
    let qmResizeStartY = 0;
    let qmResizeStartRect = null;

    // === Data Management ===
    const loadData = async () => {
      try {
        const raw = await Risuai.pluginStorage.getItem(SK_DATA);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (!parsed[0].notes) {
              folders = [{ title: '기본 폴더', notes: parsed }];
            } else {
              folders = parsed;
            }
          } else {
            folders = [{ title: '기본 폴더', notes: [] }];
          }
        } else {
          folders = [{ title: '기본 폴더', notes: [] }];
        }
      } catch (e) {
        console.log(`${PLUGIN_NAME} 데이터 로드 실패: ${e.message}`);
        folders = [{ title: '기본 폴더', notes: [] }];
      }
    };

    const saveData = async (showToastMsg = false) => {
      try {
        await Risuai.pluginStorage.setItem(SK_DATA, JSON.stringify(folders));
        if (showToastMsg) showToast('✓ 저장되었습니다.');
      } catch (e) {
        console.log(`${PLUGIN_NAME} 저장 실패: ${e.message}`);
        showToast('⚠️ 저장에 실패했습니다.');
      }
    };

    const loadUIState = async () => {
      try {
        const theme = await Risuai.safeLocalStorage.getItem(SK_THEME);
        if (theme) {
          if (theme === 'NAVY') currentTheme = 'MIDNIGHT';
          else if (theme === 'IVORY') currentTheme = 'LATTE';
          else if (THEMES[theme]) currentTheme = theme;
        }
        const fi = await Risuai.safeLocalStorage.getItem(SK_ACTIVE_FOLDER);
        if (fi !== null) activeFolderIndex = parseInt(fi) || 0;
        const ti = await Risuai.safeLocalStorage.getItem(SK_ACTIVE_TAB);
        if (ti !== null) activeTabIndex = parseInt(ti) || 0;
        const ws = await Risuai.safeLocalStorage.getItem(SK_WIDGET_SIZE);
        if (ws && SIZE_CONFIG[ws]) widgetSize = ws;
        const as = await Risuai.safeLocalStorage.getItem(SK_ALWAYS_SHOW);
        if (as !== null) alwaysShow = as === 'true';
        isWidgetVisible = alwaysShow;
      } catch (e) {}
    };

    const saveUIState = async () => {
      try {
        await Risuai.safeLocalStorage.setItem(SK_THEME, currentTheme);
        await Risuai.safeLocalStorage.setItem(SK_ACTIVE_FOLDER, String(activeFolderIndex));
        await Risuai.safeLocalStorage.setItem(SK_ACTIVE_TAB, String(activeTabIndex));
      } catch (e) {}
    };

    // === Toast (Iframe UI) ===
    const showToast = (message) => {
      const existing = document.querySelector('.mp-toast');
      if (existing) existing.remove();
      const toast = document.createElement('div');
      toast.className = 'mp-toast';
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    };

    // === Confirmation Modal (Iframe UI) ===
    const showConfirm = (message) => {
      return new Promise((resolve) => {
        const t = T();
        const overlay = document.createElement('div');
        overlay.className = 'mp-modal-overlay';
        overlay.innerHTML = `
          <div class="mp-modal-content" style="background:${t.bgMain};border:1px solid ${t.border};color:${t.textMain}">
            <p class="mp-modal-message">${message}</p>
            <div class="mp-modal-buttons">
              <button class="mp-modal-btn mp-modal-cancel" style="background:${t.btnBg};color:${t.textMain}">취소</button>
              <button class="mp-modal-btn mp-modal-confirm">확인</button>
            </div>
          </div>`;
        const remove = () => { if (overlay.parentNode) overlay.remove(); };
        overlay.querySelector('.mp-modal-confirm').onclick = () => { remove(); resolve(true); };
        overlay.querySelector('.mp-modal-cancel').onclick = () => { remove(); resolve(false); };
        document.body.appendChild(overlay);
      });
    };

    // === Get Theme ===
    const T = () => THEMES[currentTheme] || THEMES.MIDNIGHT;

    // === Inject Iframe Styles ===
    const injectStyles = () => {
      if (document.getElementById('mp-style')) return;
      const style = document.createElement('style');
      style.id = 'mp-style';
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          width: 100%; height: 100%;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: rgba(0, 0, 0, 0.35);
          overflow: hidden;
        }

        .mp-container {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: min(92vw, 480px); height: min(85vh, 660px);
          display: flex; flex-direction: column;
          border-radius: 20px; overflow: hidden;
          box-shadow: 0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04);
          transition: background 0.3s, color 0.3s;
        }

        /* Header */
        .mp-header {
          padding: 16px 20px; display: flex; align-items: center;
          justify-content: space-between; cursor: default; user-select: none; flex-shrink: 0;
        }
        .mp-header-title { font-weight: 700; font-size: 15px; letter-spacing: -0.3px; flex: 1; }
        .mp-header-buttons { display: flex; gap: 8px; }
        .mp-header-btn {
          width: 32px; height: 32px; border: none; border-radius: 10px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 14px; transition: all 0.2s; flex-shrink: 0;
        }

        /* Folders */
        .mp-folders {
          display: flex; align-items: center;
          padding: 0 16px 10px 16px; overflow-x: auto; gap: 6px;
          scrollbar-width: none; flex-shrink: 0;
        }
        .mp-folders::-webkit-scrollbar { display: none; }
        .mp-folder-item {
          padding: 5px 14px; border-radius: 20px; cursor: pointer;
          font-size: 12px; white-space: nowrap;
          transition: all 0.2s; border: 1px solid transparent;
          display: flex; align-items: center; gap: 4px; user-select: none; font-weight: 600;
        }
        .mp-folder-new {
          width: 24px; height: 24px; border: 1px dashed currentColor;
          background: transparent; cursor: pointer; font-size: 14px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%; flex-shrink: 0; opacity: 0.4; transition: opacity 0.2s;
        }
        .mp-folder-new:hover { opacity: 0.8; }

        /* Tabs */
        .mp-tabs-container {
          display: flex; align-items: center;
          padding: 6px 12px; position: relative; flex-shrink: 0; gap: 4px;
        }
        .mp-tabs-list { flex: 1; display: flex; overflow-x: auto; scrollbar-width: none; gap: 4px; }
        .mp-tabs-list::-webkit-scrollbar { display: none; }
        .mp-tab-item {
          padding: 6px 16px; border-radius: 20px; cursor: pointer;
          font-size: 13px; white-space: nowrap; max-width: 150px;
          overflow: hidden; text-overflow: ellipsis; flex-shrink: 0;
          transition: all 0.2s; user-select: none; font-weight: 500;
        }
        .mp-new-tab-btn {
          width: 28px; height: 28px; border: 1px dashed currentColor;
          border-radius: 50%; cursor: pointer; font-size: 16px;
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          background: transparent; opacity: 0.4; transition: opacity 0.2s;
        }
        .mp-new-tab-btn:hover { opacity: 0.8; }

        /* Editor */
        .mp-editor { flex: 1; display: flex; flex-direction: column; padding: 16px 20px; gap: 12px; min-height: 0; }
        .mp-title-input {
          background: transparent; border: none; padding: 8px 0;
          font-size: 20px; font-weight: 700; outline: none; flex-shrink: 0;
          font-family: inherit; letter-spacing: -0.3px;
          border-bottom: 2px solid transparent;
        }
        .mp-content-textarea {
          flex: 1; background: transparent; border: none; padding: 4px 0;
          font-size: 14px; font-family: inherit; resize: none; outline: none;
          line-height: 1.8; letter-spacing: -0.1px;
        }
        .mp-empty-state {
          flex: 1; display: flex; justify-content: center; align-items: center;
          text-align: center; font-size: 14px; opacity: 0.35; letter-spacing: -0.2px;
        }

        /* Footer */
        .mp-footer {
          padding: 12px 20px; display: flex; flex-wrap: wrap;
          justify-content: space-between; align-items: center; gap: 8px; flex-shrink: 0;
        }
        .mp-footer-left, .mp-footer-right { display: flex; gap: 8px; }
        .mp-footer button {
          border: none; border-radius: 10px; color: white; padding: 8px 16px;
          cursor: pointer; white-space: nowrap; font-weight: 600; font-size: 12px;
          transition: all 0.2s; letter-spacing: -0.2px;
        }
        .mp-save-btn.saved { opacity: 0.4; cursor: default; }

        /* Context Menu */
        .mp-context-menu {
          position: fixed; z-index: 100002;
          border-radius: 14px; overflow: hidden;
          box-shadow: 0 8px 30px rgba(0,0,0,0.25);
          padding: 6px; min-width: 150px;
        }
        .mp-context-menu ul { list-style: none; }
        .mp-context-item {
          padding: 10px 14px; border-radius: 8px;
          cursor: pointer; white-space: nowrap; font-size: 13px;
          transition: background 0.15s;
        }

        /* Toast */
        .mp-toast {
          position: fixed; top: 24px; left: 50%; transform: translateX(-50%) scale(0.9);
          padding: 10px 20px; border-radius: 12px; color: white;
          box-shadow: 0 8px 30px rgba(0,0,0,0.2); z-index: 100003;
          animation: mp-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          font-size: 13px; font-weight: 500;
        }
        @keyframes mp-pop {
          from { opacity: 0; transform: translateX(-50%) scale(0.85); }
          to { opacity: 1; transform: translateX(-50%) scale(1); }
        }

        /* Modal */
        .mp-modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.45); z-index: 100004;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(4px);
        }
        .mp-modal-content {
          padding: 28px; border-radius: 16px;
          text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.35);
          max-width: 340px; width: 90%;
        }
        .mp-modal-message { margin-bottom: 24px; line-height: 1.6; white-space: pre-wrap; font-weight: 500; font-size: 14px; }
        .mp-modal-buttons { display: flex; justify-content: center; gap: 12px; }
        .mp-modal-btn {
          padding: 10px 24px; border-radius: 10px; border: none;
          cursor: pointer; font-weight: 600; transition: all 0.2s; font-size: 13px;
        }
        .mp-modal-btn:hover { opacity: 0.85; }
        .mp-modal-confirm { background: #ef4444; color: white; }
      `;
      document.head.appendChild(style);
    };

    // === Apply Theme to Iframe ===
    const applyTheme = () => {
      const t = T();
      const container = document.querySelector('.mp-container');
      if (!container) return;

      container.style.background = t.bgMain;
      container.style.color = t.textMain;
      container.style.border = `1px solid ${t.border}`;

      const header = container.querySelector('.mp-header');
      if (header) {
        header.style.background = t.bgHeader;
        header.style.borderBottom = `1px solid ${t.border}`;
      }

      container.querySelectorAll('.mp-header-btn').forEach(btn => {
        btn.style.background = t.btnBg;
        btn.style.color = t.textMain;
        btn.onmouseenter = () => { btn.style.background = t.btnHover; };
        btn.onmouseleave = () => { btn.style.background = t.btnBg; };
      });

      const foldersBar = container.querySelector('.mp-folders');
      if (foldersBar) {
        foldersBar.style.borderBottom = `1px solid ${t.border}`;
      }

      container.querySelectorAll('.mp-folder-item').forEach(item => {
        const isActive = item.classList.contains('active');
        item.style.background = isActive ? t.folderActiveBg : t.folderBg;
        item.style.color = isActive ? t.accentText : t.textSub;
        item.style.borderColor = isActive ? t.accent : 'transparent';
      });

      const folderNewBtn = container.querySelector('.mp-folder-new');
      if (folderNewBtn) {
        folderNewBtn.style.color = t.textSub;
        folderNewBtn.style.borderColor = t.textSub;
      }

      const tabsContainer = container.querySelector('.mp-tabs-container');
      if (tabsContainer) {
        tabsContainer.style.borderBottom = `1px solid ${t.border}`;
      }

      container.querySelectorAll('.mp-tab-item').forEach(item => {
        const isActive = item.classList.contains('active');
        item.style.background = isActive ? t.tabActiveBg : t.tabBg;
        item.style.color = isActive ? t.textMain : t.textSub;
        if (isActive) item.style.fontWeight = '600';
        else item.style.fontWeight = '500';
      });

      const newTabBtn = container.querySelector('.mp-new-tab-btn');
      if (newTabBtn) {
        newTabBtn.style.color = t.textSub;
        newTabBtn.style.borderColor = t.textSub;
      }

      const titleInput = container.querySelector('.mp-title-input');
      if (titleInput) {
        titleInput.style.color = t.textMain;
        titleInput.style.borderBottomColor = t.inputBorder;
      }

      const textarea = container.querySelector('.mp-content-textarea');
      if (textarea) textarea.style.color = t.textMain;

      const footer = container.querySelector('.mp-footer');
      if (footer) footer.style.borderTop = `1px solid ${t.border}`;

      const saveBtn = container.querySelector('.mp-save-btn');
      if (saveBtn) saveBtn.style.background = t.saveBg;
      const deleteBtn = container.querySelector('.mp-delete-btn');
      if (deleteBtn) deleteBtn.style.background = t.deleteBg;
      const copyBtn = container.querySelector('.mp-copy-btn');
      if (copyBtn) copyBtn.style.background = t.copyBg;

      const toast = document.querySelector('.mp-toast');
      if (toast) toast.style.background = t.accent;

      const modalContent = document.querySelector('.mp-modal-content');
      if (modalContent) {
        modalContent.style.background = t.bgMain;
        modalContent.style.border = `1px solid ${t.border}`;
        modalContent.style.color = t.textMain;
      }
      const modalCancel = document.querySelector('.mp-modal-cancel');
      if (modalCancel) {
        modalCancel.style.background = t.btnBg;
        modalCancel.style.color = t.textMain;
      }
    };

    // === Render Functions (Iframe) ===
    const renderFolders = () => {
      const foldersEl = document.getElementById('mp-folders');
      if (!foldersEl) return;

      if (activeFolderIndex >= folders.length) activeFolderIndex = 0;

      foldersEl.innerHTML = folders.map((folder, i) =>
        `<div class="mp-folder-item ${i === activeFolderIndex ? 'active' : ''}" data-index="${i}">📁 ${folder.title}</div>`
      ).join('') + `<button class="mp-folder-new" title="새 폴더">+</button>`;

      foldersEl.querySelectorAll('.mp-folder-item').forEach(item => {
        item.addEventListener('click', () => switchFolder(parseInt(item.dataset.index)));
        item.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          showFolderContextMenu(e, parseInt(item.dataset.index));
        });
        // 모바일 롱프레스 지원
        let longPressTimer = null;
        item.addEventListener('touchstart', (e) => {
          longPressTimer = setTimeout(() => {
            longPressTimer = null;
            const touch = e.touches[0];
            showFolderContextMenu({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} }, parseInt(item.dataset.index));
          }, 500);
        }, { passive: true });
        item.addEventListener('touchend', () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } });
        item.addEventListener('touchmove', () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } });
      });

      foldersEl.querySelector('.mp-folder-new').addEventListener('click', createNewFolder);
      applyTheme();
    };

    const renderTabsAndContent = () => {
      renderFolders();

      const tabsListEl = document.getElementById('mp-tabs-list');
      const editorEl = document.getElementById('mp-editor');
      const footerEl = document.getElementById('mp-footer');
      if (!tabsListEl || !editorEl || !footerEl) return;

      if (!folders[activeFolderIndex]) {
        activeFolderIndex = 0;
        if (!folders[0]) folders = [{ title: '기본 폴더', notes: [] }];
      }

      const currentNotes = folders[activeFolderIndex].notes;

      if (currentNotes.length > 0) {
        activeTabIndex = Math.max(0, Math.min(currentNotes.length - 1, activeTabIndex));
        tabsListEl.innerHTML = currentNotes.map((note, i) =>
          `<div class="mp-tab-item ${i === activeTabIndex ? 'active' : ''}" data-index="${i}">${note.title || `메모 ${i + 1}`}</div>`
        ).join('');

        editorEl.innerHTML = `
          <input type="text" class="mp-title-input" id="mp-title-input" placeholder="제목">
          <textarea class="mp-content-textarea" id="mp-content-textarea" placeholder="내용을 입력하세요..."></textarea>`;

        footerEl.innerHTML = `
          <div class="mp-footer-left">
            <button class="mp-copy-btn" id="mp-copy-btn">📋 복사</button>
          </div>
          <div class="mp-footer-right">
            <button class="mp-save-btn" id="mp-save-btn">💾 저장</button>
            <button class="mp-delete-btn" id="mp-delete-btn">🗑️ 삭제</button>
          </div>`;

        document.getElementById('mp-save-btn').addEventListener('click', () => saveCurrentNote(true));
        document.getElementById('mp-delete-btn').addEventListener('click', deleteCurrentNote);
        document.getElementById('mp-copy-btn').addEventListener('click', copyCurrentNote);
        document.getElementById('mp-title-input').addEventListener('input', markUnsaved);
        document.getElementById('mp-content-textarea').addEventListener('input', markUnsaved);

        tabsListEl.querySelectorAll('.mp-tab-item').forEach(tab => {
          tab.addEventListener('click', () => switchTab(parseInt(tab.dataset.index)));
          tab.addEventListener('mousedown', (e) => {
            if (e.button === 1) { e.preventDefault(); deleteNoteByIndex(parseInt(tab.dataset.index)); }
          });
        });

        loadNoteContent(activeTabIndex);
      } else {
        tabsListEl.innerHTML = '';
        editorEl.innerHTML = '<div class="mp-empty-state">메모가 없습니다.<br>+ 버튼을 눌러 추가하세요.</div>';
        footerEl.innerHTML = '';
      }

      applyTheme();
    };

    const loadNoteContent = (index) => {
      const note = folders[activeFolderIndex]?.notes[index];
      if (!note) return;
      const titleInput = document.getElementById('mp-title-input');
      const textarea = document.getElementById('mp-content-textarea');
      if (titleInput) titleInput.value = note.title || '';
      if (textarea) textarea.value = note.content || '';
      hasUnsavedChanges = false;
      updateSaveButton();
    };

    // === Note/Folder Operations ===
    const markUnsaved = () => {
      hasUnsavedChanges = true;
      updateSaveButton();
    };

    const updateSaveButton = () => {
      const btn = document.getElementById('mp-save-btn');
      if (!btn) return;
      btn.classList.toggle('saved', !hasUnsavedChanges);
      btn.textContent = hasUnsavedChanges ? '💾 저장' : '✓ 저장됨';
      btn.disabled = !hasUnsavedChanges;
    };

    const saveCurrentNote = async (showMsg = false) => {
      const currentNotes = folders[activeFolderIndex]?.notes;
      if (!currentNotes || currentNotes.length === 0 || activeTabIndex >= currentNotes.length) return;
      const titleInput = document.getElementById('mp-title-input');
      const textarea = document.getElementById('mp-content-textarea');
      currentNotes[activeTabIndex].title = titleInput ? titleInput.value : '';
      currentNotes[activeTabIndex].content = textarea ? textarea.value : '';
      await saveData(showMsg);
      hasUnsavedChanges = false;

      const tabEl = document.querySelector(`.mp-tab-item[data-index="${activeTabIndex}"]`);
      if (tabEl) tabEl.textContent = currentNotes[activeTabIndex].title || `메모 ${activeTabIndex + 1}`;
      updateSaveButton();
    };

    const createNewNote = async () => {
      if (hasUnsavedChanges) {
        const confirmed = await showConfirm('저장하지 않은 변경사항이 있습니다.\n저장하고 새 메모를 만들까요?');
        if (confirmed) await saveCurrentNote(false);
      }
      folders[activeFolderIndex].notes.push({ title: '새 메모', content: '' });
      activeTabIndex = folders[activeFolderIndex].notes.length - 1;
      hasUnsavedChanges = false;
      await saveData(false);
      await saveUIState();
      renderTabsAndContent();
    };

    const deleteCurrentNote = async () => {
      const notes = folders[activeFolderIndex]?.notes;
      if (!notes || notes.length === 0) return;
      const confirmed = await showConfirm(`'${notes[activeTabIndex]?.title || '이 메모'}'를 삭제하시겠습니까?`);
      if (confirmed) await deleteNoteByIndex(activeTabIndex);
    };

    const deleteNoteByIndex = async (index) => {
      const notes = folders[activeFolderIndex]?.notes;
      if (!notes || index < 0 || index >= notes.length) return;
      notes.splice(index, 1);
      if (activeTabIndex >= notes.length) activeTabIndex = Math.max(0, notes.length - 1);
      hasUnsavedChanges = false;
      await saveData(false);
      await saveUIState();
      renderTabsAndContent();
    };

    const copyCurrentNote = async () => {
      const textarea = document.getElementById('mp-content-textarea');
      if (!textarea || !textarea.value) { showToast('복사할 내용이 없습니다.'); return; }
      try {
        await navigator.clipboard.writeText(textarea.value);
        showToast('✓ 메모 내용이 복사되었습니다.');
      } catch (e) {
        showToast('⚠️ 복사에 실패했습니다.');
      }
    };

    const switchTab = async (index) => {
      if (index === activeTabIndex) return;
      if (hasUnsavedChanges) {
        const confirmed = await showConfirm('저장하지 않은 변경사항이 있습니다.\n저장하고 이동할까요?');
        if (confirmed) await saveCurrentNote(false);
      }
      activeTabIndex = index;
      hasUnsavedChanges = false;
      await saveUIState();
      renderTabsAndContent();
    };

    const switchFolder = async (index) => {
      if (index === activeFolderIndex) return;
      if (hasUnsavedChanges) {
        const confirmed = await showConfirm('저장하지 않은 변경사항이 있습니다.\n저장하고 폴더를 이동할까요?');
        if (confirmed) await saveCurrentNote(false);
      }
      activeFolderIndex = index;
      activeTabIndex = 0;
      hasUnsavedChanges = false;
      await saveUIState();
      renderTabsAndContent();
    };

    const createNewFolder = async () => {
      folders.push({ title: '새 폴더', notes: [] });
      activeFolderIndex = folders.length - 1;
      activeTabIndex = 0;
      await saveData(false);
      await saveUIState();
      renderTabsAndContent();
    };

    const renameFolder = async (index) => {
      const currentName = folders[index]?.title || '';
      const overlay = document.createElement('div');
      overlay.className = 'mp-modal-overlay';
      overlay.innerHTML = `
        <div class="mp-modal-content" style="background:${T().bgMain};border:1px solid ${T().border};color:${T().textMain}">
          <p class="mp-modal-message">새 폴더 이름을 입력하세요:</p>
          <input type="text" id="mp-rename-input" value="${currentName}"
            style="width:100%;padding:8px;border-radius:6px;border:1px solid ${T().inputBorder};
            background:transparent;color:${T().textMain};font-size:14px;outline:none;margin-bottom:16px;box-sizing:border-box;">
          <div class="mp-modal-buttons">
            <button class="mp-modal-btn mp-modal-cancel" style="background:${T().btnBg};color:${T().textMain}">취소</button>
            <button class="mp-modal-btn" style="background:${T().accent};color:white;">확인</button>
          </div>
        </div>`;
      const remove = () => { if (overlay.parentNode) overlay.remove(); };
      overlay.querySelector('.mp-modal-cancel').onclick = remove;
      overlay.querySelectorAll('.mp-modal-btn')[1].onclick = async () => {
        const newName = document.getElementById('mp-rename-input').value.trim();
        if (newName) {
          folders[index].title = newName;
          await saveData(false);
          renderFolders();
        }
        remove();
      };
      document.body.appendChild(overlay);
      setTimeout(() => {
        const input = document.getElementById('mp-rename-input');
        if (input) { input.focus(); input.select(); }
      }, 50);
    };

    const deleteFolder = async (index) => {
      if (folders.length <= 1) { showToast('최소 하나의 폴더는 필요합니다.'); return; }
      const noteCount = folders[index].notes.length;
      const confirmed = await showConfirm(`'${folders[index].title}' 폴더와\n내부 메모 ${noteCount}개를 삭제하시겠습니까?`);
      if (!confirmed) return;
      folders.splice(index, 1);
      if (activeFolderIndex >= index) activeFolderIndex = Math.max(0, activeFolderIndex - 1);
      activeTabIndex = 0;
      await saveData(false);
      await saveUIState();
      renderTabsAndContent();
    };

    const showFolderContextMenu = (e, index) => {
      document.querySelectorAll('.mp-context-menu').forEach(m => m.remove());
      const t = T();
      const menu = document.createElement('div');
      menu.className = 'mp-context-menu';
      menu.style.left = `${e.clientX}px`;
      menu.style.top = `${e.clientY}px`;
      menu.style.background = t.menuBg;
      menu.style.border = `1px solid ${t.border}`;
      menu.style.color = t.textSub;
      menu.innerHTML = `<ul>
        <li class="mp-context-item" data-action="rename">✏️ 이름 변경</li>
        <li class="mp-context-item" data-action="delete" style="color:#ff6b6b;">🗑️ 폴더 삭제</li>
      </ul>`;
      menu.querySelectorAll('.mp-context-item').forEach(item => {
        item.onmouseenter = () => { item.style.background = t.menuHover; };
        item.onmouseleave = () => { item.style.background = 'transparent'; };
        item.addEventListener('click', () => {
          const action = item.dataset.action;
          if (action === 'rename') renameFolder(index);
          else if (action === 'delete') deleteFolder(index);
          menu.remove();
        });
      });
      document.body.appendChild(menu);
      const closeMenu = (ev) => {
        if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('click', closeMenu); }
      };
      setTimeout(() => document.addEventListener('click', closeMenu), 0);
    };

    // === Backup/Restore ===
    const backupToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(JSON.stringify(folders));
        showToast('📋 클립보드에 복사되었습니다.');
      } catch (e) { showToast('⚠️ 클립보드 복사 실패'); }
    };

    const exportToFile = () => {
      try {
        const blob = new Blob([JSON.stringify(folders, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memoplus_backup_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('📥 파일이 다운로드되었습니다.');
      } catch (e) { showToast('⚠️ 내보내기 실패'); }
    };

    const importFromFile = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) throw new Error('Invalid format');
          const confirmed = await showConfirm('⚠️ 현재 메모를 모두 덮어쓰고\n파일에서 불러오시겠습니까?');
          if (confirmed) {
            folders = parsed;
            if (folders.length === 0) folders = [{ title: '기본 폴더', notes: [] }];
            activeFolderIndex = 0;
            activeTabIndex = 0;
            await saveData(false);
            await saveUIState();
            renderTabsAndContent();
            showToast('📤 복원 완료');
          }
        } catch (err) { showToast('⚠️ 유효하지 않은 백업 파일입니다.'); }
      };
      input.click();
    };

    const factoryReset = async () => {
      const confirmed = await showConfirm('🔥 모든 폴더와 메모를 삭제하고\n초기화하시겠습니까?');
      if (!confirmed) return;
      folders = [{ title: '기본 폴더', notes: [] }];
      activeFolderIndex = 0;
      activeTabIndex = 0;
      currentTheme = 'LATTE';
      hasUnsavedChanges = false;
      await saveData(false);
      await saveUIState();
      renderTabsAndContent();
      showToast('🔥 초기화 완료');
    };

    const showBackupMenu = () => {
      document.querySelectorAll('.mp-context-menu').forEach(m => m.remove());
      const t = T();
      const menu = document.createElement('div');
      menu.className = 'mp-context-menu';
      menu.style.position = 'absolute';
      menu.style.top = '44px';
      menu.style.right = '10px';
      menu.style.background = t.menuBg;
      menu.style.border = `1px solid ${t.border}`;
      menu.style.color = t.textSub;
      menu.innerHTML = `<ul>
        <li class="mp-context-item" data-action="clipboard">📋 클립보드로 백업</li>
        <li class="mp-context-item" data-action="export">📥 파일로 내보내기</li>
        <li class="mp-context-item" data-action="import">📤 파일로 불러오기</li>
        <li class="mp-context-item" data-action="reset" style="color:#ff6b6b;border-top:1px solid ${t.border};margin-top:4px;padding-top:8px;">🔥 완전 초기화</li>
      </ul>`;
      menu.querySelectorAll('.mp-context-item').forEach(item => {
        item.onmouseenter = () => { item.style.background = t.menuHover; };
        item.onmouseleave = () => { item.style.background = 'transparent'; };
        item.addEventListener('click', () => {
          const action = item.dataset.action;
          if (action === 'clipboard') backupToClipboard();
          else if (action === 'export') exportToFile();
          else if (action === 'import') importFromFile();
          else if (action === 'reset') factoryReset();
          menu.remove();
        });
      });
      const container = document.querySelector('.mp-container');
      if (container) container.appendChild(menu);
      const closeMenu = (ev) => {
        if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('click', closeMenu); }
      };
      setTimeout(() => document.addEventListener('click', closeMenu), 0);
    };

    // === Build Notepad UI in Iframe ===
    const buildNotepadUI = () => {
      document.body.innerHTML = '';
      const container = document.createElement('div');
      container.className = 'mp-container';
      container.innerHTML = `
        <div class="mp-header">
          <span class="mp-header-title">📝 MemoPlus</span>
          <div class="mp-header-buttons">
            <button class="mp-header-btn" id="mp-backup-btn" title="백업">💾</button>
            <button class="mp-header-btn" id="mp-close-btn" title="닫기">✕</button>
          </div>
        </div>
        <div class="mp-folders" id="mp-folders"></div>
        <div class="mp-tabs-container">
          <div class="mp-tabs-list" id="mp-tabs-list"></div>
          <button class="mp-new-tab-btn" id="mp-new-tab-btn" title="새 메모">+</button>
        </div>
        <div class="mp-editor" id="mp-editor"></div>
        <div class="mp-footer" id="mp-footer"></div>`;

      document.body.appendChild(container);

      document.getElementById('mp-close-btn').addEventListener('click', closeNotepad);
      document.getElementById('mp-new-tab-btn').addEventListener('click', createNewNote);
      document.getElementById('mp-backup-btn').addEventListener('click', (e) => { e.stopPropagation(); showBackupMenu(); });

      // 배경 클릭 시 닫기
      document.body.addEventListener('click', (e) => {
        if (e.target === document.body) closeNotepad();
      });

      // Ctrl+S 저장 단축키
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          saveCurrentNote(true);
        }
        if (e.key === 'Escape') closeNotepad();
      });

      renderTabsAndContent();
    };

    // === Open/Close Notepad ===
    const openNotepad = async () => {
      if (isNotepadOpen) return;
      isNotepadOpen = true;
      buildNotepadUI();
      await Risuai.showContainer('fullscreen');
    };

    const closeNotepad = async () => {
      if (!isNotepadOpen) return;
      if (hasUnsavedChanges) {
        const confirmed = await showConfirm('저장하지 않은 변경사항이 있습니다.\n그래도 닫으시겠습니까?');
        if (!confirmed) return;
      }
      isNotepadOpen = false;
      hasUnsavedChanges = false;
      await Risuai.hideContainer();
    };

    // === Root Document Widget (ScrollPlus coordinate-check pattern) ===
    const createWidget = async () => {
      const rootDoc = await Risuai.getRootDocument();
      const body = await rootDoc.querySelector('body');

      const existingWidget = await rootDoc.querySelector(`[${WIDGET_ATTR_KEY}="${WIDGET_ATTR_VAL}"]`);
      if (existingWidget) {
        await existingWidget.remove();
        widgetElement = null;
        btnRef = null;
        if (globalPointerMoveId) await body.removeEventListener('pointermove', globalPointerMoveId);
        if (globalPointerUpId) await body.removeEventListener('pointerup', globalPointerUpId);
        globalPointerMoveId = null;
        globalPointerUpId = null;
      }

      const t = T();
      const sz = SIZE_CONFIG[widgetSize] || SIZE_CONFIG.default;

      const container = await rootDoc.createElement('div');
      await container.setAttribute(WIDGET_ATTR_KEY, WIDGET_ATTR_VAL);

      await container.setStyleAttribute(`
        position: fixed;
        bottom: 100px;
        right: 20px;
        width: ${sz.container}px;
        height: auto;
        display: ${isWidgetVisible ? 'flex' : 'none'};
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: ${sz.gap}px;
        z-index: 9999;
        padding: ${sz.pad}px;
        border-radius: ${sz.radius}px;
        background-color: rgba(0, 0, 0, 0);
        user-select: none;
        -webkit-user-select: none;
        cursor: default;
        touch-action: none;
      `);

      // 드래그 핸들
      const dragHandle = await rootDoc.createElement('div');
      await dragHandle.setStyleAttribute(`
        width: ${sz.handle}px;
        height: ${sz.handleH}px;
        background-color: ${t.widgetHandle};
        border-radius: ${sz.handleH / 2}px;
        margin-bottom: 2px;
        flex-shrink: 0;
        pointer-events: none;
        transition: background-color 0.2s;
      `);

      // 메모 버튼
      const memoBtn = await rootDoc.createElement('div');
      await memoBtn.setStyleAttribute(`
        width: ${sz.btn}px;
        height: ${sz.btn}px;
        border-radius: 50%;
        border: 1px solid ${t.widgetBtnBorder};
        background: ${t.widgetBtnBg};
        color: ${t.widgetBtnColor};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${sz.icon}px;
        flex-shrink: 0;
        pointer-events: none;
        transition: background 0.2s;
      `);
      await memoBtn.setInnerHTML('📝');

      const handleRef_local = dragHandle;
      btnRef = memoBtn;
      widgetElement = container;

      await container.appendChild(dragHandle);
      await container.appendChild(memoBtn);

      // 저장된 위치 복원
      try {
        const savedPos = await Risuai.safeLocalStorage.getItem(SK_BTN_POS);
        if (savedPos) {
          const pos = JSON.parse(savedPos);
          if (pos.left !== undefined) {
            await container.setStyle('bottom', 'auto');
            await container.setStyle('right', 'auto');
            await container.setStyle('left', `${pos.left}px`);
            await container.setStyle('top', `${pos.top}px`);
          }
        }
      } catch (e) {}

      // 포인터 이벤트 (ScrollPlus 좌표 판별 패턴)
      await container.addEventListener('pointerdown', async (e) => {
        if (e.button !== 0 && e.button !== -1) return;
        const clientX = e.clientX;
        const clientY = e.clientY;
        if (clientX === undefined || clientY === undefined) return;

        pointerStartX = clientX;
        pointerStartY = clientY;
        pressedMemoBtn = false;

        // 드래그 핸들 좌표 체크
        const handleRect = await handleRef_local.getBoundingClientRect();
        const isInsideHandle =
          clientX >= handleRect.left &&
          clientX <= handleRect.right &&
          clientY >= handleRect.top &&
          clientY <= handleRect.bottom;

        if (isInsideHandle) {
          isDragging = true;
          const rect = await container.getBoundingClientRect();
          dragShiftX = clientX - rect.left;
          dragShiftY = clientY - rect.top;

          await handleRef_local.setStyle('backgroundColor', t.widgetHandleActive);

          if (globalPointerMoveId) await body.removeEventListener('pointermove', globalPointerMoveId);
          if (globalPointerUpId) await body.removeEventListener('pointerup', globalPointerUpId);

          globalPointerMoveId = await body.addEventListener('pointermove', async (ev) => {
            if (!isDragging || !widgetElement) return;
            if (ev.preventDefault) ev.preventDefault();
            const newX = ev.clientX - dragShiftX;
            const newY = ev.clientY - dragShiftY;
            await widgetElement.setStyle('bottom', 'auto');
            await widgetElement.setStyle('right', 'auto');
            await widgetElement.setStyle('left', `${newX}px`);
            await widgetElement.setStyle('top', `${newY}px`);
          });

          globalPointerUpId = await body.addEventListener('pointerup', async () => {
            if (isDragging) {
              isDragging = false;
              await handleRef_local.setStyle('backgroundColor', t.widgetHandle);
              try {
                const finalRect = await widgetElement.getBoundingClientRect();
                await Risuai.safeLocalStorage.setItem(SK_BTN_POS, JSON.stringify({
                  left: finalRect.left,
                  top: finalRect.top
                }));
              } catch (e) {}
            }
            if (globalPointerMoveId) await body.removeEventListener('pointermove', globalPointerMoveId);
            if (globalPointerUpId) await body.removeEventListener('pointerup', globalPointerUpId);
            globalPointerMoveId = null;
            globalPointerUpId = null;
          });
          return;
        }

        // 메모 버튼 좌표 체크
        if (btnRef) {
          const btnRect = await btnRef.getBoundingClientRect();
          if (clientX >= btnRect.left && clientX <= btnRect.right &&
              clientY >= btnRect.top && clientY <= btnRect.bottom) {
            pressedMemoBtn = true;
          }
        }
      });

      await container.addEventListener('pointerup', async (e) => {
        if (isDragging) return;

        if (pressedMemoBtn) {
          pressedMemoBtn = false;
          if (isNotepadOpen) await closeNotepad();
          else await showQuickMemo();
        }
      });

      await container.addEventListener('pointerleave', async () => {
        pressedMemoBtn = false;
      });

      await body.appendChild(container);
    };

    // === Toggle Widget Visibility ===
    const toggleWidget = async (forceShow = false) => {
      if (!forceShow) {
        isWidgetVisible = !isWidgetVisible;
      }
      // 위젯 재생성 (크기/테마 변경 반영)
      await createWidget();
    };

    // === Quick Memo Content Save ===
    const saveQuickMemoContent = async () => {
      if (!quickMemoEditor) return;
      try {
        const currentNotes = folders[activeFolderIndex]?.notes;
        if (currentNotes && currentNotes[activeTabIndex]) {
          currentNotes[activeTabIndex].content = qmBuffer || '';
          await saveData(false);
        }
      } catch (e) {}
    };

    // === Iframe Overlay Editor (네이티브 textarea 편집) ===
    const openQuickEdit = async () => {
      if (isQuickEditOpen || isNotepadOpen) return;
      isQuickEditOpen = true;

      // 패널 위치/크기 가져오기
      let panelRect = { left: 0, top: 0, width: 300, height: 400 };
      if (quickMemoPanel) {
        try {
          const r = await quickMemoPanel.getBoundingClientRect();
          panelRect = { left: r.left, top: r.top, width: r.width, height: r.height };
        } catch(e) {}
      }

      // rootDocument 패널 숨기기 (iframe보다 항상 위에 렌더링되므로)
      if (quickMemoPanel) {
        try { await quickMemoPanel.setStyle('visibility', 'hidden'); } catch(e) {}
      }

      const t = T();
      const isMidnight = currentTheme === 'MIDNIGHT';
      const bgColor = t.bgMain;
      const txtColor = t.textMain;
      const borderColor = isMidnight ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)';
      const accentColor = t.accent;
      const subColor = t.textSub;
      const btnBg = t.btnBg;

      // 현재 노트 정보
      const currentNotes = folders[activeFolderIndex]?.notes || [];
      const noteObj = currentNotes[activeTabIndex] || { title: '새 메모', content: '' };
      const escH = (s) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const titleDisplay = `${escH(noteObj.title || '새 메모')} · ${activeTabIndex + 1}/${currentNotes.length}`;

      document.body.innerHTML = '';
      document.body.style.cssText = 'margin:0;padding:0;background:transparent;overflow:hidden;';

      // 배경 오버레이 (클릭 시 닫기)
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position:fixed;top:0;left:0;width:100%;height:100%;
        background:transparent;z-index:1;
      `;

      // 패널 복제 컨테이너 (rootDocument 패널과 동일한 위치/디자인)
      const panelClone = document.createElement('div');
      panelClone.style.cssText = `
        position:fixed;
        left:${panelRect.left}px;top:${panelRect.top}px;
        width:${panelRect.width}px;height:${panelRect.height}px;
        background:${bgColor};border:1px solid ${borderColor};
        border-radius:16px;
        box-shadow:0 20px 50px rgba(0,0,0,0.25),0 0 0 1px rgba(255,255,255,0.04);
        display:flex;flex-direction:column;
        z-index:2;overflow:hidden;
        font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
      `;

      // 헤더 (시각적 복제)
      const headerEl = document.createElement('div');
      headerEl.style.cssText = `
        padding:14px 16px;display:flex;align-items:center;
        justify-content:space-between;border-bottom:1px solid ${borderColor};
        flex-shrink:0;cursor:default;
      `;
      headerEl.innerHTML = `
        <span style="font-size:14px;font-weight:700;color:${txtColor};letter-spacing:-0.3px;">📝 Quick Memo</span>
        <div style="display:flex;gap:6px;">
          <div style="width:28px;height:28px;border-radius:8px;background:${btnBg};color:${subColor};display:flex;align-items:center;justify-content:center;font-size:14px;">⤢</div>
          <div id="qe-close" style="width:28px;height:28px;border-radius:8px;background:${btnBg};color:${subColor};display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;">✕</div>
        </div>
      `;

      // 네비게이션 (제목 편집 가능)
      const navEl = document.createElement('div');
      navEl.style.cssText = `
        padding:8px 16px;display:flex;align-items:center;
        gap:8px;border-bottom:1px solid ${borderColor};
        flex-shrink:0;
      `;

      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.value = noteObj.title || '새 메모';
      titleInput.placeholder = '메모 이름';
      titleInput.style.cssText = `
        font-size:12px;color:${txtColor};font-weight:500;
        flex:1;text-align:center;min-width:0;
        background:transparent;border:1px solid transparent;border-radius:6px;
        outline:none;padding:3px 6px;
        font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
        transition:border-color 0.2s;
      `;
      titleInput.addEventListener('focus', () => { titleInput.style.borderColor = accentColor; });
      titleInput.addEventListener('blur', () => { titleInput.style.borderColor = 'transparent'; });

      const countLabel = document.createElement('span');
      countLabel.style.cssText = `font-size:11px;color:${subColor};flex-shrink:0;opacity:0.7;`;
      countLabel.textContent = `${activeTabIndex + 1}/${currentNotes.length}`;

      navEl.appendChild(titleInput);
      navEl.appendChild(countLabel);

      // 에디터 영역 (네이티브 textarea)
      const editorArea = document.createElement('div');
      editorArea.style.cssText = 'flex:1;display:flex;flex-direction:column;min-height:0;overflow:hidden;';

      const textarea = document.createElement('textarea');
      textarea.value = qmBuffer || '';
      textarea.placeholder = '여기에 메모를 입력하세요...';
      textarea.style.cssText = `
        width:100%;flex:1;box-sizing:border-box;
        padding:12px 16px;margin:0;border:none;outline:none;
        background:transparent;color:${txtColor};
        font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
        font-size:13px;line-height:1.7;resize:none;
        white-space:pre-wrap;word-break:break-word;
      `;

      editorArea.appendChild(textarea);

      // 풋터 (힌트 + 완료 버튼)
      const footerEl = document.createElement('div');
      footerEl.style.cssText = `
        padding:8px 16px;font-size:11px;color:${subColor};
        font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
        display:flex;justify-content:space-between;align-items:center;
        border-top:1px solid ${borderColor};flex-shrink:0;
      `;
      footerEl.innerHTML = `
        <span style="opacity:0.7;">Esc · 바깥 클릭</span>
        <span id="qe-done" style="color:${accentColor};font-weight:600;cursor:pointer;padding:4px 12px;border-radius:8px;background:${btnBg};">✓ 완료</span>
      `;

      panelClone.appendChild(headerEl);
      panelClone.appendChild(navEl);
      panelClone.appendChild(editorArea);
      panelClone.appendChild(footerEl);
      document.body.appendChild(overlay);
      document.body.appendChild(panelClone);

      await Risuai.showContainer('fullscreen');
      textarea.focus();

      // 닫기 & 저장
      const closeQuickEdit = async () => {
        if (!isQuickEditOpen) return;
        qmBuffer = textarea.value;

        // 제목 저장
        const newTitle = titleInput.value.trim();
        if (newTitle) {
          const currentNotes2 = folders[activeFolderIndex]?.notes;
          if (currentNotes2 && currentNotes2[activeTabIndex]) {
            currentNotes2[activeTabIndex].title = newTitle;
          }
        }

        await saveQuickMemoContent();
        isQuickEditOpen = false;
        document.body.innerHTML = '';
        await Risuai.hideContainer();

        // rootDocument 패널 다시 보이기 + 에디터/제목 업데이트
        if (quickMemoPanel) {
          try { await quickMemoPanel.setStyle('visibility', 'visible'); } catch(e) {}
        }
        if (quickMemoEditor) {
          try {
            const tm = T();
            if (qmBuffer) {
              await quickMemoEditor.setStyle('color', tm.textMain);
              await quickMemoEditor.setTextContent(qmBuffer);
            } else {
              await quickMemoEditor.setStyle('color', tm.textSub);
              await quickMemoEditor.setTextContent('여기를 클릭하고 입력하세요...');
            }
          } catch(e) {}
        }
        // noteTitle 업데이트
        if (quickMemoTitle) {
          try {
            const notes = folders[activeFolderIndex].notes;
            const st = (notes[activeTabIndex].title || '새 메모').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            await quickMemoTitle.setInnerHTML(`${st} · ${activeTabIndex + 1}/${notes.length}`);
          } catch(e) {}
        }
      };

      overlay.addEventListener('click', closeQuickEdit);
      document.getElementById('qe-done')?.addEventListener('click', closeQuickEdit);
      document.getElementById('qe-close')?.addEventListener('click', closeQuickEdit);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeQuickEdit();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          qmBuffer = textarea.value;
          saveQuickMemoContent();
        }
      });
    };

    // === Quick Memo Widget (rootDocument, iframe overlay editor) ===
    const showQuickMemo = async () => {
      const rootDoc = await Risuai.getRootDocument();
      const body = await rootDoc.querySelector('body');

      // 토글: 이미 열려있으면 저장 후 닫기
      const existing = await rootDoc.querySelector(`[${QUICKMEMO_ATTR_KEY}]`);
      if (existing) {
        await saveQuickMemoContent();
        await existing.remove();
        quickMemoPanel = null;
        quickMemoEditor = null;
        quickMemoTitle = null;
        return;
      }

      // 최소 1개 폴더 + 1개 메모 보장
      if (!folders.length) {
        folders = [{ title: '기본 폴더', notes: [{ title: '새 메모', content: '' }] }];
        activeFolderIndex = 0;
        activeTabIndex = 0;
        await saveData(false);
      }
      if (activeFolderIndex >= folders.length) activeFolderIndex = 0;
      if (!folders[activeFolderIndex].notes?.length) {
        folders[activeFolderIndex].notes = [{ title: '새 메모', content: '' }];
        activeTabIndex = 0;
        await saveData(false);
      }

      const t = T();
      const currentNotes = folders[activeFolderIndex].notes;
      if (activeTabIndex >= currentNotes.length) activeTabIndex = 0;
      const note = currentNotes[activeTabIndex];

      // 패널
      const panel = await rootDoc.createElement('div');
      await panel.setAttribute(QUICKMEMO_ATTR_KEY, 'panel');
      await panel.setStyleAttribute(`
        position: fixed; bottom: 80px; right: 80px;
        width: 300px; height: 400px;
        background: ${t.bgMain}; border: 1px solid ${t.border};
        border-radius: 16px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04);
        display: flex; flex-direction: column;
        z-index: 9998; overflow: hidden;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      `);

      // === 헤더 ===
      const header = await rootDoc.createElement('div');
      await header.setStyleAttribute(`
        padding: 14px 16px; display: flex; align-items: center;
        justify-content: space-between; border-bottom: 1px solid ${t.border};
        pointer-events: none; flex-shrink: 0; cursor: grab;
      `);
      const headerTitle = await rootDoc.createElement('span');
      await headerTitle.setStyleAttribute(`font-size: 14px; font-weight: 700; color: ${t.textMain}; pointer-events: none; letter-spacing: -0.3px;`);
      await headerTitle.setInnerHTML('📝 Quick Memo');

      const headerBtns = await rootDoc.createElement('div');
      await headerBtns.setStyleAttribute('display: flex; gap: 6px; pointer-events: none;');

      const expandBtn = await rootDoc.createElement('div');
      await expandBtn.setStyleAttribute(`
        width: 28px; height: 28px; border-radius: 8px;
        background: ${t.btnBg}; color: ${t.textSub};
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; pointer-events: none;
      `);
      await expandBtn.setInnerHTML('⤢');

      const closeBtn = await rootDoc.createElement('div');
      await closeBtn.setStyleAttribute(`
        width: 28px; height: 28px; border-radius: 8px;
        background: ${t.btnBg}; color: ${t.textSub};
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; pointer-events: none;
      `);
      await closeBtn.setInnerHTML('✕');

      await headerBtns.appendChild(expandBtn);
      await headerBtns.appendChild(closeBtn);
      await header.appendChild(headerTitle);
      await header.appendChild(headerBtns);
      await panel.appendChild(header);

      // === 노트 네비게이션 ===
      const nav = await rootDoc.createElement('div');
      await nav.setStyleAttribute(`
        padding: 8px 16px; display: flex; align-items: center;
        gap: 8px; border-bottom: 1px solid ${t.border};
        pointer-events: none; flex-shrink: 0;
      `);

      const prevBtn = await rootDoc.createElement('div');
      await prevBtn.setStyleAttribute(`
        width: 24px; height: 24px; border-radius: 6px;
        background: ${t.btnBg}; color: ${t.textSub};
        display: flex; align-items: center; justify-content: center;
        font-size: 10px; pointer-events: none; flex-shrink: 0;
      `);
      await prevBtn.setInnerHTML('◀');

      const noteTitle = await rootDoc.createElement('span');
      quickMemoTitle = noteTitle;
      await noteTitle.setStyleAttribute(`
        font-size: 12px; color: ${t.textSub}; font-weight: 500;
        flex: 1; text-align: center;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        pointer-events: none;
      `);
      const safeTitleText = (note.title || '새 메모').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      await noteTitle.setInnerHTML(`${safeTitleText} · ${activeTabIndex + 1}/${currentNotes.length}`);

      const nextBtn = await rootDoc.createElement('div');
      await nextBtn.setStyleAttribute(`
        width: 24px; height: 24px; border-radius: 6px;
        background: ${t.btnBg}; color: ${t.textSub};
        display: flex; align-items: center; justify-content: center;
        font-size: 10px; pointer-events: none; flex-shrink: 0;
      `);
      await nextBtn.setInnerHTML('▶');

      const newNoteBtn = await rootDoc.createElement('div');
      await newNoteBtn.setStyleAttribute(`
        width: 24px; height: 24px; border-radius: 6px;
        background: ${t.btnBg}; color: ${t.accent};
        display: flex; align-items: center; justify-content: center;
        font-size: 16px; font-weight: bold; pointer-events: none; flex-shrink: 0;
      `);
      await newNoteBtn.setInnerHTML('+');

      await nav.appendChild(prevBtn);
      await nav.appendChild(noteTitle);
      await nav.appendChild(nextBtn);
      await nav.appendChild(newNoteBtn);
      await panel.appendChild(nav);

      // === 에디터 (읽기 전용 표시 + 클릭 시 iframe overlay) ===
      const editorWrapper = await rootDoc.createElement('div');
      await editorWrapper.setStyleAttribute(`flex: 1; padding: 0; overflow-y: auto; overflow-x: hidden; display: flex; min-height: 0; pointer-events: auto; cursor: text; -webkit-overflow-scrolling: touch;`);

      const editorEl = await rootDoc.createElement('div');
      await editorEl.setStyleAttribute(`
        width: 100%; outline: none; white-space: pre-wrap;
        font-size: 13px; line-height: 1.7; color: ${t.textMain};
        word-break: break-word; padding: 12px 16px;
        background: transparent; border: none;
        text-align: left; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        pointer-events: none;
      `);

      qmBuffer = note.content || '';
      if (qmBuffer) {
        await editorEl.setTextContent(qmBuffer);
      } else {
        await editorEl.setStyle('color', t.textSub);
        await editorEl.setTextContent('여기를 클릭하고 입력하세요...');
      }
      quickMemoEditor = editorEl;

      const setEditorContent = async (text) => {
        qmBuffer = text || '';
        try {
          if (qmBuffer) {
            await editorEl.setStyle('color', t.textMain);
            await editorEl.setTextContent(qmBuffer);
          } else {
            await editorEl.setStyle('color', t.textSub);
            await editorEl.setTextContent('여기를 클릭하고 입력하세요...');
          }
        } catch(e) {}
      };

      await editorWrapper.appendChild(editorEl);
      await panel.appendChild(editorWrapper);

      // === 풋터 ===
      const footer = await rootDoc.createElement('div');
      await footer.setStyleAttribute(`
        padding: 10px 16px; border-top: 1px solid ${t.border};
        display: flex; justify-content: center; gap: 8px;
        pointer-events: none; flex-shrink: 0;
      `);

      const saveBtn = await rootDoc.createElement('div');
      await saveBtn.setStyleAttribute(`
        padding: 7px 28px; border-radius: 10px; font-size: 12px; font-weight: 600;
        background: ${t.accent}; color: white; text-align: center;
        letter-spacing: -0.2px; pointer-events: none;
      `);
      await saveBtn.setInnerHTML('💾 저장');
      await footer.appendChild(saveBtn);
      await panel.appendChild(footer);

      // === 리사이즈 그립 (우하단 표시) ===
      const resizeGrip = await rootDoc.createElement('div');
      await resizeGrip.setStyleAttribute(`
        position: absolute; bottom: 3px; right: 5px;
        font-size: 10px; line-height: 1; color: ${t.textSub};
        opacity: 0.35; pointer-events: none; user-select: none;
      `);
      await resizeGrip.setInnerHTML('◢');
      await panel.appendChild(resizeGrip);

      await body.appendChild(panel);
      quickMemoPanel = panel;

      // 저장된 패널 위치 복원
      try {
        const savedQmPos = await Risuai.safeLocalStorage.getItem(SK_QM_POS);
        if (savedQmPos) {
          const qmPos = JSON.parse(savedQmPos);
          if (qmPos.left !== undefined) {
            await panel.setStyle('bottom', 'auto');
            await panel.setStyle('right', 'auto');
            await panel.setStyle('left', `${qmPos.left}px`);
            await panel.setStyle('top', `${qmPos.top}px`);
          }
        }
      } catch (e) {}

      // 저장된 패널 크기 복원
      try {
        const savedQmSize = await Risuai.safeLocalStorage.getItem(SK_QM_SIZE);
        if (savedQmSize) {
          const qmSize = JSON.parse(savedQmSize);
          if (qmSize.width) await panel.setStyle('width', `${qmSize.width}px`);
          if (qmSize.height) await panel.setStyle('height', `${qmSize.height}px`);
        }
      } catch (e) {}

      // === 패널 드래그 & 리사이즈 ===
      const QM_CORNER = 18;
      const QM_MIN_W = 240, QM_MAX_W = 600;
      const QM_MIN_H = 280, QM_MAX_H = 800;

      await panel.addEventListener('pointerdown', async (e) => {
        if (e.button !== 0 && e.button !== -1) return;
        const cx = e.clientX, cy = e.clientY;
        if (cx === undefined || cy === undefined) return;

        const pRect = await panel.getBoundingClientRect();

        // 패널 내부 클릭인지 먼저 확인 (ScrollPlus 바운드 체크 패턴)
        const inPanel = cx >= pRect.left && cx <= pRect.right && cy >= pRect.top && cy <= pRect.bottom;
        if (!inPanel) return;

        // === 우측 하단 모서리 리사이즈 감지 ===
        const distB = pRect.bottom - cy;
        const distR = pRect.right - cx;
        const nearSE = distB >= 0 && distB < QM_CORNER && distR >= 0 && distR < QM_CORNER;

        if (nearSE) {
          qmResizing = true;
          qmResizeStartX = cx;
          qmResizeStartY = cy;
          qmResizeStartRect = { left: pRect.left, top: pRect.top, width: pRect.width, height: pRect.height };

          // 외부 텍스트 선택 방지
          await body.setStyle('userSelect', 'none');
          await body.setStyle('-webkit-user-select', 'none');

          if (qmPointerMoveId) await body.removeEventListener('pointermove', qmPointerMoveId);
          if (qmPointerUpId) await body.removeEventListener('pointerup', qmPointerUpId);

          qmPointerMoveId = await body.addEventListener('pointermove', async (ev) => {
            if (!qmResizing || !quickMemoPanel) return;
            if (ev.preventDefault) ev.preventDefault();
            const dx = ev.clientX - qmResizeStartX;
            const dy = ev.clientY - qmResizeStartY;
            const sr = qmResizeStartRect;

            const newW = Math.max(QM_MIN_W, Math.min(QM_MAX_W, sr.width + dx));
            const newH = Math.max(QM_MIN_H, Math.min(QM_MAX_H, sr.height + dy));

            await quickMemoPanel.setStyle('width', `${newW}px`);
            await quickMemoPanel.setStyle('height', `${newH}px`);
          });

          qmPointerUpId = await body.addEventListener('pointerup', async () => {
            if (qmResizing) {
              qmResizing = false;
              qmJustDragged = true;
              setTimeout(() => { qmJustDragged = false; }, 200);
              try {
                const finalRect = await quickMemoPanel.getBoundingClientRect();
                await Risuai.safeLocalStorage.setItem(SK_QM_SIZE, JSON.stringify({
                  width: finalRect.width, height: finalRect.height
                }));
              } catch (e) {}
            }
            // 텍스트 선택 복원
            await body.setStyle('userSelect', '');
            await body.setStyle('-webkit-user-select', '');
            if (qmPointerMoveId) await body.removeEventListener('pointermove', qmPointerMoveId);
            if (qmPointerUpId) await body.removeEventListener('pointerup', qmPointerUpId);
            qmPointerMoveId = null;
            qmPointerUpId = null;
          });

          return;
        }

        // === 헤더 드래그 ===
        const hRect = await header.getBoundingClientRect();
        const inHeader = cx >= hRect.left && cx <= hRect.right && cy >= hRect.top && cy <= hRect.bottom;
        if (!inHeader) return;

        const eRect = await expandBtn.getBoundingClientRect();
        const cRect = await closeBtn.getBoundingClientRect();
        const inExpand = cx >= eRect.left && cx <= eRect.right && cy >= eRect.top && cy <= eRect.bottom;
        const inClose = cx >= cRect.left && cx <= cRect.right && cy >= cRect.top && cy <= cRect.bottom;
        if (inExpand || inClose) return;

        qmDragging = true;
        qmDragShiftX = cx - pRect.left;
        qmDragShiftY = cy - pRect.top;

        // 외부 텍스트 선택 방지
        await body.setStyle('userSelect', 'none');
        await body.setStyle('-webkit-user-select', 'none');

        if (qmPointerMoveId) await body.removeEventListener('pointermove', qmPointerMoveId);
        if (qmPointerUpId) await body.removeEventListener('pointerup', qmPointerUpId);

        qmPointerMoveId = await body.addEventListener('pointermove', async (ev) => {
          if (!qmDragging || !quickMemoPanel) return;
          if (ev.preventDefault) ev.preventDefault();
          const newX = ev.clientX - qmDragShiftX;
          const newY = ev.clientY - qmDragShiftY;
          await quickMemoPanel.setStyle('bottom', 'auto');
          await quickMemoPanel.setStyle('right', 'auto');
          await quickMemoPanel.setStyle('left', `${newX}px`);
          await quickMemoPanel.setStyle('top', `${newY}px`);
        });

        qmPointerUpId = await body.addEventListener('pointerup', async () => {
          if (qmDragging) {
            qmDragging = false;
            qmJustDragged = true;
            setTimeout(() => { qmJustDragged = false; }, 200);
            try {
              const finalRect = await quickMemoPanel.getBoundingClientRect();
              await Risuai.safeLocalStorage.setItem(SK_QM_POS, JSON.stringify({
                left: finalRect.left, top: finalRect.top
              }));
            } catch (e) {}
          }
          // 텍스트 선택 복원
          await body.setStyle('userSelect', '');
          await body.setStyle('-webkit-user-select', '');
          if (qmPointerMoveId) await body.removeEventListener('pointermove', qmPointerMoveId);
          if (qmPointerUpId) await body.removeEventListener('pointerup', qmPointerUpId);
          qmPointerMoveId = null;
          qmPointerUpId = null;
        });
      });

      // === 노트 표시 업데이트 헬퍼 ===
      const updateNoteDisplay = async () => {
        const notes = folders[activeFolderIndex].notes;
        const n = notes[activeTabIndex];
        const st = (n.title || '새 메모').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        await noteTitle.setInnerHTML(`${st} · ${activeTabIndex + 1}/${notes.length}`);
      };

      // === 좌표 기반 클릭 핸들링 ===
      await panel.addEventListener('click', async (e) => {
        if (qmJustDragged || qmDragging || qmResizing) return;
        const cx = e.clientX;
        const cy = e.clientY;
        if (cx === undefined || cy === undefined) return;

        const inR = (r) => cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;

        // 닫기
        const cRect = await closeBtn.getBoundingClientRect();
        if (inR(cRect)) {
          await saveQuickMemoContent();
          await panel.remove();
          quickMemoPanel = null;
          quickMemoEditor = null;
          quickMemoTitle = null;
          return;
        }

        // 확장 (전체 메모장 열기)
        const eRect = await expandBtn.getBoundingClientRect();
        if (inR(eRect)) {
          await saveQuickMemoContent();
          await panel.remove();
          quickMemoPanel = null;
          quickMemoEditor = null;
          quickMemoTitle = null;
          await openNotepad();
          return;
        }

        // 이전 메모
        const pRect = await prevBtn.getBoundingClientRect();
        if (inR(pRect)) {
          const notes = folders[activeFolderIndex].notes;
          if (notes.length > 1) {
            await saveQuickMemoContent();
            activeTabIndex = (activeTabIndex - 1 + notes.length) % notes.length;
            await saveUIState();
            await setEditorContent(notes[activeTabIndex].content);
            await updateNoteDisplay();
          }
          return;
        }

        // 다음 메모
        const nRect = await nextBtn.getBoundingClientRect();
        if (inR(nRect)) {
          const notes = folders[activeFolderIndex].notes;
          if (notes.length > 1) {
            await saveQuickMemoContent();
            activeTabIndex = (activeTabIndex + 1) % notes.length;
            await saveUIState();
            await setEditorContent(notes[activeTabIndex].content);
            await updateNoteDisplay();
          }
          return;
        }

        // 새 메모
        const nnRect = await newNoteBtn.getBoundingClientRect();
        if (inR(nnRect)) {
          await saveQuickMemoContent();
          folders[activeFolderIndex].notes.push({ title: '새 메모', content: '' });
          activeTabIndex = folders[activeFolderIndex].notes.length - 1;
          await saveData(false);
          await saveUIState();
          await setEditorContent('');
          await updateNoteDisplay();
          return;
        }

        // 저장
        const sRect = await saveBtn.getBoundingClientRect();
        if (inR(sRect)) {
          await saveQuickMemoContent();
          await saveBtn.setInnerHTML('✓ 저장됨');
          setTimeout(async () => {
            try { await saveBtn.setInnerHTML('💾 저장'); } catch(e) {}
          }, 1500);
          return;
        }

        // 노트 제목 또는 에디터 영역 클릭 → iframe overlay 열기
        const ntRect = await noteTitle.getBoundingClientRect();
        const edRect = await editorWrapper.getBoundingClientRect();
        if (inR(ntRect) || inR(edRect)) {
          await openQuickEdit();
          return;
        }
      });
    };

    // === Settings Panel (ScrollPlus pattern, rootDocument) ===
    const showSettingsPanel = async () => {
      const rootDoc = await Risuai.getRootDocument();
      const body = await rootDoc.querySelector('body');

      const existing = await rootDoc.querySelector(`[${SETTINGS_ATTR_KEY}]`);
      if (existing) {
        await existing.remove();
        return;
      }

      const themeDisplayMap = {
        'MIDNIGHT': { label: 'Midnight', bg: 'rgba(6,182,212,0.3)' },
        'LATTE': { label: 'Latte', bg: 'rgba(5,150,105,0.3)' },
      };
      const sizeDisplayMap = {
        'small':   { label: '작게', bg: 'rgba(255,152,0,0.3)' },
        'default': { label: '기본', bg: 'rgba(76,175,80,0.3)' },
        'large':   { label: '크게', bg: 'rgba(33,150,243,0.3)' },
      };
      let currentThemeSetting = currentTheme;
      let currentSizeSetting = widgetSize;
      // 오버레이
      const overlay = await rootDoc.createElement('div');
      await overlay.setAttribute(SETTINGS_ATTR_KEY, 'panel');
      await overlay.setStyleAttribute(`
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
        z-index: 99999; touch-action: none;
      `);

      // 패널
      const panel = await rootDoc.createElement('div');
      await panel.setStyleAttribute(`
        background: #2a2a2a; border-radius: 16px; padding: 24px;
        min-width: 280px; max-width: 340px; color: #fff;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      `);

      // 타이틀
      const title = await rootDoc.createElement('div');
      await title.setStyleAttribute(`font-size: 18px; font-weight: 600; margin-bottom: 16px; text-align: center;`);
      await title.setInnerHTML('📝 MemoPlus 설정');
      await panel.appendChild(title);

      // 버전 & 패치 내역 버튼
      const versionBtn = await rootDoc.createElement('div');
      await versionBtn.setStyleAttribute(`
        font-size: 11px; color: #888; text-align: center; margin-bottom: 16px;
        cursor: pointer; pointer-events: none; transition: color 0.2s;
      `);
      await versionBtn.setInnerHTML('v1.0.0 · 패치 내역 보기');
      await panel.appendChild(versionBtn);

      // --- 헬퍼: 설정 행 만들기 ---
      const createRow = async (labelText, valueText, valueBg, mb = '12px') => {
        const row = await rootDoc.createElement('div');
        await row.setStyleAttribute(`
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: ${mb}; padding: 12px 14px; background: rgba(255,255,255,0.08);
          border-radius: 10px; pointer-events: none;
        `);
        const label = await rootDoc.createElement('span');
        await label.setStyleAttribute(`font-size: 14px; color: #ccc; pointer-events: none;`);
        await label.setInnerHTML(labelText);
        const toggle = await rootDoc.createElement('div');
        await toggle.setStyleAttribute(`
          padding: 6px 16px; border-radius: 8px; font-size: 13px; font-weight: 500;
          background: ${valueBg}; color: #fff; border: 1px solid rgba(255,255,255,0.15);
          pointer-events: none;
        `);
        await toggle.setInnerHTML(valueText);
        await row.appendChild(label);
        await row.appendChild(toggle);
        return { row, toggle };
      };

      // 테마 행
      const themeDisplay = themeDisplayMap[currentThemeSetting];
      const { row: themeRow, toggle: themeToggle } = await createRow(
        '메모장 테마', themeDisplay.label, themeDisplay.bg
      );
      await panel.appendChild(themeRow);

      // 위젯 크기 행
      const sizeDisplay = sizeDisplayMap[currentSizeSetting];
      const { row: sizeRow, toggle: sizeToggle } = await createRow(
        '위젯 크기', sizeDisplay.label, sizeDisplay.bg
      );
      await panel.appendChild(sizeRow);

      // 항상 보이기 행
      let currentAlwaysShow = alwaysShow;
      const { row: alwaysRow, toggle: alwaysToggle } = await createRow(
        '항상 보이기', currentAlwaysShow ? 'ON' : 'OFF',
        currentAlwaysShow ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)', '20px'
      );
      await panel.appendChild(alwaysRow);

      // 닫기 버튼
      const closeBtn = await rootDoc.createElement('div');
      await closeBtn.setStyleAttribute(`
        text-align: center; padding: 10px; border-radius: 10px;
        background: rgba(255,255,255,0.1); color: #aaa; font-size: 14px;
        pointer-events: none;
      `);
      await closeBtn.setInnerHTML('닫기');
      await panel.appendChild(closeBtn);

      // 패치 내역 오버레이
      const patchOverlay = await rootDoc.createElement('div');
      await patchOverlay.setStyleAttribute(`
        display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.6); z-index: 100000;
        justify-content: center; align-items: center; touch-action: none;
      `);
      const patchCard = await rootDoc.createElement('div');
      await patchCard.setStyleAttribute(`
        background: #1e1e1e; border: 1px solid #333; border-radius: 12px;
        width: 90%; max-width: 340px; max-height: 60vh; display: flex;
        flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      `);
      const patchHeader = await rootDoc.createElement('div');
      await patchHeader.setStyleAttribute(`
        padding: 14px 18px; border-bottom: 1px solid #333;
        display: flex; justify-content: space-between; align-items: center;
      `);
      const patchTitle = await rootDoc.createElement('span');
      await patchTitle.setStyleAttribute(`font-size: 14px; color: #e0e0e0; font-weight: 600;`);
      await patchTitle.setInnerHTML('📝 패치 내역');
      const patchCloseBtn = await rootDoc.createElement('span');
      await patchCloseBtn.setStyleAttribute(`color: #888; font-size: 16px; pointer-events: none; cursor: pointer; padding: 2px 6px;`);
      await patchCloseBtn.setInnerHTML('✕');
      await patchHeader.appendChild(patchTitle);
      await patchHeader.appendChild(patchCloseBtn);
      await patchCard.appendChild(patchHeader);
      const patchBody = await rootDoc.createElement('div');
      await patchBody.setStyleAttribute(`
        padding: 16px 18px; overflow-y: auto; font-size: 12px; color: #ccc; line-height: 1.7;
      `);
      await patchBody.setInnerHTML(`
        <div style="color:#06b6d4; font-weight:600; margin-bottom:6px;">v1.0.0</div>
        <ul style="margin:0 0 12px 0; padding-left:18px;">
          <li>MemoPlus 최초 릴리즈</li>
          <li>퀵 메모 기반 메모 관리</li>
          <li>Midnight / Latte 테마 지원</li>
          <li>위젯 크기 3단계 (작게 / 기본 / 크게)</li>
          <li>백업 & 복원 (클립보드 / 파일)</li>
          <li>자동 업데이트 및 패치 내역 확인 기능</li>
        </ul>
        <div style="color:#888; font-size:11px;">자세한 설명은 아카챈 참고</div>
      `);
      await patchCard.appendChild(patchBody);
      await patchOverlay.appendChild(patchCard);
      await body.appendChild(patchOverlay);

      await overlay.appendChild(panel);
      await body.appendChild(overlay);

      // 좌표 기반 클릭 핸들링 (ScrollPlus 패턴)
      await overlay.addEventListener('click', async (e) => {
        const cx = e.clientX;
        const cy = e.clientY;
        if (cx === undefined || cy === undefined) return;

        // 테마 토글
        const themeRect = await themeRow.getBoundingClientRect();
        if (cx >= themeRect.left && cx <= themeRect.right && cy >= themeRect.top && cy <= themeRect.bottom) {
          const themeOrder = Object.keys(THEMES);
          const idx = themeOrder.indexOf(currentThemeSetting);
          currentThemeSetting = themeOrder[(idx + 1) % themeOrder.length];
          currentTheme = currentThemeSetting;
          await Risuai.safeLocalStorage.setItem(SK_THEME, currentTheme);
          const d = themeDisplayMap[currentThemeSetting];
          await themeToggle.setInnerHTML(d.label);
          await themeToggle.setStyle('background', d.bg);
          await toggleWidget(true);
          return;
        }

        // 크기 토글
        const sizeRect = await sizeRow.getBoundingClientRect();
        if (cx >= sizeRect.left && cx <= sizeRect.right && cy >= sizeRect.top && cy <= sizeRect.bottom) {
          const sizeOrder = Object.keys(SIZE_CONFIG);
          const idx = sizeOrder.indexOf(currentSizeSetting);
          currentSizeSetting = sizeOrder[(idx + 1) % sizeOrder.length];
          widgetSize = currentSizeSetting;
          await Risuai.safeLocalStorage.setItem(SK_WIDGET_SIZE, widgetSize);
          const d = sizeDisplayMap[currentSizeSetting];
          await sizeToggle.setInnerHTML(d.label);
          await sizeToggle.setStyle('background', d.bg);
          await toggleWidget(true);
          return;
        }

        // 항상 보이기 토글
        const alwaysRect = await alwaysRow.getBoundingClientRect();
        if (cx >= alwaysRect.left && cx <= alwaysRect.right && cy >= alwaysRect.top && cy <= alwaysRect.bottom) {
          currentAlwaysShow = !currentAlwaysShow;
          alwaysShow = currentAlwaysShow;
          await Risuai.safeLocalStorage.setItem(SK_ALWAYS_SHOW, alwaysShow ? 'true' : 'false');
          await alwaysToggle.setInnerHTML(currentAlwaysShow ? 'ON' : 'OFF');
          await alwaysToggle.setStyle('background', currentAlwaysShow ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)');
          if (currentAlwaysShow && !isWidgetVisible) {
            isWidgetVisible = true;
            await createWidget();
          }
          return;
        }

        // 닫기
        const closeRect = await closeBtn.getBoundingClientRect();
        if (cx >= closeRect.left && cx <= closeRect.right && cy >= closeRect.top && cy <= closeRect.bottom) {
          await patchOverlay.remove();
          await overlay.remove();
          return;
        }

        // 패치 내역 보기
        const versionRect = await versionBtn.getBoundingClientRect();
        if (cx >= versionRect.left && cx <= versionRect.right && cy >= versionRect.top && cy <= versionRect.bottom) {
          await patchOverlay.setStyle('display', 'flex');
          return;
        }

        // 패널 바깥 클릭 시 닫기
        const panelRect = await panel.getBoundingClientRect();
        if (cx < panelRect.left || cx > panelRect.right || cy < panelRect.top || cy > panelRect.bottom) {
          await patchOverlay.remove();
          await overlay.remove();
          return;
        }
      });

      // 패치 오버레이 클릭 핸들링
      await patchOverlay.addEventListener('click', async (e) => {
        const px = e.clientX;
        const py = e.clientY;
        if (px === undefined || py === undefined) return;
        const patchCloseRect = await patchCloseBtn.getBoundingClientRect();
        if (px >= patchCloseRect.left && px <= patchCloseRect.right && py >= patchCloseRect.top && py <= patchCloseRect.bottom) {
          await patchOverlay.setStyle('display', 'none');
          return;
        }
        const cardRect = await patchCard.getBoundingClientRect();
        if (px < cardRect.left || px > cardRect.right || py < cardRect.top || py > cardRect.bottom) {
          await patchOverlay.setStyle('display', 'none');
          return;
        }
      });
    };

    // === Register Risuai UI integrations ===
    Risuai.registerButton({
      name: 'MemoPlus',
      icon: '📝',
      iconType: 'html',
      location: 'chat'
    }, async () => {
      await toggleWidget();
    });

    Risuai.registerSetting(
      'MemoPlus 설정',
      async () => {
        await showSettingsPanel();
      },
      '📝',
      'html'
    );

    // === Initialize ===
    injectStyles();
    await loadData();
    await loadUIState();
    await createWidget();

    console.log(`${PLUGIN_NAME} 로드 완료`);

  } catch (error) {
    console.log(`[MemoPlus] Error: ${error.message}`);
  }
})();