import { fromUrl } from "geotiff";
import proj4 from "proj4";
import type { LatLngTuple, ParcelData, SatelliteGrid, SatelliteMode, SatelliteStats } from "../types";

const EARTH_SEARCH_STAC = "https://earth-search.aws.element84.com/v1/search";
const PLANETARY_STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search";
const PLANETARY_SAS = "https://planetarycomputer.microsoft.com/api/sas/v1/token/landsateuwest/landsat-c2";
const SAT_GRID_W = 128;
const SCL_CLOUD_MASK = new Set([0, 1, 3, 8, 9, 10]);

let sasCache: { token: string; expires: number } | null = null;

export interface LegendDefinition {
  title: string;
  hint: string;
  items: Array<{ color: string; label: string; detail: string }>;
}

export const SATELLITE_LEGENDS: Record<Exclude<SatelliteMode, "none">, LegendDefinition> = {
  stress: {
    title: "Stres cieplny roślin (°C + NDMI)",
    hint: "Łączy temperaturę powierzchni z Landsata (ST_B10), zawartość wody w liściach z Sentinela-2 (NDMI) oraz VPD.",
    items: [
      { color: "#2980b9", label: "< 22 °C", detail: "Chłodno, rośliny mają wodę" },
      { color: "#2ecc71", label: "22–26 °C", detail: "Komfort termiczny" },
      { color: "#f1c40f", label: "26–28 °C", detail: "Lekki stres — wstrzymaj oprysk" },
      { color: "#e67e22", label: "28–33 °C", detail: "Silny stres — zamknij zastawkę" },
      { color: "#c0392b", label: "> 33 °C", detail: "Krytycznie za ciepło — straty plonu" },
    ],
  },
  ndmi: {
    title: "Wilgotność liści (Sentinel-2 NDMI)",
    hint: "Mierzy wodę w tkankach roślin (bez °C). Jesienią zaorane pola bez ozimin też są czerwone — reaguj tam, gdzie rośnie uprawa (NDVI > 0,25).",
    items: [
      { color: "#b23a2b", label: "< 0,00", detail: "Goła gleba lub skrajnie suche liście" },
      { color: "#e69138", label: "0,00–0,15", detail: "Niska wilgotność — wczesny stres" },
      { color: "#eed066", label: "0,15–0,25", detail: "Umiarkowane uwodnienie" },
      { color: "#38b27a", label: "0,25–0,40", detail: "Dobry zapas wody w liściach" },
      { color: "#1769a5", label: "> 0,40", detail: "Bardzo wysokie uwodnienie / las" },
    ],
  },
  ndvi: {
    title: "Kondycja roślin (Sentinel-2 NDVI)",
    hint: "Pokazuje żywą zieloną biomasę od -1 do +1. Pomaga odróżnić gołą ziemię od upraw.",
    items: [
      { color: "#a87248", label: "< 0,15", detail: "Gleba odkryta / brak uprawy" },
      { color: "#e0ba5c", label: "0,15–0,35", detail: "Wschody ozimin / słabsza okrywa" },
      { color: "#84c15c", label: "0,35–0,55", detail: "Zdrowa, umiarkowana uprawa" },
      { color: "#17703e", label: "> 0,55", detail: "Bardzo gęsta roślinność" },
    ],
  },
};

function ensureUtmDef(epsg: number): string {
  const code = `EPSG:${epsg}`;
  if (!proj4.defs(code)) {
    const zone = epsg >= 32700 ? epsg - 32700 : epsg - 32600;
    const south = epsg >= 32700 ? " +south" : "";
    proj4.defs(code, `+proj=utm +zone=${zone}${south} +datum=WGS84 +units=m +no_defs`);
  }
  return code;
}

async function stacSearch(endpoint: string, collections: string[], bbox: number[], maxCloud: number, daysBack: number) {
  const end = new Date();
  const start = new Date(end.getTime() - daysBack * 86400 * 1000);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      collections,
      bbox,
      datetime: `${start.toISOString()}/${end.toISOString()}`,
      limit: 3,
      query: { "eo:cloud_cover": { lt: maxCloud } },
      sortby: [{ field: "properties.datetime", direction: "desc" }],
    }),
  });
  if (!res.ok) throw new Error(`STAC HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.features) ? data.features : [];
}

async function getSasToken(): Promise<string> {
  if (sasCache && sasCache.expires > Date.now() + 120000) return sasCache.token;
  const res = await fetch(PLANETARY_SAS);
  if (!res.ok) throw new Error(`SAS HTTP ${res.status}`);
  const data = await res.json();
  sasCache = { token: data.token, expires: data.expiry ? Date.parse(data.expiry) : Date.now() + 20 * 60 * 1000 };
  return sasCache.token;
}

async function readCogPatch(
  url: string,
  bounds: { south: number; west: number; north: number; east: number },
  epsg: number,
  resampleMethod: "bilinear" | "nearest"
) {
  const crs = ensureUtmDef(epsg);
  const tiff = await fromUrl(url, { allowFullFile: false });
  const image = await tiff.getImage();
  const imgW = image.getWidth();
  const imgH = image.getHeight();
  const [minX, minY, maxX, maxY] = image.getBoundingBox();

  const corners = [
    [bounds.west, bounds.south],
    [bounds.east, bounds.south],
    [bounds.west, bounds.north],
    [bounds.east, bounds.north],
  ].map(([lon, lat]) => proj4("EPSG:4326", crs, [lon, lat]));
  const bMinX = Math.min(...corners.map((c) => c[0]));
  const bMaxX = Math.max(...corners.map((c) => c[0]));
  const bMinY = Math.min(...corners.map((c) => c[1]));
  const bMaxY = Math.max(...corners.map((c) => c[1]));

  const padX = (bMaxX - bMinX) * 0.08;
  const padY = (bMaxY - bMinY) * 0.08;
  const px0 = Math.max(0, Math.floor(((bMinX - padX - minX) / (maxX - minX)) * imgW));
  const px1 = Math.min(imgW, Math.ceil(((bMaxX + padX - minX) / (maxX - minX)) * imgW));
  const py0 = Math.max(0, Math.floor(((maxY - (bMaxY + padY)) / (maxY - minY)) * imgH));
  const py1 = Math.min(imgH, Math.ceil(((maxY - (bMinY - padY)) / (maxY - minY)) * imgH));
  if (px1 <= px0 || py1 <= py0) return null;

  const outW = Math.min(180, Math.max(24, px1 - px0));
  const outH = Math.min(180, Math.max(24, py1 - py0));
  const raster = await image.readRasters({
    window: [px0, py0, px1, py1],
    width: outW,
    height: outH,
    samples: [0],
    interleave: true,
    resampleMethod,
  });
  const data = raster as unknown as ArrayLike<number>;

  const pMinX = minX + (px0 / imgW) * (maxX - minX);
  const pMaxX = minX + (px1 / imgW) * (maxX - minX);
  const pMaxY = maxY - (py0 / imgH) * (maxY - minY);
  const pMinY = maxY - (py1 / imgH) * (maxY - minY);

  return {
    sample(lat: number, lon: number): number {
      const [x, y] = proj4("EPSG:4326", crs, [lon, lat]);
      const col = Math.floor(((x - pMinX) / (pMaxX - pMinX)) * outW);
      const row = Math.floor(((pMaxY - y) / (pMaxY - pMinY)) * outH);
      if (col < 0 || row < 0 || col >= outW || row >= outH) return NaN;
      return data[row * outW + col];
    },
  };
}

export async function fetchSatelliteGrid(
  bounds: { south: number; west: number; north: number; east: number },
  fallbackTempC = 12
): Promise<SatelliteGrid> {
  const t0 = performance.now();
  const bbox = [bounds.west, bounds.south, bounds.east, bounds.north].map((v) => Number(v.toFixed(5)));

  let s2Features = await stacSearch(EARTH_SEARCH_STAC, ["sentinel-2-l2a"], bbox, 25, 90);
  if (!s2Features.length) s2Features = await stacSearch(EARTH_SEARCH_STAC, ["sentinel-2-l2a"], bbox, 60, 180);
  if (!s2Features.length) throw new Error("Brak scen Sentinel-2 w bazie STAC dla tego widoku.");
  const s2 = s2Features[0];
  const s2Epsg: number = s2.properties["proj:epsg"] || 32633;

  let ls: (typeof s2Features)[number] | null = null;
  let sas = "";
  try {
    let lsFeatures = await stacSearch(PLANETARY_STAC, ["landsat-c2-l2"], bbox, 30, 120);
    if (!lsFeatures.length) lsFeatures = await stacSearch(PLANETARY_STAC, ["landsat-c2-l2"], bbox, 65, 220);
    if (lsFeatures.length) {
      ls = lsFeatures[0];
      sas = await getSasToken();
    }
  } catch {
    ls = null;
  }

  const lsEpsg: number = ls?.properties?.["proj:epsg"] || s2Epsg;
  const [redP, nirP, swirP, sclP, lstP] = await Promise.all([
    readCogPatch(s2.assets.red.href, bounds, s2Epsg, "bilinear"),
    readCogPatch(s2.assets.nir.href, bounds, s2Epsg, "bilinear"),
    readCogPatch(s2.assets.swir16.href, bounds, s2Epsg, "bilinear"),
    s2.assets.scl ? readCogPatch(s2.assets.scl.href, bounds, s2Epsg, "nearest") : Promise.resolve(null),
    ls?.assets?.lwir11
      ? readCogPatch(`${ls.assets.lwir11.href}?${sas}`, bounds, lsEpsg, "bilinear")
      : Promise.resolve(null),
  ]);

  if (!redP || !nirP || !swirP) throw new Error("Wybrany obszar leży poza granicą kafelka Sentinel-2.");

  const cols = SAT_GRID_W;
  const aspect = Math.max(0.45, Math.min(1.4, ((bounds.north - bounds.south) / Math.max(1e-5, bounds.east - bounds.west)) * 1.65));
  const rows = Math.round(cols * aspect);
  const ndvi = new Float32Array(cols * rows).fill(NaN);
  const ndmi = new Float32Array(cols * rows).fill(NaN);
  const lst = new Float32Array(cols * rows).fill(NaN);
  const cloud = new Uint8Array(cols * rows);

  for (let r = 0; r < rows; r++) {
    const lat = bounds.north - ((r + 0.5) / rows) * (bounds.north - bounds.south);
    for (let c = 0; c < cols; c++) {
      const lon = bounds.west + ((c + 0.5) / cols) * (bounds.east - bounds.west);
      const i = r * cols + c;
      if (sclP && SCL_CLOUD_MASK.has(sclP.sample(lat, lon))) {
        cloud[i] = 1;
        continue;
      }
      const dnR = redP.sample(lat, lon);
      const dnN = nirP.sample(lat, lon);
      const dnS = swirP.sample(lat, lon);
      if (!Number.isFinite(dnR) || !Number.isFinite(dnN) || dnR === 0 || dnN === 0) continue;

      const rRefl = Math.max(0.0001, dnR * 0.0001 - 0.1);
      const nRefl = Math.max(0.0001, dnN * 0.0001 - 0.1);
      ndvi[i] = (nRefl - rRefl) / (nRefl + rRefl);

      if (Number.isFinite(dnS) && dnS !== 0) {
        const sRefl = Math.max(0.0001, dnS * 0.0001 - 0.1);
        ndmi[i] = (nRefl - sRefl) / (nRefl + sRefl);
      }

      const dnL = lstP ? lstP.sample(lat, lon) : NaN;
      if (Number.isFinite(dnL) && dnL > 1000) {
        lst[i] = dnL * 0.00341802 + 149.0 - 273.15;
      } else if (Number.isFinite(ndmi[i])) {
        const adj = Math.max(-3, Math.min(12, (0.25 - ndmi[i]) * 18));
        lst[i] = fallbackTempC + adj;
      }
    }
  }

  return {
    cols,
    rows,
    bounds,
    ndvi,
    ndmi,
    lst,
    cloud,
    s2Meta: {
      id: s2.id,
      datetime: s2.properties.datetime,
      cloudCover: s2.properties["eo:cloud_cover"],
      epsg: s2Epsg,
    },
    lsMeta: ls
      ? { id: ls.id, datetime: ls.properties.datetime, cloudCover: ls.properties["eo:cloud_cover"] }
      : null,
    loadMs: Math.round(performance.now() - t0),
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function computePixelStress(ndvi: number, ndmi: number, lstC: number, vpdMax: number | null): number {
  const lstFactor = clamp(((Number.isFinite(lstC) ? lstC : 18) - 18) / 18, 0, 1);
  const dryCanopy = Number.isFinite(ndmi) ? clamp((0.28 - ndmi) / 0.45, 0, 1) : 0.4;
  const vpdFactor = vpdMax !== null && Number.isFinite(vpdMax) ? clamp((vpdMax - 0.8) / 1.6, 0, 1) : 0.25;
  const vegMask = Number.isFinite(ndvi) && ndvi < 0.15 ? 0.55 : 1.0;
  return clamp(Math.round((lstFactor * 0.56 + dryCanopy * 0.30 + vpdFactor * 0.14) * vegMask * 100), 0, 100);
}

function lerpColor(stops: Array<[number, [number, number, number]]>, value: number): [number, number, number] {
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
  return stops[stops.length - 1][1];
}

const STRESS_PALETTE: Array<[number, [number, number, number]]> = [
  [0, [41, 128, 185]],
  [30, [46, 204, 113]],
  [55, [241, 196, 15]],
  [75, [230, 126, 34]],
  [100, [192, 57, 43]],
];
const NDMI_PALETTE: Array<[number, [number, number, number]]> = [
  [-0.25, [178, 58, 43]],
  [0.0, [230, 145, 56]],
  [0.18, [238, 208, 102]],
  [0.35, [56, 178, 122]],
  [0.55, [23, 105, 165]],
];
const NDVI_PALETTE: Array<[number, [number, number, number]]> = [
  [0.05, [168, 114, 72]],
  [0.25, [224, 186, 92]],
  [0.45, [132, 193, 92]],
  [0.75, [23, 112, 62]],
];

export function renderGridToDataUrl(
  grid: SatelliteGrid,
  mode: Exclude<SatelliteMode, "none">,
  heatwaveSim: boolean,
  vpdMax: number | null
): string {
  const canvas = document.createElement("canvas");
  canvas.width = grid.cols;
  canvas.height = grid.rows;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(grid.cols, grid.rows);

  for (let i = 0; i < grid.cols * grid.rows; i++) {
    if (grid.cloud[i] || !Number.isFinite(grid.ndvi[i])) continue;
    const effLst = Number.isFinite(grid.lst[i]) ? grid.lst[i] + (heatwaveSim ? 14 : 0) : NaN;
    let rgb: [number, number, number];
    if (mode === "ndmi") rgb = lerpColor(NDMI_PALETTE, Number.isFinite(grid.ndmi[i]) ? grid.ndmi[i] : 0);
    else if (mode === "ndvi") rgb = lerpColor(NDVI_PALETTE, grid.ndvi[i]);
    else rgb = lerpColor(STRESS_PALETTE, computePixelStress(grid.ndvi[i], grid.ndmi[i], effLst, vpdMax));
    img.data.set([rgb[0], rgb[1], rgb[2], 196], 4 * i);
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

function pointInRing(lat: number, lon: number, ring: LatLngTuple[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i];
    const [yj, xj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function pointInParcel(lat: number, lon: number, parcel: ParcelData): boolean {
  return parcel.rings.some(
    ([outer, ...holes]) => pointInRing(lat, lon, outer) && !holes.some((h) => pointInRing(lat, lon, h))
  );
}

export function summarizeGrid(
  grid: SatelliteGrid,
  parcel: ParcelData | null,
  heatwaveSim: boolean,
  vpdMax: number | null
): SatelliteStats | null {
  let pixels = 0, ndviSum = 0, ndmiSum = 0, lstSum = 0, validLst = 0, stressSum = 0, hotCount = 0;
  const { south, west, north, east } = grid.bounds;

  for (let r = 0; r < grid.rows; r++) {
    const lat = north - ((r + 0.5) / grid.rows) * (north - south);
    for (let c = 0; c < grid.cols; c++) {
      const lon = west + ((c + 0.5) / grid.cols) * (east - west);
      const i = r * grid.cols + c;
      if (grid.cloud[i] || !Number.isFinite(grid.ndvi[i])) continue;
      if (parcel && !pointInParcel(lat, lon, parcel)) continue;
      const effLst = Number.isFinite(grid.lst[i]) ? grid.lst[i] + (heatwaveSim ? 14 : 0) : NaN;
      const stress = computePixelStress(grid.ndvi[i], grid.ndmi[i], effLst, vpdMax);
      pixels++;
      ndviSum += grid.ndvi[i];
      if (Number.isFinite(grid.ndmi[i])) ndmiSum += grid.ndmi[i];
      if (Number.isFinite(effLst)) {
        lstSum += effLst;
        validLst++;
      }
      stressSum += stress;
      if (stress >= 58 || effLst >= 28) hotCount++;
    }
  }

  if (!pixels) return null;
  return {
    pixels,
    ndvi: ndviSum / pixels,
    ndmi: ndmiSum / pixels,
    lstC: validLst ? lstSum / validLst : null,
    stress: Math.round(stressSum / pixels),
    hotSharePct: Math.round((hotCount / pixels) * 100),
  };
}
