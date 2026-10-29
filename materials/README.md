# Practice data – Weather and climate change

Open papers and raw datasets for testing AI use cases in the workshop *Generative AI in Your Research*. Snapshot downloaded on 2026-10-29; the providers keep updating most series, so values may differ from today’s files.

All files may be redistributed under the licence named for each item. Cite the sources as given.

## Papers

### Global temperature records

- **A1** Morice, C. P., et al. (2021). An updated assessment of near-surface temperature change from 1850: the HadCRUT5 data set. Journal of Geophysical Research: Atmospheres, 126(3), e2019JD032361. https://doi.org/10.1029/2019JD032361 – *CC BY 4.0* – Accepted manuscript (hosted by the Met Office)  
  File: `papers/A_global-temperature/2021_Morice_HadCRUT5_JGR.pdf`. Introduces HadCRUT5, the Met Office/UEA global surface temperature record from 1850, and why its infilled version shows more recent warming.
- **A2** Rohde, R. A., & Hausfather, Z. (2020). The Berkeley Earth Land/Ocean Temperature Record. Earth System Science Data, 12(4), 3469–3479. https://doi.org/10.5194/essd-12-3469-2020 – *CC BY 4.0*  
  File: `papers/A_global-temperature/2020_Rohde-Hausfather_BerkeleyEarth_ESSD.pdf`. Describes the Berkeley Earth global record and compares it with HadCRUT, GISTEMP and other series.
- **A3** Forster, P. M., et al. (2025). Indicators of Global Climate Change 2024: annual update of key indicators of the state of the climate system and human influence. Earth System Science Data, 17(6), 2641–2680. https://doi.org/10.5194/essd-17-2641-2025 – *CC BY 4.0*  
  File: `papers/A_global-temperature/2025_Forster_Indicators-Global-Climate-Change-2024_ESSD.pdf`. The annual IPCC-style update: emissions, concentrations, forcing, observed and human-induced warming, remaining carbon budget.

### UK and Europe

- **B1** Legg, T., et al. (2025). An Update to the Central England Temperature Series – HadCET v2.1. Geoscience Data Journal, 12, e284. https://doi.org/10.1002/gdj3.284 – *CC BY 4.0*  
  File: `papers/B_uk-europe/2025_Legg_HadCET-v2-1_GDJ.pdf`. Documents the current version of the Central England Temperature series: stations, homogenisation and urban adjustment.
- **B2** Christidis, N., McCarthy, M., & Stott, P. A. (2020). The increasing likelihood of temperatures above 30 to 40 °C in the United Kingdom. Nature Communications, 11, 3093. https://doi.org/10.1038/s41467-020-16834-0 – *CC BY 4.0*  
  File: `papers/B_uk-europe/2020_Christidis_UK-30-40C_NatCommun.pdf`. Attribution study on how human influence raises the chance of 30–40 °C days in the UK – published two years before the 40.3 °C record of July 2022.
- **B3** Vautard, R., et al. (2023). Heat extremes in Western Europe increasing faster than simulated due to atmospheric circulation trends. Nature Communications, 14, 6803. https://doi.org/10.1038/s41467-023-42143-3 – *CC BY 4.0*  
  File: `papers/B_uk-europe/2023_Vautard_W-Europe-heat-extremes_NatCommun.pdf`. Shows that Western European heat extremes rise faster than climate models simulate, partly due to circulation changes.

### Extremes and attribution

- **C1** Perkins-Kirkpatrick, S. E., & Lewis, S. C. (2020). Increasing trends in regional heatwaves. Nature Communications, 11, 3357. https://doi.org/10.1038/s41467-020-16970-7 – *CC BY 4.0*  
  File: `papers/C_extremes-attribution/2020_Perkins-Kirkpatrick_regional-heatwaves_NatCommun.pdf`. Heatwave frequency, duration, intensity and cumulative heat by region since 1950.
- **C2** Myhre, G., et al. (2019). Frequency of extreme precipitation increases extensively with event rareness under global warming. Scientific Reports, 9, 16063. https://doi.org/10.1038/s41598-019-52277-4 – *CC BY 4.0*  
  File: `papers/C_extremes-attribution/2019_Myhre_extreme-precipitation_SciRep.pdf`. Extreme daily precipitation becomes more frequent with warming – the rarer the event, the larger the increase.
- **C3** Christidis, N., Mitchell, D., & Stott, P. A. (2023). Rapidly increasing likelihood of exceeding 50 °C in parts of the Mediterranean and the Middle East due to human influence. npj Climate and Atmospheric Science, 6, 45. https://doi.org/10.1038/s41612-023-00377-4 – *CC BY 4.0*  
  File: `papers/C_extremes-attribution/2023_Christidis_50C-Mediterranean_npjCAS.pdf`. Transfers the UK 40 °C method (B3) to 50 °C days in the Mediterranean and Middle East.
- **C4** Zachariah, M., et al. (2023). Attribution of 2022 early-spring heatwave in India and Pakistan to climate change: lessons in assessing vulnerability and preparedness in reducing impacts. Environmental Research: Climate, 2(4). https://doi.org/10.1088/2752-5295/acf4b6 – *CC BY 4.0*  
  File: `papers/C_extremes-attribution/2023_Zachariah_India-Pakistan-heatwave_ERC.pdf`. A rapid event-attribution study combined with a vulnerability and impact assessment.
- **C5** Schumacher, D. L., et al. (2024). Detecting the human fingerprint in the summer 2022 western–central European soil drought. Earth System Dynamics, 15, 131–154. https://doi.org/10.5194/esd-15-131-2024 – *CC BY 4.0*  
  File: `papers/C_extremes-attribution/2024_Schumacher_2022-European-drought_ESD.pdf`. Drought attribution for the European summer of 2022 – the drought counterpart to the heat papers.
- **C6** Shi, X., Beaulieu, C., Killick, R., & Lund, R. (2021). Changepoint Detection: An Analysis of the Central England Temperature Series. arXiv:2106.12180 (preprint). https://doi.org/10.48550/arXiv.2106.12180 – *CC BY 4.0* – Preprint – not peer reviewed in this version  
  File: `papers/C_extremes-attribution/2021_Shi_changepoints-CET_arXiv-preprint.pdf`. Applies changepoint methods to the Central England Temperature series.

## Raw data

- **D1 Central England Temperature – daily maximum** – Met Office (HadCET v2.1). 1878 to today. Format: Text, two columns (date, °C). *Open Government Licence v3*. Source: https://www.metoffice.gov.uk/hadobs/hadcet/. Cite: Met Office HadCET v2.1; Parker et al. (1992); Legg et al. (2025).  
  Actual temperatures, not anomalies. The most recent values are provisional.  
  Files: `data/D01_hadcet-daily/maxtemp_daily_totals_2026-10-29.txt`
- **D2 Central England Temperature – monthly** – Met Office (HadCET v2.1). 1659 to today. Format: Text, wide (year × 12 months + annual), header lines. *Open Government Licence v3*. Source: https://www.metoffice.gov.uk/hadobs/hadcet/. Cite: Met Office HadCET v2.1; Manley (1974); Parker et al. (1992).  
  The longest instrumental temperature series; needs reshaping from wide to long.  
  Files: `data/D02_hadcet-monthly/meantemp_monthly_totals_2026-10-29.txt`
- **D3 Global temperature anomalies – HadCRUT5** – Met Office / University of East Anglia. 1850 to today, monthly. Format: CSV: time, anomaly, 95 % confidence limits. *Open Government Licence v3*. Source: https://www.metoffice.gov.uk/hadobs/hadcrut5/. Cite: Morice et al. (2021).  
  Anomalies relative to 1961–1990 – other series use other baselines.  
  Files: `data/D03_hadcrut5/HadCRUT.5.1.0.0.analysis.summary_series.global.monthly_2026-10-29.csv`
- **D4 Global temperature anomalies – GISTEMP v4** – NASA GISS. 1880 to today. Format: CSV, wide (year × months + seasons), title line to skip. *US government open data*. Source: https://data.giss.nasa.gov/gistemp/. Cite: GISTEMP Team (2026), GISS Surface Temperature Analysis v4; Lenssen et al.  
  Baseline 1951–1980; missing values coded as ***.  
  Files: `data/D04_gistemp/GLB.Ts+dSST_2026-10-29.csv`
- **D5 Atmospheric CO₂ – Mauna Loa, monthly** – NOAA Global Monitoring Laboratory. March 1958 to today. Format: CSV with # comment header. *US government open data (citation requested)*. Source: https://gml.noaa.gov/ccgg/trends/data.html. Cite: Lan, X., Tans, P. & Thoning, K. W., NOAA GML; Scripps Institution of Oceanography.  
  December 2022 – July 2023 measured on Maunakea after the Mauna Loa eruption; negative values are placeholders.  
  Files: `data/D05_noaa-co2-maunaloa/co2_mm_mlo_2026-10-29.csv`
- **D6 Arctic sea-ice extent – daily** – NSIDC Sea Ice Index v4. 26 October 1978 to today. Format: CSV with a units row under the header. *Free use with citation*. Source: https://nsidc.org/data/g02135. Cite: Fetterer, F., et al., Sea Ice Index, Version 4 (G02135), NSIDC.  
  Every other day until mid-1987 and a gap in 1987–88 – good for irregular time series.  
  Files: `data/D06_nsidc-seaice-v4/N_seaice_extent_daily_v4.0_2026-10-29.csv`
- **D7 UK station records – Oxford and Durham** – Met Office historic station data. Oxford from 1853, Durham from 1880, monthly. Format: Text, header lines; tmax, tmin, air frost, rain, sun. *Open Government Licence v3*. Source: https://www.metoffice.gov.uk/research/climate/maps-and-data/historic-station-data. Cite: Met Office historic station data.  
  Codes to clean: --- missing, * estimated, # sensor type, “Provisional” rows. The best file for a data-cleaning test.  
  Files: `data/D07_metoffice-stations/durhamdata_2026-10-29.txt`, `data/D07_metoffice-stations/oxforddata_2026-10-29.txt`
- **D8 UK rainfall – national series** – Met Office HadUK-Grid. 1836 to today. Format: Text, wide (year × months + seasons + annual). *Open Government Licence v3*. Source: https://www.metoffice.gov.uk/research/climate/maps-and-data/uk-and-regional-series. Cite: Met Office HadUK-Grid.  
  Areal average for the UK; --- marks missing seasonal values.  
  Files: `data/D08_metoffice-uk-series/UK_Rainfall_2026-10-29.txt`
- **D9 Global air temperature – daily (ERA5)** – Copernicus Climate Change Service / ECMWF (Climate Pulse). 1940 to today. Format: CSV with # description header. *Copernicus licence (free, with attribution)*. Source: https://pulse.climate.copernicus.eu/. Cite: C3S/ECMWF, ERA5 via Climate Pulse.  
  Anomalies relative to 1991–2020; the last weeks are preliminary (ERA5T).  
  Files: `data/D09_copernicus-climatepulse/era5_daily_series_2t_global_2026-10-29.csv`

## Not included

- **EM-DAT disaster database (CRED/UCLouvain)** – Requires registration and does not allow redistribution – download it yourself at https://public.emdat.be after accepting the terms.
- **Berkeley Earth temperature data** – Licensed for non-commercial use only (CC BY-NC 4.0) – not included. The paper A2 describing it is in the pack; the data is available at https://berkeleyearth.org/data/.
- **State of the UK Climate in 2024 (Kendon et al., 2025)** – Licensed for non-commercial use only (CC BY-NC 4.0) – not included; open access at https://doi.org/10.1002/joc.70010.
- **Meteostat daily station data** – Licence statements conflict (CC BY vs CC BY-NC) – not included.

## Ideas for pairing papers and data

| Paper | Data | Test idea |
|---|---|---|
| B1 | D1 · D2 | Ask Copilot to explain the file layout and write code that reshapes the monthly series to long format; check the 2022 values by hand. |
| A1 | D3 · D4 · D9 | Compare the global records on a common baseline; check Copilot’s explanation of the differences against the paper. |
| C2 | D7 · D8 | Clean the two station files, compare rainfall in an early and a recent period, and ask Copilot why monthly data cannot replicate a daily-extremes study. |
| A3 | D3 · D5 | Regress global temperature on CO₂, let Copilot propose testable hypotheses, then critique them against the paper’s indicators. |
| B2 · B3 | D1 | Count hot days in the Central England maximum series and compare Copilot’s reading of “return period” with the paper. |
| B2 · C3 · C4 · C5 | – | Ask Copilot for a comparison table of the attribution studies, then check every cell against the PDFs. |

---
Compiled for the workshop by Prof. Dr. Manuel Kern · delivered by Hitachi Solutions. The pack contains third-party material; all rights remain with the authors and providers.
