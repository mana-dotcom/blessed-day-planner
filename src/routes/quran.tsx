import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Bookmark, BookmarkCheck, Check } from "lucide-react";
import { Page, Card } from "@/components/ui-kit";
import { quran, audioUrl, stepSurah, wirdDoneToday } from "@/lib/quran";
import { dayKey } from "@/lib/store";

export const Route = createFileRoute("/quran")({
  head: () => ({ meta: [
    { title: "Quran Space — Blessings" },
    { name: "description", content: "Lis le Coran en arabe, écoute la récitation de Mishary Alafasy et suis ton wird quotidien." },
    { property: "og:title", content: "Quran Space" },
    { property: "og:description", content: "Lecture, audio et wird quotidien dans un espace doux." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: QuranPage,
});

type SurahMeta = { number: number; name: string; englishName: string; numberOfAyahs: number };
type Ayah = { numberInSurah: number; text: string };

function QuranPage() {
  const [s, ready] = quran.use();
  const [list, setList] = useState<SurahMeta[]>([]);
  const [surah, setSurah] = useState(1);
  const [ayahs, setAyahs] = useState<Ayah[] | null>(null);
  const [err, setErr] = useState(false);
  const jumped = useRef(false);

  useEffect(() => {
    fetch("https://api.alquran.cloud/v1/surah").then((r) => r.json()).then((j) => setList(j.data)).catch(() => setErr(true));
  }, []);
  useEffect(() => { if (ready && s.bookmark && !jumped.current) setSurah(s.bookmark.surah); }, [ready]);
  useEffect(() => {
    setAyahs(null); setErr(false);
    fetch(`https://api.alquran.cloud/v1/surah/${surah}/quran-uthmani`).then((r) => r.json()).then((j) => setAyahs(j.data.ayahs)).catch(() => setErr(true));
  }, [surah]);
  useEffect(() => {
    if (!ayahs || jumped.current || !s.bookmark || s.bookmark.surah !== surah) return;
    jumped.current = true;
    setTimeout(() => document.getElementById(`ayah-${s.bookmark!.ayah}`)?.scrollIntoView({ block: "center" }), 50);
  }, [ayahs]);

  const meta = list.find((x) => x.number === surah);
  const isFriday = new Date().getDay() === 5;

  return (
    <Page eyebrow="Quran" title="Quran Space." subtitle="Un moment de paix avec la Parole d'Allah.">
      <Player surah={surah} setSurah={setSurah} name={meta ? `${meta.englishName} · ${meta.name}` : `Sourate ${surah}`} badge={isFriday ? "Friday · Al-Kahf" : "Daily Wird"} />
      <Wird />
      <Card title="Lecture" right={s.bookmark && <button onClick={() => { jumped.current = false; setSurah(s.bookmark!.surah); }} className="eyebrow underline">Reprendre {s.bookmark.surah}:{s.bookmark.ayah}</button>}>
        <select value={surah} onChange={(e) => setSurah(Number(e.target.value))} className="w-full rounded-full border border-border bg-card px-4 py-2.5">
          {(list.length ? list : Array.from({ length: 114 }, (_, i) => ({ number: i + 1, name: "", englishName: `Sourate ${i + 1}`, numberOfAyahs: 0 }))).map((x) => (
            <option key={x.number} value={x.number}>{x.number}. {x.englishName} {x.name}</option>
          ))}
        </select>
        {err && <p className="mt-4 font-serif italic text-destructive">Impossible de charger le texte. Vérifie ta connexion.</p>}
        {!ayahs && !err && <p className="mt-4 font-serif italic text-muted-foreground">Chargement…</p>}
        {ayahs && (
          <div dir="rtl" lang="ar" className="mt-5 space-y-3">
            {ayahs.map((a) => {
              const marked = s.bookmark?.surah === surah && s.bookmark.ayah === a.numberInSurah;
              return (
                <div key={a.numberInSurah} id={`ayah-${a.numberInSurah}`} className={`rounded-2xl px-4 py-3 ${marked ? "bg-secondary" : "bg-card/70"}`}>
                  <p className="font-quran text-3xl leading-[2.4] text-foreground">
                    {a.text} <span className="mx-1 inline-grid h-8 min-w-8 place-items-center rounded-full border border-accent-strong px-1 font-sans text-xs text-accent-strong">{a.numberInSurah}</span>
                  </p>
                  <button dir="ltr" onClick={() => quran.update((st) => ({ ...st, bookmark: { surah, ayah: a.numberInSurah } }))} aria-label="Marquer ici"
                    className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-accent-strong">
                    {marked ? <BookmarkCheck className="h-4 w-4 text-accent-strong" /> : <Bookmark className="h-4 w-4" />}{marked ? "Marque-page" : "Marquer ici"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </Page>
  );
}

function Player({ surah, setSurah, name, badge }: { surah: number; setSurah: (n: number) => void; name: string; badge: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [t, setT] = useState({ cur: 0, dur: 0 });
  const wantPlay = useRef(false);

  useEffect(() => { if (wantPlay.current) void audio.current?.play().catch(() => {}); }, [surah]);
  const go = (dir: 1 | -1) => { wantPlay.current = playing; setSurah(shuffle ? Math.floor(Math.random() * 114) + 1 : stepSurah(surah, dir)); };
  const fmt = (x: number) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;

  return (
    <section className="hero-card rounded-3xl p-6 text-primary-foreground">
      <span className="rounded-full bg-primary-foreground/20 px-3 py-1 text-[10px] uppercase tracking-widest">{badge}</span>
      <p className="mt-3 font-planner text-3xl leading-tight">{name}</p>
      <p className="font-serif italic opacity-80">Mishary Rashid Alafasy</p>
      <audio ref={audio} src={audioUrl(surah)} preload="none" loop={repeat}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setT({ cur: e.currentTarget.currentTime, dur: e.currentTarget.duration || 0 })}
        onEnded={() => { if (!repeat) { wantPlay.current = true; setSurah(shuffle ? Math.floor(Math.random() * 114) + 1 : stepSurah(surah, 1)); } }} />
      <input type="range" min={0} max={t.dur || 1} step={1} value={t.cur} aria-label="Progression"
        onChange={(e) => { if (audio.current) audio.current.currentTime = Number(e.target.value); }}
        className="mt-5 w-full accent-[var(--primary-foreground)]" />
      <div className="flex justify-between text-xs opacity-80"><span>{fmt(t.cur)}</span><span>{fmt(t.dur)}</span></div>
      <div className="mt-3 flex items-center justify-between">
        <button aria-label="Aléatoire" onClick={() => setShuffle(!shuffle)} className={shuffle ? "" : "opacity-50"}><Shuffle className="h-5 w-5" /></button>
        <button aria-label="Précédente" onClick={() => go(-1)}><SkipBack className="h-6 w-6" /></button>
        <button aria-label={playing ? "Pause" : "Lecture"} onClick={() => (playing ? audio.current?.pause() : void audio.current?.play().catch(() => {}))}
          className="grid h-14 w-14 place-items-center rounded-full bg-primary-foreground text-primary">{playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}</button>
        <button aria-label="Suivante" onClick={() => go(1)}><SkipForward className="h-6 w-6" /></button>
        <button aria-label="Répéter" onClick={() => setRepeat(!repeat)} className={repeat ? "" : "opacity-50"}><Repeat className="h-5 w-5" /></button>
      </div>
    </section>
  );
}

function Wird() {
  const [s, ready] = quran.use();
  const done = ready && wirdDoneToday(s);
  const setW = (p: Partial<typeof s.wird>) => quran.update((st) => ({ ...st, wird: { ...st.wird, ...p } }));
  return (
    <Card title="Wird du jour" right={<span className="eyebrow">{done ? "Fait ♡" : "À faire"}</span>}>
      <div className="flex items-center gap-2">
        <input type="number" min={1} max={604} value={s.wird.goal} onChange={(e) => setW({ goal: Math.max(1, Number(e.target.value) || 1) })} className="w-20 rounded-full border border-border bg-card px-3 py-2 text-center" />
        <select value={s.wird.unit} onChange={(e) => setW({ unit: e.target.value as "pages" | "sourates" })} className="rounded-full border border-border bg-card px-3 py-2">
          <option value="pages">pages</option><option value="sourates">sourates</option>
        </select>
        <span className="font-serif italic text-muted-foreground">par jour</span>
      </div>
      <button onClick={() => setW({ doneDay: done ? "" : dayKey() })}
        className={`mt-4 flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-widest text-primary-foreground ${done ? "bg-accent-strong" : "bg-primary"}`}>
        <Check className="h-4 w-4" />{done ? "Lecture faite aujourd'hui" : "Marquer comme lu"}
      </button>
    </Card>
  );
}
