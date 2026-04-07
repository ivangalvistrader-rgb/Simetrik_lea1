//+------------------------------------------------------------------+
//|                                              US_Indices_EA.mq4   |
//|                           Expert Advisor for US Indices (MT4)    |
//|  Instrumentos: US30 (Dow), US500 (S&P 500), US100 (Nasdaq 100)  |
//|                                                                  |
//|  Estrategia principal: Opening Range Breakout (ORB)              |
//|  - Define el rango de apertura en los primeros N minutos         |
//|  - Opera breakouts validados por tendencia (EMA) y volatilidad   |
//|  - Gestión de riesgo: % fijo de cuenta, trailing stop, ATR stop  |
//|  - Filtros de sesión: solo opera en ventana US (configurable)    |
//|  - Filtro de spread: evita entrar con spread anormal             |
//|  - Límite de pérdida diaria y máximo de operaciones por día      |
//|                                                                  |
//|  IMPORTANTE: Optimizar parámetros en datos históricos de cada    |
//|  instrumento antes de operar en cuenta real.                     |
//+------------------------------------------------------------------+
#property copyright "Simetrik EA - US Indices"
#property link      ""
#property version   "1.00"
#property strict

//--- Inputs: Estrategia ORB
input int    ORB_Minutes        = 30;     // Duración del rango de apertura (min)
input int    Session_StartHour  = 9;      // Hora inicio sesión US (hora del broker)
input int    Session_StartMin   = 30;     // Minuto inicio sesión US
input int    Session_EndHour    = 16;     // Hora cierre sesión US
input int    Session_EndMin     = 0;      // Minuto cierre sesión US
input int    ORB_CloseHour      = 15;     // Hora máxima para abrir nuevas entradas
input int    ORB_CloseMin       = 30;     // Minuto máxima para abrir nuevas entradas

//--- Inputs: Filtros de tendencia
input int    EMA_Fast           = 20;     // EMA rápida (tendencia intradiaria)
input int    EMA_Slow           = 50;     // EMA lenta (sesgo direccional)
input bool   UseEMAFilter       = true;   // Usar filtro de tendencia EMA
input bool   UseDailyBias       = true;   // Usar sesgo del cierre de ayer (Daily)

//--- Inputs: Volatilidad y stops
input int    ATR_Period         = 14;     // Período ATR para stops dinámicos
input double ATR_StopMult       = 1.5;    // Multiplicador ATR para Stop Loss
input double ATR_TargetMult     = 2.5;    // Multiplicador ATR para Take Profit
input bool   UseORBStop         = true;   // Stop en extremo opuesto del rango ORB
input double MinRangePoints     = 50;     // Rango mínimo ORB para operar (puntos)
input double MaxRangePoints     = 500;    // Rango máximo ORB para operar (puntos)

//--- Inputs: Trailing Stop
input bool   UseTrailingStop    = true;   // Activar trailing stop
input double TrailingATRMult    = 1.0;    // Multiplicador ATR para trailing stop
input double TrailingActivation = 1.0;    // Activar trailing cuando ganancia >= N*ATR

//--- Inputs: Gestión de riesgo
input double RiskPercent        = 1.0;    // Riesgo por operación (% del balance)
input double MaxDailyLossPct    = 3.0;    // Pérdida diaria máxima (% del balance)
input int    MaxTradesPerDay    = 2;      // Máximo de trades por día
input int    MaxSpreadPoints    = 30;     // Spread máximo permitido (puntos)
input int    Slippage           = 10;     // Deslizamiento máximo (puntos)

//--- Inputs: Identificación
input int    MagicNumber        = 202401; // Número mágico del EA
input string TradeComment       = "US_ORB"; // Comentario de las operaciones

//--- Variables globales
datetime lastBarTime      = 0;
datetime sessionDate      = 0;
double   orbHigh          = 0;
double   orbLow           = 0;
bool     orbFormed        = false;
bool     longTriggered    = false;
bool     shortTriggered   = false;
int      tradesToday      = 0;
double   dailyStartBalance= 0;
double   lastDayBalance   = 0;
bool     dailyLossReached = false;

//+------------------------------------------------------------------+
//| Expert initialization                                            |
//+------------------------------------------------------------------+
int OnInit()
{
   if(EMA_Fast >= EMA_Slow)
   {
      Alert("Error: EMA_Fast debe ser menor que EMA_Slow");
      return INIT_PARAMETERS_INCORRECT;
   }
   if(RiskPercent <= 0 || RiskPercent > 10)
   {
      Alert("Error: RiskPercent debe estar entre 0.1 y 10");
      return INIT_PARAMETERS_INCORRECT;
   }

   Print("=== US Indices EA inicializado ===");
   Print("Instrumento: ", Symbol(), " | TF: ", Period(), " min");
   Print("Sesion US: ", Session_StartHour, ":", Session_StartMin,
         " - ", Session_EndHour, ":", Session_EndMin);
   Print("ORB: ", ORB_Minutes, " minutos | Riesgo: ", RiskPercent, "%");

   ResetDailyVars();
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                          |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("US Indices EA detenido. Razón: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   //--- Solo operar en velas nuevas para evitar re-entradas
   datetime currentBar = iTime(NULL, 0, 0);
   if(currentBar == lastBarTime) return;
   lastBarTime = currentBar;

   //--- Reiniciar variables al inicio de nuevo día
   if(IsNewDay())
   {
      ResetDailyVars();
   }

   //--- Verificar límite de pérdida diaria
   if(CheckDailyLossLimit()) return;

   //--- Gestionar trailing stop en posiciones abiertas
   if(UseTrailingStop) ManageTrailingStop();

   //--- Cerrar posiciones al fin de la sesión
   if(IsPastSessionEnd()) { CloseAllPositions(); return; }

   //--- Solo continuar dentro de la sesión US
   if(!IsInSession()) return;

   //--- Construir/actualizar el rango ORB
   BuildORB();

   //--- Si el rango está formado y hay cupo para operar
   if(!orbFormed) return;
   if(tradesToday >= MaxTradesPerDay) return;
   if(IsPastEntryDeadline()) return;

   //--- Verificar spread
   double spread = MarketInfo(Symbol(), MODE_SPREAD);
   if(spread > MaxSpreadPoints) return;

   //--- Buscar señal de entrada
   CheckEntrySignal();
}

//+------------------------------------------------------------------+
//| Construye el Opening Range (primeros ORB_Minutes de la sesión)   |
//+------------------------------------------------------------------+
void BuildORB()
{
   datetime sessionOpen = GetSessionOpenTime();

   //--- Reiniciar ORB al inicio de cada sesión
   if(sessionDate != TimeCurrent() / 86400)
   {
      orbHigh       = 0;
      orbLow        = 0;
      orbFormed     = false;
      longTriggered = false;
      shortTriggered= false;
   }

   //--- Si el ORB ya está formado, no recalcular
   if(orbFormed) return;

   //--- Verificar si ya transcurrieron los minutos del ORB
   datetime orbEnd = sessionOpen + ORB_Minutes * 60;
   if(TimeCurrent() < sessionOpen) return;  // aún no empieza la sesión
   if(TimeCurrent() < orbEnd)              // dentro del período ORB
   {
      // Actualizar high/low del rango en construcción
      int barsInORB = (int)((TimeCurrent() - sessionOpen) / (Period() * 60)) + 1;
      double highTemp = 0, lowTemp = 999999;
      for(int i = barsInORB; i >= 0; i--)
      {
         double h = iHigh(NULL, 0, i);
         double l = iLow(NULL, 0, i);
         if(h > highTemp) highTemp = h;
         if(l < lowTemp)  lowTemp  = l;
      }
      orbHigh = highTemp;
      orbLow  = lowTemp;
      return;
   }

   //--- ORB completado: validar rango
   double rangePoints = (orbHigh - orbLow) / Point;
   if(rangePoints < MinRangePoints || rangePoints > MaxRangePoints)
   {
      // Rango inválido: demasiado estrecho o demasiado amplio
      Print("ORB rechazado. Rango=", rangePoints, " pts | Min=", MinRangePoints,
            " Max=", MaxRangePoints);
      orbFormed = false;
      return;
   }

   orbFormed = true;
   Print("ORB formado | Alto=", DoubleToStr(orbHigh, Digits),
         " | Bajo=", DoubleToStr(orbLow, Digits),
         " | Rango=", DoubleToStr(rangePoints, 0), " pts");
}

//+------------------------------------------------------------------+
//| Verifica y ejecuta señal de entrada                              |
//+------------------------------------------------------------------+
void CheckEntrySignal()
{
   double closePrice = iClose(NULL, 0, 1); // cierre de la vela anterior
   double atr        = iATR(NULL, 0, ATR_Period, 1);

   bool trendUp   = true;
   bool trendDown = true;

   //--- Filtro EMA intradiario
   if(UseEMAFilter)
   {
      double emaFast = iMA(NULL, 0, EMA_Fast, 0, MODE_EMA, PRICE_CLOSE, 1);
      double emaSlow = iMA(NULL, 0, EMA_Slow, 0, MODE_EMA, PRICE_CLOSE, 1);
      trendUp   = (emaFast > emaSlow);
      trendDown = (emaFast < emaSlow);
   }

   //--- Filtro sesgo diario (cierre vs apertura de ayer)
   if(UseDailyBias)
   {
      double yesterdayClose = iClose(NULL, PERIOD_D1, 1);
      double yesterdayOpen  = iOpen(NULL, PERIOD_D1, 1);
      bool dailyBullish = (yesterdayClose > yesterdayOpen);
      bool dailyBearish = (yesterdayClose < yesterdayOpen);
      trendUp   = trendUp   && dailyBullish;
      trendDown = trendDown && dailyBearish;
   }

   //--- Señal LONG: precio cierra por encima del ORB High
   if(!longTriggered && closePrice > orbHigh && trendUp)
   {
      double stopLoss, takeProfit;

      if(UseORBStop)
         stopLoss = orbLow - atr * 0.3;   // debajo del mínimo del rango + buffer ATR
      else
         stopLoss = closePrice - atr * ATR_StopMult;

      takeProfit = closePrice + atr * ATR_TargetMult;

      if(OpenTrade(OP_BUY, stopLoss, takeProfit))
         longTriggered = true;
      return;
   }

   //--- Señal SHORT: precio cierra por debajo del ORB Low
   if(!shortTriggered && closePrice < orbLow && trendDown)
   {
      double stopLoss, takeProfit;

      if(UseORBStop)
         stopLoss = orbHigh + atr * 0.3;  // encima del máximo del rango + buffer ATR
      else
         stopLoss = closePrice + atr * ATR_StopMult;

      takeProfit = closePrice - atr * ATR_TargetMult;

      if(OpenTrade(OP_SELL, stopLoss, takeProfit))
         shortTriggered = true;
      return;
   }
}

//+------------------------------------------------------------------+
//| Abre una operación con lotaje calculado por riesgo               |
//+------------------------------------------------------------------+
bool OpenTrade(int type, double sl, double tp)
{
   double entryPrice = (type == OP_BUY) ? Ask : Bid;
   double slDistance = MathAbs(entryPrice - sl);

   if(slDistance <= 0)
   {
      Print("Error: distancia de SL inválida.");
      return false;
   }

   double lots = CalculateLotSize(slDistance);
   if(lots <= 0) return false;

   int ticket = OrderSend(
      Symbol(), type, lots, entryPrice,
      Slippage, sl, tp,
      TradeComment, MagicNumber, 0,
      (type == OP_BUY) ? clrDodgerBlue : clrOrangeRed
   );

   if(ticket < 0)
   {
      Print("Error al abrir orden: ", GetLastError(),
            " | Tipo=", (type == OP_BUY ? "BUY" : "SELL"),
            " | Lotes=", lots, " | SL=", sl, " | TP=", tp);
      return false;
   }

   tradesToday++;
   Print(">>> Orden abierta | Ticket=", ticket,
         " | ", (type == OP_BUY ? "BUY" : "SELL"),
         " | Lotes=", lots,
         " | Entrada=", entryPrice,
         " | SL=", sl, " | TP=", tp);
   return true;
}

//+------------------------------------------------------------------+
//| Calcula el tamaño de lote basado en riesgo porcentual            |
//+------------------------------------------------------------------+
double CalculateLotSize(double slDistance)
{
   double balance      = AccountBalance();
   double riskAmount   = balance * RiskPercent / 100.0;
   double tickValue    = MarketInfo(Symbol(), MODE_TICKVALUE);
   double tickSize     = MarketInfo(Symbol(), MODE_TICKSIZE);
   double minLot       = MarketInfo(Symbol(), MODE_MINLOT);
   double maxLot       = MarketInfo(Symbol(), MODE_MAXLOT);
   double lotStep      = MarketInfo(Symbol(), MODE_LOTSTEP);

   if(tickValue <= 0 || tickSize <= 0)
   {
      Print("Error: tickValue o tickSize inválidos.");
      return 0;
   }

   // Valor monetario por pip por lote = tickValue * (slDistance/tickSize)
   double valuePerLot  = (slDistance / tickSize) * tickValue;
   if(valuePerLot <= 0) return 0;

   double lots = riskAmount / valuePerLot;

   // Normalizar al paso de lote del broker
   lots = MathFloor(lots / lotStep) * lotStep;
   lots = MathMax(lots, minLot);
   lots = MathMin(lots, maxLot);

   return NormalizeDouble(lots, 2);
}

//+------------------------------------------------------------------+
//| Gestión de trailing stop por ATR                                 |
//+------------------------------------------------------------------+
void ManageTrailingStop()
{
   double atr = iATR(NULL, 0, ATR_Period, 1);

   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if(OrderMagicNumber() != MagicNumber) continue;
      if(OrderSymbol() != Symbol()) continue;

      double newSL = 0;
      double currentSL = OrderStopLoss();
      double openPrice  = OrderOpenPrice();

      if(OrderType() == OP_BUY)
      {
         double trailLevel = Bid - atr * TrailingATRMult;
         double activationLevel = openPrice + atr * TrailingActivation;

         // Solo activar trailing si el precio superó el nivel de activación
         if(Bid < activationLevel) continue;

         trailLevel = NormalizeDouble(trailLevel, Digits);
         if(trailLevel > currentSL && trailLevel < Bid)
            newSL = trailLevel;
      }
      else if(OrderType() == OP_SELL)
      {
         double trailLevel = Ask + atr * TrailingATRMult;
         double activationLevel = openPrice - atr * TrailingActivation;

         if(Ask > activationLevel) continue;

         trailLevel = NormalizeDouble(trailLevel, Digits);
         if((currentSL == 0 || trailLevel < currentSL) && trailLevel > Ask)
            newSL = trailLevel;
      }

      if(newSL > 0)
      {
         bool modified = OrderModify(OrderTicket(), OrderOpenPrice(), newSL,
                                     OrderTakeProfit(), 0, clrGold);
         if(!modified)
            Print("Error al modificar trailing stop: ", GetLastError());
      }
   }
}

//+------------------------------------------------------------------+
//| Cierra todas las posiciones del EA en el símbolo actual          |
//+------------------------------------------------------------------+
void CloseAllPositions()
{
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if(OrderMagicNumber() != MagicNumber) continue;
      if(OrderSymbol() != Symbol()) continue;

      double closePrice = (OrderType() == OP_BUY) ? Bid : Ask;
      bool closed = OrderClose(OrderTicket(), OrderLots(), closePrice, Slippage, clrWhite);
      if(!closed)
         Print("Error al cerrar orden ", OrderTicket(), ": ", GetLastError());
      else
         Print("Orden cerrada al fin de sesión | Ticket=", OrderTicket());
   }
}

//+------------------------------------------------------------------+
//| Verifica el límite de pérdida diaria                             |
//+------------------------------------------------------------------+
bool CheckDailyLossLimit()
{
   if(dailyLossReached) { CloseAllPositions(); return true; }

   double currentEquity = AccountEquity();
   double lossAmount    = dailyStartBalance - currentEquity;
   double lossLimit     = dailyStartBalance * MaxDailyLossPct / 100.0;

   if(lossAmount >= lossLimit)
   {
      Print("!!! LÍMITE DE PÉRDIDA DIARIA ALCANZADO !!!");
      Print("Pérdida: $", DoubleToStr(lossAmount, 2),
            " | Límite: $", DoubleToStr(lossLimit, 2));
      dailyLossReached = true;
      CloseAllPositions();
      return true;
   }
   return false;
}

//+------------------------------------------------------------------+
//| Reinicia variables al inicio de nuevo día                        |
//+------------------------------------------------------------------+
void ResetDailyVars()
{
   tradesToday      = 0;
   dailyLossReached = false;
   dailyStartBalance= AccountBalance();
   sessionDate      = TimeCurrent() / 86400;
   orbHigh          = 0;
   orbLow           = 0;
   orbFormed        = false;
   longTriggered    = false;
   shortTriggered   = false;

   Print("--- Nuevo día | Balance inicial: $", DoubleToStr(dailyStartBalance, 2));
}

//+------------------------------------------------------------------+
//| Verifica si estamos dentro de la sesión US configurada           |
//+------------------------------------------------------------------+
bool IsInSession()
{
   int hour  = TimeHour(TimeCurrent());
   int min   = TimeMinute(TimeCurrent());
   int nowMins = hour * 60 + min;
   int startMins = Session_StartHour * 60 + Session_StartMin;
   int endMins   = Session_EndHour   * 60 + Session_EndMin;
   return (nowMins >= startMins && nowMins < endMins);
}

//+------------------------------------------------------------------+
//| Verifica si ya pasó el horario límite para nuevas entradas       |
//+------------------------------------------------------------------+
bool IsPastEntryDeadline()
{
   int hour  = TimeHour(TimeCurrent());
   int min   = TimeMinute(TimeCurrent());
   int nowMins   = hour * 60 + min;
   int limitMins = ORB_CloseHour * 60 + ORB_CloseMin;
   return (nowMins >= limitMins);
}

//+------------------------------------------------------------------+
//| Verifica si ya pasó el fin de la sesión                          |
//+------------------------------------------------------------------+
bool IsPastSessionEnd()
{
   int hour  = TimeHour(TimeCurrent());
   int min   = TimeMinute(TimeCurrent());
   int nowMins = hour * 60 + min;
   int endMins = Session_EndHour * 60 + Session_EndMin;
   return (nowMins >= endMins);
}

//+------------------------------------------------------------------+
//| Obtiene el timestamp de apertura de la sesión del día actual     |
//+------------------------------------------------------------------+
datetime GetSessionOpenTime()
{
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   dt.hour = Session_StartHour;
   dt.min  = Session_StartMin;
   dt.sec  = 0;
   return StructToTime(dt);
}

//+------------------------------------------------------------------+
//| Detecta inicio de nuevo día calendario                           |
//+------------------------------------------------------------------+
bool IsNewDay()
{
   datetime today = TimeCurrent() / 86400;
   if(today != sessionDate)
   {
      sessionDate = today;
      return true;
   }
   return false;
}

//+------------------------------------------------------------------+
//| Cuenta operaciones abiertas del EA en este símbolo               |
//+------------------------------------------------------------------+
int CountOpenTrades()
{
   int count = 0;
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if(OrderMagicNumber() == MagicNumber && OrderSymbol() == Symbol())
         count++;
   }
   return count;
}
//+------------------------------------------------------------------+
