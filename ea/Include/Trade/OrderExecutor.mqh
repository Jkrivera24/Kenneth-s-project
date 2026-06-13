//+------------------------------------------------------------------+
//| OrderExecutor.mqh - market and pending orders via correlation gate|
//+------------------------------------------------------------------+
#ifndef ORDER_EXECUTOR_MQH
#define ORDER_EXECUTOR_MQH

#include <Risk/CorrelationRiskGate.mqh>

//+------------------------------------------------------------------+
//| Map pending type to market direction for correlation group         |
//+------------------------------------------------------------------+
ENUM_ORDER_TYPE CorrelationDirectionOf(const ENUM_ORDER_TYPE orderType)
  {
   if(orderType == ORDER_TYPE_BUY || orderType == ORDER_TYPE_BUY_LIMIT || orderType == ORDER_TYPE_BUY_STOP)
      return ORDER_TYPE_BUY;
   return ORDER_TYPE_SELL;
  }

//+------------------------------------------------------------------+
//| Send market or pending order after correlation approval            |
//+------------------------------------------------------------------+
bool ExecuteWithCorrelationGate(const string symbol,
                                const ENUM_ORDER_TYPE orderType,
                                const double entry,
                                const double sl,
                                const double tp,
                                const double baseRiskPercent,
                                const double maxGroupRiskPercent,
                                const bool reduceLotsForCorrelated,
                                const ulong magic,
                                const string comment,
                                const datetime expiry = 0)
  {
   const ENUM_ORDER_TYPE corrType = CorrelationDirectionOf(orderType);

   CorrelationGateResult gate;
   const bool approved = ApproveCorrelationEntry(symbol,
                                                   corrType,
                                                   entry,
                                                   sl,
                                                   baseRiskPercent,
                                                   maxGroupRiskPercent,
                                                   reduceLotsForCorrelated,
                                                   magic,
                                                   gate);

   const ENUM_CORRELATION_GROUP group = GetCorrelationGroup(symbol, corrType);
   LogCorrelationRisk(symbol, corrType, group, gate);

   if(!approved)
      return false;

   MqlTradeRequest request = {};
   MqlTradeResult  result  = {};

   const bool isPending = (orderType == ORDER_TYPE_BUY_LIMIT
                           || orderType == ORDER_TYPE_SELL_LIMIT
                           || orderType == ORDER_TYPE_BUY_STOP
                           || orderType == ORDER_TYPE_SELL_STOP);

   request.action    = isPending ? TRADE_ACTION_PENDING : TRADE_ACTION_DEAL;
   request.symbol    = symbol;
   request.volume    = gate.finalLot;
   request.type      = orderType;
   request.sl        = sl;
   request.tp        = tp;
   request.deviation = 10;
   request.magic     = magic;
   request.comment   = comment;

   if(isPending)
     {
      request.price = entry;
      if(expiry > 0)
        {
         request.type_time   = ORDER_TIME_SPECIFIED;
         request.expiration  = expiry;
        }
      else
         request.type_time = ORDER_TIME_GTC;
     }
   else
     {
      request.price = (orderType == ORDER_TYPE_BUY) ? SymbolInfoDouble(symbol, SYMBOL_ASK)
                                                    : SymbolInfoDouble(symbol, SYMBOL_BID);
     }

   if(!OrderSend(request, result))
     {
      PrintFormat("[ORDER] failed %s %s retcode=%d %s",
                  symbol, comment, result.retcode, result.comment);
      return false;
     }

   PrintFormat("[ORDER] %s %s lot=%.2f entry=%.5f SL=%.5f TP=%.5f",
               symbol, comment, gate.finalLot, entry, sl, tp);
   return true;
  }

#endif
