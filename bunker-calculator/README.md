# Bunker Fuel Calculator

Calculate bunker fuel quantity from engine-room sounding tables — like **Bunker Master**.

Enter **trim, sounding, list, temperature, and density @ 15°C** → get **observed volume, VCF, standard volume @ 15°C, and mass (MT)**.

## What's included

| Tool | Location | Use |
|------|----------|-----|
| **Web app** | `web/index.html` | Browser calculator; import your tank table CSV |
| **Spreadsheet** | `spreadsheet/bunker-fuel-calculator.xlsx` | Excel / LibreOffice with formulas |
| **Sample tank table** | `data/sample-tank-table.csv` | Example format for your ship tables |
| **CSV template** | Download from web app | Blank template to fill from engine room |

## Quick start — Web app

```bash
cd bunker-calculator/web
python3 serve.py
# Open http://localhost:8080
```

Or open `web/index.html` directly in a browser (file:// works for local use).

1. Copy your sounding table from the engine room into CSV format (see sample).
2. Click **Import CSV** or paste into the text area.
3. Enter **trim**, **list**, and **density @ 15°C** (from BDN).
4. Add tank rows with **sounding** and **temperature**.
5. Results update automatically; **Export results CSV** for your log.

## Quick start — Spreadsheet

1. Open `spreadsheet/bunker-fuel-calculator.xlsx`.
2. Sheet **Tank_Table** — replace sample volumes with your ship's calibration table.
3. Sheet **Calculator** — enter trim, list, density, and per-tank sounding/temperature.

Regenerate the spreadsheet after editing the generator:

```bash
pip install openpyxl
python3 spreadsheet/generate_spreadsheet.py
```

## Hyundai HHI sounding tables (your ship)

Your manual header pages are registered. See **[docs/hhi-sounding-tables.md](docs/hhi-sounding-tables.md)** for setup.

| Tank ID | Tank name | Net vol |
|---------|-----------|---------|
| LOSUMP | MAIN L.O.SUMP T.(C) | 56.76 m³ |
| LOSTORP | MAIN L.O.STOR.T.(P) | 48.6 m³ |
| LOGESTORP | G/E L.O.STOR.T.(P) | 16.46 m³ |
| LOCYL01P | CYL.O.STOR.T.(P) | 36.45 m³ |

1. Open the **volume pages** after each header in your HHI manual.
2. Copy sounding / ullage / volume / trim correction rows into `data/tanks/*.csv`.
3. In the web app, click **Load my HHI L.O. tanks** — or import each CSV.

**HHI even keel CSV format:**

```csv
format,hhi_even_keel
tank_id,LOSUMP
tank_name,MAIN L.O.SUMP T.(C)
net_volume_m3,56.76
sounding_m,ullage_m,volume_m3,trim_corr_m3_per_m
0.000,5.000,0.00,0.00
0.500,4.500,2.80,0.05
```

## Tank table CSV format (trim grid — HFO)

Copy from your engine-room sounding table:

```csv
tank_name,No.1 HFO Service
list_correction_m3_per_deg,0.15
sounding_m,trim_0.0,trim_1.0,trim_2.0
6.0,380.5,378.2,376.0
7.0,410.0,407.7,405.5
8.0,439.5,437.2,435.0
```

- **Rows** = sounding (metres)
- **Columns** = trim (metres, by stern positive)
- **Cells** = volume (m³)
- **list_correction_m3_per_deg** — optional heel correction (m³ per degree)

## Calculation method

1. **Observed volume** — bilinear interpolation on sounding × trim from your tank table, plus list correction.
2. **VCF** — ASTM Table 54B: `EXP(-613.9723 / ρ² × (T − 15))` where ρ is density @ 15°C in kg/m³.
3. **Standard volume @ 15°C** = observed volume × VCF
4. **Mass (MT)** = standard volume × density @ 15°C / 1000

## Notes

- Use **density @ 15°C** from the Bunker Delivery Note (BDN), not observed density unless corrected.
- Trim and list must match the conventions on your sounding table.
- Replace all sample data with your vessel's actual calibration tables.
- For tanks with separate tables, use one CSV per tank in the web app, or duplicate the spreadsheet per tank.
