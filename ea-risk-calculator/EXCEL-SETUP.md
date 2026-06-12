# EA Risk Calculator — Excel Setup (2 tabs)

Study guide for after work. **Trend filter ON**, **correlation groups A/B**, **Excel 365** formulas (fallbacks noted).

## What you have

| File | Purpose |
|---|---|
| `csv/01-settings.csv` | Account limits and inputs |
| `csv/02-trend-table.csv` | Currency trends (hard filter) |
| `csv/03-pip-values.csv` | Pip size + $/pip per 1 lot |
| `csv/04-positions-template.csv` | Blank open-positions log |
| `csv/05-sniper-inputs-template.csv` | New-trade calculator field map |
| `csv/06-sim-open-positions.csv` | Pre-filled simulation positions |
| `csv/07-sim-test-candidates.csv` | 8 test trades to work through |

---

## Step 1 — Create workbook (10 min)

1. New Excel file: `EA-Risk-Calculator.xlsx`
2. Create two sheets: **`Risk`** and **`Sim`**
3. Import each CSV:
   - **Data → Get Data → From File → From Text/CSV**
   - Or open CSV and copy-paste into the right sheet area

### Suggested layout — sheet `Risk`

| Area | Rows | Source CSV |
|---|---|---|
| Settings | A1:C12 | `01-settings.csv` |
| Trend table | A16:B24 | `02-trend-table.csv` |
| Pip table | H2:J10 | `03-pip-values.csv` |
| Open positions | A30:H37 | `04-positions-template.csv` |
| Correlation monitor | A39:E44 | (formulas below) |
| Sniper calculator | A46:B70 | `05-sniper-inputs-template.csv` |
| Trend helpers | D72:D76 | (formulas below) |

### Suggested layout — sheet `Sim`

| Area | Rows | Source CSV |
|---|---|---|
| Open positions | A1:I8 | `06-sim-open-positions.csv` |
| Test candidates | A12:J20 | `07-sim-test-candidates.csv` |
| Results | L1:P20 | Your answers while studying |

---

## Step 2 — Name these ranges (Formulas → Name Manager)

| Name | Refers to |
|---|---|
| `AccountSize` | `Risk!$B$2` |
| `MaxGroupRiskPct` | `Risk!$B$7` |
| `ReduceCorrelated` | `Risk!$B$8` |
| `BaseRiskPct` | `Risk!$B$9` |
| `MinTP` | `Risk!$B$10` |
| `TrendFilter` | `Risk!$B$13` |
| `MaxLot` | `Risk!$B$11` |
| `TrendTable` | `Risk!$A$17:$B$24` |
| `PipTable` | `Risk!$H$2:$I$10` |

---

## Step 3 — Formulas for `Risk` sheet

### Open positions (row 31+, copy down)

**F31 — Group**

```excel
=IF(AND(A31="XAUUSD",B31="Buy"),"A",
  IF(AND(OR(A31="EURUSD",A31="GBPUSD",A31="AUDUSD",A31="NZDUSD"),B31="Buy"),"A",
    IF(AND(A31="XAUUSD",B31="Sell"),"B",
      IF(AND(OR(A31="EURUSD",A31="GBPUSD",A31="AUDUSD",A31="NZDUSD"),B31="Sell"),"B",
        IF(AND(OR(A31="USDCHF",A31="USDCAD"),B31="Buy"),"B",
          IF(AND(OR(A31="USDCHF",A31="USDCAD"),B31="Sell"),"A","None"))))))
```

**G31 — SL pips**

```excel
=IF(A31="","",
  ABS(C31-D31)/IF(A31="USDJPY",0.01,IF(OR(A31="XAUUSD",A31="BTCUSD"),0.01,0.0001)))
```

**H31 — Risk %**

```excel
=IF(A31="","",G31*VLOOKUP(A31,PipTable,2,FALSE)*E31/AccountSize*100)
```

### Correlation monitor (row 40–41)

**B40** (Group A list):

```excel
=TEXTJOIN(", ",TRUE,IF($F$31:$F$37="A",$A$31:$A$37&" "&$B$31:$B$37,""))
```

**C40**: `=SUMIF($F$31:$F$37,"A",$H$31:$H$37)`

**B41** / **C41**: same with `"B"`

**E40**: `=MaxGroupRiskPct*100-C40` (headroom %)

### Sniper inputs (manual: B48–B51)

**B52 — TP pips**

```excel
=ABS(B51-B50)/IF(B48="USDJPY",0.01,IF(OR(B48="XAUUSD",B48="BTCUSD"),0.01,0.0001))
```

**B53 — TP tier**

```excel
=IF(B52>=MinTP,"PASS","FAIL: TP < "&MinTP&" pips")
```

**B54 — SL pips**

```excel
=IF(B52<MinTP,"NO TRADE",
  IF(B52<100,B52/2,
    IF(B52<200,B52/3,
      IF(B52<300,B52/4,
        IF(B52<400,B52/5,B52/6)))))
```

**B55 — SL price**

```excel
=IF(B54="NO TRADE","",
  IF(B49="Buy",B50-B54*IF(B48="USDJPY",0.01,IF(OR(B48="XAUUSD",B48="BTCUSD"),0.01,0.0001)),
    B50+B54*IF(B48="USDJPY",0.01,IF(OR(B48="XAUUSD",B48="BTCUSD"),0.01,0.0001))))
```

**B56 — Group** (same logic as F31, using B48/B49)

**B57**: `=COUNTIF($F$31:$F$37,B56)`

**B58 — Scale**

```excel
=IF(B56="None",1,IF(ReduceCorrelated,INDEX({1,0.5,0.25,0.125},MIN(B57+1,4)),1))
```

**B59 — Base lot**

```excel
=IF(B54="NO TRADE","",(BaseRiskPct*AccountSize/100)/(B54*VLOOKUP(B48,PipTable,2,FALSE)))
```

**B60**: `=IF(B59="","",B59*B58)`

**B61**: `=IF(B60="","",MIN(B60,MaxLot))`

**B62**: `=IF(B61="","",B54*VLOOKUP(B48,PipTable,2,FALSE)*B61/AccountSize*100)`

**B63**: `=IF(B56="A",C40,IF(B56="B",C41,0))`

**B64**: `=IF(B62="","",B63+B62)`

**B65**: `=IF(B56="None","N/A",IF(B64<=MaxGroupRiskPct*100,"PASS","FAIL: exceeds "&MaxGroupRiskPct*100&"%"))`

**B71 — Max lot for group headroom**

```excel
=IF(OR(B56="None",B54="NO TRADE"),"",
  MAX(0,(MaxGroupRiskPct*AccountSize/100-B63*AccountSize/100)/(B54*VLOOKUP(B48,PipTable,2,FALSE))))
```

**B69 — Final lot**

```excel
=IF(B53<>"PASS","",
  IF(B54="NO TRADE","",
    IF(D76<>"PASS","",
      IF(B65="PASS",B61,
        IF(AND(ReduceCorrelated,B71>=0.01),FLOOR(MIN(B61,B71,MaxLot),0.01),"")))))
```

### Trend helpers (D72–D76)

**D72 — Base currency**

```excel
=IF(B48="XAUUSD","XAU",IF(B48="BTCUSD","BTC",IF(LEFT(B48,3)="USD",RIGHT(B48,3),LEFT(B48,3))))
```

**D74 — Base trend**

```excel
=IFERROR(XLOOKUP(D72,TrendTable),"NEUTRAL")
```

**D75 — USD trend**

```excel
=IFERROR(XLOOKUP("USD",TrendTable),"NEUTRAL")
```

**D76 — Trend gate (HARD when TrendFilter=TRUE)**

```excel
=IF(NOT(TrendFilter),"PASS",
  IF(B48="BTCUSD","PASS",
    IF(B48="XAUUSD",
      IF(B49="Buy",IF(OR(D75="WEAK",D75="NEUTRAL"),"PASS","FAIL: XAU Buy vs USD STRONG"),
        IF(OR(D75="STRONG",D75="NEUTRAL"),"PASS","FAIL: XAU Sell vs USD WEAK")),
      IF(LEFT(B48,3)="USD",
        IF(B49="Buy",IF(OR(D75="STRONG",D75="NEUTRAL"),"PASS","FAIL: USD Buy vs USD not STRONG"),
          IF(OR(D75="WEAK",D75="NEUTRAL"),"PASS","FAIL: USD Sell vs USD not WEAK")),
        IF(B49="Buy",IF(OR(D74="STRONG",D74="NEUTRAL"),"PASS","FAIL: Buy vs "&D72&" WEAK"),
          IF(OR(D74="WEAK",D74="NEUTRAL"),"PASS","FAIL: Sell vs "&D72&" STRONG")))))))
```

**B68 — Final verdict**

```excel
=IF(TrendFilter,IF(D76<>"PASS",D76,
  IF(B53<>"PASS",B53,
    IF(B54="NO TRADE","FAIL: NO TRADE",
      IF(B65<>"PASS",IF(ReduceCorrelated,"REDUCE OR REJECT",B65),
        IF(B69="","FAIL: lot below minimum","APPROVE"))))),
  ...)
```

*(Complete chain: trend → TP → SL → group cap → final lot)*

**B70 — Log line**

```excel
="[CORR] "&B48&" "&B49&" | Trend="&D76&" | Group="&B56&" | open="&B57&
" | scale="&TEXT(B58,"0%")&" | lot="&TEXT(IF(B69="","0",B69),"0.00")&
" | groupRisk="&TEXT(B63,"0.00")&"%+"&TEXT(IF(B62="","0",B62),"0.00")&"%="&TEXT(IF(B64="","0",B64),"0.00")&"% | "&B68
```

---

## Step 4 — Sheet `Sim` (study tab)

### Goal

Practice **without** touching live `Risk` positions.

1. Paste `06-sim-open-positions.csv` into **Sim!A1**
2. Paste `07-sim-test-candidates.csv` into **Sim!A12**
3. Copy formulas from `Risk` into Sim columns for Group / SL pips / Risk %
4. For each test row T1–T8:
   - Copy candidate Symbol/Direction/Entry/TP into `Risk` sniper cells B48–B51
   - Load matching open positions from Sim into `Risk` rows 31–37
   - Compare your outcome to **ExpectedOutcome** column

### Study checklist

| Test | What you should learn |
|---|---|
| **T1** GBPUSD Buy | Trend blocks before correlation |
| **T2** GBPUSD Sell | Group B + scaling |
| **T3** EURUSD Buy (5th leg) | 12.5% scale + 1% cap |
| **T4** AUDUSD 9 pip TP | Min TP filter |
| **T5** BTCUSD Buy | Outside groups |
| **T6** XAUUSD Buy | Gold in Group A |
| **T7** USDCHF Sell | Sells on USDXXX → Group A |
| **T8** AUDUSD 2nd leg | 50% correlation scale |

---

## Gate order (memorize)

```text
1. Trend filter (ON = hard stop)
2. Min TP 50 pips
3. SL from TP tier
4. Correlation group + scale (100 / 50 / 25 / 12.5%)
5. Group risk cap 1%
6. Daily loss 3%
7. Portfolio buffer 6%
8. Max lot 0.01 per $1k
```

---

## Excel version notes

| Feature | Excel 365 | Excel 2019 |
|---|---|---|
| `TEXTJOIN` + `IF` array | Enter normally | Ctrl+Shift+Enter |
| `XLOOKUP` | Yes | Use `VLOOKUP` |
| `LET` | Optional | Use nested `IF` |

---

## When you move to the EA (laptop)

| Excel | EA input / function |
|---|---|
| B7 | `InpMaxCorrelationGroupRiskPercent` |
| B8 | `InpReduceLotsForCorrelatedTrades` |
| B13 | `InpTrendFilterEnabled` |
| B56 / F31 | `GetCorrelationGroup()` |
| B58 | Scale array `{1.0,0.5,0.25,0.125}` |
| D76 | `PassesTrendFilter()` |
| B70 | `LogCorrelationRisk()` |

---

## Quick start after work

1. **15 min** — Import CSVs, create `Risk` + `Sim` tabs  
2. **30 min** — Paste formulas for row 31 and B48–B70  
3. **20 min** — Run tests T1–T8, fill **Sim** results column  
4. **Later** — Adjust pip values in `03-pip-values.csv` for your broker  

Good study session — no EA code needed until this sheet behaves the way you expect.
