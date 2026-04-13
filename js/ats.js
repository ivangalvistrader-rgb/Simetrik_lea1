/**
 * ats.js — Module 1: ATS Optimizer
 * Exposed as window.ATS and window.CV_TEMPLATES
 */

// ============================================================
// CV TEMPLATES — Pre-populated with Iván Galvis's real profile
// ============================================================
const CV_TEMPLATES = {
  A: {
    id: 'A',
    nombre: 'Riesgo Puro',
    emoji: '🏦',
    targetAudience: 'Bancos / Entidades Reguladas SFC',
    detectionKeywords: [
      'sagrilaft','ptee','sfc','superintendencia','basilea','liquidez',
      'provisiones','laft','saro','riesgo operativo','riesgo de crédito',
      'cumplimiento','regulatorio','circular','banco','bancario','banking',
      'encaje','cartera vencida','riesgo de mercado','derivados',
    ],
    headline: 'Especialista en Riesgo Financiero & Cumplimiento Normativo | SFC | SAGRILAFT | Basilea',
    summary: `Profesional con más de 15 años de experiencia en gestión integral de riesgo financiero, cumplimiento normativo y dirección de cartera en entidades bancarias reguladas bajo estándares de la Superintendencia Financiera de Colombia (SFC). Experto en implementación de sistemas **SAGRILAFT** y **PTEE**, gestión de **Riesgo de Liquidez** bajo metodología **Basilea III**, construcción de **Modelos de Scoring** crediticio y estructuración de **Provisiones** para cartera comercial y consumo. Capacidad demostrada para liderar equipos de riesgo en entornos de alta regulación con impacto medible en la reducción de exposición y cumplimiento de circulares externas.`,
    experiencia: [
      {
        empresa: 'Banco Santander Colombia',
        cargo: 'Director de Cartera y Riesgo de Crédito',
        periodo: '2015 – 2022',
        logros: [
          'Diseñé e implementé el sistema **SAGRILAFT** y **PTEE** alineado con circulares externas de la **SFC**, logrando cero observaciones en auditorías regulatorias durante 3 años consecutivos.',
          'Gestioné el **Riesgo de Liquidez** del portafolio institucional bajo metodología **Basilea III**, manteniendo coeficientes LCR/NSFR superiores al mínimo regulatorio.',
          'Desarrollé **Modelos de Scoring** crediticio con técnicas estadísticas avanzadas, reduciendo la mora en un 18% en 24 meses en cartera de consumo y comercial.',
          'Estructuré matrices de **Provisiones** y **SARO** para cartera de $800M USD, cumpliendo 100% de reportes a entes supervisores en plazos establecidos.',
          'Lideré equipo de 12 analistas de riesgo en gestión de portafolio comercial, consumo y **Riesgo Operativo**.',
        ],
      },
      {
        empresa: 'Banco Pichincha Colombia',
        cargo: 'Gerente de Riesgo Financiero y LAFT',
        periodo: '2010 – 2015',
        logros: [
          'Implementé sistema integral de **LAFT** y gestión de **Riesgo de Crédito** para cartera SME y Middle Market, reduciendo pérdidas crediticias en 22%.',
          'Construí modelo de **Provisiones** dinámicas bajo NIIF 9 / **Basilea II**, mejorando la precisión de las estimaciones de pérdida esperada en un 35%.',
          'Coordiné auditorías de la **Superintendencia Financiera** con resultado satisfactorio en 4 visitas de inspección.',
          'Automaticé reportes de **Riesgo de Liquidez** y encaje regulatorio, reduciendo tiempo de elaboración de 3 días a 4 horas.',
        ],
      },
    ],
    educacion: [
      'Especialización en Riesgo Financiero – Universidad de Los Andes, Bogotá',
      'Posgrado en Finanzas y Mercados de Capitales – Universidad Externado de Colombia',
      'Profesional en Economía / Administración de Empresas',
    ],
    skills: [
      'SAGRILAFT','PTEE','Riesgo de Liquidez (LCR/NSFR)','Provisiones (NIIF 9)',
      'Basilea III','SFC / Circulares Externas','SARO / Riesgo Operativo',
      'Modelos de Scoring','Cartera Vencida / PDI / PI','SQL','Power BI',
      'VBA / Excel Avanzado','Python (básico-intermedio)',
    ],
    idiomas: ['Español (nativo)','Portugués (intermedio-avanzado)','Inglés (intermedio)'],
  },

  B: {
    id: 'B',
    nombre: 'Fintech / IA',
    emoji: '🤖',
    targetAudience: 'Startups / Scaleups / Tech Companies',
    detectionKeywords: [
      'startup','fintech','python','llm','ia','ai','automatización','chatbot',
      'prompt','agente','machine learning','datos','data','tech','saas',
      'api','openai','langchain','rag','mlops','transformación digital',
      'rpa','power bi','sql','scikit','tensorflow','cloud','aws','gcp',
    ],
    headline: 'Líder en Transformación Digital & Especialista en Automatización de IA | Python | LLM | Fintech',
    summary: `Especialista en Transformación Digital con 15+ años aplicando **Python**, **SQL** y soluciones de **IA Generativa** para automatizar procesos de riesgo crediticio y financiero en entornos bancarios y fintech de alta demanda. Constructor de **Chatbots** empresariales, **Agentes IA** con LLMs y pipelines de **Automatización** que han generado eficiencias operativas medibles. Experto en **Prompt Engineering** para modelos de análisis de portafolio a escala y desarrollo de dashboards de **Power BI** con KPIs de riesgo en tiempo real. Combina profundo conocimiento del negocio financiero con capacidad técnica para entregar soluciones IA end-to-end.`,
    experiencia: [
      {
        empresa: 'Banco Santander Colombia',
        cargo: 'Líder de Transformación Digital – Riesgo & Automatización IA',
        periodo: '2019 – 2022',
        logros: [
          'Desarrollé **Agentes IA** con **Python** y LLMs (**OpenAI GPT-4**, **LangChain**) para automatización de análisis de riesgo crediticio, reduciendo tiempo de decisión de 48h a 4h.',
          'Construí **Chatbots** empresariales integrados con core bancario (API REST) para consulta de cartera en tiempo real — reducción del 40% en tiempos de gestión.',
          'Implementé pipelines de **Prompt Engineering** para modelos de análisis de portafolio a escala (>50K registros/día) con validación automática de resultados.',
          'Diseñé dashboards ejecutivos en **Power BI** con +30 KPIs de riesgo en tiempo real, adoptados por el Comité de Riesgo corporativo.',
          'Automaticé reportes regulatorios con **Python/VBA** generando un ahorro de 60 horas/mes por equipo de 8 analistas.',
        ],
      },
      {
        empresa: 'Banco Pichincha Colombia',
        cargo: 'Analista Senior de Datos & Modelado Predictivo',
        periodo: '2015 – 2019',
        logros: [
          'Construí modelos predictivos con **Python** (scikit-learn, XGBoost) para scoring de crédito SME, mejorando ROE del segmento en 12 puntos base.',
          'Implementé solución de **RPA** para reconciliación contable de cartera, eliminando 25h semanales de trabajo manual.',
          'Desarrollé modelo de **Machine Learning** para detección temprana de mora con precisión del 87% (AUC-ROC).',
          'Creé biblioteca interna de **SQL** optimizado para queries de riesgo sobre bases de >10M registros en tiempo sub-segundo.',
        ],
      },
    ],
    educacion: [
      'Certificación en Machine Learning & AI – Coursera / DeepLearning.AI',
      'Especialización en Riesgo Financiero – Universidad de Los Andes',
      'Posgrado en Finanzas – Universidad Externado de Colombia',
    ],
    skills: [
      'Python (Pandas, Scikit-learn, LangChain)','SQL (PostgreSQL, BigQuery)',
      'Power BI / Tableau','Prompt Engineering','Agentes IA / LLM',
      'Chatbots Empresariales','VBA / Excel Avanzado',
      'REST APIs / Integración','Machine Learning','RPA / Automatización',
      'Git / GitHub','Riesgo Financiero (dominio de negocio)',
    ],
    idiomas: ['Español (nativo)','Portugués (avanzado – LATAM)','Inglés (intermedio-avanzado)'],
  },

  C: {
    id: 'C',
    nombre: 'Híbrido LATAM',
    emoji: '🌎',
    targetAudience: 'Multinacionales con operación LATAM',
    detectionKeywords: [
      'latam','latinoamérica','brasil','portugal','portugués','regional',
      'multinacional','corporativo','middle market','due diligence',
      'expansión','internacional','colombia','ecuador','perú','argentina',
      'remoto','remote','headhunter','executive','dirección regional',
    ],
    headline: 'Director de Riesgo Financiero & Transformación Digital – Bilingüe LATAM | 15 años',
    summary: `Ejecutivo financiero bilingüe (Español / **Portugués avanzado**) con 15+ años liderando iniciativas de **Riesgo Corporativo**, crédito **Middle Market** y transformación digital en mercados LATAM. Experiencia directa en Colombia, Ecuador y con exposición al mercado brasileño. Combina sólido background regulatorio (SFC, **SAGRILAFT**, Basilea) con visión tecnológica (**Automatización IA**, **Python**, Power BI) para crear equipos de alto rendimiento en entornos multiculturales. Capacidad probada de articular proyectos regionales de **Due Diligence** y **Riesgo País** en inglés, español y portugués.`,
    experiencia: [
      {
        empresa: 'Banco Santander Colombia / Regional LATAM',
        cargo: 'Director de Riesgo Corporativo – LATAM',
        periodo: '2018 – 2022',
        logros: [
          'Lideré equipo regional de **Riesgo Corporativo** en 3 países LATAM (Colombia, Ecuador, Perú) con portafolio combinado de $1.2B USD.',
          'Coordiné procesos de **Due Diligence** de cartera **Middle Market** en Español y **Portugués** para adquisiciones corporativas regionales.',
          'Implementé plataforma digital unificada de riesgo en 3 países, reduciendo tiempo de reporting regional de 7 días a 2 días.',
          'Gestioné relaciones con **Superintendencia Financiera** de Colombia y reguladores equivalentes de Ecuador con resultados satisfactorios.',
          'Lideré análisis de **Riesgo País** y Banca Corresponsal para expansión a mercados emergentes de la región, incluyendo evaluación de Brasil.',
        ],
      },
      {
        empresa: 'Banco Pichincha Colombia / Ecuador',
        cargo: 'Gerente de Riesgo Financiero – Operación Binacional',
        periodo: '2010 – 2018',
        logros: [
          'Gestioné portafolio binacional (Colombia-Ecuador) con análisis en Español y comunicación ejecutiva en inglés con casa matriz.',
          'Desarrollé modelo de **Riesgo Corporativo** para clientes Middle Market con presencia en 5+ países LATAM.',
          'Coordiné con equipos de Brasil y Argentina en proyectos de estandarización de modelos de crédito regionales.',
          'Automaticé reportes en **Python/Power BI** adaptados a requisitos regulatorios de 2 jurisdicciones distintas.',
        ],
      },
    ],
    educacion: [
      'Especialización en Riesgo Financiero – Universidad de Los Andes, Bogotá',
      'Posgrado en Finanzas Internacionales – Universidad Externado de Colombia',
      'Curso de Portugués Ejecutivo para Negocios – Nivel C1',
    ],
    skills: [
      'Riesgo Corporativo','Middle Market / Due Diligence',
      'SAGRILAFT / PTEE / SFC','Basilea III',
      'Portugués Avanzado (C1)','Español Nativo','Inglés Intermedio-Avanzado',
      'Power BI / SQL / Python','Riesgo País / Banca Corresponsal',
      'Gestión de Equipos Regionales','Transformación Digital',
    ],
    idiomas: ['Español (nativo)','Portugués (avanzado – C1)','Inglés (intermedio-avanzado)'],
  },
};

// ============================================================
// ATS MODULE
// ============================================================
const ATS = (() => {

  // --- Template Detection ---
  function detectTemplate(jobText) {
    const text = jobText.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove accents

    const scores = {
      A: 0,
      B: 0,
      C: 0,
    };

    Object.keys(CV_TEMPLATES).forEach(key => {
      CV_TEMPLATES[key].detectionKeywords.forEach(kw => {
        const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (text.includes(kwNorm)) scores[key]++;
      });
    });

    // Return highest scoring template; default to C (LATAM) if all tied at 0
    const maxScore = Math.max(scores.A, scores.B, scores.C);
    if (maxScore === 0) return 'C';
    if (scores.A === maxScore && scores.A > scores.B) return 'A';
    if (scores.B === maxScore && scores.B >= scores.A) return 'B';
    return 'C';
  }

  // --- Claude System Prompt ---
  const SYSTEM_PROMPT = `Eres un experto en optimización de CVs para ATS (Applicant Tracking Systems) en el mercado financiero y tecnológico latinoamericano.

Tu tarea es tomar el perfil base de Iván Galvis y generar un CV adaptado a la vacante específica.

REGLAS ESTRICTAS:
1. NUNCA inventes empresas, cargos, fechas ni logros que no estén en el template base
2. Incorpora palabras clave de la vacante de forma natural y orgánica en el texto
3. Resalta en **negritas** (con dobles asteriscos) las keywords más relevantes para ATS
4. Prioriza logros con métricas concretas (porcentajes, montos, tiempos)
5. Mantén tono ejecutivo, profesional y conciso
6. Adapta el titular y resumen para alinearse con el lenguaje de la vacante
7. Responde SOLO con el CV adaptado, sin explicaciones ni comentarios adicionales
8. Usa este formato:
   TITULAR PROFESIONAL: [título adaptado]

   RESUMEN EJECUTIVO:
   [2-3 párrafos]

   EXPERIENCIA PROFESIONAL:
   [experiencias relevantes con logros en bullets]

   COMPETENCIAS TÉCNICAS:
   [lista de skills relevantes para la vacante]

   EDUCACIÓN:
   [formación académica]

   IDIOMAS: [idiomas]`;

  async function generateOptimizedCV(jobDesc, templateId) {
    const t = CV_TEMPLATES[templateId];
    const expText = t.experiencia.map(e =>
      `${e.cargo} | ${e.empresa} (${e.periodo})\n` +
      e.logros.map(l => `• ${l}`).join('\n')
    ).join('\n\n');

    const userContent = `TEMPLATE BASE — ${t.nombre} (${t.targetAudience}):

TITULAR BASE: ${t.headline}
RESUMEN BASE: ${t.summary}

EXPERIENCIA BASE:
${expText}

SKILLS BASE: ${t.skills.join(', ')}
EDUCACIÓN: ${t.educacion.join(' | ')}
IDIOMAS: ${t.idiomas.join(', ')}

---
VACANTE A LA QUE APLICAR:
${jobDesc}

---
INSTRUCCIÓN: Genera el CV adaptado para esta vacante específica usando el template base. Resalta en **negritas** las keywords ATS más importantes. Adapta el titular y resumen para maximizar el match con la descripción de la vacante.`;

    return API.complete(SYSTEM_PROMPT, userContent, 1500);
  }

  // --- Render CV output as HTML (convert **bold** to <strong>) ---
  function renderCV(rawText) {
    return rawText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  // --- Module Initialization ---
  function init() {
    const jobDescTextarea   = document.getElementById('ats-job-desc');
    const btnAnalyze        = document.getElementById('ats-btn-analyze');
    const btnCopy           = document.getElementById('ats-btn-copy');
    const outputArea        = document.getElementById('ats-output');
    const templateBtns      = document.querySelectorAll('.ats-template-btn');
    const detectedBadge     = document.getElementById('ats-template-badge');
    const badgeText         = document.getElementById('ats-badge-text');

    let selectedTemplate  = null; // null = auto-detect
    let lastRawOutput     = '';

    // --- Template selector ---
    templateBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const wasActive = btn.classList.contains('active');
        templateBtns.forEach(b => b.classList.remove('active'));
        if (!wasActive) {
          btn.classList.add('active');
          selectedTemplate = btn.dataset.template;
        } else {
          // Toggle off = back to auto-detect
          selectedTemplate = null;
        }
      });
    });

    // --- Analyze + Generate ---
    btnAnalyze.addEventListener('click', async () => {
      const jobDesc = jobDescTextarea.value.trim();
      if (!jobDesc) {
        Toast.show('Pega la descripción de la vacante primero');
        return;
      }

      // Determine template
      const templateId = selectedTemplate || detectTemplate(jobDesc);

      // Highlight detected template in UI
      templateBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.template === templateId);
      });

      // Show detection badge
      const t = CV_TEMPLATES[templateId];
      badgeText.textContent = `${t.emoji} Plantilla detectada: ${t.nombre} — ${t.targetAudience}`;
      detectedBadge.hidden = false;

      // Loading state
      outputArea.innerHTML = `
        <div class="skeleton" style="height:30px;margin-bottom:12px"></div>
        <div class="skeleton" style="height:120px;margin-bottom:12px"></div>
        <div class="skeleton" style="height:80px;margin-bottom:12px"></div>
        <div class="skeleton" style="height:60px"></div>`;
      btnAnalyze.disabled  = true;
      btnAnalyze.textContent = '⏳ Generando...';
      btnCopy.hidden       = true;

      try {
        const rawCV = await generateOptimizedCV(jobDesc, templateId);
        lastRawOutput = rawCV;
        outputArea.innerHTML = `<div class="ats-result-text">${renderCV(rawCV)}</div>`;
        btnCopy.hidden = false;

        // Scroll to output
        outputArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        Toast.show('✅ CV generado — listo para copiar');
      } catch (err) {
        outputArea.innerHTML = `<p class="error-text">⚠️ ${err.message}</p>`;
        Toast.show(err.message, 4000);
      } finally {
        btnAnalyze.disabled  = false;
        btnAnalyze.textContent = 'Analizar Vacante';
      }
    });

    // --- Copy ---
    btnCopy.addEventListener('click', () => {
      const textToCopy = lastRawOutput || outputArea.innerText;
      if (!textToCopy) return;

      navigator.clipboard.writeText(textToCopy)
        .then(() => Toast.show('📋 CV copiado al portapapeles'))
        .catch(() => {
          // Fallback: select + copy
          const ta = document.createElement('textarea');
          ta.value = textToCopy;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          Toast.show('📋 CV copiado');
        });
    });
  }

  return { init };
})();
