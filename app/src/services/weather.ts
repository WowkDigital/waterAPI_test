import type { Forecast48h, ImgwSummary } from "../types";

const FORECAST_FIELDS = [
  "precipitation",
  "et0_fao_evapotranspiration",
  "vapour_pressure_deficit",
  "soil_moisture_0_to_1cm",
  "soil_temperature_0cm",
] as const;

export async function fetchOpenMeteo48h(lat: number, lon: number, signal?: AbortSignal): Promise<Forecast48h> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    hourly: FORECAST_FIELDS.join(","),
    forecast_hours: "48",
    timezone: "Europe/Warsaw",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data?.hourly?.time) || data.hourly.time.length < 24) {
    throw new Error("Niepełne dane prognozy Open-Meteo");
  }
  return data.hourly as Forecast48h;
}

export async function fetchImgwSummary(teryt?: string, signal?: AbortSignal): Promise<ImgwSummary> {
  const [meteoRes, hydroRes, synopRes] = await Promise.all([
    fetch("https://danepubliczne.imgw.pl/api/data/warningsmeteo", { signal }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
    fetch("https://danepubliczne.imgw.pl/api/data/warningshydro", { signal }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
    fetch("https://danepubliczne.imgw.pl/api/data/synop", { signal }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
  ]);

  const county = teryt?.slice(0, 4);
  const localWarnings =
    county && Array.isArray(meteoRes)
      ? meteoRes.filter(
          (w: { teryt?: unknown[] }) =>
            Array.isArray(w.teryt) && w.teryt.some((val) => String(val).startsWith(county))
        )
      : [];

  const station =
    (Array.isArray(synopRes)
      ? synopRes.find((s: { stacja?: string }) => /bydgoszcz|toru|chojnic|inowroc/i.test(s.stacja || "")) ?? synopRes[0]
      : null) ?? null;

  return {
    localWarnings,
    hydroCount: Array.isArray(hydroRes) ? hydroRes.length : 0,
    stationLabel: station
      ? `Stacja ${station.stacja} · ${station.data_pomiaru} ${station.godzina_pomiaru}:00 · ${station.temperatura ?? "—"} °C`
      : "Brak odczytu ze stacji synoptycznej",
  };
}
