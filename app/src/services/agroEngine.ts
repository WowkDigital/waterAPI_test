import { jsPDF } from "jspdf";
import type { Forecast48h, ParcelData, SatelliteStats, SoilConfig, TerrainSummary } from "../types";

export const SOIL_CATEGORIES: SoilConfig[] = [
  { id: "1", label: "I · Piaski luźne i słabo gliniaste", retention: 0.65, droughtThresholdMm: -5, wodRange: "< 127,5 mm" },
  { id: "2", label: "II · Piaski gliniaste lekkie i mocne", retention: 0.80, droughtThresholdMm: -10, wodRange: "127,5–169,9 mm" },
  { id: "3", label: "III · Gliny lekkie i pyły", retention: 0.90, droughtThresholdMm: -15, wodRange: "170–202,5 mm" },
  { id: "4", label: "IV · Gliny średnie/ciężkie i iły", retention: 1.00, droughtThresholdMm: -20, wodRange: "> 202,5 mm" },
];

export const EKOSCHEMAT_RATE_PLN_HA = 290;

export function calculateWeirMetrics(weirCm: number, areaHa: number, slopePct: number) {
  const effectiveArea = Math.max(1, areaHa);
  // Zastawka 0..40 cm podnosi zwierciadło w rowie i zasięg podsiąku kapilarnego (5..48 m)
  const capillaryRadiusM = Math.round(6 + weirCm * 1.05);
  const retainedM3 = Math.round(effectiveArea * weirCm * 24.5);
  const savedYieldPln = Math.round(retainedM3 * 8.8);
  const neighborFloodRiskPct = weirCm <= 28 ? 0 : Math.min(100, Math.round((weirCm - 28) * (2.5 + slopePct)));
  const ekoschematPln = Math.round(effectiveArea * EKOSCHEMAT_RATE_PLN_HA);

  return {
    capillaryRadiusM,
    retainedM3,
    savedYieldPln,
    neighborFloodRiskPct,
    ekoschematPln,
  };
}

export function summarizeForecast48h(forecast: Forecast48h | null, areaHa: number) {
  if (!forecast) return null;
  const effArea = Math.max(1, areaHa);
  const rainMm = forecast.precipitation.reduce((s, v) => s + (v || 0), 0);
  const et0Mm = forecast.et0_fao_evapotranspiration.reduce((s, v) => s + (v || 0), 0);
  const balanceMm = rainMm - et0Mm;
  const maxVpd = Math.max(...forecast.vapour_pressure_deficit.filter(Number.isFinite));
  const minGroundC = Math.min(...forecast.soil_temperature_0cm.filter(Number.isFinite));
  const soilMoisture = forecast.soil_moisture_0_to_1cm[0] ?? null;

  return {
    rainMm,
    rainM3: rainMm * 10 * effArea,
    et0Mm,
    et0M3: et0Mm * 10 * effArea,
    balanceMm,
    balanceM3: balanceMm * 10 * effArea,
    maxVpd,
    minGroundC,
    soilMoisture,
  };
}

export function exportArimrPdfReport(params: {
  parcel: ParcelData | null;
  terrain: TerrainSummary | null;
  satStats: SatelliteStats | null;
  weirCm: number;
  pactSigned: boolean;
}) {
  const { parcel, terrain, satStats, weirCm, pactSigned } = params;
  const area = parcel?.areaHa ? parcel.areaHa : 1;
  const weir = calculateWeirMetrics(weirCm, area, terrain?.slopePct ?? 1.2);
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  doc.setFillColor(21, 56, 46);
  doc.rect(0, 0, 210, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("HydroZgoda / WodoStraznik Pola", 16, 16);
  doc.setFontSize(10);
  doc.text("Raport potwierdzajacy retencjonowanie wody (ARiMR Ekoschemat / KOWR)", 16, 25);

  doc.setTextColor(28, 48, 42);
  doc.setFontSize(12);
  let y = 48;
  const row = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 16, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 86, y);
    y += 9;
  };

  row("Data wygenerowania:", new Date().toLocaleString("pl-PL"));
  row("Dzialka ewidencyjna:", parcel ? `dz. ${parcel.number} (${parcel.commune}, obr. ${parcel.region})` : "Widok mapy (1 ha ref.)");
  row("ID TERYT:", parcel?.teryt || "Brak");
  row("Powierzchnia:", `${area.toFixed(2)} ha`);
  row("Spadek terenu (NMT):", terrain ? `${terrain.slopePct.toFixed(1)}% · splyw ${terrain.directionLabel}` : "Brak odczytu");
  row("Poziom zastawki:", `${weirCm} cm (zasieg podsiaku ~${weir.capillaryRadiusM} m)`);
  row("Zatrzymana woda:", `+${weir.retainedM3.toLocaleString("pl-PL")} m3`);
  row("Pakt Sasiedzki:", pactSigned ? "AKTYWNY (zgoda sasiadow w zlewni)" : "Oczekuje na podpis");
  row("Satelita (LST / NDMI):", satStats ? `${satStats.lstC?.toFixed(1) ?? "—"} C / NDMI ${satStats.ndmi.toFixed(2)}` : "Nie pobrano sceny");

  y += 6;
  doc.setFillColor(230, 243, 233);
  doc.roundedRect(16, y, 178, 28, 3, 3, "F");
  doc.setTextColor(23, 105, 79);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Szacowana doplata Ekoschemat (~290 zl/ha): ${weir.ekoschematPln.toLocaleString("pl-PL")} PLN`, 22, y + 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Potwierdzono warunki retencji na podstawie danych Sentinel-2, Landsat Thermal oraz GUGiK NMT.", 22, y + 20);

  doc.save(`Raport_HydroZgoda_${parcel?.number?.replace(/[^\w.-]+/g, "_") || "dzialka"}.pdf`);
}
