//+------------------------------------------------------------------+
//| MyEA.mq5 - Correlation-aware risk starter                        |
//| Wire EMA guard, pullback, and re-entry before OrderSend later.   |
//+------------------------------------------------------------------+
#property copyright "Kenneth-s-project"
#property version   "0.10"
#property strict

#include "Include/Risk/CorrelationRiskGate.mqh"

//--- inputs (match ea-risk-calculator spreadsheet)
input double InpRiskPercentPerTrade           = 0.5;   // Base risk per trade (%)
input double InpMaxCorrelationGroupRiskPercent = 1.0;  // Max group risk (%)
input bool   InpReduceLotsForCorrelatedTrades = true;  // Scale lots by open count
input ulong  InpMagicNumber                   = 20260612;
input double InpMaxLotPerThousand             = 0.01;  // Hard lot cap per $1k equity

//--- placeholder: signal module will call this before OrderSend
bool TryOpenWithCorrelationGate(const string symbol,
                                const ENUM_ORDER_TYPE orderType,
                                const double entry,
                                const double sl,
                                const double tp)
  {
   CorrelationGateResult gate;
   const bool approved = ApproveCorrelationEntry(symbol,
                                                   orderType,
                                                   entry,
                                                   sl,
                                                   InpRiskPercentPerTrade,
                                                   InpMaxCorrelationGroupRiskPercent,
                                                   InpReduceLotsForCorrelatedTrades,
                                                   InpMagicNumber,
                                                   gate);

   const ENUM_CORRELATION_GROUP group = GetCorrelationGroup(symbol, orderType);
   LogCorrelationRisk(symbol, orderType, group, gate);

   if(!approved)
      return false;

   MqlTradeRequest request = {};
   MqlTradeResult  result  = {};

   request.action    = TRADE_ACTION_DEAL;
   request.symbol    = symbol;
   request.volume    = gate.finalLot;
   request.type      = orderType;
   request.price     = entry;
   request.sl        = sl;
   request.tp        = tp;
   request.deviation = 10;
   request.magic     = InpMagicNumber;
   request.comment   = "MyEA corr gate";

   if(!OrderSend(request, result))
     {
      PrintFormat("[CORR] OrderSend failed: retcode=%d %s", result.retcode, result.comment);
      return false;
     }

   return true;
  }

//+------------------------------------------------------------------+
int OnInit()
  {
   Print("MyEA correlation risk starter loaded.");
   PrintFormat("Group cap=%.2f%% | Reduce correlated=%s | Base risk=%.2f%%",
               InpMaxCorrelationGroupRiskPercent,
               InpReduceLotsForCorrelatedTrades ? "true" : "false",
               InpRiskPercentPerTrade);
   return INIT_SUCCEEDED;
  }

//+------------------------------------------------------------------+
void OnTick()
  {
   // EMA guard, pullback, and re-entry plug in here.
   // Only call TryOpenWithCorrelationGate() after all filters pass.
  }

//+------------------------------------------------------------------+
