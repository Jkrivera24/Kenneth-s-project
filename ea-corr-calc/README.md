# Corr Risk — Pending Pullback (browser app)

Lightweight version of [ea-risk-calculator](../ea-risk-calculator/) — no Excel setup. Check correlation groups, trend filter, and lot size **before** you place a pending/limit order at a pullback price.

**Live (after deploy):** https://jkrivera24.github.io/Kenneth-s-project/ea-corr-calc/

## What it does

1. **Pending tab** — Enter symbol, direction, pullback entry (limit price), TP, optional current price. Runs all gates in order:
   - Trend filter (hard stop when ON)
   - Min TP 50 pips
   - SL from TP tier
   - Correlation group A/B + scale (100 / 50 / 25 / 12.5%)
   - Group risk cap 1%
   - Daily loss 3% · Portfolio buffer 6%
2. **Open tab** — Log open positions for correlation math
3. **Groups tab** — Group A/B headroom monitor
4. **Settings** — Account size, trends, toggles
5. **Study tab** — Load T1–T8 practice scenarios from the Excel guide

Data saves in your browser (localStorage). Works offline after first load.

## Quick start (laptop)

```bash
# From repo root — any static server works
python3 -m http.server 8080 --directory ea-corr-calc
# Open http://localhost:8080
```

Or open `index.html` directly in Chrome/Edge (modules need a local server for best results).

## Gate order (same as Excel)

```text
1. Trend filter
2. Min TP
3. SL from TP tier
4. Correlation group + scale
5. Group risk cap
6. Daily loss
7. Portfolio buffer
8. Max lot (0.01 per $1k)
```

When you're rested, the full [EXCEL-SETUP.md](../ea-risk-calculator/EXCEL-SETUP.md) study guide is still there for deeper practice.
