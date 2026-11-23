import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type CSSProperties } from "react";
import { ImagePlus, ChevronLeft, ChevronRight, RotateCw, Trash2, X, Plus } from "lucide-react";
import { Page, Card } from "@/components/ui-kit";
import { useVision, updateVision, newVisionItem, compressImage, FRAMES, type StampFrame, type VisionItem } from "@/lib/vision";

export const Route = createFileRoute("/vision")({
  head: () => ({ meta: [
    { title: "Vision Board 2027 — Blessings" },
    { name: "description", content: "Ton tableau de vision 2027 : tes rêves encadrés comme des timbres." },
    { property: "og:title", content: "Vision Board 2027 — Blessings" },
    { property: "og:description", content: "Épingle tes rêves pour 2027, en timbres-poste." },
  ] }),
  component: Vision,
});

const FRAME_LABELS: Record<StampFrame, string> = { blush: "Blush", berry: "Berry", cream: "Crème", rose: "Rose", lilac: "Lilas" };
const SLOTS = 8;

const setItems = (fn: (l: VisionItem[]) => VisionItem[]) => updateVision((b) => ({ ...b, items: fn(b.items) }));

function Stamp({ item, index, selected, onSelect }: { item: VisionItem; index: number; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} aria-label={item.caption || `Image ${index + 1}`} aria-pressed={selected}
      data-frame={item.frame}
      className={`stamp block w-full text-left transition duration-300 hover:z-10 hover:scale-[1.04] ${selected ? "z-10 scale-[1.06]" : ""}`}
      style={{ transform: selected ? undefined : `rotate(${item.tilt}deg)` }}>
      <div className="stamp-inner flex flex-col">
        <div className="relative aspect-[4/5] overflow-hidden">
          <img src={item.src} alt={item.caption || ""} className="h-full w-full object-cover" draggable={false} />
          <span className="absolute right-1 top-1 rounded-sm bg-[var(--stamp-paper)]/85 px-1 font-display text-[10px] leading-tight">27</span>
        </div>
        <p className="mt-1 line-clamp-2 min-h-[1.1rem] break-words text-center font-serif text-xs italic leading-tight sm:text-sm">{item.caption || "\u00a0"}</p>
      </div>
    </button>
  );
}

function EmptySlot({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Ajouter une image"
      className="grid aspect-[4/5] w-full place-items-center rounded-lg border-2 border-dashed border-accent-strong/35 text-accent-strong/60 transition hover:border-accent-strong hover:text-accent-strong">
      <Plus className="h-6 w-6" />
    </button>
  );
}

function Centerpiece({ title, tagline }: { title: string; tagline: string }) {
  return (
    <div className="stamp stamp-centerpiece col-start-2 row-start-2 h-full">
      <div className="stamp-inner flex flex-col items-center justify-center text-center">
        <div className="pointer-events-none absolute inset-3 rounded-full border border-dashed border-white/30" />
        <p className="eyebrow !text-[8px] !tracking-[0.25em] !text-white/80">Vision</p>
        <p className="font-display text-[2rem] leading-none sm:text-5xl">{title}</p>
        <p className="mt-1 line-clamp-2 px-1 font-serif text-xs italic leading-tight sm:text-sm">{tagline}</p>
      </div>
    </div>
  );
}

function Editor({ item, index, count, onClose }: { item: VisionItem; index: number; count: number; onClose: () => void }) {
  const patch = (p: Partial<VisionItem>) => setItems((l) => l.map((x) => (x.id === item.id ? { ...x, ...p } : x)));
  const move = (dir: -1 | 1) => setItems((l) => {
    const i = l.findIndex((x) => x.id === item.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= l.length) return l;
    const next = [...l];
    [next[i], next[j]] = [next[j]!, next[i]!];
    return next;
  });
  return (
    <Card title="Modifier le timbre" right={<button aria-label="Fermer" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-secondary"><X className="h-4 w-4" /></button>}>
      <div className="flex gap-4">
        <img src={item.src} alt="" className="h-24 w-20 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1 space-y-3">
          <input value={item.caption} onChange={(e) => patch({ caption: e.target.value })} placeholder="Légende…" maxLength={40}
            className="w-full rounded-full border border-border bg-card px-4 py-2 font-serif text-lg outline-none focus:border-accent-strong" />
          <div className="flex flex-wrap gap-2">
            {FRAMES.map((f) => (
              <button key={f} type="button" onClick={() => patch({ frame: f })} aria-label={`Cadre ${FRAME_LABELS[f]}`} aria-pressed={item.frame === f}
                data-frame={f} style={{ "--stamp-tile": "8px", padding: 5 } as CSSProperties}
                className={`stamp transition ${item.frame === f ? "scale-110" : "opacity-70"}`}>
                <span className="stamp-inner block" style={{ width: 20, height: 20, padding: 0 }} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button disabled={index === 0} onClick={() => move(-1)} className="flex items-center gap-1 rounded-full border border-border px-3 py-2 text-xs uppercase tracking-widest disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Avant</button>
        <button disabled={index === count - 1} onClick={() => move(1)} className="flex items-center gap-1 rounded-full border border-border px-3 py-2 text-xs uppercase tracking-widest disabled:opacity-40">Après<ChevronRight className="h-4 w-4" /></button>
        <button onClick={() => patch({ tilt: Math.round((Math.random() * 6 - 3) * 10) / 10 })} className="flex items-center gap-1 rounded-full border border-border px-3 py-2 text-xs uppercase tracking-widest"><RotateCw className="h-4 w-4" />Pivoter</button>
        <button onClick={() => { setItems((l) => l.filter((x) => x.id !== item.id)); onClose(); }} className="ml-auto flex items-center gap-1 rounded-full bg-destructive px-3 py-2 text-xs uppercase tracking-widest text-destructive-foreground"><Trash2 className="h-4 w-4" />Retirer</button>
      </div>
    </Card>
  );
}

function Vision() {
  const [board, ready] = useVision();
  const items = ready ? board.items : [];
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const selIndex = items.findIndex((x) => x.id === selected);
  const selItem = items[selIndex];

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setError("");
    let added = 0;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const src = await compressImage(file);
        const ok = updateVision((b) => ({ ...b, items: [...b.items, newVisionItem(src, b.items.length)] }));
        if (!ok) { setError("Stockage plein : retire quelques images pour en ajouter d'autres."); break; }
        added++;
      } catch {
        setError("Impossible de lire une des images.");
      }
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    return added;
  };
  const pick = () => fileRef.current?.click();

  return (
    <Page eyebrow="Vision Board" title="2027." subtitle="Écris-le, épingle-le, et fais du'a ♡">
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />

      <section className="glass rounded-3xl p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-4 sm:gap-5">
          <Centerpiece title={board.title} tagline={ready ? board.tagline : ""} />
          {items.map((item, i) => (
            <Stamp key={item.id} item={item} index={i} selected={item.id === selected}
              onSelect={() => setSelected(item.id === selected ? null : item.id)} />
          ))}
          {Array.from({ length: Math.max(0, SLOTS - items.length) }, (_, i) => <EmptySlot key={`slot-${i}`} onClick={pick} />)}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={pick} disabled={busy}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs uppercase tracking-widest text-primary-foreground disabled:opacity-60">
          <ImagePlus className="h-4 w-4" />{busy ? "Ajout…" : "Ajouter des images"}
        </button>
        <span className="eyebrow">{items.length} timbre{items.length > 1 ? "s" : ""}</span>
      </div>
      {error && <p className="font-serif text-lg italic text-destructive">{error}</p>}

      {selItem && <Editor item={selItem} index={selIndex} count={items.length} onClose={() => setSelected(null)} />}

      <Card title="Le tableau">
        <label className="eyebrow text-[10px]" htmlFor="vision-tagline">Phrase sous 2027</label>
        <input id="vision-tagline" value={ready ? board.tagline : ""} maxLength={40}
          onChange={(e) => updateVision((b) => ({ ...b, tagline: e.target.value }))}
          className="mt-2 w-full rounded-full border border-border bg-card px-4 py-2.5 font-serif text-lg outline-none focus:border-accent-strong" />
        <p className="eyebrow mt-3 text-[10px]">Touche un timbre pour changer sa légende, son cadre ou sa place.</p>
      </Card>
    </Page>
  );
}
