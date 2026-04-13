/**
 * app.js — Bootstrap: tab router, settings modal, Toast utility, SW registration
 * Must load LAST (after all modules)
 */

// ============================================================
// TOAST UTILITY (global, used by all modules)
// ============================================================
const Toast = (() => {
  const el = document.getElementById('toast');
  let timer = null;

  function show(msg, duration = 2500) {
    el.textContent = msg;
    el.classList.add('visible');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('visible'), duration);
  }

  return { show };
})();

// ============================================================
// TAB ROUTER
// ============================================================
(function initTabRouter() {
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  // Track which modules have been initialized (lazy init)
  const initialized = { ats: false, radar: false, voice: false, kanban: false };

  function activateTab(targetId) {
    // Update button states
    tabBtns.forEach(btn =>
      btn.classList.toggle('active', btn.dataset.target === targetId)
    );

    // Update panel visibility
    tabPanels.forEach(panel =>
      panel.classList.toggle('active', panel.dataset.tab === targetId)
    );

    // Lazy-initialize modules on first visit
    if (!initialized[targetId]) {
      initialized[targetId] = true;
      switch (targetId) {
        case 'radar':  if (window.Radar)  Radar.init();  break;
        case 'voice':  if (window.Voice)  Voice.init();  break;
        case 'kanban': if (window.Kanban) Kanban.init(); break;
      }
    }

    // Scroll content area back to top when switching tabs
    document.getElementById('tab-content').scrollTop = 0;
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.target));
  });

  // ATS is the default tab — initialize immediately
  initialized.ats = true;
  if (window.ATS) ATS.init();
})();

// ============================================================
// SETTINGS MODAL
// ============================================================
(function initSettings() {
  const modal      = document.getElementById('modal-settings');
  const inputKey   = document.getElementById('input-api-key');
  const btnOpen    = document.getElementById('btn-settings');
  const btnSave    = document.getElementById('btn-save-settings');
  const btnClose   = document.getElementById('btn-close-settings');

  async function openModal() {
    const rec = await DB.get('settings', 'apiKey');
    if (rec?.value) {
      // Show masked version
      inputKey.value = rec.value;
    }
    modal.hidden = false;
    // Focus key input
    setTimeout(() => inputKey.focus(), 300);
  }

  function closeModal() {
    modal.hidden = true;
    inputKey.blur();
  }

  btnOpen.addEventListener('click', openModal);

  btnClose.addEventListener('click', closeModal);

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  btnSave.addEventListener('click', async () => {
    const key = inputKey.value.trim();
    if (!key) {
      Toast.show('Ingresa una API Key válida');
      return;
    }
    if (!key.startsWith('sk-ant-')) {
      Toast.show('La key debe comenzar con sk-ant-');
      return;
    }
    await DB.put('settings', { key: 'apiKey', value: key });
    closeModal();
    Toast.show('✅ API Key guardada correctamente');
  });

  // Show settings prompt if no API key on first load
  setTimeout(async () => {
    const rec = await DB.get('settings', 'apiKey');
    if (!rec?.value) {
      Toast.show('👋 Agrega tu API Key en ⚙️ para usar IA', 4000);
    }
  }, 1000);
})();

// ============================================================
// SERVICE WORKER REGISTRATION
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('[SW] Registrado:', reg.scope);
      })
      .catch(err => {
        // SW fails gracefully (e.g. on HTTP / non-root scope)
        console.info('[SW] No registrado (se necesita HTTPS):', err.message);
      });
  });
}
