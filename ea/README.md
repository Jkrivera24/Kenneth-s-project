# EA — Correlation Risk Starter (MQL5)

Starter Expert Advisor with **correlation-aware group risk** matching your Excel calculator.

## Pull on laptop

```bash
cd path/to/Kenneth-s-project
git fetch origin
git checkout cursor/ea-correlation-risk-starter-3ccf
git pull
```

## Copy into MetaTrader 5

Copy the entire `ea/` folder into your MT5 data folder:

```text
Kenneth-s-project/ea/
  MyEA.mq5
  Include/Risk/
    RiskCalculator.mqh
    CorrelationGroups.mqh
    CorrelationRiskGate.mqh
```

**Destination (typical):**

```text
%APPDATA%/MetaQuotes/Terminal/<ID>/MQL5/Experts/ea/
```

Or in MT5: **File → Open Data Folder → MQL5 → Experts** — create folder `ea` and paste files.

## Compile

1. Open **MetaEditor** (F4 from MT5)
2. Open `Experts/ea/MyEA.mq5`
3. Press **Compile** (F7)
4. Fix any include path errors — `#include` paths are relative to `MyEA.mq5`

## Inputs (match Excel)

| Input | Excel cell | Default |
|---|---|---|
| `InpRiskPercentPerTrade` | B9 (×100) | 0.5% |
| `InpMaxCorrelationGroupRiskPercent` | B7 (×100) | 1.0% |
| `InpReduceLotsForCorrelatedTrades` | B8 | true |
| `InpMagicNumber` | — | 20260612 |

## Correlation groups

| Group A — USD weakness | Group B — USD strength |
|---|---|
| XAUUSD Buy | XAUUSD Sell |
| EURUSD Buy | EURUSD Sell |
| GBPUSD Buy | GBPUSD Sell |
| AUDUSD Buy | AUDUSD Sell |
| NZDUSD Buy | NZDUSD Sell |
| USDCHF Sell | USDCHF Buy |
| USDCAD Sell | USDCAD Buy |

**Outside groups:** BTCUSD, USDJPY (v1).

## Pipeline (add on laptop)

```text
Signal → EMA Guard → Pullback → Re-entry → ApproveCorrelationEntry() → OrderSend
```

`TryOpenWithCorrelationGate()` in `MyEA.mq5` is the integration point.

## Test in Strategy Tester

1. Attach `MyEA` to chart (e.g. EURUSD)
2. Manually call gate from OnTick once your signal logic fires
3. Open 2–3 correlated positions (XAU Buy + EUR Buy + AUD Buy)
4. Check **Experts** tab for `[CORR]` log lines:
   - group risk %
   - scale factor (100% / 50% / 25%)
   - APPROVE / REJECT

## Next modules to add

1. `Filters/EmaGuard.mqh`
2. `Filters/PullbackEntry.mqh`
3. `Filters/ReentryControl.mqh`
4. `Filters/TrendFilter.mqh` (from Excel D76 logic)

## Log format

```text
[CORR] EURUSD Buy | Group=A USD_Weakness | open=1 | scale=50% | groupRisk=0.45%+0.22%=0.67% | lot=0.02 | APPROVE | within group cap
```
