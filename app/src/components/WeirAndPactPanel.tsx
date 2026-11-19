import { FileText, Handshake, ShieldCheck, Waves } from "lucide-react";
import type { PactStatus, ParcelData, SatelliteStats, TerrainSummary } from "../types";
import { calculateWeirMetrics, exportArimrPdfReport } from "../services/agroEngine";

interface WeirAndPactPanelProps {
  weirCm: number;
  pactStatus: PactStatus;
  parcel: ParcelData | null;
  terrain: TerrainSummary | null;
  satStats: SatelliteStats | null;
  onWeirChange: (cm: number) => void;
  onPactStatusChange: (status: PactStatus) => void;
}

export function WeirAndPactPanel({
  weirCm,
  pactStatus,
  parcel,
  terrain,
  satStats,
  onWeirChange,
  onPactStatusChange,
}: WeirAndPactPanelProps) {
  const area = parcel?.areaHa ? parcel.areaHa : 4.5;
  const slope = terrain?.slopePct ?? 1.4;
  const metrics = calculateWeirMetrics(weirCm, area, slope);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-3xl border border-[#dfe7df] bg-white p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <Waves className="h-5 w-5 text-[#247b95]" />
              Symulator Podsiąku Zastawki
            </h2>
            <p className="mt-1 text-sm text-[#52655d]">
              Przesuń poziom piętrzenia na zastawce Z-2, aby zobaczyć zasięg podsiąku kapilarnego na mapie i oszczędność wody.
            </p>
          </div>
          <span className="rounded-lg bg-[#e8f4ea] px-2.5 py-1 text-xs font-bold text-[#17694f] tabular-nums">
            {weirCm} cm
          </span>
        </div>

        <div className="mt-4 rounded-2xl border border-[#dfe7df] bg-[#f4f8f4] p-4">
          <div className="flex justify-between text-xs font-bold text-[#52655d]">
            <span>Otwarta (0 cm)</span>
            <span>Poziom zastawki Z-2: {weirCm} cm</span>
            <span>Maks. (40 cm)</span>
          </div>
          <input
            type="range"
            min={0}
            max={40}
            value={weirCm}
            onChange={(e) => onWeirChange(Number(e.target.value))}
            className="mt-2 w-full accent-[#17694f]"
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-[#dfe7df] bg-[#f4f8f4] p-3">
            <div className="text-xs font-bold text-[#52655d]">💧 Zatrzymana woda</div>
            <div className="mt-1 text-lg font-bold text-[#17694f] tabular-nums">
              +{metrics.retainedM3.toLocaleString("pl-PL")} m³
            </div>
            <div className="text-[11px] text-[#52655d]">Podsiąk ~{metrics.capillaryRadiusM} m</div>
          </div>
          <div className="rounded-2xl border border-[#dfe7df] bg-[#f4f8f4] p-3">
            <div className="text-xs font-bold text-[#52655d]">🌾 Uratowany plon</div>
            <div className="mt-1 text-lg font-bold tabular-nums">
              +{metrics.savedYieldPln.toLocaleString("pl-PL")} zł
            </div>
            <div className="text-[11px] text-[#52655d]">Dla {area.toFixed(1)} ha</div>
          </div>
          <div className="rounded-2xl border border-[#dfe7df] bg-[#f4f8f4] p-3">
            <div className="text-xs font-bold text-[#52655d]">🛡️ Ryzyko zalania</div>
            <div
              className={`mt-1 text-lg font-bold tabular-nums ${
                metrics.neighborFloodRiskPct > 0 ? "text-[#9b392b]" : "text-[#17694f]"
              }`}
            >
              {metrics.neighborFloodRiskPct}%
            </div>
            <div className="text-[11px] text-[#52655d]">
              {metrics.neighborFloodRiskPct === 0 ? "Strefa bezpieczna" : "Obniż poniżej 28 cm"}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            exportArimrPdfReport({
              parcel,
              terrain,
              satStats,
              weirCm,
              pactSigned: pactStatus === "signed",
            })
          }
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#17694f] bg-[#e6f3e9] px-4 py-2.5 text-sm font-bold text-[#17694f] transition hover:bg-[#d5ebd9]"
        >
          <FileText className="h-4 w-4" />
          Generuj Raport PDF dla ARiMR / KOWR (~{metrics.ekoschematPln.toLocaleString("pl-PL")} zł dopłaty)
        </button>
      </section>

      <section className="rounded-3xl border border-[#dfe7df] bg-white p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <Handshake className="h-5 w-5 text-[#17694f]" />
              Pakt Sąsiedzki (Zgoda na Zastawkę)
            </h2>
            <p className="mt-1 text-sm text-[#52655d]">
              Koordynacja między rolnikami w tej samej mikrozlewni na podstawie rzeźby LiDAR NMT.
            </p>
          </div>
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
              pactStatus === "signed"
                ? "bg-[#fef9c3] text-[#854d0e]"
                : pactStatus === "proposed"
                ? "bg-[#fff0d6] text-[#875100]"
                : "bg-[#edf2ef] text-[#52655d]"
            }`}
          >
            {pactStatus === "signed"
              ? "🤝 Pakt Aktywny"
              : pactStatus === "proposed"
              ? "⏳ Oczekuje na sąsiada"
              : "Gotowy do propozycji"}
          </span>
        </div>

        <div className="mt-4 rounded-2xl border border-[#dfe7df] bg-[#f4f8f4] p-4 text-sm">
          <div className="flex items-center gap-2 font-bold text-[#1c302a]">
            <ShieldCheck className="h-4 w-4 text-[#17694f]" />
            Symulacja powiadomienia Push dla sąsiada (działka poniżej):
          </div>
          <p className="mt-2 rounded-xl border border-[#dfe7df] bg-white p-3 text-xs leading-relaxed text-[#52655d]">
            „Sąsiad proponuje zamknięcie zastawki Z-2 na <strong>{weirCm} cm</strong> przez 7 dni. Twój zysk: darmowy podsiąk
            wody na <strong>{metrics.capillaryRadiusM} m</strong> w głąb pola. Ryzyko podtopienia wg NMT:{" "}
            <strong>{metrics.neighborFloodRiskPct}%</strong>.”
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => onPactStatusChange("proposed")}
            disabled={weirCm === 0}
            className="flex-1 rounded-xl border border-[#dfe7df] bg-white px-4 py-2.5 text-sm font-bold text-[#1c302a] hover:bg-[#f4f8f4] disabled:opacity-50"
          >
            1. Zaproponuj retencję (7 dni)
          </button>
          <button
            type="button"
            onClick={() => onPactStatusChange(pactStatus === "signed" ? "idle" : "signed")}
            disabled={weirCm === 0}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-50 ${
              pactStatus === "signed" ? "bg-[#ca8a04] hover:bg-[#a16207]" : "bg-[#17694f] hover:bg-[#135640]"
            }`}
          >
            {pactStatus === "signed" ? "Zakończ Pakt Wodny" : "2. 🤝 Podpisuję Pakt (Sąsiad)"}
          </button>
        </div>
      </section>
    </div>
  );
}
