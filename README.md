# JobRadar PWA — Iván Galvis
**Búsqueda inteligente de empleo · Riesgo Financiero & IA · LATAM**

Una Progressive Web App para iPhone que convierte tu búsqueda de empleo en un proceso quirúrgico y eficiente.

---

## Módulos

| # | Módulo | Descripción | Requiere API |
|---|--------|-------------|--------------|
| 1 | **CV Optimizador ATS** | 3 plantillas de CV + IA adapta a cada vacante | Sí |
| 2 | **Radar de Vacantes** | Strings booleanos + links directos a 6 portales | No |
| 3 | **Voz → LinkedIn** | Graba tu contexto, la IA genera el mensaje | Sí |
| 4 | **Kanban** | Seguimiento de postulaciones con drag-and-drop | No |

---

## Requisitos

- **Node.js 16+** (solo para el servidor local)
- **Claude API Key** ([console.anthropic.com](https://console.anthropic.com)) — para Módulos 1 y 3
- iPhone con Safari para funcionalidad completa (PWA + voz)

---

## Instalación en iPhone (opción recomendada)

### Paso 1: Generar certificado SSL autofirmado

```bash
openssl req -x509 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -days 365 -nodes \
  -subj "/CN=localhost"
```

### Paso 2: Iniciar el servidor

```bash
node server.js
```

Verás en consola algo como:
```
🚀 JobRadar HTTPS Server iniciado

  Local:   https://localhost:3000
  Red:     https://192.168.1.45:3000  ← Usa esta en iPhone
```

### Paso 3: Instalar en iPhone

1. iPhone y computadora en la **misma red WiFi**
2. Abre **Safari** en iPhone
3. Navega a `https://TU_IP_LOCAL:3000` (la IP que aparece en consola)
4. Acepta la advertencia de certificado (toca "Mostrar detalles" → "Visitar este sitio web")
5. Toca el botón **Compartir** (⬆️) → **"Añadir a pantalla de inicio"**
6. La app aparece como ícono nativo en tu pantalla

> **Nota:** El paso de certificado solo es necesario la primera vez.

---

## Configurar la API Key

1. Obtén tu Claude API Key en [console.anthropic.com](https://console.anthropic.com)
2. En la app, toca **⚙️** (esquina superior derecha)
3. Ingresa tu API Key (empieza con `sk-ant-`)
4. Toca **Guardar**

La key se guarda **solo en tu iPhone** (IndexedDB) — nunca se envía a ningún servidor propio.

---

## Uso en Desktop (sin HTTPS)

Para probar en tu navegador de escritorio sin certificado:

```bash
node server.js
# Inicia en http://localhost:3001
```

> Módulo 3 (Voz) y Service Worker **no funcionan** en HTTP — usa HTTPS para funcionalidad completa.

---

## Estructura del Proyecto

```
├── index.html          # App shell + HTML de los 4 módulos
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker (cache-first)
├── server.js           # Servidor HTTPS local
├── css/
│   ├── variables.css   # Design tokens (colores, tipografía, spacing)
│   ├── base.css        # Reset + fixes específicos de iPhone
│   ├── layout.css      # Header, tab bar, safe area insets
│   ├── components.css  # Botones, cards, modales, toast, skeleton
│   ├── ats.css         # Módulo 1: ATS Optimizer
│   ├── radar.css       # Módulo 2: Job Radar
│   ├── voice.css       # Módulo 3: Voice to Network
│   └── kanban.css      # Módulo 4: Kanban Board
├── js/
│   ├── db.js           # IndexedDB wrapper (persistencia local)
│   ├── api.js          # Claude Haiku API client
│   ├── ats.js          # Módulo 1 + datos de plantillas CV
│   ├── radar.js        # Módulo 2
│   ├── voice.js        # Módulo 3
│   ├── kanban.js       # Módulo 4
│   └── app.js          # Bootstrap: router, settings, toast, SW
├── icons/
│   ├── icon-192.png    # PWA icon
│   └── icon-512.png    # PWA icon (alta resolución)
└── scripts/
    └── generate-icons.js  # Genera los iconos PNG
```

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| Vanilla HTML/CSS/JS | Sin frameworks — máximo rendimiento en móvil |
| Claude Haiku (`claude-haiku-4-5`) | Generación de CV + mensajes LinkedIn |
| Web Speech API (`webkitSpeechRecognition`) | Transcripción de voz — gratuito, nativo iOS |
| IndexedDB | Persistencia local — sin backend propio |
| Pointer Events API | Drag-and-drop táctil en Kanban |
| Service Worker | Modo offline + instalación como PWA |
| CSS `env(safe-area-inset-*)` | Soporte para Dynamic Island y home indicator |

---

## Notas de Seguridad

- La API Key de Claude se almacena en **IndexedDB local** en tu dispositivo
- **No existe backend propio** — todos los datos viven en tu iPhone
- Las llamadas a la API van directamente a `api.anthropic.com`
- El servidor local (`server.js`) sirve archivos estáticos únicamente

---

## Actualizaciones

Cuando actualices el código:

1. Edita el nombre del cache en `sw.js`: cambia `jobradar-v1` a `jobradar-v2`
2. Reinicia el servidor
3. En iPhone: cierra y vuelve a abrir la app (el SW actualiza automáticamente)

---

*JobRadar v1.0 · Construido para Iván Galvis · Riesgo Financiero & IA LATAM*
