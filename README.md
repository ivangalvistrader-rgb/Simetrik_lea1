# US Indices EA — Expert Advisor para MT4

EA diseñado específicamente para operar índices americanos en MetaTrader 4:
**US30 (Dow Jones)**, **US500 (S&P 500)**, **US100 (Nasdaq 100)**

---

## Estrategia: Opening Range Breakout (ORB)

### ¿Por qué ORB para índices americanos?

Los índices americanos presentan comportamientos únicos que hacen del ORB una estrategia sólida:

- **Apertura volátil (9:30-10:30 AM ET):** Los primeros 30 minutos concentran alta liquidez y dirección institucional
- **Gap y go:** Frecuentes gaps respecto al cierre anterior que continúan en la dirección del gap
- **Tendencia diaria clara:** Los índices tienden a tener días con dirección definida (trend days ~2-3x/semana)
- **Round numbers:** Niveles psicológicos como 40,000 (US30), 5,000 (US500), 18,000 (US100) actúan como imanes

### Lógica de la estrategia

```
1. Esperar a que abra la sesión US (default: 9:30 AM hora del broker)
2. Registrar el HIGH y LOW de los primeros 30 minutos → "Opening Range"
3. Validar que el rango sea coherente (ni muy estrecho ni muy amplio)
4. Filtrar dirección con EMA 20/50 y sesgo del día anterior
5. LONG si el precio cierra ENCIMA del rango alto + filtros alcistas
6. SHORT si el precio cierra DEBAJO del rango bajo + filtros bajistas
7. Stop Loss: extremo opuesto del rango (± buffer ATR)
8. Take Profit: 2.5x ATR desde la entrada
9. Cerrar todas las posiciones al fin de la sesión (default: 4:00 PM ET)
```

---

## Particularidades de los Índices Americanos

### Comportamiento de mercado

| Característica | Detalle |
|---|---|
| **Horario principal** | 9:30 AM - 4:00 PM ET |
| **Pre-market activo** | 4:00 AM - 9:30 AM ET |
| **Almuerzo tranquilo** | 12:00 PM - 2:00 PM ET (menor volatilidad) |
| **Power hour** | 3:00 PM - 4:00 PM ET (alta volatilidad al cierre) |
| **Correlación** | US30, US500 y US100 están altamente correlacionados |
| **Impacto del VIX** | VIX > 25 = mayor volatilidad, revisar tamaño de posición |

### Eventos económicos clave (filtrar manualmente o con news filter)

- **NFP** (primer viernes de cada mes): extrema volatilidad en apertura
- **FOMC** (8 veces al año): movimientos de 200-500 puntos en US30
- **CPI** (mensual): puede revertir tendencias intradía
- **Earnings season** (enero, abril, julio, octubre): mayor volatilidad sectorial

### Características por instrumento

| Instrumento | Spread típico | Volatilidad diaria | Mejor para |
|---|---|---|---|
| **US30** | 2-5 pts | 150-400 pts | Tendencias claras, menos ruido |
| **US500** | 0.5-1.5 pts | 20-60 pts | ORB, scalping con spread bajo |
| **US100** | 1-3 pts | 150-500 pts | Momentum, tendencias tecnológicas |

---

## Parámetros del EA

### Estrategia ORB

| Parámetro | Default | Descripción |
|---|---|---|
| `ORB_Minutes` | 30 | Duración del rango de apertura en minutos |
| `Session_StartHour/Min` | 9:30 | Hora de apertura de la sesión US (hora broker) |
| `Session_EndHour/Min` | 16:00 | Hora de cierre de la sesión |
| `ORB_CloseHour/Min` | 15:30 | Última hora para abrir nuevas entradas |
| `MinRangePoints` | 50 | Rango mínimo válido (evita días laterales extremos) |
| `MaxRangePoints` | 500 | Rango máximo válido (evita días de pánico extremo) |

### Filtros de Tendencia

| Parámetro | Default | Descripción |
|---|---|---|
| `EMA_Fast` | 20 | EMA rápida para tendencia intradiaria |
| `EMA_Slow` | 50 | EMA lenta para sesgo direccional |
| `UseEMAFilter` | true | Activar/desactivar filtro EMA |
| `UseDailyBias` | true | Usar cierre vs apertura del día anterior como sesgo |

### Stops y Objetivos (ATR-based)

| Parámetro | Default | Descripción |
|---|---|---|
| `ATR_Period` | 14 | Período del ATR |
| `ATR_StopMult` | 1.5 | Multiplicador ATR para SL cuando `UseORBStop=false` |
| `ATR_TargetMult` | 2.5 | Multiplicador ATR para Take Profit (R:R ~1.67) |
| `UseORBStop` | true | SL en extremo opuesto del rango ORB |

### Trailing Stop

| Parámetro | Default | Descripción |
|---|---|---|
| `UseTrailingStop` | true | Activar trailing stop dinámico |
| `TrailingATRMult` | 1.0 | Distancia del trailing stop en múltiplos de ATR |
| `TrailingActivation` | 1.0 | Activa el trailing cuando la ganancia >= N×ATR |

### Gestión de Riesgo

| Parámetro | Default | Descripción |
|---|---|---|
| `RiskPercent` | 1.0 | Riesgo por operación (% del balance) |
| `MaxDailyLossPct` | 3.0 | Pérdida diaria máxima antes de detener el EA |
| `MaxTradesPerDay` | 2 | Máximo de operaciones por día |
| `MaxSpreadPoints` | 30 | Spread máximo para entrar (rechaza si supera) |
| `Slippage` | 10 | Deslizamiento máximo aceptado |

---

## Configuración Recomendada por Instrumento

### US500 (S&P 500) — Configuración conservadora
```
ORB_Minutes     = 30
MinRangePoints  = 30
MaxRangePoints  = 200
ATR_TargetMult  = 2.0
RiskPercent     = 1.0
```

### US30 (Dow Jones) — Configuración estándar
```
ORB_Minutes     = 30
MinRangePoints  = 80
MaxRangePoints  = 500
ATR_TargetMult  = 2.5
RiskPercent     = 1.0
```

### US100 (Nasdaq 100) — Configuración agresiva
```
ORB_Minutes     = 15   // rango más corto para capturar momentum
MinRangePoints  = 100
MaxRangePoints  = 600
ATR_TargetMult  = 3.0
RiskPercent     = 0.75 // menor riesgo por mayor volatilidad
```

---

## Ajuste del Horario del Broker

Los índices americanos operan en **Eastern Time (ET)**. La hora del broker varía:

| Zona broker | Offset vs ET | Session_StartHour | Session_EndHour |
|---|---|---|---|
| UTC+0 (London) | +5h | 14 | 21 |
| UTC+2 (EET) | +7h | 16 | 23 |
| UTC+3 (MSK) | +8h | 17 | 24→0 |
| UTC-5 (ET) | 0h | 9 | 16 |

**Verificar la hora del servidor en MT4:** `Tools > Options > Server`

---

## Reglas de Uso

1. **Backtesting obligatorio:** Siempre optimizar los parámetros con datos históricos de al menos 6 meses antes de operar en real
2. **Evitar news:** Desactivar el EA manualmente los días de NFP, FOMC y CPI
3. **VIX elevado:** Cuando VIX > 30, considerar reducir `RiskPercent` a 0.5%
4. **Cuenta demo primero:** Validar la configuración del broker (spread, horarios, símbolo)
5. **No sobreoperar:** El límite de `MaxTradesPerDay=2` es intencional — la calidad supera la cantidad

---

## Arquitectura del Código

```
US_Indices_EA.mq4
├── OnInit()           → Validación de parámetros, inicialización
├── OnTick()           → Bucle principal (solo en vela nueva)
│   ├── IsNewDay()     → Reset de variables diarias
│   ├── CheckDailyLossLimit() → Protección de capital
│   ├── ManageTrailingStop()  → Gestión de posiciones abiertas
│   ├── IsPastSessionEnd()    → Cierre forzado al fin de sesión
│   ├── IsInSession()         → Filtro de horario
│   ├── BuildORB()            → Construcción del rango de apertura
│   └── CheckEntrySignal()    → Lógica de entrada
│       ├── Filtro EMA (tendencia intradiaria)
│       ├── Filtro sesgo diario
│       ├── OpenTrade()       → Envío de orden con cálculo de lote
│       └── CalculateLotSize() → Riesgo porcentual dinámico
└── CloseAllPositions() → Cierre al fin de sesión
```

---

## Versiones y Roadmap

- **v1.00** — ORB básico con filtros EMA, trailing stop, gestión de riesgo y sesión US
- **v1.10** (próximo) — Filtro automático de noticias por horario predefinido
- **v1.20** (próximo) — Panel visual en el gráfico (dashboard MT4)
- **v2.00** (futuro) — Múltiples estrategias: Mean Reversion + ORB adaptativo
