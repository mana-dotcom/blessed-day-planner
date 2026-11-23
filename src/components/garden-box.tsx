import { useEffect, useState } from "react";
import { useStore, progress } from "@/lib/store";

type Stop = [hour: number, top: string, bottom: string];
const SKY: Stop[] = [
  [0, "#0b1030", "#2a2350"],
  [5, "#1d1b4a", "#5a3d6e"],
  [6.5, "#f3a0b8", "#ffd6a5"],
  [9, "#9ccbff", "#ffe4ef"],
  [13, "#7ab8ff", "#d8ecff"],
  [17, "#ff9eb5", "#ffd0a0"],
  [19, "#c86b98", "#ff9e7a"],
  [20.5, "#3b2a6b", "#7a4a8a"],
  [24, "#0b1030", "#2a2350"],
];
const SUNRISE = 6;
const SUNSET = 19.5;

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function mix(a: string, b: string, t: number) {
  const [x, y] = [hex(a), hex(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i]! - v) * t)).join(",")})`;
}
function skyAt(h: number) {
  const i = SKY.findIndex(([hr]) => hr > h);
  const [h0, t0, b0] = SKY[i - 1]!;
  const [h1, t1, b1] = SKY[i]!;
  const t = (h - h0) / (h1 - h0);
  return { top: mix(t0, t1, t), bottom: mix(b0, b1, t) };
}

function celestial(h: number) {
  const day = h >= SUNRISE && h < SUNSET;
  const span = day ? SUNSET - SUNRISE : 24 - (SUNSET - SUNRISE);
  const elapsed = day ? h - SUNRISE : (h - SUNSET + 24) % 24;
  const t = elapsed / span;
  return { day, x: 12 + t * 136, y: 60 - Math.sin(Math.PI * t) * 46 };
}

export const STAGES = ["Graine", "Pousse", "Tige", "Bouton", "Éclosion", "Pleine floraison"];
export function stageFor(p: number) {
  if (p >= 100) return 5;
  if (p >= 70) return 4;
  if (p >= 45) return 3;
  if (p >= 20) return 2;
  if (p > 0) return 1;
  return 0;
}

function timeLabel(h: number) {
  if (h >= 5 && h < 7.5) return "Aube";
  if (h >= 7.5 && h < 17) return "Journée";
  if (h >= 17 && h < 20.5) return "Coucher du soleil";
  return "Nuit";
}

const Px = ({ x, y, w = 1, h = 1, c }: { x: number; y: number; w?: number; h?: number; c: string }) => (
  <rect x={x} y={y} width={w} height={h} fill={c} />
);

function Sun({ x, y }: { x: number; y: number }) {
  const cx = Math.round(x), cy = Math.round(y);
  return (
    <g>
      <Px x={cx - 6} y={cy - 6} w={12} h={12} c="#ffe08a" />
      <Px x={cx - 4} y={cy - 8} w={8} h={16} c="#ffd166" />
      <Px x={cx - 8} y={cy - 4} w={16} h={8} c="#ffd166" />
      <Px x={cx - 5} y={cy - 5} w={10} h={10} c="#fff1b8" />
    </g>
  );
}

function MoonPx({ x, y }: { x: number; y: number }) {
  const cx = Math.round(x), cy = Math.round(y);
  return (
    <g>
      <Px x={cx - 3} y={cy - 5} w={6} h={10} c="#f4f1ff" />
      <Px x={cx - 5} y={cy - 3} w={10} h={6} c="#f4f1ff" />
      <Px x={cx - 1} y={cy - 5} w={6} h={8} c="var(--garden-night, #1d1b4a)" />
      <Px x={cx - 2} y={cy + 1} w={1} h={1} c="#d9d3f5" />
    </g>
  );
}

const STARS = [[14, 10], [30, 22], [48, 8], [66, 18], [92, 6], [110, 20], [128, 10], [146, 26], [22, 34], [138, 38], [76, 30]];

function BlossomTree({ x, flip }: { x: number; flip?: boolean }) {
  const s = flip ? -1 : 1;
  const blooms: [number, number, number, number, string][] = [
    [-12, -26, 18, 10, "#f7a6c4"], [-16, -20, 26, 10, "#f48fb1"], [-10, -32, 14, 8, "#fbc4da"],
    [-4, -24, 16, 12, "#f9b4cf"], [-18, -16, 12, 6, "#ec7ba6"], [2, -18, 12, 6, "#f48fb1"],
  ];
  return (
    <g transform={`translate(${x} 74) scale(${s} 1)`}>
      <Px x={-2} y={-16} w={4} h={16} c="#6b3f3a" />
      <Px x={-6} y={-18} w={4} h={3} c="#6b3f3a" />
      <Px x={2} y={-14} w={4} h={2} c="#6b3f3a" />
      {blooms.map(([bx, by, w, h, c], i) => <Px key={i} x={bx} y={by} w={w} h={h} c={c} />)}
      <Px x={-8} y={-28} w={2} h={2} c="#fff0f6" />
      <Px x={4} y={-22} w={2} h={2} c="#fff0f6" />
    </g>
  );
}

function Flower({ stage }: { stage: number }) {
  const stem = "#4f9d5d", leaf = "#6cc070", petal = "#ff7eb0", petalLight = "#ffb3d1", core = "#ffd166";
  const stemTop = [74, 71, 65, 60, 58, 56][stage]!;
  return (
    <g transform="translate(80 76) scale(1.7) translate(-80 -76)">
      <Px x={75} y={74} w={10} h={2} c="#8a5a44" />
      <Px x={77} y={73} w={6} h={1} c="#8a5a44" />
      {stage === 0 && <Px x={79} y={72} w={2} h={1} c="#c9a27a" />}
      {stage >= 1 && <Px x={80} y={stemTop} w={1} h={73 - stemTop} c={stem} />}
      {stage === 1 && <><Px x={78} y={71} w={2} h={1} c={leaf} /><Px x={81} y={70} w={2} h={1} c={leaf} /></>}
      {stage >= 2 && <><Px x={77} y={69} w={3} h={1} c={leaf} /><Px x={78} y={68} w={2} h={1} c={leaf} /><Px x={81} y={66} w={3} h={1} c={leaf} /><Px x={81} y={65} w={2} h={1} c={leaf} /></>}
      {stage === 3 && <><Px x={79} y={57} w={3} h={3} c={leaf} /><Px x={80} y={56} w={1} h={2} c={petal} /></>}
      {stage === 4 && (
        <>
          <Px x={79} y={53} w={3} h={1} c={petal} /><Px x={78} y={54} w={5} h={3} c={petal} />
          <Px x={79} y={55} w={3} h={1} c={petalLight} /><Px x={80} y={55} w={1} h={1} c={core} />
          <Px x={79} y={57} w={3} h={1} c={leaf} />
        </>
      )}
      {stage === 5 && (
        <>
          <Px x={79} y={48} w={3} h={2} c={petal} /><Px x={79} y={55} w={3} h={2} c={petal} />
          <Px x={75} y={51} w={2} h={3} c={petal} /><Px x={84} y={51} w={2} h={3} c={petal} />
          <Px x={77} y={49} w={2} h={2} c={petalLight} /><Px x={82} y={49} w={2} h={2} c={petalLight} />
          <Px x={77} y={54} w={2} h={2} c={petalLight} /><Px x={82} y={54} w={2} h={2} c={petalLight} />
          <Px x={77} y={50} w={7} h={5} c={petal} />
          <Px x={79} y={51} w={3} h={3} c={core} /><Px x={80} y={51} w={1} h={1} c="#fff3c4" />
          <Px x={72} y={47} w={1} h={1} c="#fff6a8" />
          <Px x={88} y={50} w={1} h={1} c="#fff6a8" />
          <Px x={86} y={45} w={1} h={1} c="#fff6a8" />
        </>
      )}
    </g>
  );
}

export function GardenBox() {
  const [s, ready] = useStore();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hour = now ? now.getHours() + now.getMinutes() / 60 : 12;
  const sky = skyAt(hour);
  const body = celestial(hour);
  const p = ready ? progress(s) : 0;
  const stage = stageFor(p);
  const nightness = body.day ? Math.max(0, 1 - Math.min(hour - SUNRISE, SUNSET - hour) / 1.2) : 1;
  const time = now?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) ?? "--:--";

  return (
    <section className="overflow-hidden rounded-3xl border-4 border-primary/80 shadow-[0_6px_0_0_var(--primary)]" aria-labelledby="garden-title">
      <svg
        viewBox="0 0 160 90"
        className="block h-auto w-full"
        shapeRendering="crispEdges"
        role="img"
        aria-label={`Jardin : ${timeLabel(hour)}, ${body.day ? "soleil" : "lune"} dans le ciel. Fleur au stade ${STAGES[stage]} (${p}% de la journée).`}
        style={{ ["--garden-night" as string]: sky.top }}
      >
        <defs>
          <linearGradient id="garden-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={sky.top} style={{ transition: "stop-color 2s" }} />
            <stop offset="1" stopColor={sky.bottom} style={{ transition: "stop-color 2s" }} />
          </linearGradient>
        </defs>
        <rect width="160" height="90" fill="url(#garden-sky)" />

        <g opacity={nightness * (body.day ? 0.4 : 1)}>
          {STARS.map(([x, y], i) => <Px key={i} x={x!} y={y!} c="#fff7d6" />)}
        </g>

        {body.day ? <Sun x={body.x} y={body.y} /> : <MoonPx x={body.x} y={body.y} />}

        <g opacity={body.day ? 0.85 : 0.35}>
          <Px x={20} y={20} w={14} h={3} c="#ffffff" /><Px x={24} y={17} w={7} h={3} c="#ffffff" />
          <Px x={112} y={28} w={18} h={3} c="#ffffff" /><Px x={117} y={25} w={8} h={3} c="#ffffff" />
        </g>

        <Px x={0} y={58} w={40} h={16} c={body.day ? "#c58bb7" : "#4a3a6e"} />
        <Px x={8} y={54} w={24} h={4} c={body.day ? "#c58bb7" : "#4a3a6e"} />
        <Px x={100} y={56} w={60} h={18} c={body.day ? "#d49bc0" : "#54427a"} />
        <Px x={112} y={52} w={36} h={4} c={body.day ? "#d49bc0" : "#54427a"} />
        <Px x={36} y={62} w={70} h={12} c={body.day ? "#e3aac9" : "#5d4a84"} />

        <BlossomTree x={22} />
        <BlossomTree x={140} flip />

        <Px x={0} y={74} w={160} h={16} c={body.day ? "#7cc47f" : "#3f6e55"} />
        <Px x={0} y={74} w={160} h={2} c={body.day ? "#9bd88f" : "#4f8566"} />
        {[6, 18, 34, 50, 102, 118, 132, 150].map((x) => <Px key={x} x={x} y={80 + (x % 3) * 2} w={2} h={1} c={body.day ? "#5ea865" : "#2f5642"} />)}
        {[12, 44, 112, 146].map((x) => <Px key={x} x={x} y={78} w={2} h={2} c="#ffc2dc" />)}

        <Flower stage={stage} />

        <g className="garden-petals" aria-hidden="true">
          <Px x={30} y={30} w={2} h={1} c="#ffc2dc" />
          <Px x={132} y={34} w={2} h={1} c="#ffc2dc" />
          <Px x={60} y={20} w={1} h={1} c="#ffc2dc" />
        </g>
      </svg>

      <div className="flex items-center justify-between gap-3 bg-primary px-4 py-3 text-primary-foreground">
        <div>
          <p id="garden-title" className="font-mono text-xs uppercase tracking-widest">{timeLabel(hour)} · {time}</p>
          <p className="font-display text-lg leading-tight">{STAGES[stage]}</p>
        </div>
        <div className="text-right">
          <div className="flex gap-1" aria-hidden="true">
            {STAGES.slice(1).map((_, i) => (
              <span key={i} className={`h-3 w-3 ${i < stage ? "bg-accent-strong" : "bg-primary-foreground/25"}`} />
            ))}
          </div>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-primary-foreground/80">
            {ready ? s.garden.blooms : 0} fleur{(ready ? s.garden.blooms : 0) > 1 ? "s" : ""} écloses
          </p>
        </div>
      </div>
    </section>
  );
}
