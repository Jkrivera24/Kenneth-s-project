//+------------------------------------------------------------------+
//| MyEA.mq5 - Correlation-aware risk + pullback pending orders      |
//+------------------------------------------------------------------+
#property copyright "Kenneth-s-project"
#property version   "0.20"
#property strict

#include <Trade/OrderExecutor.mqh>
#include <Filters/PullbackEntry.mqh>

//--- risk inputs (match ea-risk-calculator spreadsheet)
input double InpRiskPercentPerTrade            = 0.5;   // Base risk per trade (%)
input double InpMaxCorrelationGroupRiskPercent = 1.0;  // Max group risk (%)
input bool   InpReduceLotsForCorrelatedTrades  = true;  // Scale lots by open count
input ulong  InpMagicNumber                    = 20260612;

//--- pullback pending order inputs
input bool   InpPullbackPendingEnabled = true;   // Place pending orders on pullback
input int    InpPullbackEmaPeriod      = 50;     // EMA period for trend + pullback level
input double InpPullbackTargetTpPips   = 100.0;  // Target TP distance (pips)
input double InpPullbackMinTpPips      = 50.0;   // Minimum TP (pips) - no trade below
input double InpPullbackOffsetPips     = 0.0;    // Offset from EMA (pips)
input int    InpPullbackExpiryHours    = 24;     // Pending order expiry (hours)
input bool   InpOnePullbackPerSymbol   = true;   // One pending pullback per symbol

const string PULLBACK_COMMENT = "MyEA pullback";

datetime g_lastPullbackBarTime = 0;

//+------------------------------------------------------------------+
//| Try to place a pending order at the EMA pullback level             |
//+------------------------------------------------------------------+
bool TryPlacePullbackPending(const string symbol)
  {
   if(!InpPullbackPendingEnabled)
      return false;

   if(InpOnePullbackPerSymbol && HasPullbackPendingOrder(symbol, InpMagicNumber, PULLBACK_COMMENT))
      return false;

   PullbackSetup setup = BuildPullbackSetup(symbol,
                                            _Period,
                                            InpPullbackEmaPeriod,
                                            InpPullbackTargetTpPips,
                                            InpPullbackMinTpPips,
                                            InpPullbackOffsetPips);
   LogPullbackSetup(symbol, setup);

   if(!setup.valid)
      return false;

   datetime expiry = 0;
   if(InpPullbackExpiryHours > 0)
      expiry = TimeCurrent() + InpPullbackExpiryHours * 3600;

   return ExecuteWithCorrelationGate(symbol,
                                     setup.orderType,
                                     setup.entry,
                                     setup.sl,
                                     setup.tp,
                                     InpRiskPercentPerTrade,
                                     InpMaxCorrelationGroupRiskPercent,
                                     InpReduceLotsForCorrelatedTrades,
                                     InpMagicNumber,
                                     PULLBACK_COMMENT,
                                     expiry);
  }

//+------------------------------------------------------------------+
int OnInit()
  {
   Print("MyEA v0.20 loaded - correlation risk + pullback pending.");
   PrintFormat("Group cap=%.2f%% | Pullback pending=%s | EMA=%d | TP=%.0f pips",
               InpMaxCorrelationGroupRiskPercent,
               InpPullbackPendingEnabled ? "ON" : "OFF",
               InpPullbackEmaPeriod,
               InpPullbackTargetTpPips);
   return INIT_SUCCEEDED;
  }

//+------------------------------------------------------------------+
void OnTick()
  {
   if(!InpPullbackPendingEnabled)
      return;

   // Evaluate once per new bar to avoid duplicate pending orders
   const datetime barTime = iTime(_Symbol, _Period, 0);
   if(barTime == g_lastPullbackBarTime)
      return;
   g_lastPullbackBarTime = barTime;

   TryPlacePullbackPending(_Symbol);
  }

//+------------------------------------------------------------------+
