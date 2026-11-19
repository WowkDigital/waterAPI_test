import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface CavitationAudioProps {
  stressed: boolean;
  weirCm: number;
}

export function CavitationAudio({ stressed, weirCm }: CavitationAudioProps) {
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  // Gdy zastawka piętrzy wodę >= 15 cm, stres kawitacji spada
  const droughtMode = stressed && weirCm < 15;
  const clicksPerHour = droughtMode ? 45 : 4;

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    const triggerClick = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(droughtMode ? 2400 + Math.random() * 900 : 1200, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.025);
      gain.gain.setValueAtTime(droughtMode ? 0.14 : 0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);

      const canvas = canvasRef.current;
      if (canvas) {
        const c2d = canvas.getContext("2d");
        if (c2d) {
          c2d.fillStyle = droughtMode ? "#dc2626" : "#17694f";
          const x = Math.random() * (canvas.width - 4);
          const h = droughtMode ? canvas.height * 0.8 : canvas.height * 0.32;
          c2d.fillRect(x, canvas.height - h, 3, h);
        }
      }
    };

    const intervalMs = droughtMode ? 220 : 1900;
    timerRef.current = window.setInterval(triggerClick, intervalMs);

    const fadeTimer = window.setInterval(() => {
      const canvas = canvasRef.current;
      const c2d = canvas?.getContext("2d");
      if (canvas && c2d) {
        c2d.fillStyle = "rgba(24, 45, 38, 0.25)";
        c2d.fillRect(0, 0, canvas.width, canvas.height);
      }
    }, 90);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      window.clearInterval(fadeTimer);
    };
  }, [playing, droughtMode]);

  return (
    <section className="rounded-3xl border border-[#dfe7df] bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">
            Dźwięk Pragnienia · Akustyczny Puls Uprawy (Web Audio DSP)
          </h2>
          <p className="mt-0.5 text-xs text-[#52655d]">
            Synteza kliknięć kawitacji ksylemu (inspiracja badaniami z Tel Awiwu):{" "}
            {droughtMode ? (
              <strong className="text-[#9b392b]">
                {clicksPerHour} mikro-trzasków/h — roślina cierpi na głębokie podciśnienie w naczyniach!
              </strong>
            ) : (
              <strong className="text-[#17694f]">
                {clicksPerHour} trzaski/h — naczynia napełnione wodą dzięki retencji, stan optymalny.
              </strong>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
            playing ? "bg-[#9b392b] text-white" : "border border-[#dfe7df] bg-[#f4f8f4] text-[#1c302a] hover:bg-[#e6f3e9]"
          }`}
        >
          {playing ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {playing ? "Zatrzymaj odsłuch" : "Posłuchaj pulsu rośliny"}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={680}
        height={46}
        className="mt-3 h-12 w-full rounded-xl bg-[#182d26]"
      />
    </section>
  );
}
