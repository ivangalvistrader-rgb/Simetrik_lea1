/**
 * voice.js — Module 3: Voice-to-Network (LinkedIn Message Generator)
 * Exposed as window.Voice
 */
const Voice = (() => {

  // ============================================================
  // IVÁN GALVIS PERSONA PROMPT
  // ============================================================
  const IVAN_PERSONA = `Eres Iván Galvis, ejecutivo financiero colombiano con más de 15 años de experiencia en Riesgo Financiero y Transformación Digital.

Tu trayectoria:
- Director de Cartera y Riesgo en Banco Santander Colombia y Banco Pichincha
- Especialista en SAGRILAFT, PTEE, Riesgo de Liquidez, Modelos de Scoring y Provisiones
- Experto en Automatización IA: Python, LLMs, Chatbots, Prompt Engineering, Power BI
- Bilingüe: Español nativo + Portugués avanzado (mercados LATAM)
- Basado en Bogotá, Colombia. Disponible para remoto LATAM

Tu estilo de comunicación:
- Directo, profesional y sin rodeos
- Combinas experiencia financiera dura con visión tecnológica
- No uses frases genéricas como "espero que estés bien" o "me permito contactarte"
- Sé específico y añade valor en cada oración

ESTRUCTURA OBLIGATORIA para mensajes de LinkedIn (Challenge de LinkedIn):
1. SALUDO personalizado con nombre del reclutador/contacto
2. CONEXIÓN DE PROPÓSITO: por qué contactas a ESA persona específicamente
3. VACANTE / EMPRESA: mencionar el rol o empresa de forma específica
4. VALOR DIFERENCIAL: 1-2 oraciones sobre qué traes tú que es único para ESE rol
5. CTA (Call to Action): propuesta concreta (llamada de 15 min, revisar perfil, etc.)

REGLAS:
- Máximo 150 palabras
- Tono ejecutivo pero humano, no corporativo ni robótico
- No uses emojis excesivos (máximo 1-2)
- Responde SOLO con el mensaje, sin explicaciones adicionales`;

  // ============================================================
  // SPEECH RECOGNITION SETUP
  // ============================================================
  function createRecognition(onPartial, onFinal, onError, onEnd) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError('Tu navegador no soporta reconocimiento de voz.\nUsa Safari en iPhone o Chrome en Android.');
      return null;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'es-CO';          // Colombian Spanish for best accuracy
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const isFinal = event.results[event.results.length - 1].isFinal;
      if (isFinal) {
        onFinal(transcript);
      } else {
        onPartial(transcript);
      }
    };

    rec.onerror = (event) => {
      const messages = {
        'not-allowed':  'Permiso de micrófono denegado. Ve a Ajustes > Safari > Micrófono.',
        'no-speech':    'No se detectó voz. Habla más cerca del micrófono.',
        'network':      'Error de red. Verifica tu conexión.',
        'aborted':      null, // User stopped, not an error
        'service-not-allowed': 'Servicio no disponible. Requiere HTTPS.',
      };
      const msg = messages[event.error];
      if (msg) onError(msg);
    };

    rec.onend = onEnd;
    return rec;
  }

  // ============================================================
  // MESSAGE GENERATION
  // ============================================================
  async function generateLinkedInMessage(context) {
    const userContent = `Genera un mensaje de LinkedIn usando el siguiente contexto de voz/texto:

"${context}"

Usa la estructura Challenge de LinkedIn:
1. Saludo (con nombre si se menciona)
2. Conexión de propósito
3. Vacante/empresa específica
4. Mi valor diferencial para ESE rol
5. CTA concreto

Máximo 150 palabras. Solo devuelve el mensaje final.`;

    return API.complete(IVAN_PERSONA, userContent, 400);
  }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    const btnRecord    = document.getElementById('voice-btn-record');
    const btnLabel     = document.getElementById('voice-btn-label');
    const hintEl       = document.getElementById('voice-hint');
    const transcriptEl = document.getElementById('voice-transcript');
    const btnGenerate  = document.getElementById('voice-btn-generate');
    const outputArea   = document.getElementById('voice-output');
    const btnCopy      = document.getElementById('voice-btn-copy');

    let recognition    = null;
    let isRecording    = false;
    let finalText      = '';
    let lastMessage    = '';

    // --- Check Speech API availability ---
    const hasVoice = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!hasVoice) {
      hintEl.textContent = '⚠️ Reconocimiento de voz no disponible. Escribe el contexto manualmente.';
      hintEl.style.color = 'var(--color-accent-amber)';
      btnRecord.disabled = true;
      btnRecord.style.opacity = '0.5';
    }

    // --- Record Button ---
    btnRecord.addEventListener('click', () => {
      if (isRecording) {
        stopRecording();
        return;
      }
      startRecording();
    });

    function startRecording() {
      finalText = '';
      transcriptEl.value = '';
      btnGenerate.hidden = true;
      outputArea.innerHTML = '';
      btnCopy.hidden = true;

      recognition = createRecognition(
        // onPartial
        (text) => {
          transcriptEl.value = text;
        },
        // onFinal
        (text) => {
          finalText = text;
          transcriptEl.value = text;
        },
        // onError
        (errMsg) => {
          Toast.show('🎙️ ' + errMsg, 4000);
          setRecordingState(false);
        },
        // onEnd
        () => {
          setRecordingState(false);
          if (finalText || transcriptEl.value.trim()) {
            btnGenerate.hidden = false;
          }
        }
      );

      if (!recognition) return;

      try {
        recognition.start();
        setRecordingState(true);
      } catch (e) {
        Toast.show('Error al iniciar micrófono: ' + e.message, 3000);
      }
    }

    function stopRecording() {
      if (recognition) {
        recognition.stop();
      }
      setRecordingState(false);
    }

    function setRecordingState(recording) {
      isRecording = recording;
      btnRecord.classList.toggle('recording', recording);
      btnLabel.textContent = recording ? 'Detener' : 'Hablar';
      btnRecord.querySelector('.voice-record-btn__icon').textContent = recording ? '⏹️' : '🎙️';
      hintEl.textContent = recording
        ? '🔴 Grabando... Habla claro y luego toca Detener'
        : (hasVoice ? 'Toca para grabar · Safari iOS requerido para voz' : '⚠️ Escribe el contexto manualmente');
    }

    // --- Manual text enables generate button too ---
    transcriptEl.addEventListener('input', () => {
      btnGenerate.hidden = !transcriptEl.value.trim();
    });

    // --- Generate Message ---
    btnGenerate.addEventListener('click', async () => {
      const context = transcriptEl.value.trim() || finalText;
      if (!context) {
        Toast.show('Primero graba o escribe el contexto');
        return;
      }

      outputArea.innerHTML = `
        <div class="skeleton" style="height:20px;margin-bottom:10px;width:60%"></div>
        <div class="skeleton" style="height:80px;margin-bottom:10px"></div>
        <div class="skeleton" style="height:40px;width:80%"></div>`;
      btnGenerate.disabled = true;
      btnGenerate.textContent = '⏳ Generando...';
      btnCopy.hidden = true;

      try {
        const msg = await generateLinkedInMessage(context);
        lastMessage = msg;
        outputArea.innerHTML = `
          <div class="voice-message-output">
            <div class="voice-message-header">
              <span>💬 Mensaje LinkedIn generado</span>
              <span class="voice-word-count">${countWords(msg)} palabras</span>
            </div>
            <p class="voice-message-text">${escapeHtml(msg).replace(/\n/g, '<br>')}</p>
          </div>`;
        btnCopy.hidden = false;
        outputArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        Toast.show('✅ Mensaje listo para copiar');
      } catch (err) {
        outputArea.innerHTML = `<p class="error-text">⚠️ ${escapeHtml(err.message)}</p>`;
        Toast.show(err.message, 4000);
      } finally {
        btnGenerate.disabled  = false;
        btnGenerate.textContent = 'Generar Mensaje LinkedIn';
      }
    });

    // --- Copy ---
    btnCopy.addEventListener('click', () => {
      const text = lastMessage;
      if (!text) return;
      navigator.clipboard.writeText(text)
        .then(() => Toast.show('📋 Mensaje copiado al portapapeles'))
        .catch(() => {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          Toast.show('📋 Mensaje copiado');
        });
    });
  }

  function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return { init };
})();
