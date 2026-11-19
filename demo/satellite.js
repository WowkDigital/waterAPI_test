const EARTH_SEARCH_STAC = "https://earth-search.aws.element84.com/v1/search";
const PLANETARY_STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search";
const PLANETARY_SAS = "https://planetarycomputer.microsoft.com/api/sas/v1/token/landsateuwest/landsat-c2";
const GEOTIFF_CDN = "https://cdn.jsdelivr.net/npm/geotiff@2.1.4-beta.1/+esm";
const SAT_GRID_W = 128;
const SAT_SCL_MASK = new Set([0, 1, 3, 8, 9, 10]);

const satState = {
  loading: false,
  overlay: null,
  grid: null,
  s2Scene: null,
  lsScene: null,
  heatwaveSim: false,
  mode: "stress",
  curtain: 100,
  version: 0,
  sasCache: null,
};

let geotiffPromise;
function loadGeoTiff() {
  if (!geotiffPromise) geotiffPromise = import(GEOTIFF_CDN);
  return geotiffPromise;
}

function ensureUtmDef(epsg) {
  if (!window.proj4 || !epsg) return null;
  const code = "EPSG:" + epsg;
  if (!proj4.defs(code)) {
    const zone = epsg >= 32700 ? epsg - 32700 : epsg - 32600;
    const south = epsg >= 32700 ? " +south" : "";
    proj4.defs(code, `+proj=utm +zone=${zone}${south} +datum=WGS84 +units=m +no_defs`);
  }
  return code;
}

async function stacSearch(endpoint, collections, bbox, maxCloud, daysBack, limit = 3) {
  const end = new Date();
  const start = new Date(end.getTime() - daysBack * 86400 * 1000);
  const body = {
    collections,
    bbox,
    datetime: `${start.toISOString()}/${end.toISOString()}`,
    limit,
    query: { "eo:cloud_cover": { lt: maxCloud } },
    sortby: [{ field: "properties.datetime", direction: "desc" }],
  };
  const started = performance.now();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(14000),
  });
  if (!response.ok) throw new Error(`STAC HTTP ${response.status}`);
  const json = await response.json();
  return {
    features: Array.isArray(json.features) ? json.features : [],
    ms: Math.round(performance.now() - started),
    requestBody: body,
  };
}

async function getPlanetarySasToken() {
  if (satState.sasCache && satState.sasCache.expires > Date.now() + 120000) {
    return satState.sasCache.token;
  }
  const response = await fetch(PLANETARY_SAS, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`SAS HTTP ${response.status}`);
  const data = await response.json();
  satState.sasCache = {
    token: data.token,
    expires: data.expiry ? Date.parse(data.expiry) : Date.now() + 20 * 60 * 1000,
  };
  return data.token;
}

function appendSas(href, token) {
  return href.includes("?") ? `${href}&${token}` : `${href}?${token}`;
}

function projectBboxCorners(bounds, crs) {
  const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
  const corners = [
    [sw.lng, sw.lat], [ne.lng, sw.lat],
    [sw.lng, ne.lat], [ne.lng, ne.lat],
  ].map(([lon, lat]) => proj4("EPSG:4326", crs, [lon, lat]));
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

async function readCogPatch(url, bounds, epsg, resampleMethod = "bilinear") {
  const crs = ensureUtmDef(epsg);
  if (!crs) throw new Error("Brak proj4 dla układu UTM " + epsg);
  const { fromUrl } = await loadGeoTiff();
  const tiff = await fromUrl(url, { allowFullFile: false });
  const image = await tiff.getImage();
  const imgW = image.getWidth();
  const imgH = image.getHeight();
  const [minX, minY, maxX, maxY] = image.getBoundingBox();
  const [bMinX, bMinY, bMaxX, bMaxY] = projectBboxCorners(bounds, crs);

  const padX = (bMaxX - bMinX) * 0.08;
  const padY = (bMaxY - bMinY) * 0.08;
  const px0 = Math.max(0, Math.floor(((bMinX - padX - minX) / (maxX - minX)) * imgW));
  const px1 = Math.min(imgW, Math.ceil(((bMaxX + padX - minX) / (maxX - minX)) * imgW));
  const py0 = Math.max(0, Math.floor(((maxY - (bMaxY + padY)) / (maxY - minY)) * imgH));
  const py1 = Math.min(imgH, Math.ceil(((maxY - (bMinY - padY)) / (maxY - minY)) * imgH));
  if (px1 <= px0 || py1 <= py0) return null;

  const spanX = px1 - px0;
  const spanY = py1 - py0;
  const outW = Math.min(180, Math.max(24, spanX));
  const outH = Math.min(180, Math.max(24, spanY));
  const data = await image.readRasters({
    window: [px0, py0, px1, py1],
    width: outW,
    height: outH,
    samples: [0],
    interleave: true,
    resampleMethod,
  });

  const patchMinX = minX + (px0 / imgW) * (maxX - minX);
  const patchMaxX = minX + (px1 / imgW) * (maxX - minX);
  const patchMaxY = maxY - (py0 / imgH) * (maxY - minY);
  const patchMinY = maxY - (py1 / imgH) * (maxY - minY);

  return {
    crs,
    width: outW,
    height: outH,
    minX: patchMinX,
    maxX: patchMaxX,
    minY: patchMinY,
    maxY: patchMaxY,
    data,
    sample(lat, lon) {
      const [x, y] = proj4("EPSG:4326", crs, [lon, lat]);
      const col = Math.floor(((x - patchMinX) / (patchMaxX - patchMinX)) * outW);
      const row = Math.floor(((patchMaxY - y) / (patchMaxY - patchMinY)) * outH);
      if (col < 0 || row < 0 || col >= outW || row >= outH) return NaN;
      return data[row * outW + col];
    },
  };
}

function bandParams(asset, fallbackScale, fallbackOffset, fallbackNodata = 0) {
  const info = asset?.["raster:bands"]?.[0] ?? {};
  return {
    scale: Number.isFinite(info.scale) ? info.scale : fallbackScale,
    offset: Number.isFinite(info.offset) ? info.offset : fallbackOffset,
    nodata: Number.isFinite(info.nodata) ? info.nodata : fallbackNodata,
  };
}

function pointInRing(lat, lon, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i];
    const [yj, xj] = ring[j];
    const intersect = (yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInParcel(lat, lon, parcel) {
  const rings = parcel?.rings ?? (parcel?.points ? [[parcel.points]] : []);
  for (const [outer, ...holes] of rings) {
    if (pointInRing(lat, lon, outer) && !holes.some((hole) => pointInRing(lat, lon, hole))) {
      return true;
    }
  }
  return false;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function lerpColor(stops, value) {
  if (value <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (value <= stops[i][0]) {
      const [v0, c0] = stops[i - 1];
      const [v1, c1] = stops[i];
      const t = (value - v0) / Math.max(1e-6, v1 - v0);
      return [
        Math.round(c0[0] + t * (c1[0] - c0[0])),
        Math.round(c0[1] + t * (c1[1] - c0[1])),
        Math.round(c0[2] + t * (c1[2] - c0[2])),
      ];
    }
  }
  return stops.at(-1)[1];
}

const STRESS_PALETTE = [
  [0, [41, 128, 185]],    // chłodno / dobrze nawodnione
  [30, [46, 204, 113]],   // optymalnie
  [55, [241, 196, 15]],   // lekki stres cieplny
  [75, [230, 126, 34]],   // silny stres cieplny
  [100, [192, 57, 43]],   // krytyczne przegrzanie roślin
];

const NDMI_PALETTE = [
  [-0.25, [178, 58, 43]],
  [0.0, [230, 145, 56]],
  [0.18, [238, 208, 102]],
  [0.35, [56, 178, 122]],
  [0.55, [23, 105, 165]],
];

const NDVI_PALETTE = [
  [0.05, [168, 114, 72]],
  [0.25, [224, 186, 92]],
  [0.45, [132, 193, 92]],
  [0.75, [23, 112, 62]],
];

function computePixelStress(ndvi, ndmi, lstC, vpdMax) {
  const lst = Number.isFinite(lstC) ? lstC : 18;
  const lstFactor = clamp((lst - 18) / 18, 0, 1); // >36°C -> 1.0
  const dryCanopy = Number.isFinite(ndmi) ? clamp((0.28 - ndmi) / 0.45, 0, 1) : 0.4;
  const vpdFactor = Number.isFinite(vpdMax) ? clamp((vpdMax - 0.8) / 1.6, 0, 1) : 0.25;
  const vegMask = Number.isFinite(ndvi) && ndvi < 0.15 ? 0.55 : 1.0;
  return clamp(Math.round((lstFactor * 0.56 + dryCanopy * 0.30 + vpdFactor * 0.14) * vegMask * 100), 0, 100);
}

function applyHeatwaveOffset(rawLst) {
  if (!Number.isFinite(rawLst)) return NaN;
  return satState.heatwaveSim ? rawLst + 14 : rawLst;
}

function summarizeRegion(grid, predicate) {
  let count = 0, validLst = 0, lstSum = 0, ndviSum = 0, ndmiSum = 0, hotCount = 0, stressSum = 0;
  const { cols, rows, bounds, ndvi, ndmi, lst, cloud } = grid;
  const south = bounds.getSouth(), north = bounds.getNorth();
  const west = bounds.getWest(), east = bounds.getEast();
  const vpdMax = state.forecast ? Math.max(...state.forecast.vapour_pressure_deficit.filter(Number.isFinite)) : null;

  for (let r = 0; r < rows; r++) {
    const lat = north - ((r + 0.5) / rows) * (north - south);
    for (let c = 0; c < cols; c++) {
      const lon = west + ((c + 0.5) / cols) * (east - west);
      const idx = r * cols + c;
      if (cloud[idx] || !Number.isFinite(ndvi[idx])) continue;
      if (predicate && !predicate(lat, lon)) continue;
      const effLst = applyHeatwaveOffset(lst[idx]);
      const stress = computePixelStress(ndvi[idx], ndmi[idx], effLst, vpdMax);
      count++;
      ndviSum += ndvi[idx];
      if (Number.isFinite(ndmi[idx])) ndmiSum += ndmi[idx];
      if (Number.isFinite(effLst)) {
        lstSum += effLst;
        validLst++;
      }
      stressSum += stress;
      if (stress >= 58 || effLst >= 28) hotCount++;
    }
  }
  if (!count) return null;
  return {
    pixels: count,
    ndvi: ndviSum / count,
    ndmi: ndmiSum / count,
    lstC: validLst ? lstSum / validLst : null,
    stress: Math.round(stressSum / count),
    hotShare: Math.round((hotCount / count) * 100),
  };
}

const LAYER_LEGENDS = {
  stress: {
    hint: "Łączy temperaturę powierzchni (Landsat ST_B10) z niedoborem wody w liściach (Sentinel-2 NDMI) i VPD.",
    items: [
      { color: "#2980b9", text: "Chłodno (<22 °C) · brak stresu, rośliny dobrze się chłodzą" },
      { color: "#2ecc71", text: "Optymalnie (22–26 °C) · stabilna transpiracja" },
      { color: "#f1c40f", text: "Lekki stres (26–28 °C) · unikaj oprysków w południe" },
      { color: "#e67e22", text: "Silny stres (28–33 °C) · zamknij zastawkę, chroń wodę" },
      { color: "#c0392b", text: "Krytycznie za ciepło (>33 °C) · rośliny zamykają aparaty, straty plonu" },
    ],
  },
  ndmi: {
    hint: "Wskaźnik NDMI (bez °C) mierzy ilość wody w tkankach roślin. Uwaga: jesienią zaorane pola bez upraw również są czerwone — reaguj tylko, gdy na polu rośnie uprawa (NDVI > 0,25).",
    items: [
      { color: "#b23a2b", text: "NDMI < 0,00 · goła gleba lub skrajnie przesuszone liście (pilne, jeśli jest uprawa)" },
      { color: "#e69138", text: "0,00 – 0,15 · niska wilgotność liści (początek stresu wodnego)" },
      { color: "#eed066", text: "0,15 – 0,25 · umiarkowane uwodnienie roślin" },
      { color: "#38b27a", text: "0,25 – 0,40 · dobre uwodnienie, roślina ma zapas wody" },
      { color: "#1769a5", text: "> 0,40 · bardzo wysokie uwodnienie (gęsta zieleń, las lub teren podmokły)" },
    ],
  },
  ndvi: {
    hint: "Wskaźnik NDVI pokazuje ilość żywej, zielonej biomasy (od -1 do +1). Pomaga odróżnić gołe pole od rosnącej uprawy.",
    items: [
      { color: "#a87248", text: "NDVI < 0,15 · goła gleba, ściernisko, drogi lub woda (brak wegetacji)" },
      { color: "#e0ba5c", text: "0,15 – 0,35 · wschody ozimin lub słabsza okrywa roślinna" },
      { color: "#84c15c", text: "0,35 – 0,55 · umiarkowanie gęsta, zdrowa uprawa" },
      { color: "#17703e", text: "> 0,55 · bardzo gęsta, bujna roślinność (np. silne oziminy lub las)" },
    ],
  },
};

function renderSatelliteLegend() {
  const container = $("sat-legend");
  if (!container) return;
  container.replaceChildren();
  const cfg = LAYER_LEGENDS[satState.mode];
  if (!cfg) {
    container.hidden = true;
    return;
  }
  container.hidden = false;
  const hint = document.createElement("p");
  hint.className = "sat-legend-hint";
  hint.textContent = cfg.hint;
  container.append(hint);
  const row = document.createElement("div");
  row.className = "sat-legend-items";
  for (const item of cfg.items) {
    const span = document.createElement("span");
    span.className = "legend-item";
    const swatch = document.createElement("i");
    swatch.style.background = item.color;
    span.append(swatch, document.createTextNode(item.text));
    row.append(span);
  }
  container.append(row);
}

function renderSatelliteOverlay() {
  renderSatelliteLegend();
  if (!map || !satState.grid) return;
  if (satState.overlay) {
    map.removeLayer(satState.overlay);
    satState.overlay = null;
  }
  if (!satState.mode) {
    updateCurtainVisual();
    return;
  }

  const { cols, rows, bounds, ndvi, ndmi, lst, cloud } = satState.grid;
  const vpdMax = state.forecast ? Math.max(...state.forecast.vapour_pressure_deficit.filter(Number.isFinite)) : null;
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d");
  const imgData = ctx.createImageData(cols, rows);

  for (let i = 0; i < cols * rows; i++) {
    if (cloud[i] || !Number.isFinite(ndvi[i])) continue;
    let rgb;
    if (satState.mode === "ndmi") {
      rgb = lerpColor(NDMI_PALETTE, Number.isFinite(ndmi[i]) ? ndmi[i] : 0);
    } else if (satState.mode === "ndvi") {
      rgb = lerpColor(NDVI_PALETTE, ndvi[i]);
    } else {
      const effLst = applyHeatwaveOffset(lst[i]);
      const stress = computePixelStress(ndvi[i], ndmi[i], effLst, vpdMax);
      rgb = lerpColor(STRESS_PALETTE, stress);
    }
    imgData.data.set([rgb[0], rgb[1], rgb[2], 196], 4 * i);
  }
  ctx.putImageData(imgData, 0, 0);

  satState.overlay = L.imageOverlay(canvas.toDataURL(), bounds, {
    opacity: 0.85,
    interactive: false,
    zIndex: 450,
  }).addTo(map);

  updateCurtainVisual();
  renderSatelliteMetrics();
}

function updateCurtainVisual() {
  const divider = $("sat-curtain-line");
  const pct = satState.curtain;
  const img = satState.overlay?.getElement?.();
  if (img) {
    img.style.clipPath = `inset(0 0 0 ${100 - pct}%)`;
  }
  if (divider) {
    const active = Boolean(satState.overlay && satState.mode && pct > 0 && pct < 100);
    divider.hidden = !active;
    if (active) divider.style.left = `${100 - pct}%`;
  }
}

function stressBadgeLabel(summary) {
  if (!summary) return { text: "Brak pikseli (chmury / poza sceną)", level: "warn" };
  if (summary.stress >= 72 || (summary.lstC !== null && summary.lstC >= 32)) {
    return { text: "🔥 Krytycznie za ciepło roślinom", level: "crit" };
  }
  if (summary.stress >= 55 || (summary.lstC !== null && summary.lstC >= 27)) {
    return { text: "🌡️ Podwyższony stres cieplny", level: "warn" };
  }
  return { text: "💧 Chłodzenie i wilgotność OK", level: "ok" };
}

function renderSatelliteMetrics() {
  const grid = satState.grid;
  const badgeEl = $("sat-badge");
  const rankingEl = $("sat-ranking");

  if (!grid) {
    badgeEl.textContent = "Gotowy do pobrania";
    badgeEl.className = "badge info";
    for (const id of ["sat-lst", "sat-ndmi", "sat-ndvi", "sat-hotshare"]) $(id).textContent = "—";
    $("sat-lst-sub").textContent = "Landsat 8/9 ST_B10";
    $("sat-ndmi-sub").textContent = "Sentinel-2 (B08-B11)";
    $("sat-ndvi-sub").textContent = "Sentinel-2 (B08-B04)";
    $("sat-hotshare-sub").textContent = "Ocena dla działki lub widoku";
    rankingEl.replaceChildren();
    return;
  }

  const parcelSummary = state.parcel?.rings?.length
    ? summarizeRegion(grid, (lat, lon) => pointInParcel(lat, lon, state.parcel))
    : null;
  const summary = parcelSummary ?? summarizeRegion(grid, null);
  const verdict = stressBadgeLabel(summary);
  badgeEl.textContent = verdict.text;
  badgeEl.className = "badge " + verdict.level;

  if (summary) {
    $("sat-lst").textContent = summary.lstC !== null ? format(summary.lstC, 1) + " °C" : "Brak T°";
    $("sat-ndmi").textContent = format(summary.ndmi, 2);
    $("sat-ndvi").textContent = format(summary.ndvi, 2);
    $("sat-hotshare").textContent = summary.hotShare + "%";
    $("sat-lst-sub").textContent = (satState.heatwaveSim ? "Symulacja +14 °C · " : "") + (satState.lsScene ? satState.lsScene.id.slice(0, 16) : "Estymacja Open-Meteo");
    $("sat-ndmi-sub").textContent = summary.ndmi < 0.08 ? "Niska zawartość wody w liściach" : "Dobry turgor roślin";
    $("sat-ndvi-sub").textContent = summary.ndvi >= 0.35 ? "Aktywna okrywa roślinna" : "Słaba biomasa / gleba odkryta";
    $("sat-hotshare-sub").textContent = (parcelSummary ? "Dla wybranej działki" : "Dla widoku mapy") + " · indeks " + summary.stress + "/100";
  }

  rankingEl.replaceChildren();
  const fieldScores = (typeof farm !== "undefined" ? farm.fields : [])
    .map((field) => ({
      field,
      stats: summarizeRegion(grid, (lat, lon) => pointInParcel(lat, lon, field.parcel)),
    }))
    .filter((entry) => entry.stats)
    .sort((a, b) => b.stats.stress - a.stats.stress);

  if (!fieldScores.length) {
    const note = document.createElement("p");
    note.className = "section-note";
    note.textContent = "Dodaj pola do sekcji „Moje pola” w granicach tego widoku, aby otrzymać ranking przegrzania upraw.";
    rankingEl.append(note);
    return;
  }

  for (const { field, stats } of fieldScores) {
    const item = document.createElement("li");
    item.className = "sat-rank-item";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "farm-field-link";
    btn.textContent = (field.parcel.custom ? "Własny obrys" : "Działka " + (field.parcel.number || field.parcel.teryt))
      + " · " + format(field.parcel.area, 2) + " ha";
    btn.onclick = () => inspectField(field);

    const status = document.createElement("span");
    const statusInfo = stressBadgeLabel(stats);
    status.className = "badge " + statusInfo.level;
    status.textContent = (stats.lstC !== null ? format(stats.lstC, 1) + " °C · " : "")
      + "NDMI " + format(stats.ndmi, 2)
      + " · stres " + stats.stress + "/100";

    item.append(btn, status);
    rankingEl.append(item);
  }
}

async function fetchSatelliteForView() {
  if (!map || satState.loading) return;
  if (map.getZoom() < 12) {
    showToast("Przybliż mapę", "Przybliż widok przynajmniej do poziomu 12 (gmina / pola), aby pobrać wycinek Sentinela.");
    return;
  }

  const version = ++satState.version;
  satState.loading = true;
  $("sat-fetch").disabled = true;
  $("sat-status").textContent = "Wyszukiwanie bezchmurnych scen Sentinel-2 i Landsat 8/9 w STAC…";
  $("sat-badge").textContent = "Pobieranie STAC…";
  $("sat-badge").className = "badge info";

  const bounds = map.getBounds();
  const bbox = [
    Number(bounds.getWest().toFixed(5)),
    Number(bounds.getSouth().toFixed(5)),
    Number(bounds.getEast().toFixed(5)),
    Number(bounds.getNorth().toFixed(5)),
  ];

  const logLines = [];
  try {
    let s2Res = await stacSearch(EARTH_SEARCH_STAC, ["sentinel-2-l2a"], bbox, 25, 90, 3);
    if (!s2Res.features.length) {
      s2Res = await stacSearch(EARTH_SEARCH_STAC, ["sentinel-2-l2a"], bbox, 60, 180, 3);
    }
    if (version !== satState.version) return;
    if (!s2Res.features.length) throw new Error("Brak scen Sentinel-2 w bazie STAC dla tego obszaru.");

    const s2 = s2Res.features[0];
    satState.s2Scene = s2;
    logLines.push(`Sentinel-2 STAC (${s2Res.ms} ms): ${s2.id} · ${s2.properties.datetime} · chmury ${format(s2.properties["eo:cloud_cover"], 1)}% · EPSG:${s2.properties["proj:epsg"]}`);

    let ls = null;
    let sasToken = "";
    try {
      let lsRes = await stacSearch(PLANETARY_STAC, ["landsat-c2-l2"], bbox, 30, 120, 3);
      if (!lsRes.features.length) lsRes = await stacSearch(PLANETARY_STAC, ["landsat-c2-l2"], bbox, 65, 220, 3);
      if (lsRes.features.length) {
        ls = lsRes.features[0];
        sasToken = await getPlanetarySasToken();
        logLines.push(`Landsat Thermal STAC (${lsRes.ms} ms): ${ls.id} · ${ls.properties.datetime} · chmury ${format(ls.properties["eo:cloud_cover"], 1)}%`);
      }
    } catch (lsErr) {
      logLines.push("Landsat Thermal pominięty: " + lsErr.message);
    }
    satState.lsScene = ls;

    $("sat-status").textContent = "Strumieniowanie pasm COG (HTTP Range: B04, B08, B11, SCL" + (ls ? ", ST_B10" : "") + ")…";
    const s2Epsg = s2.properties["proj:epsg"] || 32633;
    const lsEpsg = ls?.properties?.["proj:epsg"] || s2Epsg;

    const tasks = [
      readCogPatch(s2.assets.red.href, bounds, s2Epsg, "bilinear"),
      readCogPatch(s2.assets.nir.href, bounds, s2Epsg, "bilinear"),
      readCogPatch(s2.assets.swir16.href, bounds, s2Epsg, "bilinear"),
      s2.assets.scl ? readCogPatch(s2.assets.scl.href, bounds, s2Epsg, "nearest") : Promise.resolve(null),
      ls?.assets?.lwir11 ? readCogPatch(appendSas(ls.assets.lwir11.href, sasToken), bounds, lsEpsg, "bilinear") : Promise.resolve(null),
    ];

    const t0 = performance.now();
    const [redPatch, nirPatch, swirPatch, sclPatch, lstPatch] = await Promise.all(tasks);
    if (version !== satState.version) return;
    if (!redPatch || !nirPatch || !swirPatch) throw new Error("Wybrany obszar leży poza granicą kafelka Sentinel-2.");

    const redCfg = bandParams(s2.assets.red, 0.0001, -0.1);
    const nirCfg = bandParams(s2.assets.nir, 0.0001, -0.1);
    const swirCfg = bandParams(s2.assets.swir16, 0.0001, -0.1);
    const lstCfg = bandParams(ls?.assets?.lwir11, 0.00341802, 149.0);

    const cols = SAT_GRID_W;
    const aspect = Math.max(0.45, Math.min(1.4, (bounds.getNorth() - bounds.getSouth()) / Math.max(1e-5, bounds.getEast() - bounds.getWest()) * 1.65));
    const rows = Math.round(cols * aspect);
    const ndvi = new Float32Array(cols * rows).fill(NaN);
    const ndmi = new Float32Array(cols * rows).fill(NaN);
    const lst = new Float32Array(cols * rows).fill(NaN);
    const cloud = new Uint8Array(cols * rows);

    const south = bounds.getSouth(), north = bounds.getNorth();
    const west = bounds.getWest(), east = bounds.getEast();
    const fallbackTemp = state.forecast?.soil_temperature_0cm?.[0] ?? 12;

    for (let r = 0; r < rows; r++) {
      const lat = north - ((r + 0.5) / rows) * (north - south);
      for (let c = 0; c < cols; c++) {
        const lon = west + ((c + 0.5) / cols) * (east - west);
        const i = r * cols + c;
        const sclVal = sclPatch ? sclPatch.sample(lat, lon) : 4;
        if (sclPatch && SAT_SCL_MASK.has(sclVal)) {
          cloud[i] = 1;
          continue;
        }
        const dnRed = redPatch.sample(lat, lon);
        const dnNir = nirPatch.sample(lat, lon);
        const dnSwir = swirPatch.sample(lat, lon);
        if (!Number.isFinite(dnRed) || !Number.isFinite(dnNir) || dnRed === redCfg.nodata || dnNir === nirCfg.nodata) continue;

        const rRefl = Math.max(0.0001, dnRed * redCfg.scale + redCfg.offset);
        const nRefl = Math.max(0.0001, dnNir * nirCfg.scale + nirCfg.offset);
        ndvi[i] = (nRefl - rRefl) / (nRefl + rRefl);

        if (Number.isFinite(dnSwir) && dnSwir !== swirCfg.nodata) {
          const sRefl = Math.max(0.0001, dnSwir * swirCfg.scale + swirCfg.offset);
          ndmi[i] = (nRefl - sRefl) / (nRefl + sRefl);
        }

        const dnLst = lstPatch ? lstPatch.sample(lat, lon) : NaN;
        if (Number.isFinite(dnLst) && dnLst !== lstCfg.nodata && dnLst > 1000) {
          lst[i] = dnLst * lstCfg.scale + lstCfg.offset - 273.15;
        } else if (Number.isFinite(ndmi[i])) {
          // Empiryczne doskalowanie temperatury powierzchni przy braku bezchmurnego Landsata
          lst[i] = fallbackTemp + clamp((0.25 - ndmi[i]) * 18, -3, 12);
        }
      }
    }

    satState.grid = { cols, rows, bounds, ndvi, ndmi, lst, cloud };
    if (!satState.mode) {
      satState.mode = "stress";
      $("sat-layer-mode").value = "stress";
    }
    renderSatelliteOverlay();

    const msCog = Math.round(performance.now() - t0);
    const s2Date = s2.properties.datetime.slice(0, 10);
    const lsDate = ls ? ls.properties.datetime.slice(0, 10) : "brak (estymacja)";
    $("sat-status").textContent = `Załadowano w ${msCog} ms · Sentinel-2: ${s2Date} (chmury ${format(s2.properties["eo:cloud_cover"], 1)}%) · Landsat Termiczny: ${lsDate}.`;
    logLines.push(`COG Range Stream (${msCog} ms) · siatka ${cols}×${rows}`);
    logLines.push("Sentinel B04 href: " + s2.assets.red.href);
    if (ls?.assets?.lwir11) logLines.push("Landsat ST_B10 href: " + ls.assets.lwir11.href);
    state.logs.sentinel = logLines.join("\n\n");
    renderRawTab();
  } catch (error) {
    if (version === satState.version) {
      $("sat-status").textContent = "Błąd pobierania danych satelitarnych: " + error.message;
      $("sat-badge").textContent = "Błąd satelity";
      $("sat-badge").className = "badge crit";
      state.logs.sentinel = [...logLines, "ERROR: " + error.message].join("\n\n");
      renderRawTab();
    }
  } finally {
    if (version === satState.version) {
      satState.loading = false;
      $("sat-fetch").disabled = false;
    }
  }
}

function initSatelliteModule() {
  const fetchBtn = $("sat-fetch");
  if (!fetchBtn) return;

  renderSatelliteLegend();
  fetchBtn.addEventListener("click", fetchSatelliteForView);
  $("sat-layer-mode").addEventListener("change", (event) => {
    satState.mode = event.target.value;
    renderSatelliteOverlay();
  });
  $("sat-heatwave").addEventListener("change", (event) => {
    satState.heatwaveSim = event.target.checked;
    if (satState.grid) {
      renderSatelliteOverlay();
    }
  });
  $("sat-curtain").addEventListener("input", (event) => {
    satState.curtain = Number(event.target.value);
    $("sat-curtain-val").textContent = satState.curtain + "%";
    updateCurtainVisual();
  });

  if (map) {
    map.on("mousemove", ({ latlng }) => {
      const readout = $("sat-hover-readout");
      if (!readout || !satState.grid || !satState.mode) return;
      const { cols, rows, bounds, ndvi, ndmi, lst, cloud } = satState.grid;
      if (!bounds.contains(latlng)) {
        readout.textContent = "Najedź na pobrany wycinek, aby odczytać stres roślin.";
        return;
      }
      const c = Math.floor(((latlng.lng - bounds.getWest()) / (bounds.getEast() - bounds.getWest())) * cols);
      const r = Math.floor(((bounds.getNorth() - latlng.lat) / (bounds.getNorth() - bounds.getSouth())) * rows);
      const i = clamp(r, 0, rows - 1) * cols + clamp(c, 0, cols - 1);
      if (cloud[i] || !Number.isFinite(ndvi[i])) {
        readout.textContent = "Piksel zachmurzony lub poza maską danych.";
        return;
      }
      const effLst = applyHeatwaveOffset(lst[i]);
      const vpdMax = state.forecast ? Math.max(...state.forecast.vapour_pressure_deficit.filter(Number.isFinite)) : null;
      const stress = computePixelStress(ndvi[i], ndmi[i], effLst, vpdMax);
      readout.textContent = `Kursor · Temp: ${Number.isFinite(effLst) ? format(effLst, 1) + " °C" : "—"} · NDMI: ${format(ndmi[i], 2)} · NDVI: ${format(ndvi[i], 2)} · Stres: ${stress}/100`;
    });
  }
  const farmList = $("farm-list");
  if (farmList) {
    new MutationObserver(() => {
      if (satState.grid) renderSatelliteMetrics();
    }).observe(farmList, { childList: true });
  }
}

initSatelliteModule();

window.refreshSatelliteMetrics = renderSatelliteMetrics;
