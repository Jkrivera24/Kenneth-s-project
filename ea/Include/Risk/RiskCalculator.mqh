//+------------------------------------------------------------------+
//| RiskCalculator.mqh - SL-based risk % and lot sizing              |
//+------------------------------------------------------------------+
#ifndef RISK_CALCULATOR_MQH
#define RISK_CALCULATOR_MQH

//+------------------------------------------------------------------+
//| Money at risk for a position at the given SL                     |
//+------------------------------------------------------------------+
double RiskMoneyAtSL(const string symbol,
                   const double volume,
                   const double entry,
                   const double sl,
                   const ENUM_ORDER_TYPE orderType)
  {
   if(volume <= 0.0 || entry <= 0.0 || sl <= 0.0)
      return 0.0;

   double profit = 0.0;
   if(!OrderCalcProfit(orderType, symbol, volume, entry, sl, profit))
      return 0.0;

   return MathAbs(profit);
  }

//+------------------------------------------------------------------+
//| Risk as percent of account equity                                |
//+------------------------------------------------------------------+
double RiskPercentAtSL(const string symbol,
                     const double volume,
                     const double entry,
                     const double sl,
                     const ENUM_ORDER_TYPE orderType)
  {
   const double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   if(equity <= 0.0)
      return 0.0;

   const double riskMoney = RiskMoneyAtSL(symbol, volume, entry, sl, orderType);
   return riskMoney / equity * 100.0;
  }

//+------------------------------------------------------------------+
//| Lot size from target risk percent and SL distance                |
//+------------------------------------------------------------------+
double LotFromRiskPercent(const string symbol,
                          const double entry,
                          const double sl,
                          const ENUM_ORDER_TYPE orderType,
                          const double riskPercent)
  {
   if(riskPercent <= 0.0 || entry <= 0.0 || sl <= 0.0)
      return 0.0;

   const double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   if(equity <= 0.0)
      return 0.0;

   const double targetMoney = equity * riskPercent / 100.0;

   const double tickSize  = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_SIZE);
   const double tickValue = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_VALUE);
   if(tickSize <= 0.0 || tickValue <= 0.0)
      return 0.0;

   const double slDistance = MathAbs(entry - sl);
   const double ticks      = slDistance / tickSize;
   if(ticks <= 0.0)
      return 0.0;

   const double riskPerLot = ticks * tickValue;
   if(riskPerLot <= 0.0)
      return 0.0;

   return targetMoney / riskPerLot;
  }

//+------------------------------------------------------------------+
//| Hard ceiling: 0.01 lot per $1,000 equity (matches spreadsheet)   |
//+------------------------------------------------------------------+
double MaxLotFromEquity(const double lotPerThousand = 0.01)
  {
   const double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   if(equity <= 0.0)
      return 0.0;

   return MathFloor(equity / 1000.0) * lotPerThousand;
  }

//+------------------------------------------------------------------+
//| Normalize volume to broker min / max / step                      |
//+------------------------------------------------------------------+
double NormalizeVolume(const string symbol, double volume)
  {
   const double minVol  = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
   const double maxVol  = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
   const double step    = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);

   if(step > 0.0)
      volume = MathFloor(volume / step) * step;

   volume = MathMax(minVol, volume);
   volume = MathMin(maxVol, volume);

   const int digits = (int)MathMax(0, MathRound(-MathLog10(step)));
   return NormalizeDouble(volume, digits);
  }

#endif
