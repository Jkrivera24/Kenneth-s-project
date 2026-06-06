# Hyundai HHI Sounding/Ullage Tables — Setup Guide

Your photos are the **header pages** from the Hyundai Heavy Industries *Sounding/Ullage Table* manual. They identify each tank but do **not** include the volume lookup numbers yet.

## Tanks registered from your photos

| Tank ID | Tank name | Contents | Net volume |
|---------|-----------|----------|------------|
| **LOSUMP** | MAIN L.O.SUMP T.(C) | Lubricating Oil | 56.76 m³ |
| **LOSTORP** | MAIN L.O.STOR.T.(P) | Lubricating Oil | 48.6 m³ |
| **LOGESTORP** | G/E L.O.STOR.T.(P) | Lubricating Oil | 16.46 m³ |
| **LOCYL01P** | CYL.O.STOR.T.(P) | Lubricating Oil | 36.45 m³ |

Blank CSV templates for each tank are in `data/tanks/`.

## What to copy next from the manual

For each tank, find the pages **after** the header. They usually show a table like:

| Sounding (m) | Ullage (m) | Volume (m³) | Trim correction |
|--------------|------------|-------------|-----------------|
| 0.000 | 5.000 | 0.00 | … |
| 0.100 | 4.900 | 1.15 | … |
| … | … | … | … |

Some HHI manuals use:

1. **Even keel + trim correction** — one volume column at even keel, plus m³ correction per metre of trim (supported as `hhi_even_keel` format).
2. **Sounding × trim grid** — volume at each sounding for different trim values (supported as `grid` format).

Photograph or copy **all rows** from empty to full for each tank you use.

## How to enter into the calculator

### Option A — HHI even keel format (recommended for L.O. tanks)

Edit `data/tanks/LOSUMP.csv` (or import in web app):

```csv
format,hhi_even_keel
tank_id,LOSUMP
tank_name,MAIN L.O.SUMP T.(C)
net_volume_m3,56.76
list_correction_m3_per_deg,0
sounding_m,ullage_m,volume_m3,trim_corr_m3_per_m
0.000,5.000,0.00,0.00
0.500,4.500,2.80,0.05
1.000,4.000,5.60,0.05
```

- **trim_corr_m3_per_m** — m³ added per metre of trim (by stern = positive). From your manual’s trim correction table.
- **ullage_m** — optional but useful; lets you enter ullage instead of sounding in the web app.

### Option B — Trim grid (if manual shows volumes per trim column)

```csv
format,grid
tank_name,MAIN L.O.STOR.T.(P)
list_correction_m3_per_deg,0
sounding_m,trim_-1.0,trim_0.0,trim_1.0,trim_2.0
6.0,380.5,382.0,383.5,385.0
```

## Lubricating oil vs bunker fuel

These four tanks are **lube oil**, not HFO bunker. The same calculator applies:

- **Volume** — from sounding table (trim + list).
- **VCF** — still use ASTM 54B if you need mass at 15°C.
- **Density @ 15°C** — typical system LO ≈ **900 kg/m³** (0.900 kg/L); cylinder oil may differ — use lab or maker data.

For daily LO ROB you may only need **m³**; set density to 900 or leave mass as reference.

## Sounding vs ullage

- **Sounding** — depth of liquid from bottom of tank (tape reading down).
- **Ullage** — empty space from liquid surface to top of tank.

HHI tables list both. In the web app, choose **Sounding** or **Ullage** per tank row — the calculator looks up volume from the matching column.

## Adding HFO / bunker tanks

When you have HFO sounding tables (e.g. No.1 HFO Service, Settling, Overflow), create new CSV files the same way and import them. Bunker density @ 15°C comes from the **BDN** (often 991 kg/m³ for HFO).
