//+------------------------------------------------------------------+
//| CorrelationGroups.mqh - USD weakness / strength exposure groups  |
//+------------------------------------------------------------------+
#ifndef CORRELATION_GROUPS_MQH
#define CORRELATION_GROUPS_MQH

#include "RiskCalculator.mqh"

enum ENUM_CORRELATION_GROUP
  {
   GROUP_NONE = 0,
   GROUP_A_USD_WEAKNESS = 1,
   GROUP_B_USD_STRENGTH = 2
  };

//+------------------------------------------------------------------+
//| Map symbol + direction to correlation group                        |
//+------------------------------------------------------------------+
ENUM_CORRELATION_GROUP GetCorrelationGroup(const string symbol,
                                           const ENUM_ORDER_TYPE orderType)
  {
   const bool isBuy = (orderType == ORDER_TYPE_BUY || orderType == ORDER_TYPE_BUY_LIMIT
                       || orderType == ORDER_TYPE_BUY_STOP);

   if(symbol == "XAUUSD")
      return isBuy ? GROUP_A_USD_WEAKNESS : GROUP_B_USD_STRENGTH;

   if(symbol == "EURUSD" || symbol == "GBPUSD" || symbol == "AUDUSD" || symbol == "NZDUSD")
      return isBuy ? GROUP_A_USD_WEAKNESS : GROUP_B_USD_STRENGTH;

   if(symbol == "USDCHF" || symbol == "USDCAD")
      return isBuy ? GROUP_B_USD_STRENGTH : GROUP_A_USD_WEAKNESS;

   // BTCUSD, USDJPY, and others: outside USD correlation basket
   return GROUP_NONE;
  }

//+------------------------------------------------------------------+
//| Human-readable group label for logging                             |
//+------------------------------------------------------------------+
string CorrelationGroupLabel(const ENUM_CORRELATION_GROUP group)
  {
   switch(group)
     {
      case GROUP_A_USD_WEAKNESS: return "A USD_Weakness";
      case GROUP_B_USD_STRENGTH: return "B USD_Strength";
      default:                   return "None";
     }
  }

//+------------------------------------------------------------------+
//| Check if open position belongs to the given group                  |
//+------------------------------------------------------------------+
bool PositionMatchesGroup(const ulong ticket,
                          const ENUM_CORRELATION_GROUP group,
                          const ulong magic)
  {
   if(group == GROUP_NONE)
      return false;

   if(!PositionSelectByTicket(ticket))
      return false;

   if(magic > 0 && PositionGetInteger(POSITION_MAGIC) != (long)magic)
      return false;

   const string symbol = PositionGetString(POSITION_SYMBOL);
   const ENUM_POSITION_TYPE posType = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
   const ENUM_ORDER_TYPE orderType  = (posType == POSITION_TYPE_BUY) ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;

   return GetCorrelationGroup(symbol, orderType) == group;
  }

//+------------------------------------------------------------------+
//| Count open positions in correlation group                          |
//+------------------------------------------------------------------+
int CountOpenInGroup(const ENUM_CORRELATION_GROUP group, const ulong magic = 0)
  {
   if(group == GROUP_NONE)
      return 0;

   int count = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      const ulong ticket = PositionGetTicket(i);
      if(PositionMatchesGroup(ticket, group, magic))
         count++;
     }
   return count;
  }

//+------------------------------------------------------------------+
//| Sum risk % of all open positions in group                          |
//+------------------------------------------------------------------+
double SumGroupRiskPercent(const ENUM_CORRELATION_GROUP group, const ulong magic = 0)
  {
   if(group == GROUP_NONE)
      return 0.0;

   double total = 0.0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      const ulong ticket = PositionGetTicket(i);
      if(!PositionMatchesGroup(ticket, group, magic))
         continue;

      const string symbol = PositionGetString(POSITION_SYMBOL);
      const double volume = PositionGetDouble(POSITION_VOLUME);
      const double entry  = PositionGetDouble(POSITION_PRICE_OPEN);
      const double sl     = PositionGetDouble(POSITION_SL);
      const ENUM_POSITION_TYPE posType = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
      const ENUM_ORDER_TYPE orderType  = (posType == POSITION_TYPE_BUY) ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;

      if(sl <= 0.0)
         continue;

      total += RiskPercentAtSL(symbol, volume, entry, sl, orderType);
     }
   return total;
  }

#endif
