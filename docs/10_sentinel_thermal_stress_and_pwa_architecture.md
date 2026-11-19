---
doc_id: sentinel_thermal_stress_and_pwa_architecture
title: "Sentinel-2 + Landsat Thermal + Architektura React PWA dla WodoStrażnika / HydroZgody"
edition: "2026"
status: "verified_against_live_apis"
language: "pl"
---

# Architektura PWA + Pobieranie danych z Sentinela i mapowanie stresu cieplnego pól

Ten dokument odpowiada na dwa kluczowe pytania techniczne przed HackNation 2026:
1. **Jak podejść do budowy Progressive Web App (PWA)** — biorąc pod uwagę to, co już działa w `demo/`, oraz docelową migrację/rozwój w React + Vite.
2. **Jak technicznie zaciągać dane z Sentinela (i Landsata termicznego) bez własnego ciężkiego backendu**, żeby wyświetlać pola, na których roślinom jest zbyt ciepło.

---

## 1. Co już mamy w repozytorium i jak podejść do PWA?

W katalogu `demo/` działa już lekki prototyp **WodoStrażnik Pola** (Vanilla JS + Leaflet + Geoportal ULDK/NMT/EGiB + Open-Meteo + IMGW) z automatycznym deploymentem na GitHub Pages (`.github/workflows/deploy-pages.yml`).

### Ścieżka A (Najszybsza na 24h — Zero-Build PWA + opcjonalny React):
- **Już teraz** dokładamy do `demo/` pełny standard PWA (`manifest.webmanifest`, `sw.js` Service Worker offline-first, ikona wektorowa) oraz moduł `satellite.js` pobierający dane z **Sentinela-2 i Landsata**.
- **Dlaczego to działa świetnie na hackathonie:** zero problemów z bundlowaniem w stresie, błyskawiczny deploy na GitHub Pages po każdym `git push`, 100% działa offline na telefonie jury.

### Ścieżka B (Docelowy React 19 + Vite PWA — jeśli zainstalujesz Node.js LTS):
Na tym komputerze obecnie nie ma jeszcze zainstalowanego `node` / `npm`. Jeśli zespół chce przejść na **React + Vite + Tailwind + shadcn/ui**, krok po kroku wygląda to tak:
1. Zainstaluj **Node.js 22 LTS** (`winget install OpenJS.NodeJS.LTS` lub z `nodejs.org`).
2. Utwórz projekt w osobnym folderze np. `app/` (żeby nie zepsuć działającego `demo/`):
   ```bash
   npm create vite@latest app -- --template react-ts
   cd app
   npm install leaflet proj4 geotiff lucide-react jspdf
   npm install -D vite-plugin-pwa tailwindcss @tailwindcss/vite
   ```
3. Skonfiguruj `vite-plugin-pwa` w `vite.config.ts` (`registerType: 'autoUpdate'`, `manifest`, Workbox `runtimeCaching` dla Open-Meteo, IMGW, ULDK i kafelków mapy).
4. **Czysta separacja domenowa (`src/services/`):**
   - `geoportal.ts` — ULDK, NMT, EGiB WFS
   - `weather.ts` — Open-Meteo (`VPD`, `ET0`, `soil_temperature_0cm`, `soil_moisture`) + IMGW
   - `satellite.ts` — STAC Search + `geotiff.js` COG HTTP Range Requests (Sentinel-2 + Landsat `ST_B10`)
   - `stressEngine.ts` — deterministyczne wyliczanie NDVI, NDMI, LST (°C) oraz rankingu przegrzania pól
5. **Efekty „WOW” w React na bazie naszego silnika:**
   - **Kurtyna Rentgena Satelitarnego (Before/After)** — suwak `clip-path` między Ortofotomapą Geoportalu a warstwą termiczno-wodną z satelity.
   - **Symulator Zastawki & Pakt Sąsiedzki** — suwak poziomu spiętrzenia (`0–40 cm`) i alerty Web Push / WebSocket dla sąsiadów w zlewni.
   - **Generator PDF dla ARiMR/KOWR** (`jspdf`) — gotowy dokument z wykresem 14-dniowym i mapką działki.

---

## 2. Jak pobierać dane z Sentinela (i wykrywać, gdzie roślinom jest zbyt ciepło)?

### Ważny fakt fizyczny (dlaczego łączymy Sentinel-2 + Landsat 8/9!)
- **Sentinel-2 (10 m / 20 m)** nie ma pasma termalnego (LWIR), ale ma pasma **Red (`B04`)**, **NIR (`B08`)** i **SWIR1 (`B11`)** oraz maskę chmur **SCL**.
  - Z `B04` i `B08` liczymy **NDVI** (czy na polu jest żywa roślinność).
  - Z `B08` i `B11` liczymy **NDMI** (`(NIR - SWIR1) / (NIR + SWIR1)`): to **najczulszy wskaźnik zawartości wody w liściach**. Gdy roślina przegrzewa się i traci turgor, NDMI spada zanim liście zżółkną!
- **Landsat 8/9 Collection 2 Level-2 (`ST_B10` / `lwir11`, 30 m)** posiada **prawdziwe pasmo termalne podczerwieni** mierzące **Land Surface Temperature (LST)** w Kelwinach:
  $$\text{LST (°C)} = (\text{DN} \times 0.00341802 + 149.0) - 273.15$$
  Gdy roślina ma wodę, chłodzi się przez ewapotranspirację. Gdy brakuje jej wody, zamyka aparaty szparkowe i jej temperatura powierzchniowa gwałtownie rośnie (**+4°C do +12°C** powyżej sąsiednich dobrze nawodnionych pól!).

### Zweryfikowane na żywo publiczne API STAC (bez kluczy i z CORS `*`!):
1. **Element84 Earth Search STAC** (`https://earth-search.aws.element84.com/v1/search`)
   - Kolekcja: `sentinel-2-l2a`
   - Zwraca publiczne pliki **COG (Cloud Optimized GeoTIFF)** na AWS S3 (`sentinel-cogs.s3.us-west-2.amazonaws.com`) z obsługą `HTTP 206 Partial Content` i `Access-Control-Allow-Origin: *`.
   - Skala odbicia ESA Baseline ≥ 04.00: `reflectance = DN * 0.0001 - 0.1` (`nodata = 0`).
   - Przeglądarka przez `geotiff.js` (`fromUrl`) pobiera **tylko kilkadziesiąt kilobajtów** dokładnie dla okna działki/widoku zamiast całych scen 800 MB!
2. **Microsoft Planetary Computer STAC** (`https://planetarycomputer.microsoft.com/api/stac/v1/search`)
   - Kolekcja: `landsat-c2-l2` (`lwir11` = `ST_B10`)
   - Publiczny, anonimowy token SAS z `https://planetarycomputer.microsoft.com/api/sas/v1/token/landsateuwest/landsat-c2` + `Access-Control-Allow-Origin: *` na Azure Blob Storage!
3. **Copernicus Data Space Ecosystem STAC** (`https://stac.dataspace.copernicus.eu/v1`)
   - Oficjalny europejski katalog ESA/Copernicus (zgodny z KOWR S2MUR), ale surowe rastry `.jp2` wymagają logowania OIDC/S3 — świetny jako docelowe źródło produkcyjne po stronie backendu lub po dodaniu tokenu CDSE.

---

## 3. Wzór na wykrywanie pól przegrzanych („gdzie roślinom jest zbyt ciepło”)

Dla każdego piksela (lub każdej zapisanej działki w *Moje pola*):
1. Maskujemy chmury i cienie chmur (`SCL ∈ {3, 8, 9, 10}` w Sentinel-2).
2. Wyliczamy z Sentinela-2:
   - $\text{NDVI} = \frac{\text{NIR} - \text{RED}}{\text{NIR} + \text{RED}}$
   - $\text{NDMI} = \frac{\text{NIR} - \text{SWIR1}}{\text{NIR} + \text{SWIR1}}$
3. Łączymy z temperaturą powierzchni z Landsata (`LST °C`) oraz bieżącym stresem atmosferycznym z Open-Meteo (`soil_temperature_0cm`, `VPD`).
4. **Indeks Stresu Cieplnego Uprawy (`0–100`):**
   - Wysoka temperatura powierzchni (`LST > 28°C` — lub w trybie symulacji fali upałów dla listopadowego demo na scenie!)
   - + niski zapas wody w liściach (`NDMI < 0.15` na polach z roślinnością `NDVI > 0.2`)
   - + wysokie `VPD > 1.6 kPa`
   → Pole zostaje oznaczone kolorem pomarańczowo-czerwonym na mapie (**Kurtyna Rentgena**) i automatycznie trafia na górę rankingu w **Moje pola**.
