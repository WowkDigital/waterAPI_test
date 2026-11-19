import proj4 from "proj4";
import type { LatLngTuple, ParcelData, TerrainSample, TerrainSummary } from "../types";

if (!proj4.defs("EPSG:2180")) {
  proj4.defs(
    "EPSG:2180",
    "+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +units=m +no_defs"
  );
}

export function projectTo2180([lat, lon]: LatLngTuple): [number, number] {
  const [east, north] = proj4("EPSG:4326", "EPSG:2180", [lon, lat]);
  return [north, east];
}

export function parseWktPolygon(wkt: string): LatLngTuple[][][] {
  const shape = wkt?.match(/^(?:SRID=\d+;)?(MULTIPOLYGON|POLYGON)\s*(\(.*\))$/i);
  if (!shape) return [];
  const text = shape[2].slice(1, -1);
  const polygons =
    shape[1].toUpperCase() === "POLYGON"
      ? [text]
      : text.match(/\([^()]*\([^()]+\)(?:\s*,\s*\([^()]+\))*\s*\)/g) ?? [];

  return polygons
    .map((polygon) =>
      [...polygon.matchAll(/\(([^()]+)\)/g)].map(([, ring]) =>
        ring.split(",").map((pair): LatLngTuple => {
          const [lon, lat] = pair.trim().split(/\s+/).map(Number);
          return [lat, lon];
        })
      )
    )
    .filter(
      (polygon) =>
        polygon.length > 0 &&
        polygon.every((ring) => ring.length >= 4 && ring.every((pt) => Number.isFinite(pt[0]) && Number.isFinite(pt[1])))
    );
}

export function polygonAreaHa(latLngs: LatLngTuple[]): number {
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

export function distanceMeters(p1: LatLngTuple, p2: LatLngTuple): number {
  const R = 6371000;
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1[0] * Math.PI) / 180) * Math.cos((p2[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingLabel(from: LatLngTuple, to: LatLngTuple): string {
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

export async function fetchParcelByXY(lat: number, lon: number, signal?: AbortSignal): Promise<ParcelData | null> {
  const url =
    `https://uldk.gugik.gov.pl/?request=GetParcelByXY&xy=${lon.toFixed(6)},${lat.toFixed(6)},4326` +
    `&result=geom_wkt,voivodeship,county,commune,region,parcel,teryt&srid=4326`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`ULDK HTTP ${res.status}`);
  const body = await res.text();
  const [code, record] = body.trim().split(/\r?\n/);
  if (code !== "0" || !record) return null;
  const [wkt, , , commune, region, number, teryt] = record.split("|");
  const rings = parseWktPolygon(wkt);
  const areaHa = rings.reduce(
    (sum, [outer, ...holes]) =>
      sum + polygonAreaHa(outer) - holes.reduce((hSum, hole) => hSum + polygonAreaHa(hole), 0),
    0
  );
  const points = rings[0]?.[0] ?? [];
  const center: LatLngTuple = points.length
    ? [points.reduce((s, p) => s + p[0], 0) / points.length, points.reduce((s, p) => s + p[1], 0) / points.length]
    : [lat, lon];

  return {
    id: teryt || `${lat.toFixed(5)},${lon.toFixed(5)}`,
    commune,
    region,
    number,
    teryt,
    rings,
    points,
    areaHa,
    center,
  };
}

export async function fetchTerrainSummary(
  lat: number,
  lon: number,
  parcel: ParcelData | null,
  signal?: AbortSignal
): Promise<TerrainSummary | null> {
  const points: LatLngTuple[] = [[lat, lon]];
  const outline = parcel?.points;
  if (outline && outline.length >= 4) {
    const step = Math.max(1, Math.floor((outline.length - 1) / 4));
    for (let i = 0; i < outline.length - 1 && points.length < 5; i += step) points.push(outline[i]);
  } else {
    points.push([lat + 0.001, lon], [lat - 0.001, lon], [lat, lon + 0.0015], [lat, lon - 0.0015]);
  }

  const samples = await Promise.all(
    points.map(async (point): Promise<TerrainSample | null> => {
      const [north, east] = projectTo2180(point);
      const url = `https://services.gugik.gov.pl/nmt/?request=GetHbyXY&x=${north.toFixed(2)}&y=${east.toFixed(2)}`;
      try {
        const res = await fetch(url, { signal });
        if (!res.ok) return null;
        const val = Number((await res.text()).trim().replace(",", "."));
        return Number.isFinite(val) ? { point, elevationM: val } : null;
      } catch {
        return null;
      }
    })
  );

  const valid = samples.filter((s): s is TerrainSample => s !== null).sort((a, b) => a.elevationM - b.elevationM);
  if (valid.length < 2) return null;

  const lowest = valid[0];
  const highest = valid[valid.length - 1];
  const deltaM = highest.elevationM - lowest.elevationM;
  const slopePct = (deltaM * 100) / Math.max(1, distanceMeters(highest.point, lowest.point));
  const directionLabel = deltaM > 0.1 ? bearingLabel(highest.point, lowest.point) : "Teren płaski";
  return { lowest, highest, deltaM, slopePct, directionLabel };
}
