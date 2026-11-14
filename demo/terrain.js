const TERRARIUM = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/";
const SHADE_WMS = "https://mapy.geoportal.gov.pl/wss/service/PZGIK/NMT/GRID1/WMS/ShadedRelief";
const NMT_WCS = "https://mapy.geoportal.gov.pl/wss/service/PZGIK/NMT/GRID1/WCS/DigitalTerrainModelFormatTIFF";
const TERRAIN_ZOOM = 13;
const GRID_SIZE = 160;
const TILE_SIZE = 256;
const tileCache = new Map();
let terrainOverlay, shadedRelief, profileLine, importedTerrain, terrainHintBounds, activeProfile, slopeReading;
let terrainVersion = 0, profileVersion = 0, importVersion = 0, terrainMoveTimer;

function tiffUrl(bounds) {
  if (!window.proj4) return null;
  const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
  const points = [[sw.lat, sw.lng], [sw.lat, ne.lng], [ne.lat, sw.lng], [ne.lat, ne.lng]].map(projectPoint);
  const east = points.map((point) => point[1]);
  const north = points.map((point) => point[0]);
  const left = Math.floor(Math.min(...east) - 150), right = Math.ceil(Math.max(...east) + 150);
  const bottom = Math.floor(Math.min(...north) - 150), top = Math.ceil(Math.max(...north) + 150);
  const step = Math.max(2, Math.ceil(Math.max(right - left, top - bottom) / 900));
  return NMT_WCS + "?" + new URLSearchParams({
    service: "WCS", version: "1.0.0", request: "GetCoverage", coverage: "DTM_PL-KRON86-NH_TIFF",
    bbox: [left, bottom, right, top].join(","), crs: "EPSG:2180", response_crs: "EPSG:2180",
    format: "GEOTIFF", width: String(Math.ceil((right - left) / step)), height: String(Math.ceil((top - bottom) / step)),
  });
}

function updateTerrainDownload(bounds) {
  if (typeof bounds?.getSouthWest === "function") terrainHintBounds = bounds;
  if (!map) return;
  const target = terrainHintBounds ?? map.getBounds();
  const span = distanceMeters([target.getSouth(), target.getWest()], [target.getNorth(), target.getEast()]);
  const link = $("terrain-download");
  const url = span <= 4800 ? tiffUrl(target) : null;
  link.hidden = !url;
  if (url) link.href = url;
}

function loadElevationTile(x, y) {
  const key = x + "/" + y;
  if (!tileCache.has(key)) {
    const pending = fetch(TERRARIUM + TERRAIN_ZOOM + "/" + key + ".png", { signal: AbortSignal.timeout(12000) })
      .then(async (response) => {
        if (!response.ok) throw new Error("Nie udało się pobrać kafla wysokości");
        const bitmap = await createImageBitmap(await response.blob(), { colorSpaceConversion: "none" });
        try {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = TILE_SIZE;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          context.drawImage(bitmap, 0, 0);
          const rgba = context.getImageData(0, 0, TILE_SIZE, TILE_SIZE).data;
          const values = new Float32Array(TILE_SIZE * TILE_SIZE);
          for (let i = 0; i < values.length; i++) {
            values[i] = rgba[4 * i] * 256 + rgba[4 * i + 1] + rgba[4 * i + 2] / 256 - 32768;
          }
          return values;
        } finally {
          bitmap.close();
        }
      }).catch((error) => {
        if (tileCache.get(key) === pending) tileCache.delete(key);
        throw error;
      });
    tileCache.set(key, pending);
    if (tileCache.size > 32) tileCache.delete(tileCache.keys().next().value);
  }
  return tileCache.get(key);
}

async function elevationSource(bounds) {
  if (importedTerrain?.bounds.contains(bounds.getSouthWest()) && importedTerrain.bounds.contains(bounds.getNorthEast())) {
    return importedTerrain;
  }
  const nw = map.project(bounds.getNorthWest(), TERRAIN_ZOOM).subtract([1, 1]);
  const se = map.project(bounds.getSouthEast(), TERRAIN_ZOOM).add([1, 1]);
  const xy = (value) => Math.floor(value / TILE_SIZE);
  const tiles = new Map();
  const pending = [];
  if ((xy(se.x) - xy(nw.x) + 1) * (xy(se.y) - xy(nw.y) + 1) > 12) {
    throw new Error("Przybliż mapę, aby objąć mniejszy obszar.");
  }
  for (let x = xy(nw.x); x <= xy(se.x); x++) {
    for (let y = xy(nw.y); y <= xy(se.y); y++) {
      pending.push(loadElevationTile(x, y).then((values) => tiles.set(x + "/" + y, values)));
    }
  }
  await Promise.all(pending);
  return {
    label: "Mapzen / AWS · podgląd orientacyjny",
    sample(latlng) {
      const point = map.project(latlng, TERRAIN_ZOOM);
      const left = Math.floor(point.x - .5), top = Math.floor(point.y - .5);
      const dx = point.x - .5 - left, dy = point.y - .5 - top;
      const at = (col, row) => {
        const x = xy(col), y = xy(row);
        return tiles.get(x + "/" + y)?.[(row - TILE_SIZE * y) * TILE_SIZE + col - TILE_SIZE * x] ?? NaN;
      };
      const upper = at(left, top) * (1 - dx) + at(left + 1, top) * dx;
      const lower = at(left, top + 1) * (1 - dx) + at(left + 1, top + 1) * dx;
      return upper * (1 - dy) + lower * dy;
    },
  };
}

async function readTerrainFile(file) {
  if (!window.proj4) throw new Error("Nie udało się wczytać biblioteki współrzędnych.");
  if (file.size > 40 * 1024 * 1024) throw new Error("Wybierz wycinek GeoTIFF do 40 MB.");
  const { fromBlob } = await import("https://cdn.jsdelivr.net/npm/geotiff@2.1.4-beta.1/+esm");
  const tiff = await fromBlob(file);
  const image = await tiff.getImage();
  const keys = image.getGeoKeys();
  const code = keys.ProjectedCSTypeGeoKey ?? keys.GeographicTypeGeoKey;
  if (![2180, 4326, 3857].includes(code)) throw new Error("Wymagany jest układ EPSG:2180, 4326 lub 3857.");
  if (image.getSamplesPerPixel() !== 1) throw new Error("Wybierz jednopasmowy raster wysokości NMT.");
  const [left, bottom, right, top] = image.getBoundingBox();
  const sourceCrs = "EPSG:" + code;
  const corners = [[left, bottom], [left, top], [right, bottom], [right, top]];
  const bounds = L.latLngBounds(corners.map((point) => {
    const [lon, lat] = proj4(sourceCrs, "EPSG:4326", point);
    return [lat, lon];
  }));
  if (image.getWidth() * image.getHeight() > 12_000_000) {
    throw new Error("Raster zawiera ponad 12 mln pikseli. Pobierz mniejszy wycinek.");
  }
  const scale = Math.max(1, image.getWidth() / 1024, image.getHeight() / 1024);
  const width = Math.max(1, Math.round(image.getWidth() / scale));
  const height = Math.max(1, Math.round(image.getHeight() / scale));
  const values = await image.readRasters({ samples: [0], interleave: true, width, height });
  const noData = image.getGDALNoData();
  return {
    bounds,
    label: "NMT z GeoTIFF · piksel ok. " + (code === 2180 ? format((right - left) / width, 1) + " m" : format(distanceMeters(
      [bounds.getSouth(), bounds.getWest()], [bounds.getSouth(), bounds.getEast()]
    ) / width, 1) + " m"),
    sample({ lat, lng }) {
      const [x, y] = proj4("EPSG:4326", sourceCrs, [lng, lat]);
      const col = Math.floor((x - left) / (right - left) * width);
      const row = Math.floor((top - y) / (top - bottom) * height);
      if (col < 0 || row < 0 || col >= width || row >= height) return NaN;
      const value = values[row * width + col];
      return value === noData || value < -500 || value > 9000 ? NaN : value;
    },
  };
}

function makeElevationGrid(bounds, source) {
  const nw = map.project(bounds.getNorthWest(), TERRAIN_ZOOM);
  const se = map.project(bounds.getSouthEast(), TERRAIN_ZOOM);
  const columns = GRID_SIZE;
  const rows = Math.max(24, Math.round(columns * Math.min(1.5, (se.y - nw.y) / (se.x - nw.x))));
  const dx = (se.x - nw.x) / (columns - 1);
  const dy = (se.y - nw.y) / (rows - 1);
  const point = (x, y) => map.unproject([nw.x + dx * x, nw.y + dy * y], TERRAIN_ZOOM);
  const values = new Float32Array(columns * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) values[y * columns + x] = source.sample(point(x, y));
  }
  const minDistance = (a, b) => distanceMeters([a.lat, a.lng], [b.lat, b.lng]);
  const mid = Math.floor(rows / 2);
  return { values, columns, rows, pixel: { nw, dx, dy }, dx: minDistance(point(0, mid), point(1, mid)), dy: minDistance(point(0, mid), point(0, mid + 1)) };
}

const SLOPE_COLORS = [[211, 237, 201], [184, 218, 157], [253, 220, 127], [237, 145, 85], [174, 64, 59]];
const SLOPE_LEVELS = [1, 3, 6, 12];

function slopeIndex(value) {
  return SLOPE_LEVELS.filter((level) => value >= level).length;
}

function slopeAt({ values, columns, rows, dx, dy }, x, y) {
  if (x < 1 || x >= columns - 1 || y < 1 || y >= rows - 1) return NaN;
  const i = y * columns + x;
  const east = (values[i + 1] - values[i - 1]) / (2 * dx);
  const north = (values[i + columns] - values[i - columns]) / (2 * dy);
  return Number.isFinite(values[i]) ? Math.hypot(east, north) * 100 : NaN;
}

function paintSlopes(context, grid) {
  const { columns, rows } = grid;
  const image = context.createImageData(columns, rows);
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < columns - 1; x++) {
      const slope = slopeAt(grid, x, y);
      if (Number.isFinite(slope)) image.data.set([...SLOPE_COLORS[slopeIndex(slope)], 182], 4 * (y * columns + x));
    }
  }
  const small = document.createElement("canvas");
  small.width = columns;
  small.height = rows;
  small.getContext("2d").putImageData(image, 0, 0);
  context.imageSmoothingEnabled = false;
  context.drawImage(small, 0, 0, context.canvas.width, context.canvas.height);
}

function paintContours(context, { values, columns, rows }) {
  const available = values.filter(Number.isFinite);
  const min = available.reduce((a, b) => Math.min(a, b), Infinity);
  const max = available.reduce((a, b) => Math.max(a, b), -Infinity);
  const step = Math.max(1, Math.ceil((max - min) / 18));
  const sx = context.canvas.width / (columns - 1), sy = context.canvas.height / (rows - 1);
  context.font = "11px system-ui";
  context.strokeStyle = "#265c53";
  context.fillStyle = "#183b33";
  for (let level = Math.ceil(min / step) * step; level <= max; level += step) {
    context.beginPath();
    let label;
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < columns - 1; x++) {
        const i = y * columns + x;
        const a = [x, y, values[i]], b = [x + 1, y, values[i + 1]];
        const c = [x, y + 1, values[i + columns]], d = [x + 1, y + 1, values[i + columns + 1]];
        for (const triangle of [[a, b, d], [a, c, d]]) {
          if (!triangle.every((vertex) => Number.isFinite(vertex[2]))) continue;
          const crossings = [];
          for (let j = 0; j < 3; j++) {
            const [px, py, z1] = triangle[j], [qx, qy, z2] = triangle[(j + 1) % 3];
            if ((z1 < level) === (z2 < level)) continue;
            const t = (level - z1) / (z2 - z1);
            crossings.push([(px + t * (qx - px)) * sx, (py + t * (qy - py)) * sy]);
          }
          if (crossings.length === 2) {
            context.moveTo(...crossings[0]);
            context.lineTo(...crossings[1]);
            if (!label && x > columns * .22 && x < columns * .8 && y > rows * .25) label = crossings[0];
          }
        }
      }
    }
    context.stroke();
    if (label) {
      const text = format(level) + " m";
      context.save();
      context.strokeStyle = "#fff";
      context.lineWidth = 3;
      context.strokeText(text, ...label);
      context.fillText(text, ...label);
      context.restore();
    }
  }
  return "Warstwice co " + format(step) + " m n.p.m.";
}

function paintFlow(context, { values, columns, rows, dx, dy }) {
  const downstream = new Int32Array(values.length).fill(-1);
  const accumulation = new Uint32Array(values.length).fill(1);
  const descending = [];
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < columns - 1; x++) {
      const i = y * columns + x;
      if (!Number.isFinite(values[i])) continue;
      descending.push(i);
      let best = .00001;
      for (let offsetY = -1; offsetY <= 1; offsetY++) {
        for (let offsetX = -1; offsetX <= 1; offsetX++) {
          if (!offsetX && !offsetY) continue;
          const j = i + offsetY * columns + offsetX;
          const grade = (values[i] - values[j]) / Math.hypot(offsetX * dx, offsetY * dy);
          if (grade > best) {
            best = grade;
            downstream[i] = j;
          }
        }
      }
    }
  }
  descending.sort((a, b) => values[b] - values[a]);
  for (const i of descending) {
    if (downstream[i] >= 0) accumulation[downstream[i]] += accumulation[i];
  }
  const sx = context.canvas.width / (columns - 1), sy = context.canvas.height / (rows - 1);
  context.strokeStyle = "#10628e";
  for (const i of descending) {
    const j = downstream[i];
    if (j < 0) continue;
    const x = i % columns, y = Math.floor(i / columns);
    const major = accumulation[i] >= 25;
    if (!major && (x % 11 || y % 11)) continue;
    const px = x * sx, py = y * sy;
    const qx = (j % columns) * sx, qy = Math.floor(j / columns) * sy;
    context.beginPath();
    context.lineWidth = major ? 2 : 1;
    context.moveTo(px, py);
    context.lineTo(qx, qy);
    const angle = Math.atan2(qy - py, qx - px);
    if (!major || (!(x % 5) && !(y % 5))) {
      const tip = major ? 4 : 3;
      context.lineTo(qx - tip * Math.cos(angle - .6), qy - tip * Math.sin(angle - .6));
      context.moveTo(qx, qy);
      context.lineTo(qx - tip * Math.cos(angle + .6), qy - tip * Math.sin(angle + .6));
    }
    context.stroke();
  }
  return "Strzałki pokazują kierunek w dół stoku; mocniejsze linie wskazują skupienie odpływu w obrębie analizowanego fragmentu.";
}

function renderTerrainLegend(mode, caption) {
  const legend = $("terrain-legend");
  legend.replaceChildren();
  legend.hidden = !caption;
  if (!caption) return;
  appendText(legend, "span", caption);
  if (mode === "slope") {
    const key = document.createElement("div");
    key.className = "slope-key";
    for (const [i, text] of ["<1%", "1–3%", "3–6%", "6–12%", "≥12%"].entries()) {
      const item = document.createElement("span");
      item.style.setProperty("--key", "rgb(" + SLOPE_COLORS[i].join(",") + ")");
      item.textContent = text;
      key.append(item);
    }
    legend.append(key);
  }
}

async function renderTerrainLayer() {
  const version = ++terrainVersion;
  slopeReading = null;
  if (terrainOverlay) map.removeLayer(terrainOverlay);
  if (shadedRelief) map.removeLayer(shadedRelief);
  const mode = $("terrain-layer").value;
  renderTerrainLegend("", "");
  const note = $("terrain-note");
  if (!mode) {
    note.textContent = importedTerrain ? importedTerrain.label : "Źródło dokładnych wysokości można dodać jako GeoTIFF z Geoportalu.";
    return;
  }
  if (mode === "shade") {
    shadedRelief.addTo(map);
    note.textContent = "Cieniowanie numerycznego modelu terenu · GUGiK.";
    return;
  }
  if (map.getZoom() < 14) {
    note.textContent = "Przybliż mapę do poziomu 14, aby zobaczyć analizę terenu.";
    return;
  }
  const viewport = map.getBounds();
  const bounds = importedTerrain && viewport.intersects(importedTerrain.bounds)
    ? L.latLngBounds([Math.max(viewport.getSouth(), importedTerrain.bounds.getSouth()), Math.max(viewport.getWest(), importedTerrain.bounds.getWest())],
      [Math.min(viewport.getNorth(), importedTerrain.bounds.getNorth()), Math.min(viewport.getEast(), importedTerrain.bounds.getEast())])
    : viewport;
  if (bounds.getSouth() === bounds.getNorth() || bounds.getWest() === bounds.getEast()) return;
  note.textContent = "Przygotowywanie warstwy terenu…";
  try {
    const source = bounds !== viewport ? importedTerrain : await elevationSource(bounds);
    if (version !== terrainVersion) return;
    const grid = makeElevationGrid(bounds, source);
    if (!grid.values.some(Number.isFinite)) throw new Error("Brak odczytów wysokości w tym miejscu.");
    const canvas = document.createElement("canvas");
    canvas.width = 760;
    canvas.height = Math.round(canvas.width * grid.rows / grid.columns);
    const context = canvas.getContext("2d");
    let caption = "";
    if (mode === "slope") {
      paintSlopes(context, grid);
      slopeReading = { grid, source };
      caption = "Szacowany spadek terenu (%) · kliknij mapę, aby odczytać wartość";
    } else if (mode === "contours") caption = paintContours(context, grid);
    else caption = paintFlow(context, grid);
    terrainOverlay = L.imageOverlay(canvas.toDataURL(), bounds, { opacity: .82, interactive: false }).addTo(map);
    note.textContent = source.label;
    renderTerrainLegend(mode, caption);
  } catch (error) {
    if (version === terrainVersion) note.textContent = error.message;
  }
}

function plotProfile(readings, distance) {
  const canvas = $("profile-chart");
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  const min = Math.floor(rangeExtreme(readings, Math.min)), max = Math.ceil(rangeExtreme(readings, Math.max));
  const left = 62, right = width - 23, top = 15, bottom = height - 30;
  const y = (value) => bottom - (value - min) * (bottom - top) / Math.max(1, max - min);
  ctx.font = "14px system-ui";
  ctx.strokeStyle = "#c9d9ce";
  ctx.fillStyle = "#52655d";
  for (const value of new Set([min, Math.round((min + max) / 2), max])) {
    ctx.beginPath();
    ctx.moveTo(left, y(value));
    ctx.lineTo(right, y(value));
    ctx.stroke();
    ctx.fillText(format(value) + " m", 4, y(value) + 5);
  }
  ctx.fillText("0 m", left, height - 7);
  const label = format(distance) + " m";
  ctx.fillText(label, right - ctx.measureText(label).width, height - 7);
  ctx.strokeStyle = "#17694f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  let previous = false;
  for (const [i, value] of readings.entries()) {
    if (!Number.isFinite(value)) {
      previous = false;
      continue;
    }
    const x = left + i * (right - left) / (readings.length - 1);
    if (previous) ctx.lineTo(x, y(value));
    else ctx.moveTo(x, y(value));
    previous = true;
  }
  ctx.stroke();
}

async function showElevationProfile(start, end) {
  const version = ++profileVersion;
  activeProfile = [start, end];
  const distance = distanceMeters(start, end);
  const panel = $("profile-panel"), summary = $("profile-summary"), canvas = $("profile-chart");
  panel.hidden = false;
  canvas.hidden = true;
  if (profileLine) profileLine.remove();
  if (distance < 5 || distance > 4500) {
    summary.textContent = "Wybierz przekrój o długości od 5 m do 4,5 km.";
    return;
  }
  profileLine = L.polyline([start, end], { color: "#7333aa", weight: 3, interactive: false }).addTo(map);
  summary.textContent = "Pobieranie wysokości dla przekroju…";
  try {
    const source = await elevationSource(L.latLngBounds(start, end).pad(.01));
    if (version !== profileVersion) return;
    const readings = Array.from({ length: 81 }, (_, i) => source.sample({
      lat: start[0] + (end[0] - start[0]) * i / 80,
      lng: start[1] + (end[1] - start[1]) * i / 80,
    }));
    if (readings.filter(Number.isFinite).length < 2) throw new Error("Za mało danych wysokości na tym odcinku.");
    summary.textContent = format(distance) + " m długości · wysokość " + format(rangeExtreme(readings, Math.min), 1)
      + "–" + format(rangeExtreme(readings, Math.max), 1) + " m n.p.m. · " + source.label;
    if (Number.isFinite(readings[0]) && Number.isFinite(readings.at(-1))) {
      const delta = readings.at(-1) - readings[0];
      summary.textContent += " · zmiana " + format(delta, 1) + " m (" + format(100 * delta / distance, 1) + "%)";
    }
    canvas.hidden = false;
    canvas.setAttribute("aria-label", "Profil wysokości. " + summary.textContent);
    plotProfile(readings, distance);
  } catch (error) {
    if (version === profileVersion) summary.textContent = error.message;
  }
}

$("terrain-file").onchange = async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file || !map) return;
  const version = ++importVersion;
  $("terrain-note").textContent = "Odczyt GeoTIFF…";
  try {
    const source = await readTerrainFile(file);
    if (version !== importVersion) return;
    importedTerrain = source;
    terrainHintBounds = undefined;
    if ($("terrain-layer").value === "" || $("terrain-layer").value === "shade") $("terrain-layer").value = "contours";
    map.fitBounds(source.bounds, { maxZoom: 17 });
    clearTimeout(terrainMoveTimer);
    renderTerrainLayer();
    if (activeProfile) showElevationProfile(...activeProfile);
  } catch (error) {
    if (version === importVersion) $("terrain-note").textContent = "Import GeoTIFF nie powiódł się. " + error.message;
  }
};
$("terrain-layer").onchange = () => renderTerrainLayer();
$("terrain-layer").disabled = $("terrain-file").disabled = !map;
mapTools.inspectTerrain = (latlng) => {
  if (!slopeReading || $("terrain-layer").value !== "slope") return false;
  const { grid, source } = slopeReading;
  const { nw, dx, dy } = grid.pixel;
  const pixel = map.project(latlng, TERRAIN_ZOOM);
  const slope = slopeAt(grid, Math.round((pixel.x - nw.x) / dx), Math.round((pixel.y - nw.y) / dy));
  const text = document.createElement("span");
  text.textContent = Number.isFinite(slope) ? "Nachylenie " + format(slope, 1) + "% · " + source.label
    : "Brak odczytu spadku w tym punkcie.";
  L.popup().setLatLng(latlng).setContent(text).openOn(map);
  return true;
};

if (map) {
  shadedRelief = L.tileLayer.wms(SHADE_WMS, {
    layers: "Raster", format: "image/png", transparent: true, opacity: .68, maxZoom: 19, attribution: "GUGiK NMT",
  });
  map.on("moveend", () => {
    updateTerrainDownload();
    if (["contours", "slope", "flow"].includes($("terrain-layer").value)) {
      terrainVersion++;
      slopeReading = null;
      if (terrainOverlay) map.removeLayer(terrainOverlay);
      clearTimeout(terrainMoveTimer);
      terrainMoveTimer = setTimeout(renderTerrainLayer, 280);
    }
  });
  updateTerrainDownload();
}
