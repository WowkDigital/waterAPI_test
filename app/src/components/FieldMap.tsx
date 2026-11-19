import { useEffect, useRef } from "react";
import L from "leaflet";
import type { LatLngTuple, PactStatus, ParcelData, SatelliteGrid, SatelliteMode, SavedField, TerrainSummary } from "../types";
import { computePixelStress, renderGridToDataUrl } from "../services/satellite";

interface FieldMapProps {
  center: LatLngTuple;
  zoom: number;
  parcel: ParcelData | null;
  terrain: TerrainSummary | null;
  savedFields: SavedField[];
  satGrid: SatelliteGrid | null;
  satMode: SatelliteMode;
  curtainPct: number;
  heatwaveSim: boolean;
  vpdMax: number | null;
  weirCm: number;
  pactStatus: PactStatus;
  onMapClick: (lat: number, lon: number) => void;
  onBoundsReady: (bounds: { south: number; west: number; north: number; east: number; zoom: number }) => void;
  onHoverPixel: (text: string) => void;
  onSelectSavedField: (field: SavedField) => void;
}

export function FieldMap({
  center,
  zoom,
  parcel,
  terrain,
  savedFields,
  satGrid,
  satMode,
  curtainPct,
  heatwaveSim,
  vpdMax,
  weirCm,
  pactStatus,
  onMapClick,
  onBoundsReady,
  onHoverPixel,
  onSelectSavedField,
}: FieldMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlaysRef = useRef<L.LayerGroup | null>(null);
  const fieldsRef = useRef<L.LayerGroup | null>(null);
  const satLayerRef = useRef<L.ImageOverlay | null>(null);
  const weirLayerRef = useRef<L.LayerGroup | null>(null);

  const callbacksRef = useRef({ onMapClick, onBoundsReady, onHoverPixel, onSelectSavedField });
  callbacksRef.current = { onMapClick, onBoundsReady, onHoverPixel, onSelectSavedField };

  const satDataRef = useRef({ satGrid, satMode, heatwaveSim, vpdMax });
  satDataRef.current = { satGrid, satMode, heatwaveSim, vpdMax };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    });
    const ortho = L.tileLayer.wms("https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution", {
      layers: "Raster",
      format: "image/png",
      maxZoom: 19,
      attribution: "GUGiK",
    });
    const hydro = L.tileLayer.wms("https://mapy.geoportal.gov.pl/wss/service/img/guest/HYDRO/MapServer/WMSServer", {
      layers: "0,1,2,3,4,5,6",
      format: "image/png",
      transparent: true,
      opacity: 0.75,
      attribution: "GUGiK",
    });

    const map = L.map(containerRef.current, { center, zoom, layers: [osm] });
    L.control.layers({ OpenStreetMap: osm, "Ortofotomapa Geoportalu": ortho }, { "Mapa hydrograficzna (rowy)": hydro }).addTo(map);

    overlaysRef.current = L.layerGroup().addTo(map);
    fieldsRef.current = L.layerGroup().addTo(map);
    weirLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const emitBounds = () => {
      const b = map.getBounds();
      callbacksRef.current.onBoundsReady({
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
        zoom: map.getZoom(),
      });
    };

    emitBounds();
    map.on("moveend", emitBounds);
    map.on("click", (e) => callbacksRef.current.onMapClick(e.latlng.lat, e.latlng.lng));
    map.on("mousemove", (e) => {
      const { satGrid: g, satMode: m, heatwaveSim: hw, vpdMax: vpd } = satDataRef.current;
      if (!g || m === "none") return;
      const { south, west, north, east } = g.bounds;
      if (e.latlng.lat < south || e.latlng.lat > north || e.latlng.lng < west || e.latlng.lng > east) {
        callbacksRef.current.onHoverPixel("Najedź na pobrany wycinek, aby odczytać stres roślin.");
        return;
      }
      const c = Math.min(g.cols - 1, Math.max(0, Math.floor(((e.latlng.lng - west) / (east - west)) * g.cols)));
      const r = Math.min(g.rows - 1, Math.max(0, Math.floor(((north - e.latlng.lat) / (north - south)) * g.rows)));
      const i = r * g.cols + c;
      if (g.cloud[i] || !Number.isFinite(g.ndvi[i])) {
        callbacksRef.current.onHoverPixel("Piksel zachmurzony lub poza maską danych.");
        return;
      }
      const effLst = Number.isFinite(g.lst[i]) ? g.lst[i] + (hw ? 14 : 0) : NaN;
      const stress = computePixelStress(g.ndvi[i], g.ndmi[i], effLst, vpd);
      callbacksRef.current.onHoverPixel(
        `Kursor · Temp: ${Number.isFinite(effLst) ? effLst.toFixed(1) + " °C" : "—"} · NDMI: ${g.ndmi[i].toFixed(2)} · NDVI: ${g.ndvi[i].toFixed(2)} · Stres: ${stress}/100`
      );
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView(center, zoom);
  }, [center[0], center[1], zoom]);

  useEffect(() => {
    const overlays = overlaysRef.current;
    if (!overlays) return;
    overlays.clearLayers();
    L.circleMarker(center, { radius: 6, color: "#fff", weight: 2, fillColor: "#11644c", fillOpacity: 1 }).addTo(overlays);
    if (parcel?.rings.length) {
      L.polygon(parcel.rings, { color: "#428440", weight: 2.5, fillOpacity: 0.2 }).addTo(overlays);
    }
    if (terrain && terrain.deltaM > 0.1) {
      L.polyline([terrain.highest.point, terrain.lowest.point], {
        color: "#247b95",
        weight: 3,
        dashArray: "6,6",
      })
        .bindTooltip(`Spływ · ${terrain.slopePct.toFixed(1)}%`)
        .addTo(overlays);
      L.circleMarker(terrain.lowest.point, { radius: 5, color: "#247b95", fillOpacity: 1 })
        .bindTooltip(`Najniższy punkt (zastawka): ${terrain.lowest.elevationM.toFixed(1)} m n.p.m.`)
        .addTo(overlays);
    }
  }, [center, parcel, terrain]);

  useEffect(() => {
    const layer = fieldsRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const field of savedFields) {
      L.polygon(field.parcel.rings, {
        color: "#286d58",
        weight: 2,
        dashArray: "4 4",
        fillOpacity: 0.08,
      })
        .bindTooltip(`Działka ${field.parcel.number} (${field.parcel.areaHa.toFixed(2)} ha)`)
        .on("click", () => callbacksRef.current.onSelectSavedField(field))
        .addTo(layer);
    }
  }, [savedFields]);

  // Warstwa podsiąku kapilarnego wokół zastawki + złoty status Paktu Sąsiedzkiego
  useEffect(() => {
    const weirLayer = weirLayerRef.current;
    if (!weirLayer) return;
    weirLayer.clearLayers();
    if (weirCm <= 0) return;

    const anchor = terrain?.lowest.point ?? center;
    const radiusM = 8 + weirCm * 1.15;
    const isPactActive = pactStatus === "signed";

    L.circle(anchor, {
      radius: radiusM,
      color: isPactActive ? "#d4a017" : "#2563eb",
      weight: isPactActive ? 2.5 : 1.5,
      fillColor: isPactActive ? "#facc15" : "#38bdf8",
      fillOpacity: 0.22 + (weirCm / 40) * 0.22,
      interactive: false,
    }).addTo(weirLayer);

    L.circleMarker(anchor, {
      radius: 6,
      color: "#fff",
      weight: 2,
      fillColor: isPactActive ? "#ca8a04" : "#0284c7",
      fillOpacity: 1,
    })
      .bindTooltip(
        isPactActive
          ? `Pakt Aktywny · Zastawka ${weirCm} cm (podsiąk ~${Math.round(radiusM)} m)`
          : `Zastawka ${weirCm} cm · Podsiąk ~${Math.round(radiusM)} m`
      )
      .addTo(weirLayer);
  }, [weirCm, pactStatus, terrain, center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (satLayerRef.current) {
      map.removeLayer(satLayerRef.current);
      satLayerRef.current = null;
    }
    if (!satGrid || satMode === "none") return;

    const dataUrl = renderGridToDataUrl(satGrid, satMode, heatwaveSim, vpdMax);
    const lBounds = L.latLngBounds(
      [satGrid.bounds.south, satGrid.bounds.west],
      [satGrid.bounds.north, satGrid.bounds.east]
    );
    const overlay = L.imageOverlay(dataUrl, lBounds, { opacity: 0.85, interactive: false, zIndex: 450 }).addTo(map);
    satLayerRef.current = overlay;
    const el = overlay.getElement();
    if (el) el.style.clipPath = `inset(0 0 0 ${100 - curtainPct}%)`;
  }, [satGrid, satMode, heatwaveSim, vpdMax]);

  useEffect(() => {
    const el = satLayerRef.current?.getElement();
    if (el) el.style.clipPath = `inset(0 0 0 ${100 - curtainPct}%)`;
  }, [curtainPct]);

  const showDivider = Boolean(satGrid && satMode !== "none" && curtainPct > 0 && curtainPct < 100);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d7e4d8]">
      <div ref={containerRef} className="h-[360px] w-full" />
      {showDivider && (
        <div
          className="pointer-events-none absolute inset-y-0 z-[650] w-0.5 bg-white shadow-[0_0_0_1px_rgba(21,56,46,0.5)]"
          style={{ left: `${100 - curtainPct}%` }}
        >
          <span className="absolute top-1/2 left-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#15382e] text-xs font-bold text-white shadow">
            ⇄
          </span>
        </div>
      )}
    </div>
  );
}
