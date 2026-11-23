import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Droplets, Lock, Fence, Lamp, Flower2, Droplet, Plus, Sprout } from "lucide-react";
import { Page, Card } from "@/components/ui-kit";
import { PlantSprite } from "@/components/plant-sprite";
import { useStore } from "@/lib/store";
import {
  PLANTS, DECOR, KIND_LABEL, MAX_PLOTS, BOUQUET_SIZE, actions, plantById, plotPrice, canPrice, stageOf,
} from "@/lib/garden-game";

export const Route = createFileRoute("/jardin")({
  head: () => ({ meta: [
    { title: "Jardin cozy — Blessings" },
    { name: "description", content: "Arrose tes plantes, récolte fleurs, fruits et légumes, compose des bouquets et gagne des étoiles." },
    { property: "og:title", content: "Jardin cozy — Blessings" },
    { property: "og:description", content: "Un petit jardin à faire pousser jour après jour." },
  ] }),
  component: Jardin,
});

const STAGE_LABEL = ["Graine", "Pousse", "Jeune plant", "Bouton", "Prêt à récolter"];
const DECOR_ICON = { cloture: Fence, lanterne: Lamp, arche: Flower2, fontaine: Droplet } as const;
type Tab = "graines" | "recolte" | "boutique" | "catalogue";

const chip = (active: boolean) => `rounded-full px-3 py-1.5 text-xs uppercase tracking-widest transition ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`;
const smallBtn = "flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs uppercase tracking-widest text-primary-foreground disabled:opacity-40";

function Jardin() {
  const [s, ready] = useStore();
  const f = s.farm;
  const [tab, setTab] = useState<Tab>("graines");
  const [selected, setSelected] = useState<string | null>(null);
  const seedChoice = selected && f.seeds[selected] ? selected : null;

  return (
    <Page eyebrow="Mini-jeu" title="Jardin cozy." subtitle="Arrose, récolte, fais fleurir ♡">
      <div className="flex gap-3">
        <Stat icon={<Star className="h-5 w-5 fill-current" />} label="Njoum" value={ready ? f.stars : 0} />
        <Stat icon={<Droplets className="h-5 w-5" />} label="Arrosoir" value={ready ? `${f.water}/${f.maxWater}` : "–"} />
      </div>

      <section className="overflow-hidden rounded-3xl border-4 border-primary/80 shadow-lg" aria-label="Parcelles du jardin">
        <div className="flex h-12 items-end justify-center gap-4 bg-gradient-to-b from-[#fbcfe8] to-[#fde2e4] px-4 pb-1 text-primary">
          {f.decor.length === 0
            ? <span className="pb-2 font-serif text-sm italic text-primary/70">Décore ton jardin depuis la boutique</span>
            : f.decor.map((id) => { const Icon = DECOR_ICON[id as keyof typeof DECOR_ICON]; return Icon ? <Icon key={id} className="h-7 w-7" aria-label={id} /> : null; })}
        </div>
        <div className="grid grid-cols-3 gap-2 bg-[#86c66f] p-3">
          {f.plots.map((plot) => {
            const plant = plot.plant ? plantById(plot.plant) : null;
            const stage = plant ? stageOf(plot.progress, plant.need) : 0;
            const ripe = plant && plot.progress >= plant.need;
            const label = !plant ? (seedChoice ? `Planter ${plantById(seedChoice).name}` : "Parcelle vide")
              : ripe ? `Récolter ${plant.name}` : `Arroser ${plant.name}`;
            return (
              <button key={plot.id} aria-label={label}
                disabled={!plant && !seedChoice}
                onClick={() => {
                  if (!plant && seedChoice) actions.plant(plot.id, seedChoice);
                  else if (ripe) actions.harvest(plot.id);
                  else if (plant) actions.water(plot.id);
                }}
                className={`relative flex aspect-square flex-col items-center justify-end rounded-xl border-2 border-[#5b3a24] bg-[#8b5a3c] pb-1 transition active:scale-95 ${ripe ? "ring-4 ring-[#fde047]" : ""} ${!plant && seedChoice ? "ring-2 ring-primary-foreground" : ""}`}>
                <span className="absolute inset-x-2 top-1/2 h-px bg-[#6b4429]" aria-hidden="true" />
                <span className="absolute inset-x-2 top-3/4 h-px bg-[#6b4429]" aria-hidden="true" />
                {plant ? <PlantSprite plant={plant} stage={stage} className="relative h-14 w-14" />
                  : <Plus className="mb-4 h-6 w-6 text-[#c4946e]" />}
                {plant && (
                  <span className="relative mt-0.5 h-1.5 w-3/4 overflow-hidden rounded-full bg-[#5b3a24]">
                    <span className="block h-full bg-[#7dd3fc]" style={{ width: `${Math.min(100, (plot.progress / plant.need) * 100)}%` }} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="bg-[#5b3a24] px-4 py-2 text-center text-xs uppercase tracking-widest text-[#fde2e4]">
          {seedChoice ? `Touche une parcelle vide pour planter : ${plantById(seedChoice).name}` : "Touche une plante pour l'arroser · dorée = à récolter"}
        </p>
      </section>

      <div className="flex flex-wrap gap-2" role="tablist">
        {([["graines", "Graines"], ["recolte", "Récolte"], ["boutique", "Boutique"], ["catalogue", "Catalogue"]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={chip(tab === k)}>{l}</button>
        ))}
      </div>

      {tab === "graines" && (
        <Card title="Mes graines">
          {Object.keys(f.seeds).length === 0 && <p className="font-serif italic text-muted-foreground">Plus de graines — passe à la boutique.</p>}
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(f.seeds).map(([id, q]) => {
              const p = plantById(id);
              return (
                <button key={id} onClick={() => setSelected(seedChoice === id ? null : id)} aria-pressed={seedChoice === id}
                  className={`flex flex-col items-center rounded-2xl bg-card/70 p-2 transition ${seedChoice === id ? "ring-2 ring-accent-strong" : ""}`}>
                  <PlantSprite plant={p} stage={4} className="h-10 w-10" />
                  <span className="font-serif">{p.name}</span>
                  <span className="eyebrow text-[10px]">× {q}</span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {tab === "recolte" && <Harvest />}
      {tab === "boutique" && <Shop />}

      {tab === "catalogue" && (
        <Card title="Catalogue">
          <div className="space-y-2">
            {PLANTS.map((p) => {
              const owned = f.unlocked.includes(p.id);
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-card/70 p-3">
                  <div className="flex gap-0.5" aria-hidden="true">
                    {[1, 2, 4].map((st) => <PlantSprite key={st} plant={p} stage={st} className="h-8 w-8" />)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg">{p.name}</p>
                    <p className="eyebrow text-[10px]">{KIND_LABEL[p.kind]} · {p.need} arrosages · vente {p.sell}</p>
                  </div>
                  {owned ? <Sprout className="h-4 w-4 text-accent-strong" aria-label="Débloquée" /> : <span className="eyebrow flex items-center gap-1 text-[10px]"><Lock className="h-3 w-3" />{p.unlock}</span>}
                </div>
              );
            })}
          </div>
          <p className="mt-3 font-serif text-sm italic text-muted-foreground">Étapes : {STAGE_LABEL.join(" → ")}</p>
        </Card>
      )}
    </Page>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="glass flex flex-1 items-center gap-3 rounded-3xl p-4">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-accent-strong">{icon}</div>
      <div><p className="font-display text-2xl leading-none text-primary">{value}</p><p className="eyebrow mt-1 text-[10px]">{label}</p></div>
    </div>
  );
}

function Harvest() {
  const [s] = useStore();
  const f = s.farm;
  const items = Object.entries(f.harvest);
  const flowers = items.filter(([id]) => plantById(id).kind === "flower").reduce((t, [, q]) => t + q, 0);
  return (
    <>
      <Card title="Récolte" right={
        <button onClick={actions.makeBouquet} disabled={flowers < BOUQUET_SIZE} className={smallBtn}><Flower2 className="h-3.5 w-3.5" />Bouquet</button>}>
        {items.length === 0 && <p className="font-serif italic text-muted-foreground">Rien encore — récolte une plante dorée.</p>}
        <div className="space-y-2">
          {items.map(([id, q]) => {
            const p = plantById(id);
            return (
              <div key={id} className="flex items-center gap-3 rounded-2xl bg-card/70 p-3">
                <PlantSprite plant={p} stage={4} className="h-10 w-10" />
                <div className="min-w-0 flex-1"><p className="font-serif text-lg">{p.name} × {q}</p><p className="eyebrow text-[10px]">{KIND_LABEL[p.kind]} · {p.sell} njoum / pièce</p></div>
                <button onClick={() => actions.sell(id)} className={smallBtn}><Star className="h-3.5 w-3.5" />+{q * p.sell}</button>
              </div>
            );
          })}
        </div>
        <p className="mt-3 font-serif text-sm italic text-muted-foreground">Un bouquet réunit {BOUQUET_SIZE} fleurs et vaut 1,5× leur prix.</p>
      </Card>
      {f.bouquets.length > 0 && (
        <Card title="Bouquets">
          <div className="grid grid-cols-2 gap-2">
            {f.bouquets.map((v, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-2xl bg-card/70 p-3">
                <Flower2 className="h-6 w-6 text-accent-strong" aria-hidden="true" />
                <button onClick={() => actions.sellBouquet(i)} className={smallBtn}><Star className="h-3.5 w-3.5" />+{v}</button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function Shop() {
  const [s] = useStore();
  const f = s.farm;
  const row = (key: string, icon: React.ReactNode, title: string, sub: string, price: number, onBuy: () => void, disabled = false) => (
    <div key={key} className="flex items-center gap-3 rounded-2xl bg-card/70 p-3">
      {icon}
      <div className="min-w-0 flex-1"><p className="font-serif text-lg">{title}</p><p className="eyebrow text-[10px]">{sub}</p></div>
      <button onClick={onBuy} disabled={disabled || f.stars < price} className={smallBtn}><Star className="h-3.5 w-3.5" />{price}</button>
    </div>
  );
  return (
    <>
      <Card title="Graines">
        <div className="space-y-2">
          {PLANTS.map((p) => f.unlocked.includes(p.id)
            ? row(p.id, <PlantSprite plant={p} stage={4} className="h-10 w-10" />, p.name, `Sachet · en stock ${f.seeds[p.id] ?? 0}`, p.seed, () => actions.buySeed(p.id))
            : row(p.id, <div className="relative"><PlantSprite plant={p} stage={4} className="h-10 w-10 opacity-40" /><Lock className="absolute inset-0 m-auto h-4 w-4" /></div>, p.name, `Débloquer · ${KIND_LABEL[p.kind]}`, p.unlock, () => actions.unlock(p.id)))}
        </div>
      </Card>
      <Card title="Jardin">
        <div className="space-y-2">
          {row("plot", <Plus className="h-8 w-8 text-accent-strong" />, "Nouvelle parcelle", `${f.plots.length}/${MAX_PLOTS} parcelles`, plotPrice(f), actions.buyPlot, f.plots.length >= MAX_PLOTS)}
          {row("can", <Droplets className="h-8 w-8 text-accent-strong" />, "Arrosoir plus grand", `+5 gouttes par jour · actuel ${f.maxWater}`, canPrice(f), actions.upgradeCan)}
          {DECOR.map((d) => {
            const Icon = DECOR_ICON[d.id];
            const owned = f.decor.includes(d.id);
            return row(d.id, <Icon className="h-8 w-8 text-accent-strong" />, d.name, owned ? "Installé" : "Décoration", d.price, () => actions.buyDecor(d.id), owned);
          })}
        </div>
      </Card>
    </>
  );
}
