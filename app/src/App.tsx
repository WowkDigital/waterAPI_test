import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Download, Droplets, MapPin, Plus, RotateCcw, Trash2, Wifi, WifiOff } from "lucide-react";
import { CavitationAudio } from "./components/CavitationAudio";
import { FieldMap } from "./components/FieldMap";
import { SatellitePanel } from "./components/SatellitePanel";
import { WeirAndPactPanel } from "./components/WeirAndPactPanel";
import { SOIL_CATEGORIES, summarizeForecast48h } from "./services/agroEngine";
import { fetchParcelByXY, fetchTerrainSummary } from "./services/geoportal";
import { fetchSatelliteGrid, summarizeGrid } from "./services/satellite";
import { fetchImgwSummary, fetchOpenMeteo48h } from "./services/weather";
import type {
  Forecast48h,
  ImgwSummary,
  LatLngTuple,
  PactStatus,
  ParcelData,
  SatelliteGrid,
  SatelliteMode,
  SavedField,
  SoilConfig,
  TerrainSummary,
} from "./types";

const PRESETS = {
  sicienko: { label: "Sicienko", sub: "Osówiec", coords: [53.185, 17.855] as LatLngTuple, zoom: 15 },
  dobrcz: { label: "Dobrcz", sub: "Borówno", coords: [53.245, 18.145] as LatLngTuple, zoom: 14 },
};

const STORAGE_KEY = "hydrozgoda.fields.v1";

function loadSavedFields(): SavedField[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function App() {
  const [center, setCenter] = useState<LatLngTuple>(PRESETS.sicienko.coords);
  const [zoom, setZoom] = useState<number>(PRESETS.sicienko.zoom);
  const [activePreset, setActivePreset] = useState<keyof typeof PRESETS | null>("sicienko");
  const [soilId, setSoilId] = useState<SoilConfig["id"]>("2");
  const [scenario, setScenario] = useState<"rain" | "vpd" | null>(null);

  const [parcel, setParcel] = useState<ParcelData | null>(null);
  const [terrain, setTerrain] = useState<TerrainSummary | null>(null);
  const [forecast, setForecast] = useState<Forecast48h | null>(null);
  const [imgw, setImgw] = useState<ImgwSummary | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [savedFields, setSavedFields] = useState<SavedField[]>(loadSavedFields);

  const [mapBounds, setMapBounds] = useState<{ south: number; west: number; north: number; east: number; zoom: number } | null>(null);
  const [satGrid, setSatGrid] = useState<SatelliteGrid | null>(null);
  const [satLoading, setSatLoading] = useState(false);
  const [satError, setSatError] = useState<string | null>(null);
  const [satMode, setSatMode] = useState<SatelliteMode>("stress");
  const [curtainPct, setCurtainPct] = useState(100);
  const [heatwaveSim, setHeatwaveSim] = useState(false);
  const [hoverText, setHoverText] = useState("Odczyt spod kursora pojawi się po załadowaniu wycinka satelitarnego.");

  const [weirCm, setWeirCm] = useState(18);
  const [pactStatus, setPactStatus] = useState<PactStatus>("idle");
  const [online, setOnline] = useState(navigator.onLine);
  const [installEvent, setInstallEvent] = useState<{ prompt: () => Promise<void> } | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as unknown as { prompt: () => Promise<void> });
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onInstall);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onInstall);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedFields));
  }, [savedFields]);

  const analyzeLocation = useCallback(
    async (lat: number, lon: number, preset: keyof typeof PRESETS | null = null, nextZoom?: number) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setActivePreset(preset);
      setCenter([lat, lon]);
      if (nextZoom) setZoom(nextZoom);
      setLoadingLocation(true);
      setParcel(null);
      setTerrain(null);

      try {
        const [parcelData, forecastData] = await Promise.all([
          fetchParcelByXY(lat, lon, ctrl.signal).catch(() => null),
          fetchOpenMeteo48h(lat, lon, ctrl.signal).catch(() => null),
        ]);
        if (ctrl.signal.aborted) return;

        setParcel(parcelData);
        setForecast(forecastData);

        const [terrainData, imgwData] = await Promise.all([
          fetchTerrainSummary(lat, lon, parcelData, ctrl.signal).catch(() => null),
          fetchImgwSummary(parcelData?.teryt, ctrl.signal).catch(() => null),
        ]);
        if (ctrl.signal.aborted) return;

        setTerrain(terrainData);
        setImgw(imgwData);
      } finally {
        if (!ctrl.signal.aborted) setLoadingLocation(false);
      }
    },
    []
  );

  useEffect(() => {
    analyzeLocation(PRESETS.sicienko.coords[0], PRESETS.sicienko.coords[1], "sicienko", PRESETS.sicienko.zoom);
  }, [analyzeLocation]);

  const effectiveForecast = useMemo<Forecast48h | null>(() => {
    if (!forecast) return null;
    if (!scenario) return forecast;
    return {
      ...forecast,
      precipitation: forecast.precipitation.map((v, i) => (scenario === "rain" && i >= 6 && i < 11 ? v + 5 : v)),
      vapour_pressure_deficit: forecast.vapour_pressure_deficit.map((v, i) =>
        scenario === "vpd" && i >= 10 && i < 18 ? Math.max(v, 2.15) : v
      ),
    };
  }, [forecast, scenario]);

  const balance = useMemo(
    () => summarizeForecast48h(effectiveForecast, parcel?.areaHa ?? 1),
    [effectiveForecast, parcel]
  );

  const satStats = useMemo(
    () => (satGrid ? summarizeGrid(satGrid, parcel, heatwaveSim, balance?.maxVpd ?? null) : null),
    [satGrid, parcel, heatwaveSim, balance?.maxVpd]
  );

  const handleFetchSatellite = async () => {
    if (!mapBounds) return;
    if (mapBounds.zoom < 12) {
      setSatError("Przybliż mapę przynajmniej do poziomu 12, aby pobrać wycinek Sentinela.");
      return;
    }
    setSatLoading(true);
    setSatError(null);
    try {
      const grid = await fetchSatelliteGrid(mapBounds, effectiveForecast?.soil_temperature_0cm[0] ?? 12);
      setSatGrid(grid);
      if (satMode === "none") setSatMode("stress");
    } catch (err) {
      setSatError(err instanceof Error ? err.message : "Błąd pobierania danych satelitarnych.");
    } finally {
      setSatLoading(false);
    }
  };

  const handleSaveParcel = () => {
    if (!parcel || parcel.areaHa <= 0) return;
    setSavedFields((prev) => {
      if (prev.some((f) => f.id === parcel.id)) return prev;
      return [...prev, { id: parcel.id, parcel, soil: soilId }];
    });
  };

  const handleNotify = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      new Notification("HydroZgoda · WodoStrażnik Pola", {
        body: "Powiadomienia Push dla paktów sąsiedzkich i alertów suszy są aktywne!",
      });
    }
  };

  const isStressed = Boolean(
    heatwaveSim ||
      (balance && balance.maxVpd > 1.6) ||
      (satStats && satStats.stress >= 55)
  );

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-[800] border-b border-[#dfe7df] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#15382e] text-[#bbefd0]">
              <Droplets className="h-5 w-5" />
            </span>
            <div>
              <span className="text-lg font-bold tracking-tight">HydroZgoda</span>
              <span className="ml-1.5 text-sm font-semibold text-[#52655d]">· WodoStrażnik (React PWA)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                online ? "bg-[#e6f3e9] text-[#17694f]" : "bg-[#fff0d6] text-[#875100]"
              }`}
            >
              {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {online ? "Online" : "Tryb Offline PWA"}
            </span>
            {installEvent && (
              <button
                type="button"
                onClick={() => installEvent.prompt()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#17694f] bg-[#e6f3e9] px-3 py-1.5 text-xs font-bold text-[#17694f]"
              >
                <Download className="h-3.5 w-3.5" />
                Zainstaluj PWA
              </button>
            )}
            <button
              type="button"
              onClick={handleNotify}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe7df] bg-white px-3 py-1.5 text-xs font-bold hover:bg-[#f4f8f4]"
            >
              <Bell className="h-3.5 w-3.5" />
              Powiadomienia
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-7xl space-y-5 px-4 sm:px-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#15382e] to-[#1d5e4a] px-6 py-7 text-white shadow-sm">
          <p className="text-xs font-bold tracking-wider text-[#bbefd0] uppercase">
            HackNation 2026 · KOWR · Zgoda buduje, woda ratuje!
          </p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight sm:text-4xl">
            Satelitarny Rentgen Upraw & Pakt Wodny Sąsiadów
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#e2f2e9]">
            Łączy bezpłatne dane z kosmosu (Sentinel-2 + Landsat Thermal), rzeźbę LiDAR NMT i prognozy Open-Meteo/IMGW w
            jednym instalowalnym PWA działającym w polu.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.8fr_1fr]">
          <section className="rounded-3xl border border-[#dfe7df] bg-white p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Mapa działki i podsiąku</h2>
                <p className="text-xs text-[#52655d]">Kliknij dowolne pole w Polsce, aby pobrać granice ULDK i spływ NMT.</p>
              </div>
              <span className="rounded-lg bg-[#edf2ef] px-2.5 py-1 text-xs font-bold text-[#52655d]">
                {loadingLocation ? "Pobieranie…" : parcel ? `dz. ${parcel.number}` : "Wybierz punkt"}
              </span>
            </div>

            <FieldMap
              center={center}
              zoom={zoom}
              parcel={parcel}
              terrain={terrain}
              savedFields={savedFields}
              satGrid={satGrid}
              satMode={satMode}
              curtainPct={curtainPct}
              heatwaveSim={heatwaveSim}
              vpdMax={balance?.maxVpd ?? null}
              weirCm={weirCm}
              pactStatus={pactStatus}
              onMapClick={(lat, lon) => analyzeLocation(lat, lon, null)}
              onBoundsReady={setMapBounds}
              onHoverPixel={setHoverText}
              onSelectSavedField={(field) => {
                setSoilId(field.soil);
                analyzeLocation(field.parcel.center[0], field.parcel.center[1], null, 15);
              }}
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#52655d]">
              <span>
                {parcel
                  ? `${parcel.commune}, obr. ${parcel.region} · ${parcel.areaHa.toFixed(2)} ha · TERYT ${parcel.teryt}`
                  : "Kliknij mapę lub wybierz przykładowe pole"}
              </span>
              {terrain && (
                <span className="font-semibold text-[#1c302a]">
                  Wys. {terrain.lowest.elevationM.toFixed(1)}–{terrain.highest.elevationM.toFixed(1)} m · spadek{" "}
                  {terrain.slopePct.toFixed(1)}% ({terrain.directionLabel})
                </span>
              )}
            </div>
          </section>

          <aside className="rounded-3xl border border-[#dfe7df] bg-white p-5 shadow-xs">
            <h2 className="text-xl font-bold tracking-tight">Wybór działki i gleby</h2>
            <div className="mt-3 grid gap-2">
              {(Object.entries(PRESETS) as Array<[keyof typeof PRESETS, (typeof PRESETS)["sicienko"]]>).map(([key, p]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => analyzeLocation(p.coords[0], p.coords[1], key, p.zoom)}
                  className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition ${
                    activePreset === key
                      ? "border-[#80ad94] bg-[#edf7ee]"
                      : "border-[#dfe7df] bg-white hover:border-[#8ab29d]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-[#17694f]" />
                    <span>
                      <strong className="block text-sm">{p.label}</strong>
                      <small className="text-xs text-[#52655d]">{p.sub}</small>
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveParcel}
              disabled={!parcel || parcel.areaHa <= 0}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#80ad94] bg-[#e6f3e9] px-3 py-2 text-sm font-bold text-[#17694f] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Dodaj działkę do moich pól
            </button>

            <label className="mt-4 block text-xs font-bold text-[#52655d]">
              Kategoria gleby (IUNG WOD)
              <select
                value={soilId}
                onChange={(e) => setSoilId(e.target.value as SoilConfig["id"])}
                className="mt-1.5 w-full rounded-xl border border-[#dfe7df] bg-white px-3 py-2 text-sm font-semibold text-[#1c302a]"
              >
                {SOIL_CATEGORIES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 border-t border-[#dfe7df] pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#52655d]">Symulacja pogodowa (48h)</span>
                {scenario && (
                  <button
                    type="button"
                    onClick={() => setScenario(null)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#17694f] underline"
                  >
                    <RotateCcw className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScenario(scenario === "rain" ? null : "rain")}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                    scenario === "rain"
                      ? "border-[#d2a45f] bg-[#fdf0db] text-[#875100]"
                      : "border-[#dfe7df] bg-white hover:bg-[#f4f8f4]"
                  }`}
                >
                  Ulewa +25 mm
                </button>
                <button
                  type="button"
                  onClick={() => setScenario(scenario === "vpd" ? null : "vpd")}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                    scenario === "vpd"
                      ? "border-[#d2a45f] bg-[#fdf0db] text-[#875100]"
                      : "border-[#dfe7df] bg-white hover:bg-[#f4f8f4]"
                  }`}
                >
                  Stres VPD
                </button>
              </div>
            </div>

            {balance && (
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#dfe7df] pt-3 text-xs">
                <div className="rounded-xl bg-[#f4f8f4] p-2.5">
                  <div className="text-[#52655d]">Saldo wody 48h</div>
                  <div className="text-base font-bold text-[#17694f]">
                    {balance.balanceM3 > 0 ? "+" : ""}
                    {Math.round(balance.balanceM3).toLocaleString("pl-PL")} m³
                  </div>
                </div>
                <div className="rounded-xl bg-[#f4f8f4] p-2.5">
                  <div className="text-[#52655d]">Maks. VPD</div>
                  <div className="text-base font-bold">{balance.maxVpd.toFixed(2)} kPa</div>
                </div>
              </div>
            )}
          </aside>
        </div>

        <SatellitePanel
          grid={satGrid}
          loading={satLoading}
          error={satError}
          mode={satMode}
          curtainPct={curtainPct}
          heatwaveSim={heatwaveSim}
          hoverText={hoverText}
          parcel={parcel}
          savedFields={savedFields}
          vpdMax={balance?.maxVpd ?? null}
          onFetch={handleFetchSatellite}
          onModeChange={setSatMode}
          onCurtainChange={setCurtainPct}
          onHeatwaveChange={setHeatwaveSim}
          onInspectField={(field) => {
            setSoilId(field.soil);
            analyzeLocation(field.parcel.center[0], field.parcel.center[1], null, 15);
          }}
        />

        <WeirAndPactPanel
          weirCm={weirCm}
          pactStatus={pactStatus}
          parcel={parcel}
          terrain={terrain}
          satStats={satStats}
          onWeirChange={setWeirCm}
          onPactStatusChange={setPactStatus}
        />

        <CavitationAudio stressed={isStressed} weirCm={weirCm} />

        {savedFields.length > 0 && (
          <section className="rounded-3xl border border-[#dfe7df] bg-white p-5 shadow-xs">
            <h2 className="text-lg font-bold">Moje pola ({savedFields.length})</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {savedFields.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between rounded-xl border border-[#dfe7df] bg-[#f4f8f4] px-3 py-2 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => analyzeLocation(f.parcel.center[0], f.parcel.center[1], null, 15)}
                    className="text-left font-bold text-[#17694f] hover:underline"
                  >
                    Działka {f.parcel.number}
                    <span className="block text-xs font-normal text-[#52655d]">
                      {f.parcel.commune} · {f.parcel.areaHa.toFixed(2)} ha
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="Usuń pole"
                    onClick={() => setSavedFields((prev) => prev.filter((item) => item.id !== f.id))}
                    className="rounded-lg p-1.5 text-[#52655d] hover:bg-white hover:text-[#9b392b]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {imgw && (
          <section className="rounded-3xl border border-[#dfe7df] bg-white p-5 text-sm text-[#52655d] shadow-xs">
            <h2 className="text-base font-bold text-[#1c302a]">Komunikaty IMGW-PIB</h2>
            <p className="mt-1">
              {imgw.stationLabel} · Ostrzeżenia lokalne: {imgw.localWarnings.length} · Ostrzeżenia hydro w kraju:{" "}
              {imgw.hydroCount}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
export default App;
