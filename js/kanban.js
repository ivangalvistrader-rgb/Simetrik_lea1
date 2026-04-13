/**
 * kanban.js — Module 4: Swipeable Kanban Board
 * Exposed as window.Kanban
 */
const Kanban = (() => {

  // ============================================================
  // COLUMNS DEFINITION
  // ============================================================
  const COLUMNS = [
    { id: 'oportunidad', label: 'Oportunidad',   emoji: '👀', colorVar: '--kanban-col-1' },
    { id: 'enviado',     label: 'CV Enviado',     emoji: '📤', colorVar: '--kanban-col-2' },
    { id: 'entrevista',  label: 'Entrevista',     emoji: '🤝', colorVar: '--kanban-col-3' },
    { id: 'oferta',      label: 'Oferta',         emoji: '🎉', colorVar: '--kanban-col-4' },
  ];

  const FUENTE_OPTIONS = [
    'LinkedIn','Magneto','elempleo','Talent.com','Michael Page',
    'Glassdoor','Bumeran','Referido','Directo','Otro',
  ];

  // ============================================================
  // STATE
  // ============================================================
  let cards = [];

  // Drag state
  let dragCardEl   = null;
  let dragGhostEl  = null;
  let dragCardData = null;
  let pointerId    = null;

  // ============================================================
  // DB HELPERS
  // ============================================================
  async function loadCards() {
    cards = await DB.getAll('kanban_cards');
  }

  async function saveCard(card) {
    await DB.put('kanban_cards', card);
  }

  async function removeCard(id) {
    await DB.del('kanban_cards', id);
    cards = cards.filter(c => c.id !== id);
    renderBoard();
  }

  function makeCard(data = {}) {
    return {
      id:          crypto.randomUUID(),
      empresa:     data.empresa  || '',
      cargo:       data.cargo    || '',
      url:         data.url      || '',
      fuente:      data.fuente   || '',
      column:      data.column   || 'oportunidad',
      template:    data.template || null,
      fechaCreado: new Date().toISOString(),
      fechaMov:    new Date().toISOString(),
      notas:       data.notas    || '',
      salario:     data.salario  || '',
      contacto:    data.contacto || '',
    };
  }

  // ============================================================
  // RENDER
  // ============================================================
  function renderBoard() {
    const board = document.getElementById('kanban-board');
    if (!board) return;

    board.innerHTML = '';

    COLUMNS.forEach(col => {
      const colCards = cards.filter(c => c.column === col.id);
      const colEl    = document.createElement('div');
      colEl.className = 'kanban-col';
      colEl.dataset.colId = col.id;
      colEl.style.setProperty('--col-bg', `var(${col.colorVar})`);

      colEl.innerHTML = `
        <div class="kanban-col__header">
          <div class="kanban-col__title">
            <span>${col.emoji}</span>
            <span>${col.label}</span>
          </div>
          <span class="kanban-col__count">${colCards.length}</span>
        </div>
        <div class="kanban-col__cards" data-col="${col.id}">
          ${colCards.map(renderCardHTML).join('')}
          ${colCards.length === 0
            ? `<div class="kanban-empty-col">Arrastra aquí</div>`
            : ''}
        </div>
      `;
      board.appendChild(colEl);
    });

    attachPointerHandlers();
    attachCardActions();
  }

  function renderCardHTML(card) {
    const templateBadge = card.template && CV_TEMPLATES?.[card.template]
      ? `<span class="badge badge--${card.template.toLowerCase()}">
           ${CV_TEMPLATES[card.template].emoji} ${CV_TEMPLATES[card.template].nombre}
         </span>`
      : '';

    const fuente = card.fuente
      ? `<span class="tag">${card.fuente}</span>`
      : '';

    const colIdx  = COLUMNS.findIndex(c => c.id === card.column);
    const canLeft  = colIdx > 0;
    const canRight = colIdx < COLUMNS.length - 1;

    const dateStr = card.fechaCreado
      ? new Date(card.fechaCreado).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
      : '';

    return `
      <div class="kanban-card" data-card-id="${card.id}" touch-action="none">
        <div class="kanban-card__body">
          <p class="kanban-card__empresa">${escapeHtml(card.empresa || 'Empresa')}</p>
          <p class="kanban-card__cargo">${escapeHtml(card.cargo || 'Vacante')}</p>
          <div class="kanban-card__meta">
            ${fuente}
            ${templateBadge}
            ${dateStr ? `<span class="kanban-card__date">${dateStr}</span>` : ''}
          </div>
          ${card.notas ? `<p class="kanban-card__notes">${escapeHtml(card.notas)}</p>` : ''}
          ${card.url
            ? `<a href="${escapeHtml(card.url)}" target="_blank" rel="noopener"
                  class="kanban-card__link" onclick="event.stopPropagation()">Ver oferta ↗</a>`
            : ''}
        </div>
        <div class="kanban-card__actions">
          <button class="card-action-btn ${!canLeft ? 'invisible' : ''}"
                  data-action="left" data-id="${card.id}" aria-label="Mover izquierda">←</button>
          <button class="card-action-btn card-action-btn--delete"
                  data-action="delete" data-id="${card.id}" aria-label="Eliminar">🗑</button>
          <button class="card-action-btn ${!canRight ? 'invisible' : ''}"
                  data-action="right" data-id="${card.id}" aria-label="Mover derecha">→</button>
        </div>
      </div>`;
  }

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ============================================================
  // POINTER-EVENT DRAG (works on iOS touch + desktop mouse)
  // ============================================================
  function attachPointerHandlers() {
    const board = document.getElementById('kanban-board');

    // Clean up previous listeners to avoid duplicates (re-render)
    board.replaceWith(board.cloneNode(true));
    const freshBoard = document.getElementById('kanban-board');

    // Re-attach card innerHTML was already set above; now attach pointer events
    freshBoard.querySelectorAll('.kanban-card').forEach(cardEl => {
      cardEl.addEventListener('pointerdown', onPointerDown, { passive: false });
    });

    freshBoard.addEventListener('pointermove', onPointerMove, { passive: false });
    freshBoard.addEventListener('pointerup',    onPointerUp);
    freshBoard.addEventListener('pointercancel', onPointerUp);
  }

  function onPointerDown(e) {
    // Ignore if clicking action buttons
    if (e.target.closest('.card-action-btn') || e.target.closest('.kanban-card__link')) return;
    if (e.button !== undefined && e.button !== 0) return;

    dragCardEl   = e.currentTarget;
    dragCardData = cards.find(c => c.id === dragCardEl.dataset.cardId);
    if (!dragCardData) return;

    pointerId = e.pointerId;
    dragCardEl.setPointerCapture(e.pointerId);

    // Create ghost
    dragGhostEl = dragCardEl.cloneNode(true);
    dragGhostEl.classList.add('kanban-drag-ghost');
    dragGhostEl.style.width  = dragCardEl.offsetWidth + 'px';
    document.body.appendChild(dragGhostEl);
    updateGhostPos(e);

    dragCardEl.classList.add('kanban-card--dragging');
    e.preventDefault(); // prevent scroll during drag
  }

  function onPointerMove(e) {
    if (!dragCardEl) return;
    e.preventDefault();
    updateGhostPos(e);

    // Highlight drop target column
    const el = getElementUnderPointer(e);
    const dropCol = el?.closest('.kanban-col__cards');
    document.querySelectorAll('.kanban-col__cards').forEach(c => {
      c.classList.toggle('kanban-drop-target', c === dropCol);
    });
  }

  async function onPointerUp(e) {
    if (!dragCardEl) return;

    // Find drop column
    const el = getElementUnderPointer(e);
    const dropColEl = el?.closest('.kanban-col__cards');

    if (dropColEl && dragCardData) {
      const newColId = dropColEl.dataset.col;
      if (newColId && newColId !== dragCardData.column) {
        dragCardData.column   = newColId;
        dragCardData.fechaMov = new Date().toISOString();
        await saveCard(dragCardData);
        const newColLabel = COLUMNS.find(c => c.id === newColId)?.label || newColId;
        Toast.show(`📤 Movido a ${newColLabel}`);
      }
    }

    // Cleanup
    dragCardEl.classList.remove('kanban-card--dragging');
    dragGhostEl?.remove();
    dragGhostEl  = null;
    dragCardEl   = null;
    dragCardData = null;
    pointerId    = null;

    document.querySelectorAll('.kanban-drop-target').forEach(c =>
      c.classList.remove('kanban-drop-target')
    );

    renderBoard();
  }

  function updateGhostPos(e) {
    if (!dragGhostEl) return;
    const w = dragGhostEl.offsetWidth;
    dragGhostEl.style.left = (e.clientX - w / 2) + 'px';
    dragGhostEl.style.top  = (e.clientY - 30)   + 'px';
  }

  function getElementUnderPointer(e) {
    if (dragGhostEl) dragGhostEl.style.display = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (dragGhostEl) dragGhostEl.style.display = '';
    return el;
  }

  // ============================================================
  // CARD ACTIONS (← → 🗑)
  // ============================================================
  function attachCardActions() {
    const board = document.getElementById('kanban-board');
    board.addEventListener('click', async (e) => {
      const btn = e.target.closest('.card-action-btn');
      if (!btn) return;
      e.stopPropagation();

      const { action, id } = btn.dataset;
      const card = cards.find(c => c.id === id);
      if (!card) return;

      if (action === 'delete') {
        if (!confirm(`¿Eliminar "${card.empresa} – ${card.cargo}"?`)) return;
        await removeCard(id);
        Toast.show('🗑 Postulación eliminada');
        return;
      }

      const colIdx = COLUMNS.findIndex(c => c.id === card.column);
      let newIdx = colIdx;
      if (action === 'right') newIdx = Math.min(colIdx + 1, COLUMNS.length - 1);
      if (action === 'left')  newIdx = Math.max(colIdx - 1, 0);

      if (newIdx !== colIdx) {
        card.column   = COLUMNS[newIdx].id;
        card.fechaMov = new Date().toISOString();
        await saveCard(card);
        renderBoard();
        Toast.show(`Movido a ${COLUMNS[newIdx].label}`);
      }
    });
  }

  // ============================================================
  // ADD CARD MODAL (uses a bottom-sheet form approach)
  // ============================================================
  function showAddCardModal(preCol = 'oportunidad') {
    // Build modal HTML
    const modalId = 'kanban-add-modal';
    let existing  = document.getElementById(modalId);
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal__card">
        <h2>➕ Nueva Postulación</h2>

        <div class="settings-field">
          <label for="kf-empresa">Empresa *</label>
          <input type="text" class="input" id="kf-empresa" placeholder="Ej: Bancolombia" autocomplete="off">
        </div>
        <div class="settings-field">
          <label for="kf-cargo">Cargo / Vacante *</label>
          <input type="text" class="input" id="kf-cargo" placeholder="Ej: Director de Riesgos">
        </div>
        <div class="settings-field">
          <label for="kf-fuente">Fuente</label>
          <select class="input" id="kf-fuente">
            <option value="">-- Selecciona --</option>
            ${FUENTE_OPTIONS.map(f => `<option value="${f}">${f}</option>`).join('')}
          </select>
        </div>
        <div class="settings-field">
          <label for="kf-url">URL de la oferta</label>
          <input type="url" class="input" id="kf-url" placeholder="https://..." autocomplete="off">
        </div>
        <div class="settings-field">
          <label for="kf-template">Plantilla CV usada</label>
          <select class="input" id="kf-template">
            <option value="">-- Ninguna --</option>
            <option value="A">🏦 A – Riesgo Puro</option>
            <option value="B">🤖 B – Fintech / IA</option>
            <option value="C">🌎 C – Híbrido LATAM</option>
          </select>
        </div>
        <div class="settings-field">
          <label for="kf-notas">Notas</label>
          <textarea class="input" id="kf-notas" rows="2" placeholder="Contacto, salario, observaciones..."></textarea>
        </div>

        <div class="modal__actions">
          <button class="btn btn--primary" id="kf-btn-save" style="flex:1">Agregar</button>
          <button class="btn btn--ghost" id="kf-btn-cancel" style="flex:1">Cancelar</button>
        </div>
      </div>`;

    document.body.appendChild(modal);

    // Pre-select column
    // (column selection happens implicitly by whichever "Add" was tapped — preCol)

    // Events
    document.getElementById('kf-btn-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('kf-btn-save').addEventListener('click', async () => {
      const empresa = document.getElementById('kf-empresa').value.trim();
      const cargo   = document.getElementById('kf-cargo').value.trim();
      if (!empresa || !cargo) {
        Toast.show('Empresa y Cargo son obligatorios');
        return;
      }

      const card = makeCard({
        empresa,
        cargo,
        fuente:   document.getElementById('kf-fuente').value,
        url:      document.getElementById('kf-url').value.trim(),
        template: document.getElementById('kf-template').value || null,
        notas:    document.getElementById('kf-notas').value.trim(),
        column:   preCol,
      });

      cards.push(card);
      await saveCard(card);
      modal.remove();
      renderBoard();
      Toast.show(`✅ "${empresa}" agregada`);
    });
  }

  // ============================================================
  // INIT
  // ============================================================
  async function init() {
    await loadCards();
    renderBoard();

    // Global "+" button
    document.getElementById('kanban-btn-add').addEventListener('click', () => {
      showAddCardModal('oportunidad');
    });
  }

  return { init };
})();
