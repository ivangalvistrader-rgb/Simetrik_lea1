/**
 * api.js — Claude API client
 * Exposed as window.API
 */
const API = (() => {
  const MODEL    = 'claude-haiku-4-5-20251001';
  const ENDPOINT = 'https://api.anthropic.com/v1/messages';

  async function getApiKey() {
    const record = await DB.get('settings', 'apiKey');
    return record?.value ?? null;
  }

  /**
   * Call Claude Haiku
   * @param {string} systemPrompt
   * @param {string} userContent
   * @param {number} maxTokens
   * @returns {Promise<string>} assistant text
   */
  async function complete(systemPrompt, userContent, maxTokens = 1024) {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('API Key no configurada. Toca ⚙️ para agregarla.');
    }

    const body = {
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    };

    let response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'x-api-key':     apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      throw new Error('Sin conexión a internet. Verifica tu red.');
    }

    if (!response.ok) {
      let errMsg = `HTTP ${response.status}`;
      try {
        const errData = await response.json();
        errMsg = errData?.error?.message || errMsg;
      } catch (_) { /* ignore */ }

      if (response.status === 401) {
        throw new Error('API Key inválida. Verifica en ⚙️ Configuración.');
      }
      if (response.status === 429) {
        throw new Error('Límite de velocidad alcanzado. Espera un momento.');
      }
      throw new Error(`Error API: ${errMsg}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  return { complete, getApiKey };
})();
