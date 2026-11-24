import { update, type Farm } from "@/lib/store";

export type Kind = "flower" | "veg" | "fruit";
export type Plant = {
  id: string; name: string; kind: Kind; color: string;
  seed: number; sell: number; unlock: number; need: number;
};

export const PLANTS: Plant[] = [
  { id: "tulipe", name: "Tulipe", kind: "flower", color: "#f472b6", seed: 2, sell: 4, unlock: 0, need: 4 },
  { id: "marguerite", name: "Marguerite", kind: "flower", color: "#fafafa", seed: 2, sell: 4, unlock: 0, need: 4 },
  { id: "radis", name: "Radis", kind: "veg", color: "#e11d48", seed: 1, sell: 3, unlock: 0, need: 3 },
  { id: "carotte", name: "Carotte", kind: "veg", color: "#f97316", seed: 2, sell: 5, unlock: 15, need: 4 },
  { id: "fraise", name: "Fraise", kind: "fruit", color: "#dc2626", seed: 3, sell: 7, unlock: 25, need: 5 },
  { id: "rose", name: "Rose", kind: "flower", color: "#be123c", seed: 4, sell: 8, unlock: 30, need: 5 },
  { id: "tomate", name: "Tomate", kind: "veg", color: "#ef4444", seed: 4, sell: 9, unlock: 40, need: 6 },
  { id: "tournesol", name: "Tournesol", kind: "flower", color: "#facc15", seed: 5, sell: 11, unlock: 50, need: 6 },
  { id: "myrtille", name: "Myrtille", kind: "fruit", color: "#6366f1", seed: 6, sell: 13, unlock: 65, need: 7 },
  { id: "pivoine", name: "Pivoine", kind: "flower", color: "#f9a8d4", seed: 7, sell: 15, unlock: 80, need: 7 },
  { id: "citrouille", name: "Citrouille", kind: "veg", color: "#ea580c", seed: 8, sell: 18, unlock: 100, need: 8 },
];

export const DECOR = [
  { id: "cloture", name: "Clôture blanche", price: 12 },
  { id: "lanterne", name: "Lanterne", price: 18 },
  { id: "arche", name: "Arche fleurie", price: 30 },
  { id: "fontaine", name: "Fontaine", price: 45 },
] as const;

export const plantById = (id: string) => PLANTS.find((p) => p.id === id)!;
export const KIND_LABEL: Record<Kind, string> = { flower: "Fleur", veg: "Légume", fruit: "Fruit" };
export const MAX_PLOTS = 12;
export const BOUQUET_SIZE = 3;
export const plotPrice = (f: Farm) => 8 + f.plots.length * 6;
export const canPrice = (f: Farm) => 10 + (f.maxWater - 10) * 4;
export const stageOf = (progress: number, need: number) => Math.min(4, Math.floor((progress / need) * 4));

const farm = (fn: (f: Farm) => Farm) => update((s) => ({ ...s, farm: fn(s.farm) }));
const add = (r: Record<string, number>, k: string, d: number) => {
  const value = (r[k] ?? 0) + d;
  const next = { ...r, [k]: value };
  if (value <= 0) delete next[k];
  return next;
};

export const actions = {
  plant: (plotId: string, plantId: string) => farm((f) => {
    if (!f.seeds[plantId]) return f;
    return { ...f, seeds: add(f.seeds, plantId, -1), plots: f.plots.map((p) => (p.id === plotId && !p.plant ? { ...p, plant: plantId, progress: 0 } : p)) };
  }),
  water: (plotId: string) => farm((f) => {
    const plot = f.plots.find((p) => p.id === plotId);
    if (!plot?.plant || f.water <= 0 || plot.progress >= plantById(plot.plant).need) return f;
    return { ...f, water: f.water - 1, plots: f.plots.map((p) => (p.id === plotId ? { ...p, progress: p.progress + 1 } : p)) };
  }),
  harvest: (plotId: string) => farm((f) => {
    const plot = f.plots.find((p) => p.id === plotId);
    if (!plot?.plant || plot.progress < plantById(plot.plant).need) return f;
    // Each harvest also returns one seed so the garden never dead-ends.
    return { ...f, harvest: add(f.harvest, plot.plant, plantById(plot.plant).kind === "flower" ? 1 : 2), seeds: add(f.seeds, plot.plant, 1),
      plots: f.plots.map((p) => (p.id === plotId ? { ...p, plant: null, progress: 0 } : p)) };
  }),
  sell: (plantId: string) => farm((f) => {
    const qty = f.harvest[plantId] ?? 0;
    return qty ? { ...f, stars: f.stars + qty * plantById(plantId).sell, harvest: add(f.harvest, plantId, -qty) } : f;
  }),
  makeBouquet: () => farm((f) => {
    const flowers = Object.entries(f.harvest).filter(([id]) => plantById(id).kind === "flower").flatMap(([id, q]) => Array<string>(q).fill(id));
    if (flowers.length < BOUQUET_SIZE) return f;
    const picked = flowers.sort((a, b) => plantById(b).sell - plantById(a).sell).slice(0, BOUQUET_SIZE);
    const value = Math.round(picked.reduce((t, id) => t + plantById(id).sell, 0) * 1.5);
    const harvest = picked.reduce((h, id) => add(h, id, -1), f.harvest);
    return { ...f, harvest, bouquets: [...f.bouquets, value] };
  }),
  sellBouquet: (i: number) => farm((f) => (f.bouquets[i] == null ? f : { ...f, stars: f.stars + f.bouquets[i], bouquets: f.bouquets.filter((_, j) => j !== i) })),
  buySeed: (plantId: string) => farm((f) => {
    const p = plantById(plantId);
    if (!f.unlocked.includes(plantId) || f.stars < p.seed) return f;
    return { ...f, stars: f.stars - p.seed, seeds: add(f.seeds, plantId, 1) };
  }),
  unlock: (plantId: string) => farm((f) => {
    const p = plantById(plantId);
    if (f.unlocked.includes(plantId) || f.stars < p.unlock) return f;
    return { ...f, stars: f.stars - p.unlock, unlocked: [...f.unlocked, plantId], seeds: add(f.seeds, plantId, 1) };
  }),
  buyPlot: () => farm((f) => (f.plots.length >= MAX_PLOTS || f.stars < plotPrice(f) ? f
    : { ...f, stars: f.stars - plotPrice(f), plots: [...f.plots, { id: Math.random().toString(36).slice(2, 9), plant: null, progress: 0 }] })),
  upgradeCan: () => farm((f) => (f.stars < canPrice(f) ? f : { ...f, stars: f.stars - canPrice(f), maxWater: f.maxWater + 5, water: f.water + 5 })),
  buyDecor: (id: string) => farm((f) => {
    const d = DECOR.find((x) => x.id === id);
    if (!d || f.decor.includes(id) || f.stars < d.price) return f;
    return { ...f, stars: f.stars - d.price, decor: [...f.decor, id] };
  }),
  awardStars: (n: number) => farm((f) => ({ ...f, stars: f.stars + n })),
};
