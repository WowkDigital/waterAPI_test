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


const $ = (id) => document.getElementById(id);
const PRESETS = {
  sicienko: { lat: 53.1850, lon: 17.8550, zoom: 16 },
  dobrcz: { lat: 53.2450, lon: 18.1450, zoom: 14 },
};
const SOILS = {
  "1": { retention: 0.65, drought: -5 },
  "2": { retention: 0.80, drought: -10 },
  "3": { retention: 0.90, drought: -15 },
  "4": { retention: 1.00, drought: -20 },
};
const SCENARIOS = {
  rain: "Symulacja ulewy · dodatkowe 25 mm opadu",
  vpd: "Symulacja stresu roślin · VPD do 2,15 kPa",
};
const FORECAST_FIELDS = [
  "precipitation", "et0_fao_evapotranspiration", "vapour_pressure_deficit",
  "soil_moisture_0_to_1cm", "soil_temperature_0cm",
];
const state = {
  request: null,
  location: null,
  parcel: null,
  terrain: null,
  forecast: null,
  imgw: null,
  scenario: null,
  activeTab: "uldk",
  logs: {},
};
const format = (value, digits = 0) => value.toLocaleString("pl-PL", {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
});
let map, overlays, toastTimer;

function initMap() {
  if (!window.L) {
    showMapFeedback("Mapa jest niedostępna. Wybierz jedno z przykładowych pól.");
    return;
  }
  const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  });
  const ortho = L.tileLayer.wms("https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution", {
    layers: "Raster", format: "image/png", maxZoom: 19, attribution: "GUGiK",
  });
  const hydro = L.tileLayer.wms("https://mapy.geoportal.gov.pl/wss/service/img/guest/HYDRO/MapServer/WMSServer", {
    layers: "0,1,2,3,4,5,6", format: "image/png", transparent: true, opacity: 0.75, attribution: "GUGiK",
  });
  map = L.map("map", {
    center: [PRESETS.sicienko.lat, PRESETS.sicienko.lon],
    zoom: PRESETS.sicienko.zoom,
    layers: [osm],
  });
  L.control.layers(
    { "OpenStreetMap": osm, "Ortofotomapa Geoportalu": ortho },
    { "Mapa hydrograficzna": hydro }
  ).addTo(map);
  overlays = L.layerGroup().addTo(map);

  for (const layer of [osm, ortho]) {
    let loadedTile = false;
    layer.on("loading", () => { loadedTile = false; });
    layer.on("tileload", () => { loadedTile = true; });
    layer.on("load", () => {
      if (map.hasLayer(layer)) showMapFeedback(loadedTile ? "" : "Nie udało się wczytać podkładu mapy. Zmień warstwę lub przybliż widok.");
    });
  }
  map.on("click", ({ latlng }) => analyzeLocation(latlng.lat, latlng.lng));
}

function showMapFeedback(message) {
  $("map-feedback").textContent = message;
  $("map-feedback").hidden = !message;
}

function badge(id, label, level = "info") {
  const element = $(id);
  element.textContent = label;
  element.className = "badge " + level;
}

function showToast(title, body) {
  const toast = $("toast");
  const heading = document.createElement("strong");
  const message = document.createElement("p");
  heading.textContent = title;
  message.textContent = body;
  toast.replaceChildren(heading, message);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 6500);
}

async function readSource(url, signal, parse = (body) => body) {
  const started = performance.now();
  let status = "";
  let body = "";
  let data;
  let error;
  try {
    const response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]) });
    status = "HTTP " + response.status;
    body = await response.text();
    if (!response.ok) throw new Error(status);
    data = parse(body);
  } catch (failure) {
    error = failure.name === "TimeoutError" ? "Przekroczono czas oczekiwania" : failure.message;
  }
  const timing = Math.round(performance.now() - started) + " ms";
  const log = ["GET " + url, [status, timing].filter(Boolean).join(" · "), error, body.slice(0, 16000)].filter(Boolean).join("\n\n");
  return { data, error, log };
}

function parseParcel(body) {
  const [code, record] = body.trim().split(/\r?\n/);
  if (code !== "0" || !record) return null;
  const [wkt, , , commune, region, number, teryt] = record.split("|");
  const points = parseWktPolygon(wkt);
  return { commune, region, number, teryt, points, area: polygonAreaHa(points) };
}

function parseForecast(body) {
  const { hourly } = JSON.parse(body);
  if (!Array.isArray(hourly?.time) || hourly.time.length !== 48 ||
      FORECAST_FIELDS.some((key) => hourly[key]?.length !== hourly.time.length)) {
    throw new Error("Brak pełnego zakresu prognozy");
  }
  return hourly;
}

function parseList(body) {
  const data = JSON.parse(body);
  if (!Array.isArray(data)) throw new Error("Nieoczekiwany format odpowiedzi IMGW");
  return data;
}

async function requestTerrain(lat, lon, parcel, signal) {
  if (!window.proj4) return { data: null, log: "Biblioteka przeliczeń współrzędnych jest niedostępna." };
  const outline = parcel?.points;
  const points = [[lat, lon]];
  if (outline?.length >= 4) {
    const step = Math.max(1, Math.floor((outline.length - 1) / 4));
    for (let i = 0; i < outline.length - 1 && points.length < 5; i += step) points.push(outline[i]);
  } else {
    points.push([lat + .001, lon], [lat - .001, lon], [lat, lon + .0015], [lat, lon - .0015]);
  }
  const results = await Promise.all(points.map(async (point) => {
    const [north, east] = projectPoint(point);
    const url = "https://services.gugik.gov.pl/nmt/?request=GetHbyXY&x=" + north.toFixed(2) + "&y=" + east.toFixed(2);
    const result = await readSource(url, signal, (body) => {
      const value = Number(body.trim().replace(",", "."));
      if (!body.trim() || !Number.isFinite(value)) throw new Error("Brak wysokości");
      return value;
    });
    return { ...result, point };
  }));
  const valid = results.filter((sample) => Number.isFinite(sample.data)).sort((a, b) => a.data - b.data);
  const log = results.map((sample) => sample.log).join("\n\n");
  if (valid.length < 2) return { data: null, log };

  const lowest = valid[0], highest = valid.at(-1);
  const delta = highest.data - lowest.data;
  const slope = delta * 100 / Math.max(1, distanceMeters(highest.point, lowest.point));
  const direction = delta > 0.1 ? bearingLabel(highest.point, lowest.point) : "Teren płaski";
  return { data: { lowest, highest, delta, slope, direction }, log };
}

function projectPoint([lat, lon]) {
  const [east, north] = proj4("EPSG:4326", "EPSG:2180", [lon, lat]);
  return [north, east];
}

async function analyzeLocation(lat, lon, preset) {
  state.request?.abort();
  const request = new AbortController();
  const { signal } = request;
  Object.assign(state, { request, location: { lat, lon, preset }, parcel: null, terrain: null, forecast: null, imgw: null, scenario: null, logs: {} });

  for (const key of Object.keys(PRESETS)) $("btn-" + key).setAttribute("aria-pressed", key === preset);
  const latitude = format(Math.abs(lat), 5) + (lat < 0 ? "° S" : "° N");
  const longitude = format(Math.abs(lon), 5) + (lon < 0 ? "° W" : "° E");
  $("map-coordinates").textContent = latitude + " · " + longitude;
  $("btn-retry").hidden = true;
  $("api-timing").textContent = "Pobieranie";
  badge("status-badge", "Pobieranie danych");
  renderTerrain();
  renderForecast();
  renderImgw();
  renderRawTab();

  if (map) {
    overlays.clearLayers();
    L.circleMarker([lat, lon], { radius: 7, color: "#fff", weight: 2, fillColor: "#11644c", fillOpacity: 1 }).addTo(overlays);
    if (preset) map.setView([lat, lon], PRESETS[preset].zoom);
  }

  const started = performance.now();
  const parcelUrl = "https://uldk.gugik.gov.pl/?request=GetParcelByXY&xy=" + lon.toFixed(6) + "," + lat.toFixed(6) + ",4326&result=geom_wkt,voivodeship,county,commune,region,parcel,teryt&srid=4326";
  const weatherUrl = "https://api.open-meteo.com/v1/forecast?latitude=" + lat.toFixed(4) + "&longitude=" + lon.toFixed(4) + "&hourly=" + FORECAST_FIELDS.join(",") + "&forecast_hours=48&timezone=Europe/Warsaw";
  const imgwBase = "https://danepubliczne.imgw.pl/api/data/";

  const parcelAndTerrain = (async () => {
    const parcel = await readSource(parcelUrl, signal, parseParcel);
    if (signal.aborted) return;
    state.parcel = parcel.data;
    state.logs.uldk = parcel.log;
    renderTerrain();
    if (map && state.parcel?.points.length >= 3) {
      const polygon = L.polygon(state.parcel.points, { color: "#428440", weight: 2.5, fillOpacity: .24 }).addTo(overlays);
      if (!preset) map.fitBounds(polygon.getBounds(), { maxZoom: 17, padding: [20, 20] });
    }
    renderForecast();
    renderImgw();
    renderRawTab();

    const terrain = await requestTerrain(lat, lon, state.parcel, signal);
    if (signal.aborted) return;
    state.terrain = terrain.data;
    state.logs.nmt = terrain.log;
    if (map && state.terrain?.delta > .1) {
      const { highest, lowest, slope } = state.terrain;
      L.polyline([highest.point, lowest.point], { color: "#247b95", weight: 3, dashArray: "6,6" })
        .bindTooltip("Szacowany spływ · nachylenie " + format(slope, 1) + "%")
        .addTo(overlays);
      L.circleMarker(lowest.point, { radius: 5, color: "#247b95", fillOpacity: 1 })
        .bindTooltip("Najniższy punkt próbki · " + format(lowest.data, 1) + " m n.p.m.")
        .addTo(overlays);
    }
    renderTerrain();
    renderForecast();
    renderRawTab();
  })();

  const weather = readSource(weatherUrl, signal, parseForecast).then((result) => {
    if (signal.aborted) return;
    state.forecast = result.data;
    state.logs.openmeteo = result.log;
    renderForecast();
    renderRawTab();
  });

  const imgw = Promise.all(["warningsmeteo", "warningshydro", "synop"].map((endpoint) =>
    readSource(imgwBase + endpoint, signal, parseList)
  )).then(([meteo, hydro, synop]) => {
    if (signal.aborted) return;
    state.imgw = { meteo: meteo.data, hydro: hydro.data, synop: synop.data };
    state.logs.imgw = [meteo.log, hydro.log, synop.log].join("\n\n");
    renderImgw();
    renderRawTab();
  });

  const results = await Promise.allSettled([parcelAndTerrain, weather, imgw]);
  if (signal.aborted) return;
  for (const result of results) {
    if (result.status === "rejected") console.error(result.reason);
  }
  $("api-timing").textContent = format(performance.now() - started) + " ms";
  const imgwParts = Object.values(state.imgw ?? {});
  const complete = state.parcel && state.terrain && state.forecast && state.imgw && imgwParts.every(Array.isArray);
  $("btn-retry").hidden = Boolean(complete);
  if (!state.parcel && !state.terrain && !state.forecast && !imgwParts.some(Array.isArray)) {
    badge("status-badge", "Brak danych", "crit");
  } else if (!complete) {
    badge("status-badge", "Dane częściowe", "warn");
  } else {
    badge("status-badge", "Dane pobrane", "ok");
  }
}

function renderTerrain() {
  const { parcel, terrain, logs } = state;
  $("kpi-parcel").textContent = parcel?.number ? "dz. " + parcel.number : (logs.uldk ? "Niedostępny" : "—");
  $("kpi-commune").textContent = parcel?.commune ? parcel.commune + ", obr. " + parcel.region : "—";
  $("kpi-area").textContent = parcel?.area > 0 ? format(parcel.area, 2) + " ha" : "—";
  $("parcel-teryt").textContent = parcel?.teryt ? "TERYT " + parcel.teryt : "—";
  $("kpi-elev").textContent = terrain ? format(terrain.lowest.data, 1) + "–" + format(terrain.highest.data, 1) + " m" : "—";
  $("kpi-slope").textContent = terrain ? "Spadek " + format(terrain.slope, 1) + "%" : (logs.nmt ? "Brak danych NMT" : "—");
  $("kpi-dir").textContent = terrain?.direction ?? "—";
}

function appendText(parent, tag, text) {
  const element = document.createElement(tag);
  element.textContent = text;
  parent.append(element);
}

function addAlert(parent, level, title, body) {
  const box = document.createElement("div");
  box.className = "alert-box " + level;
  appendText(box, "strong", title);
  if (body) appendText(box, "p", body);
  parent.append(box);
}

function renderForecast() {
  const { forecast, terrain, parcel, scenario, logs } = state;
  const alerts = $("alerts-container");
  alerts.replaceChildren();
  for (const key of Object.keys(SCENARIOS)) {
    $("btn-sim-" + key).disabled = !forecast;
    $("btn-sim-" + key).setAttribute("aria-pressed", key === scenario);
  }
  $("btn-reset").hidden = !scenario;
  $("scenario-status").textContent = SCENARIOS[scenario] ?? (forecast
    ? "Wybierz scenariusz, aby przeliczyć bilans i alerty."
    : "Symulacje wymagają prognozy dla wybranej lokalizacji.");
  $("timeline").hidden = !forecast;
  if (!forecast) {
    for (const key of ["rain-m3", "rain-mm", "et0-m3", "et0-mm", "kbw-m3", "soil-moisture", "vpd", "ground-t"]) $("kpi-" + key).textContent = "—";
    badge("balance-badge", logs.openmeteo ? "Brak prognozy" : "—");
    $("balance-area").textContent = "";
    $("semaphore-row").replaceChildren();
    addAlert(alerts, "", logs.openmeteo ? "Prognoza jest niedostępna" : "Pobieranie prognozy", logs.openmeteo
      ? "Ponów pobieranie w panelu mapy lub wybierz inną lokalizację."
      : "");
    return;
  }

  const soil = SOILS[$("soil-category").value];
  const area = parcel?.area > 0 ? parcel.area : 1;
  const isReferenceArea = !(parcel?.area > 0);
  $("balance-area").textContent = isReferenceArea ? " · przeliczenie dla 1 ha" : " · " + format(area, 2) + " ha";
  const rain = forecast.precipitation.map((value, hour) =>
    scenario === "rain" && hour >= 6 && hour < 11 ? (value ?? 0) + 5 : value
  );
  const vpd = forecast.vapour_pressure_deficit.map((value, hour) =>
    scenario === "vpd" && hour >= 10 && hour < 18 ? Math.max(value ?? 0, 2.15) : value
  );
  const rainMm = sumComplete(rain);
  const etMm = sumComplete(forecast.et0_fao_evapotranspiration);
  const balance = rainMm !== null && etMm !== null ? rainMm - etMm : null;
  const maxVpd = rangeExtreme(vpd, Math.max);
  const minGround = rangeExtreme(forecast.soil_temperature_0cm, Math.min);
  const moisture = forecast.soil_moisture_0_to_1cm[0];
  const volume = (mm) => mm === null ? "—" : format(mm * 10 * area) + (isReferenceArea ? " m³/ha" : " m³");
  const depth = (mm) => mm === null ? "Brak danych" : format(mm, 1) + " mm";

  $("kpi-rain-m3").textContent = volume(rainMm);
  $("kpi-rain-mm").textContent = depth(rainMm);
  $("kpi-et0-m3").textContent = volume(etMm);
  $("kpi-et0-mm").textContent = depth(etMm);
  $("kpi-kbw-m3").textContent = (balance > 0 ? "+" : "") + volume(balance);
  $("kpi-soil-moisture").textContent = moisture == null ? "Brak danych o wilgotności" : "Wilgotność gleby (0–1 cm) " + format(moisture * 100) + "%";
  $("kpi-vpd").textContent = maxVpd === null ? "—" : format(maxVpd, 2) + " kPa";
  $("kpi-ground-t").textContent = minGround === null ? "Brak temperatury gruntu" : "Min. przy gruncie " + format(minGround, 1) + " °C";

  if (balance === null) badge("balance-badge", "Niepełna prognoza", "warn");
  else if (balance < soil.drought) badge("balance-badge", "Deficyt wodny", "crit");
  else if (rainMm >= 15) badge("balance-badge", "Duży opad", "warn");
  else badge("balance-badge", "Bilans stabilny", "ok");
  if (scenario) {
    const badgeText = $("balance-badge").textContent;
    $("balance-badge").textContent = "Symulacja · " + badgeText;
  }

  if (rainMm >= 15 && terrain?.slope >= 1) {
    const runoff = rainMm * (1 - soil.retention + .25);
    addAlert(alerts, "warn", "Ryzyko spływu · ok. " + volume(runoff), "Prognozowany opad wynosi " + depth(rainMm) + ", a szacowany spadek terenu " + format(terrain.slope, 1) + "%. Sprawdź kierunek spływu i miejsca, w których można zatrzymać wodę.");
  } else if (rainMm >= 15 && !terrain) {
    addAlert(alerts, "warn", "Duży opad · " + depth(rainMm), "Ocena spływu wymaga danych o nachyleniu terenu.");
  }
  if (maxVpd > 1.6) addAlert(alerts, "crit", "Stres roślin · VPD " + format(maxVpd, 2) + " kPa", "Suche powietrze może zwiększyć stres roślin. Sprawdź godziny podwyższonego ryzyka przed zabiegami.");
  if (minGround !== null && minGround <= 2) addAlert(alerts, "warn", "Ryzyko przymrozku · " + format(minGround, 1) + " °C przy gruncie", "Sprawdź wrażliwe uprawy przed planowanymi zabiegami.");
  if (balance !== null && balance < soil.drought) addAlert(alerts, "crit", "Deficyt wody · " + volume(balance), "Saldo " + depth(balance) + " spada poniżej progu dla wybranej gleby (" + depth(soil.drought) + ").");
  if (!alerts.childElementCount) {
    const partial = balance === null || maxVpd === null || minGround === null;
    addAlert(alerts, partial ? "warn" : "ok", partial ? "Niepełna ocena ryzyka" : "Brak przekroczeń progów w prognozie",
      partial ? "Część parametrów pogodowych jest niedostępna." : "Sprawdź okna pogodowe na osi czasu.");
  }
  renderTimeline(forecast.time, rain, vpd);
}

function sumComplete(values) {
  return values.every(Number.isFinite) ? values.reduce((sum, value) => sum + value, 0) : null;
}

function rangeExtreme(values, extreme) {
  const available = values.filter(Number.isFinite);
  return available.length ? extreme(...available) : null;
}

function renderTimeline(times, rain, vpd) {
  const row = $("semaphore-row");
  row.replaceChildren();
  for (let hour = 0; hour < 24; hour += 2) {
    const rain2h = sumComplete(rain.slice(hour, hour + 2));
    const vpd2h = rangeExtreme(vpd.slice(hour, hour + 2), Math.max);
    let level = "green", label = "Niskie ryzyko";
    if (vpd2h > 1.6 || rain2h >= 8) [level, label] = ["red", "Wysokie ryzyko"];
    else if (vpd2h > 1.2 || rain2h >= 3) [level, label] = ["yellow", "Uwaga"];
    else if (rain2h === null || vpd2h === null) [level, label] = ["unknown", "Brak danych"];

    const cell = document.createElement("div");
    cell.className = "sem-cell sem-" + level;
    const timeLabel = times[hour].slice(11, 16);
    const dayLabel = times[hour].slice(5, 10).split("-").reverse().join(".");
    const symbol = { green: "✓", yellow: "!", red: "!!", unknown: "–" }[level];
    appendText(cell, "span", symbol);
    appendText(cell, "span", timeLabel);
    cell.title = dayLabel + " · " + label + " · opad " + (rain2h === null ? "—" : format(rain2h, 1) + " mm") + " · VPD " + (vpd2h === null ? "—" : format(vpd2h, 2) + " kPa");
    cell.setAttribute("role", "img");
    cell.setAttribute("aria-label", timeLabel + " · " + cell.title);
    row.append(cell);
  }
}

function renderImgw() {
  const summary = $("imgw-summary");
  summary.replaceChildren();
  if (!state.imgw) {
    appendText(summary, "p", "Pobieranie danych IMGW.");
    return;
  }
  const { meteo, hydro, synop } = state.imgw;
  const county = state.parcel?.teryt?.slice(0, 4);
  if (!meteo) {
    appendText(summary, "p", "Ostrzeżenia meteorologiczne są niedostępne.");
  } else if (!county) {
    appendText(summary, "p", "Ustalenie ostrzeżeń lokalnych wymaga kodu TERYT działki.");
  } else {
    const local = meteo.filter((warning) => Array.isArray(warning.teryt) && warning.teryt.some((value) => String(value).startsWith(county)));
    for (const warning of local) {
      addAlert(summary, "warn", String(warning.nazwa_zdarzenia) + " · stopień " + warning.stopien, warning.tresc);
    }
    if (!local.length) appendText(summary, "p", "Brak aktywnych ostrzeżeń meteorologicznych dla powiatu " + county + ".");
  }
  if (hydro) appendText(summary, "p", "Ostrzeżenia hydrologiczne w kraju · " + hydro.length);
  const station = synop?.find((item) => /toru|chojnic|bydgoszcz|inowroc/i.test(item.stacja)) ?? synop?.[0];
  if (station) {
    appendText(summary, "p", "Stacja " + station.stacja + " · " + station.data_pomiaru + " " + station.godzina_pomiaru + ":00 · " + (station.temperatura ?? "—") + " °C");
  }
}

function renderRawTab() {
  $("raw-output").textContent = state.logs[state.activeTab] ?? "Pobieranie danych ze źródła.";
}

function selectScenario(scenario) {
  state.scenario = scenario;
  renderForecast();
  if (!scenario) {
    showToast("Przywrócono prognozę", "Bilans i alerty znów korzystają z danych Open-Meteo.");
    return;
  }
  const title = "Symulacja aktywna";
  showToast(title, SCENARIOS[scenario]);
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body: SCENARIOS[scenario] });
    } catch {
      // Komunikat na stronie jest dostępny także bez zgody systemowej.
    }
  }
}

for (const [key, preset] of Object.entries(PRESETS)) {
  $("btn-" + key).addEventListener("click", () => analyzeLocation(preset.lat, preset.lon, key));
}
$("btn-retry").addEventListener("click", () => {
  const { lat, lon, preset } = state.location;
  analyzeLocation(lat, lon, preset);
});
$("soil-category").addEventListener("change", renderForecast);
$("btn-sim-rain").addEventListener("click", () => selectScenario("rain"));
$("btn-sim-vpd").addEventListener("click", () => selectScenario("vpd"));
$("btn-reset").addEventListener("click", () => {
  const previous = $("btn-sim-" + state.scenario);
  selectScenario(null);
  previous?.focus();
});

$("btn-notify").addEventListener("click", async () => {
  let message = "Powiadomienia systemowe są niedostępne w tej przeglądarce.";
  if ("Notification" in window) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        message = "Zgoda jest włączona. Strona może wyświetlać powiadomienia podczas analizy.";
        new Notification("WodoStrażnik Pola", { body: "Powiadomienia są włączone." });
      } else {
        message = permission === "denied" ? "Zmień zgodę w ustawieniach tej witryny, aby włączyć powiadomienia." : "Przeglądarka jeszcze nie przyznała zgody.";
      }
    } catch {
      message = "Ta przeglądarka nie udostępnia powiadomień systemowych dla tej strony.";
    }
  }
  showToast("Powiadomienia", message);
});

const tabs = document.querySelectorAll(".tab-btn");
for (const button of tabs) {
  button.addEventListener("click", () => {
    state.activeTab = button.dataset.tab;
    for (const tab of tabs) {
      const selected = tab === button;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-pressed", selected);
    }
    renderRawTab();
  });
}

if (window.proj4) {
  proj4.defs("EPSG:2180", "+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +units=m +no_defs");
}
initMap();
analyzeLocation(PRESETS.sicienko.lat, PRESETS.sicienko.lon, "sicienko");
