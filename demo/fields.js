const FARM_STORAGE = "wodostraznik.fields.v1";
const MAX_FIELDS = 60;
const MAX_AREA_RESULTS = 100;
const EGiB_WFS = "https://mapy.geoportal.gov.pl/wss/service/PZGIK/EGIB/WFS/UslugaZbiorcza";
const farm = { fields: loadFields(), progress: false, updated: null, autoAt: 0 };
const drawing = { mode: null, points: [] };
let fieldLayers, selectionLayers, drawPreview, areaSelection, areaRequest;

function loadFields() {
  try {
    const fields = JSON.parse(localStorage.getItem(FARM_STORAGE) ?? "[]");
    return Array.isArray(fields) ? fields.filter(({ parcel, lat, lon }) =>
      parcel?.area > 0 && Number.isFinite(lat) && Number.isFinite(lon)) : [];
  } catch {
    return [];
  }
}

function saveFields() {
  try {
    localStorage.setItem(FARM_STORAGE, JSON.stringify(farm.fields));
  } catch {
    showToast("Zapis jest niedostępny", "Pola będą dostępne do zamknięcia tej karty.");
  }
}

function fieldId(parcel) {
  return parcel.teryt || JSON.stringify(parcel.points);
}

function addFields(incoming) {
  const ids = new Set(farm.fields.map(({ id }) => id));
  let added = 0;
  for (const field of incoming) {
    if (ids.has(field.id) || farm.fields.length >= MAX_FIELDS) continue;
    farm.fields.push(field);
    ids.add(field.id);
    added++;
  }
  saveFields();
  renderFieldsOnMap();
  renderFarm();
  scheduleFarmRefresh();
  return added;
}

function savedField(parcel, lat, lon) {
  return { id: fieldId(parcel), parcel, lat, lon, soil: $("soil-category").value };
}

function fieldLabel({ parcel }) {
  return parcel.custom ? "Własny obrys" : "Działka " + (parcel.number || parcel.teryt);
}

function inspectField(field) {
  cancelDrawing();
  $("soil-category").value = field.soil;
  analyzeLocation(field.lat, field.lon, null, field);
  $("dzialka").scrollIntoView({ block: "start" });
}

function renderFieldsOnMap() {
  if (!fieldLayers) return;
  fieldLayers.clearLayers();
  for (const field of farm.fields) {
    const label = document.createElement("span");
    label.textContent = fieldLabel(field);
    L.polygon(field.parcel.rings ?? field.parcel.points, {
      color: "#286d58", weight: 2, dashArray: "4 4", fillOpacity: .08, bubblingMouseEvents: false,
    }).bindTooltip(label).on("click", (event) => {
      if (drawing.mode) handleDrawClick(event.latlng);
      else inspectField(field);
    }).addTo(fieldLayers);
  }
}

function groupFields() {
  const groups = [];
  for (const field of [...farm.fields].sort((a, b) => a.id.localeCompare(b.id))) {
    const group = groups.find((entry) => distanceMeters([entry.location.lat, entry.location.lon], [field.lat, field.lon]) <= 1500);
    if (group) group.fields.push(field);
    else groups.push({ location: { lat: field.lat, lon: field.lon }, fields: [field] });
  }
  return groups;
}

function groupForecast(group) {
  const entry = weatherCache.get(weatherKey(group.location));
  return entry && { ...entry, shared: group.fields.length > 1 };
}

function fieldBalance(field, entry) {
  if (!entry) return null;
  const rain = sumComplete(entry.data.precipitation);
  const evap = sumComplete(entry.data.et0_fao_evapotranspiration);
  if (rain === null || evap === null) return null;
  const mm = rain - evap;
  const vpd = rangeExtreme(entry.data.vapour_pressure_deficit, Math.max);
  const temperature = rangeExtreme(entry.data.soil_temperature_0cm, Math.min);
  let risk = "";
  if (mm < (SOILS[field.soil]?.drought ?? -10)) risk = "Deficyt wody";
  else if (rain >= 15) risk = "Duży opad";
  else if (vpd > 1.6) risk = "Stres roślin";
  else if (temperature !== null && temperature <= 2) risk = "Ryzyko przymrozku";
  return { mm, volume: mm * 10 * field.parcel.area, risk };
}

function renderFarm() {
  const list = $("farm-list");
  list.replaceChildren();
  $("farm-refresh").disabled = farm.progress || !farm.fields.length;
  const rows = groupFields().flatMap((group) => {
    const entry = groupForecast(group);
    return group.fields.map((field) => ({ field, entry, balance: fieldBalance(field, entry) }));
  }).sort((a, b) => Number(Boolean(b.balance?.risk)) - Number(Boolean(a.balance?.risk)));
  const valid = rows.filter(({ balance }) => balance);
  const covered = valid.reduce((sum, { field }) => sum + field.parcel.area, 0);
  const totalArea = rows.reduce((sum, { field }) => sum + field.parcel.area, 0);
  const net = valid.reduce((sum, { balance }) => sum + balance.volume, 0);
  const summary = $("farm-summary");
  summary.hidden = !rows.length;
  summary.textContent = format(totalArea, 2) + " ha · suma powierzchni pól" + (covered
    ? " · saldo " + format(net) + " m³ · " + format(net / (10 * covered), 1) + " mm" : "")
    + (valid.length !== rows.length ? " · bilans dla " + format(covered, 2) + " ha" : "");
  if (!rows.length) $("farm-status").textContent = "Dodaj działkę z mapy lub narysuj własny obrys.";
  else if (farm.progress) $("farm-status").textContent = "Pobieranie prognozy dla zapisanych pól…";
  else if (farm.updated) {
    const time = farm.updated.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });
    const missing = rows.length - valid.length;
    const stale = valid.some(({ entry }) => entry.expires <= Date.now());
    $("farm-status").textContent = "Ostatnie odświeżenie " + time + (missing ? " · bez pełnej prognozy: " + missing : "")
      + (stale ? " · część wyników pochodzi ze starszej prognozy" : "") + ".";
  }
  else $("farm-status").textContent = "Prognoza wkrótce zostanie pobrana.";
  for (const { field, entry, balance } of rows) {
    const row = document.createElement("li");
    row.className = "farm-row";
    const select = document.createElement("button");
    select.type = "button";
    select.className = "farm-field-link";
    select.textContent = fieldLabel(field);
    select.onclick = () => inspectField(field);
    appendText(select, "small", [field.parcel.commune, format(field.parcel.area, 2) + " ha"].filter(Boolean).join(" · "));
    row.append(select);

    const reading = document.createElement("span");
    reading.textContent = balance ? format(balance.volume) + " m³ · " + format(balance.mm, 1) + " mm" : "—";
    const flags = [balance?.risk, entry?.shared && "Wspólna prognoza", entry?.expires <= Date.now() && "Starsze dane"].filter(Boolean);
    if (flags.length) appendText(reading, "small", flags.join(" · "));
    row.append(reading);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "text-button";
    remove.textContent = "Usuń";
    remove.setAttribute("aria-label", "Usuń z moich pól: " + fieldLabel(field));
    remove.onclick = () => {
      farm.fields = farm.fields.filter(({ id }) => id !== field.id);
      saveFields();
      renderFieldsOnMap();
      renderFarm();
      $("farm-list").querySelector("button")?.focus();
    };
    row.append(remove);
    list.append(row);
  }
}

let farmRefreshTimer;
function scheduleFarmRefresh() {
  clearTimeout(farmRefreshTimer);
  farmRefreshTimer = setTimeout(() => refreshFarm(), 350);
}

async function refreshFarm(force = false) {
  if (farm.progress || !farm.fields.length) return;
  const groups = groupFields().filter((group) => force || !(groupForecast(group)?.expires > Date.now()));
  const fieldsAtStart = farm.fields.map(({ id }) => id).join("\n");
  farm.progress = true;
  farm.autoAt = Date.now() + WEATHER_TTL;
  renderFarm();
  const controller = new AbortController();
  try {
    for (let offset = 0; offset < groups.length; offset += 12) {
      const locations = groups.slice(offset, offset + 12).map((group) => group.location);
      const result = await readSource(forecastUrl(locations), controller.signal, JSON.parse);
      if (!result.data) continue;
      const forecasts = Array.isArray(result.data) ? result.data : [result.data];
      if (forecasts.length !== locations.length) continue;
      for (const [index, location] of locations.entries()) {
        try { rememberWeather(location, validateForecast(forecasts[index])); }
        catch { /* Inne lokalizacje z tej paczki pozostają dostępne. */ }
      }
    }
  } finally {
    farm.updated = new Date();
    farm.progress = false;
    renderFarm();
    if (farm.fields.map(({ id }) => id).join("\n") !== fieldsAtStart) scheduleFarmRefresh();
    else if (groupFields().some((group) => !(groupForecast(group)?.expires > Date.now()))) {
      farm.autoAt = Date.now() + 5 * 60 * 1000;
    }
  }
}

function cancelDrawing() {
  drawing.mode = null;
  drawing.points = [];
  if (drawPreview) drawPreview.clearLayers();
  mapTools.onClick = null;
  $("map").classList.remove("is-drawing");
  $("draw-guide").hidden = true;
  $("draw-finish").hidden = true;
  $("draw-cancel").hidden = true;
  for (const mode of ["area", "field", "profile"]) $(mode + "-draw").setAttribute("aria-pressed", "false");
}

function startDrawing(mode) {
  if (drawing.mode === mode) return cancelDrawing();
  cancelDrawing();
  drawing.mode = mode;
  $(mode + "-draw").setAttribute("aria-pressed", "true");
  mapTools.onClick = handleDrawClick;
  $("map").classList.add("is-drawing");
  $("draw-guide").hidden = false;
  $("draw-cancel").hidden = false;
  $("draw-guide").textContent = {
    area: "Kliknij dwa przeciwległe narożniki prostokąta na mapie.",
    field: "Klikaj kolejne narożniki pola, a następnie zakończ obrys.",
    profile: "Kliknij początek i koniec przekroju na mapie.",
  }[mode];
}

function handleDrawClick({ lat, lng }) {
  const mode = drawing.mode;
  if (drawing.points.length >= 200) {
    $("draw-guide").textContent = "Obrys ma 200 wierzchołków. Zakończ rysowanie, aby go zapisać.";
    return;
  }
  drawing.points.push([lat, lng]);
  const points = drawing.points;
  drawPreview.clearLayers();
  for (const point of points) L.circleMarker(point, { radius: 4, color: "#177c60", fillOpacity: 1 }).addTo(drawPreview);
  if (points.length > 1) L.polyline(points, { color: "#177c60", dashArray: "5 5" }).addTo(drawPreview);
  if (mode === "field") {
    $("draw-finish").hidden = points.length < 3;
    return;
  }
  if (points.length < 2) return;
  const [start, end] = points;
  cancelDrawing();
  if (mode === "area") selectArea(L.latLngBounds(start, end));
  else showElevationProfile(start, end);
}

function finishField() {
  const points = [...drawing.points, drawing.points[0]];
  const area = polygonAreaHa(points);
  if (area <= 0 || !simpleRing(points)) {
    $("draw-guide").textContent = "Obrys musi zamykać powierzchnię i mieć krawędzie bez przecięć. Anuluj i spróbuj ponownie.";
    return;
  }
  const center = L.polygon(points).getBounds().getCenter();
  cancelDrawing();
  const added = addFields([savedField({ points, area, custom: true, number: "Własny obrys" }, center.lat, center.lng)]);
  if (added) showToast("Dodano własny obrys", format(area, 2) + " ha");
  else showToast("Nie dodano obrysu", "Obrys już istnieje lub lista osiągnęła limit " + MAX_FIELDS + " pól.");
}

function simpleRing(points) {
  const side = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
  const count = points.length - 1;
  const onSegment = (a, b, p) => side(a, b, p) === 0 &&
    p.every((value, i) => value >= Math.min(a[i], b[i]) && value <= Math.max(a[i], b[i]));
  for (let i = 0; i < count; i++) {
    const a = points[i], b = points[i + 1];
    if (a[0] === b[0] && a[1] === b[1]) return false;
    for (let j = i + 2; j < count; j++) {
      if (i === 0 && j === count - 1) continue;
      const c = points[j], d = points[j + 1];
      if (onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b)
          || (side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0)) return false;
    }
  }
  return true;
}

function wfsUrl(bounds) {
  return EGiB_WFS + "?" + new URLSearchParams({
    service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: "ms:dzialki",
    srsName: "EPSG:4326", bbox: [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast(), "EPSG:4326"].join(","),
    count: String(MAX_AREA_RESULTS + 1), outputFormat: "application/json",
  });
}

async function selectArea(bounds) {
  const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
  if (sw.lat === ne.lat || sw.lng === ne.lng || distanceMeters([sw.lat, sw.lng], [ne.lat, ne.lng]) > 4500) {
    showToast("Wybierz mniejszy obszar", "Zaznacz prostokąt o przekątnej do 4,5 km.");
    return;
  }
  areaRequest?.abort();
  areaRequest = new AbortController();
  const { signal } = areaRequest;
  areaSelection = bounds;
  selectionLayers.clearLayers();
  L.rectangle(bounds, { color: "#17694f", weight: 2, dashArray: "6 4", fillOpacity: .06, interactive: false }).addTo(selectionLayers);
  $("area-results").hidden = false;
  $("area-candidates").replaceChildren();
  $("area-save").disabled = true;
  $("area-download").href = wfsUrl(bounds);
  $("area-status").textContent = "Sprawdzanie danych EGiB dla zaznaczenia…";
  $("area-results").scrollIntoView({ block: "nearest" });
  const response = await readSource(wfsUrl(bounds), signal, JSON.parse);
  if (signal.aborted) return;
  if (Array.isArray(response.data?.features)) showAreaCandidates(response.data);
  else $("area-status").textContent = "Geoportal nie udostępnia zbiorczej odpowiedzi tej stronie. Otwórz link, zapisz odpowiedź jako .geojson lub .json i wczytaj plik.";
  updateTerrainDownload(bounds);
}

function clipRingToArea(ring, bounds) {
  const edges = [[0, bounds.getSouth(), 1], [0, bounds.getNorth(), -1],
    [1, bounds.getWest(), 1], [1, bounds.getEast(), -1]];
  let clipped = ring;
  for (const [axis, limit, sign] of edges) {
    const previousRing = clipped;
    clipped = [];
    let previous = previousRing.at(-1);
    if (!previous) break;
    const inside = (point) => sign * (point[axis] - limit) >= 0;
    for (const point of previousRing) {
      if (inside(previous) !== inside(point)) {
        const t = (limit - previous[axis]) / (point[axis] - previous[axis]);
        clipped.push(previous.map((value, i) => i === axis ? limit : value + t * (point[i] - value)));
      }
      if (inside(point)) clipped.push(point);
      previous = point;
    }
  }
  return clipped.length >= 3 ? polygonAreaHa([...clipped, clipped[0]]) : 0;
}

function convertFeature(feature) {
  const { geometry, properties } = feature ?? {};
  const attributes = properties ?? {};
  const polygons = geometry?.type === "Polygon" ? [geometry.coordinates] : geometry?.type === "MultiPolygon" ? geometry.coordinates : [];
  const inArea = (ring) => Array.isArray(ring) && ring.length >= 4 && ring.every((point) =>
    Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1]) && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90);
  if (!polygons.length || !polygons.every((polygon) => Array.isArray(polygon) && polygon.length && polygon.every(inArea))) return null;
  const rings = polygons.map((polygon) => polygon.map((ring) => ring.map(([lon, lat]) => [lat, lon])));
  const centers = L.polygon(rings).getBounds();
  if (!areaSelection.intersects(centers)) return null;
  const netArea = (measure) => rings.reduce((total, [outer, ...holes]) =>
    total + measure(outer) - holes.reduce((sum, hole) => sum + measure(hole), 0), 0);
  if (netArea((ring) => clipRingToArea(ring, areaSelection)) <= .000001) return null;
  const area = netArea((ring) => polygonAreaHa([...ring, ring[0]]));
  if (!(area > 0)) return null;
  const center = centers.getCenter();
  return savedField({
    rings, points: rings[0][0], area,
    teryt: attributes.ID_DZIALKI, number: attributes.NUMER_DZIALKI,
    commune: attributes.NAZWA_GMINY, region: attributes.NAZWA_OBREBU,
    custom: !attributes.ID_DZIALKI && !attributes.NUMER_DZIALKI,
  }, center.lat, center.lng);
}

function showAreaCandidates(collection) {
  const container = $("area-candidates");
  container.replaceChildren();
  $("area-save").disabled = true;
  if (!Array.isArray(collection?.features)) throw new Error("Plik musi zawierać kolekcję GeoJSON");
  const fields = collection.features.slice(0, MAX_AREA_RESULTS).map(convertFeature).filter(Boolean);
  const known = new Set(farm.fields.map(({ id }) => id));
  const options = [];
  for (const field of fields) {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.disabled = known.has(field.id);
    const polygon = L.polygon(field.parcel.rings, { color: "#b38a32", weight: 1, fillOpacity: .07, interactive: false }).addTo(selectionLayers);
    checkbox.onchange = () => {
      polygon.setStyle({ weight: checkbox.checked ? 3 : 1, fillOpacity: checkbox.checked ? .24 : .07 });
      $("area-save").disabled = !options.some((option) => option.checkbox.checked);
    };
    label.append(checkbox, document.createTextNode(fieldLabel(field) + " · " + format(field.parcel.area, 2) + " ha"
      + (checkbox.disabled ? " · zapisana" : "")));
    container.append(label);
    options.push({ field, checkbox });
  }
  $("area-status").textContent = fields.length ? "Zaznacz działki, którymi zarządzasz."
    + (Number(collection.numberMatched) > MAX_AREA_RESULTS || collection.features.length > MAX_AREA_RESULTS
      ? " Pokazano maksymalnie " + MAX_AREA_RESULTS + " wyników. Dla pozostałych wybierz mniejszy obszar." : "")
    : "W pliku nie znaleziono działek w granicach zaznaczenia.";
  $("area-save").onclick = () => {
    const selected = options.filter(({ checkbox }) => checkbox.checked);
    const added = addFields(selected.map(({ field }) => field));
    for (const { field, checkbox } of selected) {
      if (farm.fields.some(({ id }) => id === field.id)) {
        checkbox.checked = false;
        checkbox.disabled = true;
        checkbox.onchange();
      }
    }
    $("area-status").textContent = "Dodane działki: " + added + "."
      + (added < selected.length ? " Lista mieści " + MAX_FIELDS + " unikalnych pól." : "");
  };
}

$("field-save").onclick = () => {
  const { lat, lon } = state.location;
  if (!state.parcel?.area) return;
  const added = addFields([savedField(state.parcel, lat, lon)]);
  showToast(added ? "Działka zapisana" : "Nie dodano działki",
    added ? "Znajdziesz ją w sekcji Moje pola." : "Działka już istnieje lub lista osiągnęła limit " + MAX_FIELDS + " pól.");
};
$("farm-refresh").onclick = () => refreshFarm(true);
$("soil-category").addEventListener("change", () => {
  const field = farm.fields.find(({ id }) => id === state.location?.savedField?.id);
  if (!field) return;
  field.soil = $("soil-category").value;
  saveFields();
  renderFarm();
});
$("area-file").onchange = async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file || !areaSelection) return;
  const bounds = areaSelection;
  areaRequest?.abort();
  try {
    if (file.size > 12 * 1024 * 1024) throw new Error("Plik jest większy niż 12 MB. Pobierz mniejszy obszar.");
    const data = JSON.parse(await file.text());
    if (bounds !== areaSelection) return;
    selectionLayers.clearLayers();
    L.rectangle(bounds, { color: "#17694f", dashArray: "6 4", interactive: false }).addTo(selectionLayers);
    showAreaCandidates(data);
  } catch (error) {
    if (bounds === areaSelection) $("area-status").textContent = "Import nie powiódł się. " + error.message;
  }
};
for (const mode of ["area", "field", "profile"]) {
  $(mode + "-draw").disabled = !map;
  $(mode + "-draw").onclick = () => startDrawing(mode);
}
$("draw-finish").onclick = finishField;
$("draw-cancel").onclick = cancelDrawing;
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && drawing.mode) cancelDrawing();
});
if (map) {
  fieldLayers = L.layerGroup().addTo(map);
  selectionLayers = L.layerGroup().addTo(map);
  drawPreview = L.layerGroup().addTo(map);
}
renderFieldsOnMap();
renderFarm();
if (farm.fields.length) scheduleFarmRefresh();
setInterval(() => {
  if (!document.hidden && Date.now() >= farm.autoAt) refreshFarm();
}, 60 * 1000);
