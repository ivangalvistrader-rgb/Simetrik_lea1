/**
 * radar.js — Module 2: Job Radar
 * Exposed as window.Radar
 */
const Radar = (() => {

  // ============================================================
  // JOB PLATFORMS
  // ============================================================
  const PLATFORMS = [
    {
      name: 'Talent.com',
      emoji: '🔷',
      buildUrl: q => `https://co.talent.com/jobs?k=${encodeURIComponent(q)}&l=Colombia`,
    },
    {
      name: 'elempleo',
      emoji: '🟦',
      buildUrl: q => `https://www.elempleo.com/co/ofertas-empleo/?s=${encodeURIComponent(q)}`,
    },
    {
      name: 'Michael Page',
      emoji: '🔴',
      buildUrl: q => `https://www.michaelpage.com.co/jobs/search#q=${encodeURIComponent(q)}&country=Colombia`,
    },
    {
      name: 'Glassdoor',
      emoji: '🟢',
      buildUrl: q => `https://www.glassdoor.com.co/Job/jobs.htm?suggestCount=0&typedKeyword=${encodeURIComponent(q)}&sc.keyword=${encodeURIComponent(q)}`,
    },
    {
      name: 'Magneto',
      emoji: '🟣',
      buildUrl: q => `https://magneto.co/empleos?q=${encodeURIComponent(q)}`,
    },
    {
      name: 'Bumeran',
      emoji: '🟠',
      buildUrl: q => `https://www.bumeran.com.co/empleos/busqueda-${encodeURIComponent(q).replace(/%20/g, '-')}.html`,
    },
  ];

  // ============================================================
  // PRESET BOOLEAN SEARCHES
  // ============================================================
  const PRESET_SEARCHES = [
    {
      id: 'p1',
      emoji: '🏦',
      name: 'Director Riesgos Regulatorio',
      description: 'Banca / SFC / Cumplimiento',
      query: '"Director de Riesgos" OR "Risk Manager" AND (SAGRILAFT OR PTEE) AND Colombia',
      tags: ['SAGRILAFT', 'PTEE', 'Banca', 'SFC'],
    },
    {
      id: 'p2',
      emoji: '🤖',
      name: 'Prompt Engineer / IA Fintech',
      description: 'Startups / Scaleups Tech',
      query: '"Prompt Engineer" OR "AI Specialist" AND (Fintech OR Banca) AND (Python OR Automatización)',
      tags: ['Python', 'IA', 'Fintech', 'LLM'],
    },
    {
      id: 'p3',
      emoji: '🌎',
      name: 'Gerente Crédito LATAM',
      description: 'Colombia / Remoto LATAM',
      query: '"Gerente de Crédito" AND (Cartera OR Scoring) AND (Bogotá OR "Remoto LATAM")',
      tags: ['Cartera', 'Scoring', 'LATAM'],
    },
    {
      id: 'p4',
      emoji: '💡',
      name: 'Transformación Digital Banca',
      description: 'Liderazgo Tech en Finanzas',
      query: '("Transformación Digital" OR "Digital Transformation") AND (Banca OR Fintech OR Riesgo) AND Colombia',
      tags: ['Digital', 'Liderazgo', 'Banca'],
    },
    {
      id: 'p5',
      emoji: '📊',
      name: 'Data / Risk Analyst Senior',
      description: 'Datos + Riesgo Financiero',
      query: '("Data Analyst" OR "Risk Analyst") AND (SQL OR Python OR "Power BI") AND (Riesgo OR Fintech OR Banca)',
      tags: ['SQL', 'Python', 'Power BI'],
    },
  ];

  // ============================================================
  // EXCLUSION FILTER
  // ============================================================
  const EXCLUDE_TERMS = [
    'call center','callcenter','soporte técnico','soporte tecnico',
    'atención al cliente','atencion al cliente','servicio al cliente',
    'asesor comercial','ejecutivo de cuenta','cajero','teller',
    'mesa de ayuda','help desk',
  ];

  function hasExcludedTerm(query) {
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return EXCLUDE_TERMS.some(t => {
      const tNorm = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return q.includes(tNorm);
    });
  }

  // ============================================================
  // RENDER HELPERS
  // ============================================================
  function renderPlatformButtons(query) {
    return PLATFORMS.map(p => `
      <a href="${p.buildUrl(query)}"
         target="_blank"
         rel="noopener noreferrer"
         class="radar-platform-link">
        <span>${p.emoji}</span>
        <span>${p.name}</span>
      </a>
    `).join('');
  }

  function renderSearchCard(search) {
    const tagsHtml = search.tags.map(t =>
      `<span class="tag">${t}</span>`
    ).join('');

    return `
      <div class="radar-card card">
        <div class="radar-card__header">
          <span class="radar-card__emoji">${search.emoji}</span>
          <div class="radar-card__info">
            <span class="radar-card__name">${search.name}</span>
            <span class="radar-card__desc">${search.description}</span>
          </div>
          <button class="btn btn--icon radar-copy-btn"
                  data-query="${search.query.replace(/"/g, '&quot;')}"
                  aria-label="Copiar búsqueda"
                  title="Copiar string booleano">📋</button>
        </div>

        <div class="radar-query-block">
          <code>${escapeHtml(search.query)}</code>
        </div>

        <div class="radar-tags">${tagsHtml}</div>

        <div class="radar-platform-grid">
          ${renderPlatformButtons(search.query)}
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    // --- Render preset searches ---
    const presetsContainer = document.getElementById('radar-presets');
    presetsContainer.innerHTML = PRESET_SEARCHES.map(renderSearchCard).join('');

    // --- Build custom platform row ---
    const customPlatforms = document.getElementById('radar-custom-platforms');
    customPlatforms.innerHTML = PLATFORMS.map(p => `
      <button class="radar-platform-link radar-custom-open"
              data-platform="${p.name}"
              aria-label="Buscar en ${p.name}">
        <span>${p.emoji}</span>
        <span>${p.name}</span>
      </button>
    `).join('');

    // --- Copy query buttons ---
    presetsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.radar-copy-btn');
      if (!btn) return;
      const query = btn.dataset.query;
      navigator.clipboard.writeText(query)
        .then(() => Toast.show('📋 String booleano copiado'))
        .catch(() => Toast.show('Error al copiar'));
    });

    // --- Custom search: open in platform ---
    customPlatforms.addEventListener('click', (e) => {
      const btn = e.target.closest('.radar-custom-open');
      if (!btn) return;

      const customInput = document.getElementById('radar-custom-input');
      const query = customInput.value.trim();
      if (!query) {
        Toast.show('Escribe tu búsqueda primero');
        return;
      }

      // Smart filter warning
      if (hasExcludedTerm(query)) {
        Toast.show('⚠️ Alerta: detecté términos excluidos (call center / soporte)', 3500);
        return;
      }

      // Find platform and open
      const platform = PLATFORMS.find(p => p.name === btn.dataset.platform);
      if (platform) {
        window.open(platform.buildUrl(query), '_blank', 'noopener');
      }
    });
  }

  return { init };
})();
