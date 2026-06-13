//+------------------------------------------------------------------+
//| PullbackEntry.mqh - EMA pullback pending order setup             |
//+------------------------------------------------------------------+
#ifndef PULLBACK_ENTRY_MQH
#define PULLBACK_ENTRY_MQH

struct PullbackSetup
  {
   bool             valid;
   ENUM_ORDER_TYPE  orderType;
   double           entry;
   double           sl;
   double           tp;
   double           tpPips;
   double           slPips;
   string           reason;
  };

//+------------------------------------------------------------------+
//| Pip size in price units                                          |
//+------------------------------------------------------------------+
double PipSizeOf(const string symbol)
  {
   const int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   if(StringFind(symbol, "JPY") >= 0)
      return 0.01;
   if(digits == 3 || digits == 5)
      return SymbolInfoDouble(symbol, SYMBOL_POINT) * 10.0;
   return SymbolInfoDouble(symbol, SYMBOL_POINT);
  }

//+------------------------------------------------------------------+
//| Convert price distance to pips                                   |
//+------------------------------------------------------------------+
double PriceDistanceToPips(const string symbol, const double distance)
  {
   const double pip = PipSizeOf(symbol);
   if(pip <= 0.0)
      return 0.0;
   return MathAbs(distance) / pip;
  }

//+------------------------------------------------------------------+
//| Convert pips to price distance                                   |
//+------------------------------------------------------------------+
double PipsToPriceDistance(const string symbol, const double pips)
  {
   return pips * PipSizeOf(symbol);
  }

//+------------------------------------------------------------------+
//| SL pips from TP tier rules (matches Excel calculator)            |
//+------------------------------------------------------------------+
double SlPipsFromTpTier(const double tpPips, const double minTpPips)
  {
   if(tpPips < minTpPips)
      return 0.0;
   if(tpPips < 100.0)
      return tpPips / 2.0;
   if(tpPips < 200.0)
      return tpPips / 3.0;
   if(tpPips < 300.0)
      return tpPips / 4.0;
   if(tpPips < 400.0)
      return tpPips / 5.0;
   return tpPips / 6.0;
  }

//+------------------------------------------------------------------+
//| Read EMA value                                                     |
//+------------------------------------------------------------------+
double GetEmaValue(const string symbol,
                   const ENUM_TIMEFRAMES timeframe,
                   const int period,
                   const int shift = 0)
  {
   const int handle = iMA(symbol, timeframe, period, 0, MODE_EMA, PRICE_CLOSE);
   if(handle == INVALID_HANDLE)
      return 0.0;

   double buffer[];
   ArraySetAsSeries(buffer, true);
   if(CopyBuffer(handle, 0, shift, 1, buffer) != 1)
     {
      IndicatorRelease(handle);
      return 0.0;
     }

   IndicatorRelease(handle);
   return buffer[0];
  }

//+------------------------------------------------------------------+
//| Build pullback pending setup from EMA and target TP                |
//+------------------------------------------------------------------+
PullbackSetup BuildPullbackSetup(const string symbol,
                                 const ENUM_TIMEFRAMES timeframe,
                                 const int emaPeriod,
                                 const double targetTpPips,
                                 const double minTpPips,
                                 const double pullbackOffsetPips)
  {
   PullbackSetup setup;
   setup.valid     = false;
   setup.orderType = ORDER_TYPE_BUY;
   setup.entry     = 0.0;
   setup.sl        = 0.0;
   setup.tp        = 0.0;
   setup.tpPips    = 0.0;
   setup.slPips    = 0.0;
   setup.reason    = "";

   if(targetTpPips < minTpPips)
     {
      setup.reason = StringFormat("TP %.0f pips < minimum %.0f", targetTpPips, minTpPips);
      return setup;
     }

   const double ema = GetEmaValue(symbol, timeframe, emaPeriod, 1);
   if(ema <= 0.0)
     {
      setup.reason = "EMA unavailable";
      return setup;
     }

   const double close1 = iClose(symbol, timeframe, 1);
   if(close1 <= 0.0)
     {
      setup.reason = "price unavailable";
      return setup;
     }

   const double offset = PipsToPriceDistance(symbol, pullbackOffsetPips);
   const double tpDist = PipsToPriceDistance(symbol, targetTpPips);
   const double slPips = SlPipsFromTpTier(targetTpPips, minTpPips);
   if(slPips <= 0.0)
     {
      setup.reason = "SL tier rejected setup";
      return setup;
     }
   const double slDist = PipsToPriceDistance(symbol, slPips);

   const int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   const double bid = SymbolInfoDouble(symbol, SYMBOL_BID);
   const double ask = SymbolInfoDouble(symbol, SYMBOL_ASK);

   // Uptrend: buy limit on pullback to EMA
   if(close1 > ema)
     {
      setup.orderType = ORDER_TYPE_BUY_LIMIT;
      setup.entry     = NormalizeDouble(ema - offset, digits);
      setup.sl        = NormalizeDouble(setup.entry - slDist, digits);
      setup.tp        = NormalizeDouble(setup.entry + tpDist, digits);

      if(setup.entry >= ask)
        {
         setup.reason = "buy limit must be below ask";
         return setup;
        }
     }
   // Downtrend: sell limit on pullback to EMA
   else if(close1 < ema)
     {
      setup.orderType = ORDER_TYPE_SELL_LIMIT;
      setup.entry     = NormalizeDouble(ema + offset, digits);
      setup.sl        = NormalizeDouble(setup.entry + slDist, digits);
      setup.tp        = NormalizeDouble(setup.entry - tpDist, digits);

      if(setup.entry <= bid)
        {
         setup.reason = "sell limit must be above bid";
         return setup;
        }
     }
   else
     {
      setup.reason = "price at EMA - no trend bias";
      return setup;
     }

   setup.tpPips = targetTpPips;
   setup.slPips = slPips;
   setup.valid  = true;
   setup.reason = "pullback setup ready";
   return setup;
  }

//+------------------------------------------------------------------+
//| Log pullback setup                                                 |
//+------------------------------------------------------------------+
void LogPullbackSetup(const string symbol, const PullbackSetup &setup)
  {
   const string dir = (setup.orderType == ORDER_TYPE_BUY_LIMIT) ? "BuyLimit" : "SellLimit";
   PrintFormat("[PULLBACK] %s %s | entry=%.5f | SL=%.5f (%.0fp) | TP=%.5f (%.0fp) | %s",
               symbol, dir,
               setup.entry, setup.sl, setup.slPips,
               setup.tp, setup.tpPips,
               setup.reason);
  }

//+------------------------------------------------------------------+
//| True if a pending pullback order already exists                    |
//+------------------------------------------------------------------+
bool HasPullbackPendingOrder(const string symbol,
                             const ulong magic,
                             const string commentTag)
  {
   for(int i = OrdersTotal() - 1; i >= 0; i--)
     {
      const ulong ticket = OrderGetTicket(i);
      if(ticket == 0 || !OrderSelect(ticket))
         continue;

      if(OrderGetString(ORDER_SYMBOL) != symbol)
         continue;
      if(magic > 0 && OrderGetInteger(ORDER_MAGIC) != (long)magic)
         continue;

      const ENUM_ORDER_TYPE type = (ENUM_ORDER_TYPE)OrderGetInteger(ORDER_TYPE);
      if(type != ORDER_TYPE_BUY_LIMIT && type != ORDER_TYPE_SELL_LIMIT)
         continue;

      const string comment = OrderGetString(ORDER_COMMENT);
      if(StringFind(comment, commentTag) >= 0)
         return true;
     }
   return false;
  }

#endif
