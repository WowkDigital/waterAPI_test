// Rejestracja układu PUWG 1992 (EPSG:2180) dla zapytań GUGiK NMT
proj4.defs(
  "EPSG:2180",
  "+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +units=m +no_defs"
);

const PRESETS = {
  sicienko: { name: "Sicienko / Osówiec", lat: 53.1850, lon: 17.8550, zoom: 16 },
  dobrcz: { name: "Dobrcz / Borówno", lat: 53.2450, lon: 18.1450, zoom: 14 },
};

const SOIL_MODIFIERS = {
  "1": { name: "Kat. I (piaski, WOD < 127.5 mm)", retentionFactor: 0.65, droughtThresholdMm: -5 },
  "2": { name: "Kat. II (piaski gliniaste, WOD 127.5–169.9 mm)", retentionFactor: 0.80, droughtThresholdMm: -10 },
  "3": { name: "Kat. III (gliny lekkie, WOD 170–202.5 mm)", retentionFactor: 0.90, droughtThresholdMm: -15 },
  "4": { name: "Kat. IV (gliny ciężkie/iły, WOD > 202.5 mm)", retentionFactor: 1.00, droughtThresholdMm: -20 },
};

// Stan bieżącej analizy (do przełączania gleby i symulacji bez ponownego fetchowania)
let state = {
  lat: PRESETS.sicienko.lat,
  lon: PRESETS.sicienko.lon,
  parcel: null,
  nmt: null,
  openMeteo: null,
  imgw: null,
  simulation: null, // null | "rain" | "vpd"
  activeTab: "uldk",
  rawLogs: {
    uldk: "Brak danych",
    nmt: "Brak danych",
    openmeteo: "Brak danych",
    imgw: "Brak danych",
  },
};

// Inicjalizacja mapy Leaflet + warstwy WMS Geoportalu
const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap",
});

const ortoWms = L.tileLayer.wms("https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution", {
  layers: "Raster",
  format: "image/png",
  transparent: false,
  maxZoom: 19,
  attribution: "GUGiK Ortofotomapa",
});

const hydroWms = L.tileLayer.wms("https://mapy.geoportal.gov.pl/wss/service/img/guest/HYDRO/MapServer/WMSServer", {
  layers: "0,1,2,3,4,5,6",
  format: "image/png",
  transparent: true,
  opacity: 0.75,
  attribution: "GUGiK Mapa Hydrograficzna",
});

const map = L.map("map", {
  center: [PRESETS.sicienko.lat, PRESETS.sicienko.lon],
  zoom: PRESETS.sicienko.zoom,
  layers: [osmLayer],
});

L.control.layers(
  {
    "OpenStreetMap": osmLayer,
    "Ortofotomapa Geoportal (WMS)": ortoWms,
  },
  {
    "Mapa Hydrograficzna Polski (WMS)": hydroWms,
  }
).addTo(map);

const overlayGroup = L.layerGroup().addTo(map);

// Helpery UI
const $ = (id) => document.getElementById(id);

function setStatus(text, type = "info") {
  const el = $("status-badge");
  el.textContent = text;
  el.className = `badge ${type}`;
}

function showToast(title, body) {
  const toast = $("toast");
  toast.innerHTML = `<strong style="color:var(--accent)">${title}</strong><div style="margin-top:4px;font-size:0.84rem">${body}</div>`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 7000);

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body });
    } catch (_) {
      // Fallback gdy przeglądarka wymaga ServiceWorkera
    }
  }
}

function renderRawTab() {
  $("raw-output").textContent = state.rawLogs[state.activeTab] || "Brak danych";
}

// Parsowanie WKT POLYGON / MULTIPOLYGON z ULDK
function parseWktPolygon(wkt) {
  const match = wkt.match(/\(\(([^()]+)\)\)/);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((pair) => {
      const [lonStr, latStr] = pair.trim().split(/\s+/);
      return [parseFloat(latStr), parseFloat(lonStr)]; // Leaflet: [lat, lon]
    })
    .filter(([lat, lon]) => !Number.isNaN(lat) && !Number.isNaN(lon));
}

function polygonAreaHa(latLngs) {
  if (latLngs.length < 3) return 0;
  const lat0 = latLngs.reduce((s, p) => s + p[0], 0) / latLngs.length;
  const lon0 = latLngs.reduce((s, p) => s + p[1], 0) / latLngs.length;
  const mLat = 111132.92 - 559.82 * Math.cos((2 * lat0 * Math.PI) / 180);
  const mLon = 111412.84 * Math.cos((lat0 * Math.PI) / 180);
  let area = 0;
  for (let i = 0; i < latLngs.length - 1; i++) {
    const x1 = (latLngs[i][1] - lon0) * mLon;
    const y1 = (latLngs[i][0] - lat0) * mLat;
    const x2 = (latLngs[i + 1][1] - lon0) * mLon;
    const y2 = (latLngs[i + 1][0] - lat0) * mLat;
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2 / 10000;
}

function distanceMeters(p1, p2) {
  const R = 6371000;
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1[0] * Math.PI) / 180) *
      Math.cos((p2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingLabel(from, to) {
  const y = Math.sin(((to[1] - from[1]) * Math.PI) / 180) * Math.cos((to[0] * Math.PI) / 180);
  const x =
    Math.cos((from[0] * Math.PI) / 180) * Math.sin((to[0] * Math.PI) / 180) -
    Math.sin((from[0] * Math.PI) / 180) *
      Math.cos((to[0] * Math.PI) / 180) *
      Math.cos(((to[1] - from[1]) * Math.PI) / 180);
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const dirs = ["N (Północ)", "NE (Pn-Wsch)", "E (Wschód)", "SE (Pd-Wsch)", "S (Południe)", "SW (Pd-Zach)", "W (Zachód)", "NW (Pn-Zach)"];
  return dirs[Math.round(deg / 45) % 8];
}

// Konwersja WGS84 (lat, lon) -> GUGiK NMT (X=Northing, Y=Easting w EPSG:2180)
async function fetchNmtElevation(lat, lon) {
  const [easting, northing] = proj4("EPSG:4326", "EPSG:2180", [lon, lat]);
  const url = `https://services.gugik.gov.pl/nmt/?request=GetHbyXY&x=${northing.toFixed(2)}&y=${easting.toFixed(2)}`;
  const t0 = performance.now();
  const res = await fetch(url);
  const text = (await res.text()).trim();
  const h = parseFloat(text);
  return {
    lat,
    lon,
    northing: northing.toFixed(2),
    easting: easting.toFixed(2),
    url,
    ms: Math.round(performance.now() - t0),
    elevation: Number.isNaN(h) ? null : h,
    raw: text,
  };
}

async function analyzeLocation(lat, lon, zoomTo = null) {
  state.lat = lat;
  state.lon = lon;
  state.simulation = null;
  setStatus("Pobieranie API...", "info");
  const totalStart = performance.now();

  overlayGroup.clearLayers();
  L.circleMarker([lat, lon], { radius: 6, color: "#38bdf8", fillOpacity: 0.9 }).addTo(overlayGroup);
  if (zoomTo) map.setView([lat, lon], zoomTo);

  // 1. ULDK + Open-Meteo + IMGW równolegle
  const uldkUrl = `https://uldk.gugik.gov.pl/?request=GetParcelByXY&xy=${lon.toFixed(6)},${lat.toFixed(6)},4326&result=geom_wkt,voivodeship,county,commune,region,parcel,teryt&srid=4326`;
  const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&hourly=precipitation,precipitation_probability,et0_fao_evapotranspiration,vapour_pressure_deficit,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,soil_temperature_0cm,wind_speed_10m&forecast_days=2&timezone=Europe/Warsaw`;
  const imgwWarnUrl = "https://danepubliczne.imgw.pl/api/data/warningsmeteo";
  const imgwHydroWarnUrl = "https://danepubliczne.imgw.pl/api/data/warningshydro";
  const imgwSynopUrl = "https://danepubliczne.imgw.pl/api/data/synop";

  try {
    const [uldkRes, omRes, wMeteoRes, wHydroRes, synopRes] = await Promise.all([
      fetch(uldkUrl).then(async (r) => ({ status: r.status, text: await r.text() })),
      fetch(omUrl).then(async (r) => ({ status: r.status, data: await r.json() })),
      fetch(imgwWarnUrl).then(async (r) => ({ status: r.status, data: await r.json() })),
      fetch(imgwHydroWarnUrl).then(async (r) => ({ status: r.status, data: await r.json() })),
      fetch(imgwSynopUrl).then(async (r) => ({ status: r.status, data: await r.json() })),
    ]);

    // Parsowanie ULDK
    const lines = uldkRes.text.trim().split(/\r?\n/);
    let parcelObj = null;
    if (lines[0] === "0" && lines[1]) {
      const [wkt, voivodeship, county, commune, region, parcelNo, teryt] = lines[1].split("|");
      const latLngs = parseWktPolygon(wkt);
      const areaHa = polygonAreaHa(latLngs);
      parcelObj = { wkt, voivodeship, county, commune, region, parcelNo, teryt, latLngs, areaHa };

      if (latLngs.length >= 3) {
        const poly = L.polygon(latLngs, { color: "#22c55e", weight: 2.5, fillOpacity: 0.18 }).addTo(overlayGroup);
        if (!zoomTo) map.fitBounds(poly.getBounds(), { maxZoom: 17, padding: [20, 20] });
      }
    }
    state.parcel = parcelObj;
    state.rawLogs.uldk = `GET ${uldkUrl}\nHTTP ${uldkRes.status}\n\n${uldkRes.text}`;

    // 2. NMT — pobierz próbki wysokości z poligonu (max 5 równomiernie rozłożonych punktów)
    let samplePoints = [[lat, lon]];
    if (parcelObj && parcelObj.latLngs.length >= 4) {
      const pts = parcelObj.latLngs;
      const step = Math.max(1, Math.floor((pts.length - 1) / 4));
      for (let i = 0; i < pts.length - 1 && samplePoints.length < 5; i += step) {
        samplePoints.push(pts[i]);
      }
    } else {
      samplePoints.push([lat + 0.001, lon], [lat - 0.001, lon], [lat, lon + 0.0015], [lat, lon - 0.0015]);
    }

    const nmtSamples = await Promise.all(samplePoints.map(([pLat, pLon]) => fetchNmtElevation(pLat, pLon)));
    const validSamples = nmtSamples.filter((s) => s.elevation !== null);
    let nmtSummary = null;
    if (validSamples.length >= 2) {
      validSamples.sort((a, b) => a.elevation - b.elevation);
      const lowest = validSamples[0];
      const highest = validSamples[validSamples.length - 1];
      const deltaH = highest.elevation - lowest.elevation;
      const dist = Math.max(1, distanceMeters([highest.lat, highest.lon], [lowest.lat, lowest.lon]));
      const slopePct = (deltaH / dist) * 100;
      const dir = deltaH > 0.1 ? bearingLabel([highest.lat, highest.lon], [lowest.lat, lowest.lon]) : "Teren płaski";
      nmtSummary = { lowest, highest, deltaH, dist, slopePct, dir, samples: nmtSamples };

      if (deltaH > 0.1) {
        L.polyline(
          [
            [highest.lat, highest.lon],
            [lowest.lat, lowest.lon],
          ],
          { color: "#38bdf8", weight: 3, dashArray: "6,6" }
        )
          .bindTooltip(`Spływ wody: -${deltaH.toFixed(1)} m (${slopePct.toFixed(1)}%)`)
          .addTo(overlayGroup);
        L.circleMarker([lowest.lat, lowest.lon], { radius: 6, color: "#ef4444", fillOpacity: 0.9 })
          .bindTooltip(`Najniższy punkt: ${lowest.elevation.toFixed(1)} m n.p.m. (tu zbiera się woda)`)
          .addTo(overlayGroup);
      }
    }
    state.nmt = nmtSummary;
    state.rawLogs.nmt = nmtSamples
      .map((s, idx) => `#${idx + 1} (${s.lat.toFixed(5)}, ${s.lon.toFixed(5)}) -> EPSG:2180 (${s.northing}, ${s.easting})\nGET ${s.url}\nWysokość: ${s.raw} m n.p.m. (${s.ms} ms)`)
      .join("\n\n");

    // 3. Open-Meteo & IMGW
    state.openMeteo = omRes.data;
    state.rawLogs.openmeteo = `GET ${omUrl}\nHTTP ${omRes.status}\n\n${JSON.stringify(omRes.data, null, 2).slice(0, 8000)}`;

    state.imgw = {
      warningsMeteo: Array.isArray(wMeteoRes.data) ? wMeteoRes.data : [],
      warningsHydro: Array.isArray(wHydroRes.data) ? wHydroRes.data : [],
      synop: Array.isArray(synopRes.data) ? synopRes.data : [],
    };
    state.rawLogs.imgw =
      `GET ${imgwWarnUrl} -> ${state.imgw.warningsMeteo.length} aktywnych ostrzeżeń meteo\n` +
      `GET ${imgwHydroWarnUrl} -> ${state.imgw.warningsHydro.length} aktywnych ostrzeżeń hydro\n` +
      `GET ${imgwSynopUrl} -> ${state.imgw.synop.length} stacji synoptycznych\n\n` +
      `=== WARNINGS METEO ===\n${JSON.stringify(state.imgw.warningsMeteo.slice(0, 5), null, 2)}\n\n` +
      `=== WARNINGS HYDRO ===\n${JSON.stringify(state.imgw.warningsHydro.slice(0, 5), null, 2)}`;

    const totalMs = Math.round(performance.now() - totalStart);
    $("api-timing").textContent = `${totalMs} ms`;
    setStatus("Dane aktualne", "ok");
    renderAll();
    renderRawTab();
  } catch (err) {
    console.error(err);
    setStatus("Błąd API", "crit");
    $("raw-output").textContent = `Błąd zapytania:\n${err.message}`;
  }
}

function renderAll() {
  const soilKey = $("soil-category").value;
  const soil = SOIL_MODIFIERS[soilKey];

  // Działka i NMT
  if (state.parcel) {
    $("parcel-teryt").textContent = `TERYT: ${state.parcel.teryt || "—"}`;
    $("kpi-parcel").textContent = `dz. ${state.parcel.parcelNo}`;
    $("kpi-commune").textContent = `${state.parcel.commune}, obr. ${state.parcel.region}`;
    $("kpi-area").textContent = `${state.parcel.areaHa.toFixed(2)} ha`;
  } else {
    $("parcel-teryt").textContent = "Poza działką";
    $("kpi-parcel").textContent = "Brak działki";
    $("kpi-commune").textContent = "Kliknij wewnątrz gruntu rolnego";
    $("kpi-area").textContent = "1.00 ha (test)";
  }

  const areaHa = state.parcel && state.parcel.areaHa > 0 ? state.parcel.areaHa : 1.0;

  if (state.nmt) {
    $("kpi-elev").textContent = `${state.nmt.lowest.elevation.toFixed(1)}–${state.nmt.highest.elevation.toFixed(1)} m`;
    $("kpi-slope").textContent = `ΔH=${state.nmt.deltaH.toFixed(1)} m | spadek ${state.nmt.slopePct.toFixed(1)}%`;
    $("kpi-dir").textContent = state.nmt.dir;
  } else {
    $("kpi-elev").textContent = "—";
    $("kpi-slope").textContent = "Brak danych NMT";
    $("kpi-dir").textContent = "—";
  }

  // Open-Meteo + ewentualna symulacja
  if (!state.openMeteo || !state.openMeteo.hourly) return;
  const h = state.openMeteo.hourly;
  let precipArr = [...h.precipitation];
  const et0Arr = [...h.et0_fao_evapotranspiration];
  let vpdArr = [...h.vapour_pressure_deficit];
  const soilMoist0 = h.soil_moisture_0_to_1cm[0];
  const minGroundT = Math.min(...h.soil_temperature_0cm);

  if (state.simulation === "rain") {
    // Symulacja nawalnego opadu +25 mm w godzinach 6..10
    for (let i = 6; i < 11 && i < precipArr.length; i++) precipArr[i] += 5.0;
  } else if (state.simulation === "vpd") {
    // Symulacja gorącego, suchego popołudnia VPD > 2.1 kPa
    for (let i = 10; i < 18 && i < vpdArr.length; i++) vpdArr[i] = 2.15;
  }

  const sumRainMm = precipArr.reduce((a, b) => a + (b || 0), 0);
  const sumEt0Mm = et0Arr.reduce((a, b) => a + (b || 0), 0);
  const kbwMm = sumRainMm - sumEt0Mm;
  const maxVpd = Math.max(...vpdArr);

  // 1 mm = 10 m3 / ha
  const rainM3 = sumRainMm * 10 * areaHa;
  const et0M3 = sumEt0Mm * 10 * areaHa;
  const kbwM3 = kbwMm * 10 * areaHa;

  $("kpi-rain-m3").textContent = `${Math.round(rainM3)} m³`;
  $("kpi-rain-mm").textContent = `${sumRainMm.toFixed(1)} mm w 48h`;
  $("kpi-et0-m3").textContent = `-${Math.round(et0M3)} m³`;
  $("kpi-et0-mm").textContent = `${sumEt0Mm.toFixed(1)} mm (FAO-56)`;
  $("kpi-kbw-m3").textContent = `${kbwM3 >= 0 ? "+" : ""}${Math.round(kbwM3)} m³`;
  $("kpi-soil-moisture").textContent = `Wilg. 0-1cm: ${(soilMoist0 * 100).toFixed(0)}%`;
  $("kpi-vpd").textContent = `${maxVpd.toFixed(2)} kPa`;
  $("kpi-ground-t").textContent = `Min T gruntu: ${minGroundT.toFixed(1)} °C`;

  const balBadge = $("balance-badge");
  if (kbwMm < soil.droughtThresholdMm) {
    balBadge.textContent = "Deficyt wodny";
    balBadge.className = "badge crit";
  } else if (sumRainMm >= 15) {
    balBadge.textContent = "Duży opad / Szansa retencji";
    balBadge.className = "badge warn";
  } else {
    balBadge.textContent = "Bilans stabilny";
    balBadge.className = "badge ok";
  }

  // Alerty deterministyczne
  const alerts = [];
  const slopePct = state.nmt ? state.nmt.slopePct : 0;
  const dirText = state.nmt ? state.nmt.dir : "w dół działki";

  if (sumRainMm >= 15 && slopePct >= 1.0) {
    const runoffM3 = Math.round(rainM3 * (1 - soil.retentionFactor) + rainM3 * 0.25);
    alerts.push({
      level: "warn",
      title: `ALERT RETENCYJNY: Zatrzymaj ~${runoffM3} m³ wody przed spływem!`,
      body: `Prognoza ${sumRainMm.toFixed(1)} mm opadu na działce ${areaHa.toFixed(2)} ha przy spadku ${slopePct.toFixed(1)}% (kierunek: ${dirText}). Zamknij zastawki na rowach i zabezpiecz odpływ przed falą opadu.`,
    });
  }

  if (maxVpd > 1.6) {
    alerts.push({
      level: "crit",
      title: `ALERT STRESU VPD (${maxVpd.toFixed(2)} kPa > 1.6 kPa)`,
      body: `Silny niedosyt wilgotności powietrza powoduje zamykanie aparatów szparkowych i duże straty parowania. Wstrzymaj nawadnianie i opryski w godzinach popołudniowych — przenieś zabiegi na noc/świt.`,
    });
  }

  if (minGroundT <= 2.0) {
    alerts.push({
      level: "warn",
      title: `ALERT PRZYMROZKOWY: T gruntu spadnie do ${minGroundT.toFixed(1)} °C`,
      body: `Zabezpiecz wrażliwe wschody i sady; rozważ nawadnianie antyprzymrozkowe lub opóźnienie zabiegów stresujących rośliny.`,
    });
  }

  if (kbwMm < soil.droughtThresholdMm) {
    alerts.push({
      level: "crit",
      title: `DEFICYT KBW (${kbwMm.toFixed(1)} mm) na glebie ${soil.name}`,
      body: `Działka straci netto ${Math.abs(Math.round(kbwM3))} m³ wody w 48h. Zalecane utrzymanie okrywy / mulczu i piętrzenie wody w rowach melioracyjnych.`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      level: "ok",
      title: "Brak zagrożeń krytycznych w najbliższych 48h",
      body: `Parametry VPD (${maxVpd.toFixed(2)} kPa), T gruntu (${minGroundT.toFixed(1)} °C) i bilansu (${kbwMm.toFixed(1)} mm) w normie. Użyj przycisków „Symuluj” u góry, aby przetestować wyzwalanie alertów.`,
    });
  }

  $("alerts-container").innerHTML = alerts
    .map((a) => `<div class="alert-box ${a.level}"><strong>${a.title}</strong><div style="margin-top:3px;color:var(--muted)">${a.body}</div></div>`)
    .join("");

  // Semafor 24h (12 bloków co 2h)
  const semHtml = [];
  for (let i = 0; i < 24 && i < h.time.length; i += 2) {
    const hourLabel = h.time[i].slice(11, 16);
    const vpd = vpdArr[i];
    const p2h = (precipArr[i] || 0) + (precipArr[i + 1] || 0);
    let cls = "sem-green";
    if (vpd > 1.6 || p2h >= 8) cls = "sem-red";
    else if (vpd > 1.2 || p2h >= 3) cls = "sem-yellow";
    semHtml.push(`<div class="sem-cell ${cls}" title="Opad 2h: ${p2h.toFixed(1)} mm | VPD: ${vpd.toFixed(2)} kPa">${hourLabel}</div>`);
  }
  $("semaphore-row").innerHTML = semHtml.join("");

  // Podsumowanie IMGW dla powiatu
  if (state.imgw) {
    const countyTeryt = state.parcel && state.parcel.teryt ? state.parcel.teryt.slice(0, 4) : "0403";
    const localWarnings = state.imgw.warningsMeteo.filter(
      (w) => Array.isArray(w.teryt) && w.teryt.some((t) => String(t).startsWith(countyTeryt))
    );
    const synopByd = state.imgw.synop.find((s) => /toru|chojnic|bydgoszcz|inowroc/i.test(s.stacja)) || state.imgw.synop[0];
    const synopText = synopByd
      ? `Najbliższa stacja synoptyczna IMGW: <strong>${synopByd.stacja}</strong> (${synopByd.data_pomiaru} ${synopByd.godzina_pomiaru}:00) — T: <strong>${synopByd.temperatura} °C</strong>, wilgotność: ${synopByd.wilgotnosc_wzgledna}%, wiatr: ${synopByd.predkosc_wiatru} m/s, opad dobowy: ${synopByd.suma_opadu} mm.`
      : "Brak danych synop.";

    const warnText =
      localWarnings.length > 0
        ? localWarnings.map((w) => `<div class="alert-box warn"><strong>IMGW (${w.stopien} st.): ${w.nazwa_zdarzenia}</strong><br>${w.tresc}</div>`).join("")
        : `<div>Brak aktywnych ostrzeżeń meteorologicznych IMGW dla powiatu TERYT <code>${countyTeryt}</code> (łącznie w Polsce aktywnych: ${state.imgw.warningsMeteo.length} meteo, ${state.imgw.warningsHydro.length} hydro).</div>`;

    $("imgw-summary").innerHTML = `${warnText}<div style="margin-top:8px">${synopText}</div>`;
  }
}

// Zdarzenia UI
map.on("click", (e) => analyzeLocation(e.latlng.lat, e.latlng.lng));

$("btn-sicienko").addEventListener("click", () =>
  analyzeLocation(PRESETS.sicienko.lat, PRESETS.sicienko.lon, PRESETS.sicienko.zoom)
);
$("btn-dobrcz").addEventListener("click", () =>
  analyzeLocation(PRESETS.dobrcz.lat, PRESETS.dobrcz.lon, PRESETS.dobrcz.zoom)
);
$("soil-category").addEventListener("change", renderAll);

$("btn-sim-rain").addEventListener("click", () => {
  state.simulation = "rain";
  renderAll();
  const area = state.parcel ? state.parcel.areaHa.toFixed(2) : "1.00";
  showToast(
    "WodoStrażnik — Symulacja Ulewy (+25 mm)",
    `Na działkę (${area} ha) spadnie +${Math.round(25 * 10 * parseFloat(area))} m³ wody. Zamknij zastawkę przed spływem!`
  );
});

$("btn-sim-vpd").addEventListener("click", () => {
  state.simulation = "vpd";
  renderAll();
  showToast(
    "WodoStrażnik — Alert Stresu VPD (2.15 kPa)",
    "Krytyczne parowanie! Wstrzymaj nawadnianie i opryski do godziny 20:00."
  );
});

$("btn-notify").addEventListener("click", async () => {
  if (!("Notification" in window)) {
    alert("Twoja przeglądarka nie obsługuje Notification API.");
    return;
  }
  const perm = await Notification.requestPermission();
  showToast("Status powiadomień", `Uprawnienie przeglądarki: ${perm}`);
});

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.activeTab = btn.dataset.tab;
    renderRawTab();
  });
});

// Start na polu #1 pod Bydgoszczą
analyzeLocation(PRESETS.sicienko.lat, PRESETS.sicienko.lon, PRESETS.sicienko.zoom);
