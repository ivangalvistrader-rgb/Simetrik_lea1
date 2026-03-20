//+------------------------------------------------------------------+
//|                                          EA_ForexOptimizer.mq4   |
//|                         Estrategia Forex con Optimización MT4     |
//|                                                                    |
//|  Estrategias disponibles:                                         |
//|   1 - Cruce de Medias Móviles (MA Crossover)                     |
//|   2 - RSI + Media Móvil (momentum + tendencia)                   |
//|   3 - Breakout de Bollinger Bands                                 |
//|   4 - MACD Divergencia                                            |
//+------------------------------------------------------------------+
#property copyright "EA ForexOptimizer"
#property link      ""
#property version   "1.00"
#property strict

//--- Enumeraciones
enum ENUM_STRATEGY {
   STRATEGY_MA_CROSSOVER   = 1,  // MA Crossover
   STRATEGY_RSI_MA         = 2,  // RSI + MA
   STRATEGY_BOLLINGER      = 3,  // Bollinger Breakout
   STRATEGY_MACD           = 4   // MACD Divergencia
};

enum ENUM_LOT_MODE {
   LOT_FIXED    = 0,  // Lote fijo
   LOT_PERCENT  = 1   // % del capital
};

//--- ============================================================
//    PARÁMETROS DE ENTRADA (optimizables en Strategy Tester)
//--- ============================================================

//--- Selección de estrategia
input ENUM_STRATEGY InpStrategy      = STRATEGY_MA_CROSSOVER; // Estrategia

//--- Medias Móviles
input int    InpFastMAPeriod         = 10;    // Periodo MA Rápida  [5-50 paso 5]
input int    InpSlowMAPeriod         = 30;    // Periodo MA Lenta   [20-200 paso 10]
input int    InpSignalMAPeriod       = 5;     // Periodo MA Señal   [3-20 paso 1]
input ENUM_MA_METHOD InpMAMethod     = MODE_EMA; // Método MA

//--- RSI
input int    InpRSIPeriod            = 14;    // Periodo RSI        [7-21 paso 1]
input double InpRSIOverBought        = 70.0;  // RSI Sobrecompra    [65-80 paso 5]
input double InpRSIOverSold          = 30.0;  // RSI Sobreventa     [20-35 paso 5]

//--- Bollinger Bands
input int    InpBBPeriod             = 20;    // Periodo BB         [10-50 paso 5]
input double InpBBDeviation          = 2.0;   // Desviación BB      [1.5-3.0 paso 0.5]

//--- MACD
input int    InpMACDFast             = 12;    // MACD EMA Rápida    [8-16 paso 2]
input int    InpMACDSlow             = 26;    // MACD EMA Lenta     [18-34 paso 2]
input int    InpMACDSignal           = 9;     // MACD Señal         [5-15 paso 2]

//--- ATR para gestión de riesgo dinámica
input int    InpATRPeriod            = 14;    // Periodo ATR        [10-20 paso 2]
input double InpATRMultSL            = 1.5;   // ATR multiplicador SL [1.0-3.0 paso 0.5]
input double InpATRMultTP            = 2.5;   // ATR multiplicador TP [1.5-4.0 paso 0.5]

//--- Stop Loss / Take Profit fijos (en pips, 0 = usar ATR)
input double InpStopLossPips         = 0;     // Stop Loss pips (0=ATR)
input double InpTakeProfitPips       = 0;     // Take Profit pips (0=ATR)

//--- Trailing Stop
input bool   InpUseTrailing          = true;  // Usar Trailing Stop
input double InpTrailingPips         = 20;    // Trailing Stop pips [10-50 paso 5]
input double InpTrailingStep         = 5;     // Trailing Step pips [2-10 paso 1]

//--- Gestión de lotes / riesgo
input ENUM_LOT_MODE InpLotMode       = LOT_PERCENT; // Modo de lotaje
input double InpFixedLot             = 0.01;  // Lote fijo
input double InpRiskPercent          = 1.0;   // Riesgo % capital   [0.5-3.0 paso 0.5]
input double InpMaxLot               = 1.0;   // Lote máximo

//--- Filtros adicionales
input bool   InpUseTrendFilter       = true;  // Filtro de tendencia (MA200)
input int    InpTrendMAPeriod        = 200;   // Periodo MA tendencia
input bool   InpUseSessions          = false; // Filtrar por sesión
input int    InpSessionStartHour     = 8;     // Hora inicio sesión (UTC)
input int    InpSessionEndHour       = 20;    // Hora fin sesión (UTC)
input int    InpMaxSpreadPips        = 3;     // Spread máximo pips [1-10 paso 1]

//--- Control de posiciones
input int    InpMagicNumber          = 12345; // Magic Number
input int    InpMaxPositions         = 1;     // Máximo posiciones abiertas
input bool   InpAllowBuy             = true;  // Permitir compras
input bool   InpAllowSell            = true;  // Permitir ventas

//--- ============================================================
//    VARIABLES GLOBALES
//--- ============================================================
double g_point;
int    g_digits;
double g_lastBarTime;

//+------------------------------------------------------------------+
//| Inicialización del EA                                            |
//+------------------------------------------------------------------+
int OnInit() {
   // Validaciones básicas
   if (InpFastMAPeriod >= InpSlowMAPeriod) {
      Print("[EA] ERROR: MA Rápida debe ser menor que MA Lenta");
      return INIT_PARAMETERS_INCORRECT;
   }
   if (InpRiskPercent <= 0 || InpRiskPercent > 10) {
      Print("[EA] ERROR: Riesgo debe estar entre 0.1 y 10%");
      return INIT_PARAMETERS_INCORRECT;
   }

   // Configurar precisión según el símbolo
   g_digits = (int)MarketInfo(Symbol(), MODE_DIGITS);
   g_point  = (g_digits == 3 || g_digits == 5) ? Point * 10 : Point;

   Print("[EA] Inicializado - Estrategia: ", EnumToString(InpStrategy));
   Print("[EA] Símbolo: ", Symbol(), " | Timeframe: ", Period(), " | Digits: ", g_digits);

   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Deinicialización                                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
   Print("[EA] Detenido - Razón: ", reason);
}

//+------------------------------------------------------------------+
//| Tick principal                                                   |
//+------------------------------------------------------------------+
void OnTick() {
   // Ejecutar solo en nueva vela para evitar re-entradas
   if (!IsNewBar()) return;

   // Verificar condiciones de mercado
   if (!CheckMarketConditions()) return;

   // Gestión del trailing stop en posiciones abiertas
   if (InpUseTrailing) ManageTrailingStop();

   // Contar posiciones abiertas por este EA
   int openPositions = CountOpenPositions();
   if (openPositions >= InpMaxPositions) return;

   // Obtener señales según la estrategia seleccionada
   int signal = GetSignal();

   // Ejecutar la señal
   if (signal == 1 && InpAllowBuy)  OpenOrder(OP_BUY);
   if (signal == -1 && InpAllowSell) OpenOrder(OP_SELL);
}

//+------------------------------------------------------------------+
//| Detectar nueva vela                                              |
//+------------------------------------------------------------------+
bool IsNewBar() {
   double currentBarTime = (double)Time[0];
   if (currentBarTime != g_lastBarTime) {
      g_lastBarTime = currentBarTime;
      return true;
   }
   return false;
}

//+------------------------------------------------------------------+
//| Verificar condiciones de mercado                                 |
//+------------------------------------------------------------------+
bool CheckMarketConditions() {
   // Verificar spread
   double currentSpread = MarketInfo(Symbol(), MODE_SPREAD) * Point / g_point;
   if (currentSpread > InpMaxSpreadPips * g_point / g_point) {
      // Comparación en pips reales
      double spreadPips = MarketInfo(Symbol(), MODE_SPREAD) / (g_point / Point);
      if (spreadPips > InpMaxSpreadPips) return false;
   }

   // Verificar sesión de trading
   if (InpUseSessions) {
      int hour = TimeHour(TimeCurrent());
      if (hour < InpSessionStartHour || hour >= InpSessionEndHour) return false;
   }

   // Verificar que hay suficientes barras
   if (Bars < MathMax(InpSlowMAPeriod, InpTrendMAPeriod) + 10) return false;

   return true;
}

//+------------------------------------------------------------------+
//| Obtener señal según estrategia seleccionada                      |
//+------------------------------------------------------------------+
int GetSignal() {
   switch (InpStrategy) {
      case STRATEGY_MA_CROSSOVER: return SignalMACrossover();
      case STRATEGY_RSI_MA:       return SignalRSIMA();
      case STRATEGY_BOLLINGER:    return SignalBollinger();
      case STRATEGY_MACD:         return SignalMACD();
      default:                    return 0;
   }
}

//+------------------------------------------------------------------+
//| Estrategia 1: Cruce de Medias Móviles                           |
//+------------------------------------------------------------------+
int SignalMACrossover() {
   double fastMA_now  = iMA(NULL, 0, InpFastMAPeriod, 0, InpMAMethod, PRICE_CLOSE, 1);
   double fastMA_prev = iMA(NULL, 0, InpFastMAPeriod, 0, InpMAMethod, PRICE_CLOSE, 2);
   double slowMA_now  = iMA(NULL, 0, InpSlowMAPeriod, 0, InpMAMethod, PRICE_CLOSE, 1);
   double slowMA_prev = iMA(NULL, 0, InpSlowMAPeriod, 0, InpMAMethod, PRICE_CLOSE, 2);

   // Filtro de tendencia
   if (InpUseTrendFilter) {
      double trendMA = iMA(NULL, 0, InpTrendMAPeriod, 0, MODE_SMA, PRICE_CLOSE, 1);
      double price   = Close[1];
      // Cruce alcista solo si precio sobre MA200, bajista solo si precio bajo MA200
      if (fastMA_now > slowMA_now && fastMA_prev <= slowMA_prev && price > trendMA) return 1;
      if (fastMA_now < slowMA_now && fastMA_prev >= slowMA_prev && price < trendMA) return -1;
   } else {
      if (fastMA_now > slowMA_now && fastMA_prev <= slowMA_prev) return 1;
      if (fastMA_now < slowMA_now && fastMA_prev >= slowMA_prev) return -1;
   }
   return 0;
}

//+------------------------------------------------------------------+
//| Estrategia 2: RSI + Media Móvil                                 |
//+------------------------------------------------------------------+
int SignalRSIMA() {
   double rsi      = iRSI(NULL, 0, InpRSIPeriod, PRICE_CLOSE, 1);
   double rsi_prev = iRSI(NULL, 0, InpRSIPeriod, PRICE_CLOSE, 2);
   double ma       = iMA(NULL, 0, InpSlowMAPeriod, 0, InpMAMethod, PRICE_CLOSE, 1);
   double price    = Close[1];

   // Compra: RSI sale de sobreventa y precio sobre MA
   if (rsi_prev < InpRSIOverSold && rsi >= InpRSIOverSold && price > ma) return 1;
   // Venta: RSI sale de sobrecompra y precio bajo MA
   if (rsi_prev > InpRSIOverBought && rsi <= InpRSIOverBought && price < ma) return -1;

   return 0;
}

//+------------------------------------------------------------------+
//| Estrategia 3: Breakout de Bollinger Bands                       |
//+------------------------------------------------------------------+
int SignalBollinger() {
   double bbUpper = iBands(NULL, 0, InpBBPeriod, InpBBDeviation, 0, PRICE_CLOSE, MODE_UPPER, 1);
   double bbLower = iBands(NULL, 0, InpBBPeriod, InpBBDeviation, 0, PRICE_CLOSE, MODE_LOWER, 1);
   double bbMid   = iBands(NULL, 0, InpBBPeriod, InpBBDeviation, 0, PRICE_CLOSE, MODE_MAIN,  1);
   double close   = Close[1];
   double open    = Open[1];

   // Vela cierra fuera de la banda superior (breakout alcista)
   if (close > bbUpper && open < bbUpper) {
      if (!InpUseTrendFilter) return 1;
      double trendMA = iMA(NULL, 0, InpTrendMAPeriod, 0, MODE_SMA, PRICE_CLOSE, 1);
      if (close > trendMA) return 1;
   }
   // Vela cierra fuera de la banda inferior (breakout bajista)
   if (close < bbLower && open > bbLower) {
      if (!InpUseTrendFilter) return -1;
      double trendMA2 = iMA(NULL, 0, InpTrendMAPeriod, 0, MODE_SMA, PRICE_CLOSE, 1);
      if (close < trendMA2) return -1;
   }
   return 0;
}

//+------------------------------------------------------------------+
//| Estrategia 4: MACD Divergencia/Cruce                            |
//+------------------------------------------------------------------+
int SignalMACD() {
   double macd_now     = iMACD(NULL, 0, InpMACDFast, InpMACDSlow, InpMACDSignal, PRICE_CLOSE, MODE_MAIN,   1);
   double macd_prev    = iMACD(NULL, 0, InpMACDFast, InpMACDSlow, InpMACDSignal, PRICE_CLOSE, MODE_MAIN,   2);
   double signal_now   = iMACD(NULL, 0, InpMACDFast, InpMACDSlow, InpMACDSignal, PRICE_CLOSE, MODE_SIGNAL, 1);
   double signal_prev  = iMACD(NULL, 0, InpMACDFast, InpMACDSlow, InpMACDSignal, PRICE_CLOSE, MODE_SIGNAL, 2);

   // Cruce alcista del MACD
   if (macd_now > signal_now && macd_prev <= signal_prev && macd_now < 0) return 1;
   // Cruce bajista del MACD
   if (macd_now < signal_now && macd_prev >= signal_prev && macd_now > 0) return -1;

   return 0;
}

//+------------------------------------------------------------------+
//| Calcular lote según gestión de riesgo                           |
//+------------------------------------------------------------------+
double CalculateLot(double slPips) {
   if (InpLotMode == LOT_FIXED) return NormalizeLot(InpFixedLot);

   double balance    = AccountBalance();
   double riskAmount = balance * InpRiskPercent / 100.0;
   double tickValue  = MarketInfo(Symbol(), MODE_TICKVALUE);
   double tickSize   = MarketInfo(Symbol(), MODE_TICKSIZE);
   double lotStep    = MarketInfo(Symbol(), MODE_LOTSTEP);
   double minLot     = MarketInfo(Symbol(), MODE_MINLOT);

   if (slPips <= 0 || tickValue <= 0) return NormalizeLot(minLot);

   double lot = riskAmount / (slPips * tickValue / tickSize * g_point);
   lot = MathMax(minLot, MathMin(InpMaxLot, lot));
   lot = MathFloor(lot / lotStep) * lotStep;

   return NormalizeLot(lot);
}

//+------------------------------------------------------------------+
//| Normalizar lotaje                                               |
//+------------------------------------------------------------------+
double NormalizeLot(double lot) {
   double minLot  = MarketInfo(Symbol(), MODE_MINLOT);
   double maxLot  = MarketInfo(Symbol(), MODE_MAXLOT);
   double lotStep = MarketInfo(Symbol(), MODE_LOTSTEP);
   int    decimals = (int)MathRound(-MathLog10(lotStep));
   return NormalizeDouble(MathMax(minLot, MathMin(maxLot, lot)), decimals);
}

//+------------------------------------------------------------------+
//| Calcular Stop Loss y Take Profit                                |
//+------------------------------------------------------------------+
void CalculateSLTP(int orderType, double &sl, double &tp) {
   double atr = iATR(NULL, 0, InpATRPeriod, 1);

   double slDistance = (InpStopLossPips > 0)   ? InpStopLossPips * g_point   : atr * InpATRMultSL;
   double tpDistance = (InpTakeProfitPips > 0)  ? InpTakeProfitPips * g_point : atr * InpATRMultTP;

   double ask = MarketInfo(Symbol(), MODE_ASK);
   double bid = MarketInfo(Symbol(), MODE_BID);

   if (orderType == OP_BUY) {
      sl = NormalizeDouble(ask - slDistance, g_digits);
      tp = NormalizeDouble(ask + tpDistance, g_digits);
   } else {
      sl = NormalizeDouble(bid + slDistance, g_digits);
      tp = NormalizeDouble(bid - tpDistance, g_digits);
   }
}

//+------------------------------------------------------------------+
//| Abrir orden                                                     |
//+------------------------------------------------------------------+
bool OpenOrder(int orderType) {
   double sl, tp;
   CalculateSLTP(orderType, sl, tp);

   // Calcular pips de SL para dimensionar el lote
   double slPips = 0;
   if (orderType == OP_BUY)
      slPips = (MarketInfo(Symbol(), MODE_ASK) - sl) / g_point;
   else
      slPips = (sl - MarketInfo(Symbol(), MODE_BID)) / g_point;

   double lot   = CalculateLot(slPips);
   double price = (orderType == OP_BUY) ? MarketInfo(Symbol(), MODE_ASK) : MarketInfo(Symbol(), MODE_BID);
   int    slippage = 3;

   int ticket = OrderSend(Symbol(), orderType, lot, price, slippage, sl, tp,
                           "EA_ForexOptimizer", InpMagicNumber, 0,
                           (orderType == OP_BUY) ? clrBlue : clrRed);

   if (ticket < 0) {
      Print("[EA] ERROR al abrir orden: ", GetLastError(),
            " | Tipo: ", (orderType == OP_BUY ? "BUY" : "SELL"),
            " | Lote: ", lot, " | SL: ", sl, " | TP: ", tp);
      return false;
   }

   Print("[EA] Orden abierta - Ticket: ", ticket,
         " | ", (orderType == OP_BUY ? "BUY" : "SELL"),
         " | Lote: ", lot, " | Precio: ", price,
         " | SL: ", sl, " | TP: ", tp);
   return true;
}

//+------------------------------------------------------------------+
//| Gestionar Trailing Stop                                         |
//+------------------------------------------------------------------+
void ManageTrailingStop() {
   double trailingDist = InpTrailingPips * g_point;
   double trailingStep = InpTrailingStep * g_point;

   for (int i = 0; i < OrdersTotal(); i++) {
      if (!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if (OrderSymbol() != Symbol()) continue;
      if (OrderMagicNumber() != InpMagicNumber) continue;

      if (OrderType() == OP_BUY) {
         double newSL = NormalizeDouble(Bid - trailingDist, g_digits);
         if (newSL > OrderStopLoss() + trailingStep) {
            OrderModify(OrderTicket(), OrderOpenPrice(), newSL, OrderTakeProfit(), 0, clrBlue);
         }
      } else if (OrderType() == OP_SELL) {
         double newSL = NormalizeDouble(Ask + trailingDist, g_digits);
         if (newSL < OrderStopLoss() - trailingStep || OrderStopLoss() == 0) {
            OrderModify(OrderTicket(), OrderOpenPrice(), newSL, OrderTakeProfit(), 0, clrRed);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Contar posiciones abiertas del EA                               |
//+------------------------------------------------------------------+
int CountOpenPositions() {
   int count = 0;
   for (int i = 0; i < OrdersTotal(); i++) {
      if (!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if (OrderSymbol() == Symbol() && OrderMagicNumber() == InpMagicNumber) count++;
   }
   return count;
}

//+------------------------------------------------------------------+
//| Función de optimización personalizada (Criterio Custom)         |
//|  MT4 la llama al finalizar cada pasada del Tester               |
//+------------------------------------------------------------------+
double OnTester() {
   double profit        = TesterStatistics(STAT_PROFIT);
   double drawdown      = TesterStatistics(STAT_BALANCE_DD);
   double trades        = TesterStatistics(STAT_TRADES);
   double profitFactor  = TesterStatistics(STAT_PROFIT_FACTOR);
   double sharpRatio    = TesterStatistics(STAT_SHARPE_RATIO);
   double winRate       = TesterStatistics(STAT_WIN_TRADES) / (trades > 0 ? trades : 1);

   // Penalizar si hay muy pocas operaciones (baja estadística)
   if (trades < 30) return 0;

   // Criterio compuesto:
   // 40% Profit Factor + 30% Sharpe + 20% Win Rate + 10% ganancia neta
   double maxDD         = (drawdown > 0) ? drawdown : 1;
   double score         = (profitFactor * 0.40)
                        + (sharpRatio   * 0.30)
                        + (winRate      * 0.20)
                        + (profit / maxDD * 0.10);

   return score;
}
//+------------------------------------------------------------------+
