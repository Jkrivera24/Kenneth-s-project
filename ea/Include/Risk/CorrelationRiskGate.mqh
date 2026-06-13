//+------------------------------------------------------------------+
//| CorrelationRiskGate.mqh - group risk cap and lot scaling           |
//+------------------------------------------------------------------+
#ifndef CORRELATION_RISK_GATE_MQH
#define CORRELATION_RISK_GATE_MQH

#include "CorrelationGroups.mqh"

struct CorrelationGateResult
  {
   bool     approved;
   double   finalLot;
   double   scaleFactor;
   double   currentGroupRiskPct;
   double   candidateRiskPct;
   double   projectedGroupRiskPct;
   int      openInGroup;
   string   reason;
  };

//+------------------------------------------------------------------+
//| Correlation scale: 100% / 50% / 25% / 12.5% by open count          |
//+------------------------------------------------------------------+
double CorrelationScaleFactor(const int openInGroup, const bool reduceEnabled)
  {
   if(!reduceEnabled)
      return 1.0;

   static const double SCALES[] = {1.0, 0.5, 0.25, 0.125};
   const int index = MathMin(openInGroup, ArraySize(SCALES) - 1);
   return SCALES[index];
  }

//+------------------------------------------------------------------+
//| Log correlation risk decision                                      |
//+------------------------------------------------------------------+
void LogCorrelationRisk(const string symbol,
                        const ENUM_ORDER_TYPE orderType,
                        const ENUM_CORRELATION_GROUP group,
                        const CorrelationGateResult &result)
  {
   const string dir = (orderType == ORDER_TYPE_BUY) ? "Buy" : "Sell";
   const string outcome = result.approved ? "APPROVE" : "REJECT";

   PrintFormat("[CORR] %s %s | Group=%s | open=%d | scale=%.0f%% | "
               "groupRisk=%.2f%%+%.2f%%=%.2f%% | lot=%.2f | %s | %s",
               symbol, dir,
               CorrelationGroupLabel(group),
               result.openInGroup,
               result.scaleFactor * 100.0,
               result.currentGroupRiskPct,
               result.candidateRiskPct,
               result.projectedGroupRiskPct,
               result.finalLot,
               outcome,
               result.reason);
  }

//+------------------------------------------------------------------+
//| Main gate: scale lots, enforce group cap, approve or reject        |
//+------------------------------------------------------------------+
bool ApproveCorrelationEntry(const string symbol,
                             const ENUM_ORDER_TYPE orderType,
                             const double entry,
                             const double sl,
                             const double baseRiskPercent,
                             const double maxGroupRiskPercent,
                             const bool reduceLotsForCorrelated,
                             const ulong magic,
                             CorrelationGateResult &result)
  {
   result.approved              = false;
   result.finalLot              = 0.0;
   result.scaleFactor           = 1.0;
   result.currentGroupRiskPct   = 0.0;
   result.candidateRiskPct      = 0.0;
   result.projectedGroupRiskPct = 0.0;
   result.openInGroup           = 0;
   result.reason                = "";

   if(entry <= 0.0 || sl <= 0.0)
     {
      result.reason = "invalid entry or SL";
      return false;
     }

   const ENUM_CORRELATION_GROUP group = GetCorrelationGroup(symbol, orderType);

   // Outside USD basket: per-trade risk only, no group cap
   if(group == GROUP_NONE)
     {
      double lot = LotFromRiskPercent(symbol, entry, sl, orderType, baseRiskPercent);
      lot = MathMin(lot, MaxLotFromEquity());
      lot = NormalizeVolume(symbol, lot);

      const double minVol = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
      if(lot < minVol)
        {
         result.reason = "lot below minimum (no group)";
         return false;
        }

      result.approved             = true;
      result.finalLot             = lot;
      result.scaleFactor          = 1.0;
      result.candidateRiskPct     = RiskPercentAtSL(symbol, lot, entry, sl, orderType);
      result.projectedGroupRiskPct = result.candidateRiskPct;
      result.reason               = "outside correlation groups";
      return true;
     }

   result.openInGroup         = CountOpenInGroup(group, magic);
   result.currentGroupRiskPct = SumGroupRiskPercent(group, magic);
   result.scaleFactor         = CorrelationScaleFactor(result.openInGroup, reduceLotsForCorrelated);

   double lot = LotFromRiskPercent(symbol, entry, sl, orderType, baseRiskPercent);
   lot *= result.scaleFactor;
   lot  = MathMin(lot, MaxLotFromEquity());
   lot  = NormalizeVolume(symbol, lot);

   result.candidateRiskPct      = RiskPercentAtSL(symbol, lot, entry, sl, orderType);
   result.projectedGroupRiskPct = result.currentGroupRiskPct + result.candidateRiskPct;

   const double minVol = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);

   // Group cap exceeded: shrink lot if reduction enabled
   if(result.projectedGroupRiskPct > maxGroupRiskPercent)
     {
      if(reduceLotsForCorrelated)
        {
         const double headroomPct = maxGroupRiskPercent - result.currentGroupRiskPct;
         if(headroomPct > 0.0)
           {
            double cappedLot = LotFromRiskPercent(symbol, entry, sl, orderType, headroomPct);
            cappedLot = MathMin(cappedLot, MaxLotFromEquity());
            cappedLot = NormalizeVolume(symbol, cappedLot);

            if(cappedLot >= minVol)
              {
               result.candidateRiskPct      = RiskPercentAtSL(symbol, cappedLot, entry, sl, orderType);
               result.projectedGroupRiskPct = result.currentGroupRiskPct + result.candidateRiskPct;
               result.finalLot              = cappedLot;
               result.approved              = (result.projectedGroupRiskPct <= maxGroupRiskPercent + 0.001);
               result.reason                = "lot reduced to fit group cap";
               return result.approved;
              }
           }
        }

      result.reason = StringFormat("group cap exceeded: %.2f%% + %.2f%% > %.2f%%",
                                   result.currentGroupRiskPct,
                                   result.candidateRiskPct,
                                   maxGroupRiskPercent);
      return false;
     }

   if(lot < minVol)
     {
      result.reason = "lot below minimum after scaling";
      return false;
     }

   result.approved = true;
   result.finalLot = lot;
   result.reason   = "within group cap";
   return true;
  }

#endif
