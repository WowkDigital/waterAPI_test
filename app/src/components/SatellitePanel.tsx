import { Flame, Satellite, SlidersHorizontal } from "lucide-react";
import type { ParcelData, SatelliteGrid, SatelliteMode, SavedField } from "../types";
import { SATELLITE_LEGENDS, summarizeGrid } from "../services/satellite";

interface SatellitePanelProps {
  grid: SatelliteGrid | null;
  loading: boolean;
  error: string | null;
  mode: SatelliteMode;
  curtainPct: number;
  heatwaveSim: boolean;
  hoverText: string;
  parcel: ParcelData | null;
  savedFields: SavedField[];
  vpdMax: number | null;
  onFetch: () => void;
  onModeChange: (mode: SatelliteMode) => void;
  onCurtainChange: (pct: number) => void;
  onHeatwaveChange: (enabled: boolean) => void;
  onInspectField: (field: SavedField) => void;
}

export function SatellitePanel({
  grid,
  loading,
  error,
  mode,
  curtainPct,
  heatwaveSim,
  hoverText,
  parcel,
  savedFields,
  vpdMax,
  onFetch,
  onModeChange,
  onCurtainChange,
  onHeatwaveChange,
  onInspectField,
}: SatellitePanelProps) {
  const parcelStats = grid && parcel?.rings.length ? summarizeGrid(grid, parcel, heatwaveSim, vpdMax) : null;
  const viewStats = grid ? parcelStats ?? summarizeGrid(grid, null, heatwaveSim, vpdMax) : null;
  const legend = mode !== "none" ? SATELLITE_LEGENDS[mode] : null;

  const ranking = grid
    ? savedFields
        .map((field) => ({
          field,
          stats: summarizeGrid(grid, field.parcel, heatwaveSim, vpdMax),
        }))
        .filter((x): x is { field: SavedField; stats: NonNullable<typeof x.stats> } => x.stats !== null)
        .sort((a, b) => b.stats.stress - a.stats.stress)
    : [];

  return (
    <section className="rounded-3xl border border-[#dfe7df] bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Satellite className="h-5 w-5 text-[#17694f]" />
            Rentgen satelitarny · Stres cieplny pól (Sentinel-2 + Landsat)
          </h2>
          <p className="mt-1 text-sm text-[#52655d]">
            Strumieniowanie wycinków COG przez STAC (bez backendu). Wskazuje pola, na których roślinom jest zbyt ciepło.
          </p>
        </div>
        <span
          className={`rounded-lg px-3 py-1 text-xs font-bold ${
            !viewStats
              ? "bg-[#edf2ef] text-[#52655d]"
              : viewStats.stress >= 70 || (viewStats.lstC !== null && viewStats.lstC >= 32)
              ? "bg-[#fae8e3] text-[#9b392b]"
              : viewStats.stress >= 52
              ? "bg-[#fff0d6] text-[#875100]"
              : "bg-[#e6f3e9] text-[#17694f]"
          }`}
        >
          {!viewStats
            ? "Gotowy do pobrania"
            : viewStats.stress >= 70
            ? "🔥 Krytycznie za ciepło roślinom"
            : viewStats.stress >= 52
            ? "🌡️ Podwyższony stres cieplny"
            : "💧 Chłodzenie i wilgotność OK"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onFetch}
          disabled={loading}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#17694f] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#135640] disabled:opacity-50"
        >
          {loading ? "Pobieranie COG…" : "Pobierz scenę z satelity dla widoku"}
        </button>

        <label className="flex items-center gap-2 text-sm font-semibold text-[#52655d]">
          <span>Warstwa</span>
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value as SatelliteMode)}
            className="rounded-xl border border-[#dfe7df] bg-white px-3 py-2 text-sm font-semibold text-[#1c302a]"
          >
            <option value="stress">Stres cieplny roślin (°C + NDMI)</option>
            <option value="ndmi">Wilgotność liści (Sentinel-2 NDMI)</option>
            <option value="ndvi">Kondycja roślin (Sentinel-2 NDVI)</option>
            <option value="none">Ukryj nakładkę</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm font-semibold text-[#52655d]">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Kurtyna {curtainPct}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={curtainPct}
            onChange={(e) => onCurtainChange(Number(e.target.value))}
            className="w-28 accent-[#17694f]"
          />
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={heatwaveSim}
            onChange={(e) => onHeatwaveChange(e.target.checked)}
            className="h-4 w-4 accent-[#9b392b]"
          />
          <Flame className="h-4 w-4 text-[#9b392b]" />
          <span>Symulacja fali upałów (+14 °C)</span>
        </label>
      </div>

      {grid && (
        <p className="mt-2 text-xs text-[#52655d]">
          Załadowano w {grid.loadMs} ms · Sentinel-2: <strong>{grid.s2Meta.datetime.slice(0, 10)}</strong> (chmury{" "}
          {grid.s2Meta.cloudCover.toFixed(1)}%) · Landsat Termiczny:{" "}
          <strong>{grid.lsMeta ? grid.lsMeta.datetime.slice(0, 10) : "estymacja Open-Meteo"}</strong>.
        </p>
      )}
      {error && <p className="mt-2 rounded-xl bg-[#fae8e3] px-3 py-2 text-sm text-[#9b392b]">{error}</p>}

      <p className="mt-2 rounded-xl border border-[#dfe7df] bg-[#f4f8f4] px-3 py-2 text-xs font-medium tabular-nums">
        {hoverText}
      </p>

      {legend && (
        <div className="mt-3 rounded-xl border border-[#dfe7df] bg-[#f4f8f4] p-3">
          <p className="text-xs font-semibold text-[#1c302a]">{legend.hint}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#52655d]">
            {legend.items.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1.5">
                <i className="inline-block h-2.5 w-2.5 rounded-xs" style={{ backgroundColor: item.color }} />
                <strong className="text-[#1c302a]">{item.label}</strong> · {item.detail}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <div className="rounded-2xl border border-[#d1e6d7] bg-[#e8f4ea] p-3.5">
          <div className="text-xs font-bold text-[#52655d]">Temperatura (LST)</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-[#17694f] tabular-nums">
            {viewStats?.lstC !== null && viewStats?.lstC !== undefined ? `${viewStats.lstC.toFixed(1)} °C` : "—"}
          </div>
          <div className="text-xs text-[#52655d]">
            {heatwaveSim ? "Symulacja +14 °C" : grid?.lsMeta ? "Landsat ST_B10" : "Oczekuje"}
          </div>
        </div>
        <div className="rounded-2xl border border-[#dfe7df] bg-[#f4f8f4] p-3.5">
          <div className="text-xs font-bold text-[#52655d]">Wilgotność liści (NDMI)</div>
          <div className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
            {viewStats ? viewStats.ndmi.toFixed(2) : "—"}
          </div>
          <div className="text-xs text-[#52655d]">
            {!viewStats ? "Sentinel-2" : viewStats.ndmi < 0.08 ? "Niska woda w liściach" : "Dobry turgor"}
          </div>
        </div>
        <div className="rounded-2xl border border-[#dfe7df] bg-[#f4f8f4] p-3.5">
          <div className="text-xs font-bold text-[#52655d]">Kondycja (NDVI)</div>
          <div className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
            {viewStats ? viewStats.ndvi.toFixed(2) : "—"}
          </div>
          <div className="text-xs text-[#52655d]">
            {!viewStats ? "Sentinel-2" : viewStats.ndvi >= 0.35 ? "Aktywna okrywa" : "Gleba / słaba uprawa"}
          </div>
        </div>
        <div className="rounded-2xl border border-[#dfe7df] bg-[#f4f8f4] p-3.5">
          <div className="text-xs font-bold text-[#52655d]">Przegrzany obszar</div>
          <div className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
            {viewStats ? `${viewStats.hotSharePct}%` : "—"}
          </div>
          <div className="text-xs text-[#52655d]">
            {viewStats ? `Indeks ${viewStats.stress}/100` : "Widok lub działka"}
          </div>
        </div>
      </div>

      {ranking.length > 0 && (
        <div className="mt-4 border-t border-[#dfe7df] pt-3">
          <h3 className="text-sm font-bold">Najcieplejsze pola w widoku (Moje pola)</h3>
          <ul className="mt-2 grid gap-1.5">
            {ranking.map(({ field, stats }) => (
              <li
                key={field.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#dfe7df] bg-[#f4f8f4] px-3 py-2 text-sm"
              >
                <button
                  type="button"
                  onClick={() => onInspectField(field)}
                  className="font-bold text-[#17694f] hover:underline"
                >
                  Działka {field.parcel.number} · {field.parcel.areaHa.toFixed(2)} ha
                </button>
                <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold tabular-nums">
                  {stats.lstC !== null ? `${stats.lstC.toFixed(1)} °C · ` : ""}NDMI {stats.ndmi.toFixed(2)} · stres{" "}
                  {stats.stress}/100
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
