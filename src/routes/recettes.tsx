import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Heart, Clock, X, Salad, ChevronRight } from "lucide-react";
import { Page } from "@/components/ui-kit";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { createPersisted } from "@/lib/persisted";
import { recipes, CATEGORIES, type Recipe, type RecipeCategory } from "@/lib/recipes";

export const Route = createFileRoute("/recettes")({
  head: () => ({
    meta: [
      { title: "Healthy Recipes — Blessings" },
      { name: "description", content: "Des recettes saines et simples : petit-déj, déjeuner, dîner, snacks, desserts et boissons." },
      { property: "og:title", content: "Healthy Recipes — Blessings" },
      { property: "og:description", content: "Recettes saines avec recherche, filtres et favoris." },
    ],
  }),
  component: RecipesPage,
});

const favoritesStore = createPersisted<string[]>(
  "recipe-favorites",
  () => [],
  (raw) => Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [],
);

type Filter = "Tous" | RecipeCategory | "Favoris";

const FILTERS: Filter[] = ["Tous", ...CATEGORIES, "Favoris"];

function RecipesPage() {
  const [favs, favsReady] = favoritesStore.use();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Tous");
  const [open, setOpen] = useState<Recipe | null>(null);

  const favSet = useMemo(() => new Set(favs), [favs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      if (filter === "Favoris" && !favSet.has(r.id)) return false;
      if (filter !== "Tous" && filter !== "Favoris" && r.category !== filter) return false;
      if (q) {
        const haystack = `${r.name} ${r.note} ${r.tags.join(" ")} ${r.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [query, filter, favSet]);

  const toggleFav = (id: string) => {
    favoritesStore.update((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  };

  return (
    <Page eyebrow="Bien-être" title="Healthy Recipes." subtitle="Des recettes simples pour prendre soin de toi ♡">
      {/* Search */}
      <div className="glass flex items-center gap-3 rounded-3xl px-4 py-3">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une recette, un ingrédient…"
          className="min-w-0 flex-1 bg-transparent font-serif text-lg outline-none placeholder:text-muted-foreground/60"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Effacer" className="shrink-0 text-muted-foreground hover:text-primary">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-widest transition ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
            }`}
          >
            {f === "Favoris" ? `♥ ${f} (${favs.length})` : f}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="eyebrow">
        {filtered.length} recette{filtered.length > 1 ? "s" : ""}
        {filter !== "Tous" && filter !== "Favoris" ? ` · ${filter}` : ""}
        {filter === "Favoris" ? " · vos coups de cœur" : ""}
      </p>

      {/* Recipe grid: 4 cols on large, 2 on tablet, 1 on mobile */}
      {filtered.length === 0 ? (
        <EmptyState filter={filter} query={query} onReset={() => { setQuery(""); setFilter("Tous"); }} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              isFav={favSet.has(r.id) && favsReady}
              onToggleFav={() => toggleFav(r.id)}
              onOpen={() => setOpen(r)}
            />
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <Drawer open={!!open} onOpenChange={(o) => { if (!o) setOpen(null); }}>
        <DrawerContent className="max-h-[85vh]">
          {open && <RecipeDetail recipe={open} isFav={favSet.has(open.id) && favsReady} onToggleFav={() => toggleFav(open.id)} />}
        </DrawerContent>
      </Drawer>
    </Page>
  );
}

/* ---------- Recipe Card ---------- */

const CARD_GRADIENTS: Record<RecipeCategory, string> = {
  "Petit-déj": "from-[#fcd34d] to-[#f59e0b]",
  "Déjeuner": "from-[#86efac] to-[#22c55e]",
  "Dîner": "from-[#fda4af] to-[#e11d48]",
  "Snack": "from-[#fbcfe8] to-[#f472b6]",
  "Dessert": "from-[#f9a8d4] to-[#be185d]",
  "Boisson": "from-[#93c5fd] to-[#3b82f6]",
};

function RecipeCard({
  recipe,
  isFav,
  onToggleFav,
  onOpen,
}: {
  recipe: Recipe;
  isFav: boolean;
  onToggleFav: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="glass group flex flex-col overflow-hidden rounded-3xl transition hover:-translate-y-0.5">
      {/* Photo fallback: gradient + icon */}
      <button onClick={onOpen} className="relative aspect-[4/3] w-full overflow-hidden" aria-label={`Voir ${recipe.name}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${CARD_GRADIENTS[recipe.category]}`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Salad className="h-12 w-12 text-white/70" />
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary backdrop-blur-sm">
          {recipe.category}
        </span>
        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-medium text-primary backdrop-blur-sm">
          <Clock className="h-3 w-3" /> {recipe.time}
        </span>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <button onClick={onOpen} className="text-left">
          <h3 className="font-display text-lg leading-tight text-primary">{recipe.name}</h3>
        </button>
        <p className="mt-1 flex-1 font-serif text-sm italic text-muted-foreground">{recipe.note}</p>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {recipe.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-secondary/70 px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-secondary-foreground">
              {t}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
          <button onClick={onOpen} className="flex items-center gap-1 text-xs uppercase tracking-widest text-primary transition hover:gap-2">
            Voir la recette <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onToggleFav}
            aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
            className={`grid h-9 w-9 place-items-center rounded-full transition ${isFav ? "bg-accent-strong/15 text-accent-strong" : "bg-secondary/60 text-muted-foreground hover:text-accent-strong"}`}
          >
            <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ---------- Recipe Detail (Drawer content) ---------- */

function RecipeDetail({ recipe, isFav, onToggleFav }: { recipe: Recipe; isFav: boolean; onToggleFav: () => void }) {
  return (
    <div className="overflow-y-auto">
      <DrawerHeader className="sr-only">
        <DrawerTitle>{recipe.name}</DrawerTitle>
        <DrawerDescription>{recipe.note}</DrawerDescription>
      </DrawerHeader>

      {/* Visual header */}
      <div className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${CARD_GRADIENTS[recipe.category]}`}>
        <Salad className="h-14 w-14 text-white/80" />
      </div>

      <div className="space-y-5 p-5">
        {/* Title + fav */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-tight text-primary">{recipe.name}</h2>
            <p className="mt-1 font-serif italic text-muted-foreground">{recipe.note}</p>
          </div>
          <button
            onClick={onToggleFav}
            aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${isFav ? "bg-accent-strong/15 text-accent-strong" : "bg-secondary/60 text-muted-foreground hover:text-accent-strong"}`}
          >
            <Heart className={`h-5 w-5 ${isFav ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 rounded-full bg-secondary/60 px-3 py-1.5 text-xs uppercase tracking-widest text-secondary-foreground">
            <Clock className="h-3.5 w-3.5" /> {recipe.time}
          </span>
          <span className="rounded-full bg-secondary/60 px-3 py-1.5 text-xs uppercase tracking-widest text-secondary-foreground">
            {recipe.category}
          </span>
          {recipe.tags.map((t) => (
            <span key={t} className="rounded-full border border-border/50 px-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              {t}
            </span>
          ))}
        </div>

        {/* Ingredients */}
        <div>
          <h3 className="font-display text-xl text-primary">Ingrédients</h3>
          <ul className="mt-3 space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl bg-card/70 px-4 py-2.5">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {i + 1}
                </span>
                <span className="font-serif text-base">{ing}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div>
          <h3 className="font-display text-xl text-primary">Étapes</h3>
          <ol className="mt-3 space-y-3">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="pt-0.5 font-serif text-base leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ---------- Empty State ---------- */

function EmptyState({ filter, query, onReset }: { filter: Filter; query: string; onReset: () => void }) {
  const isFavFilter = filter === "Favoris";
  const hasQuery = query.trim().length > 0;
  return (
    <div className="glass flex flex-col items-center rounded-3xl p-10 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-secondary/60 text-muted-foreground">
        {isFavFilter ? <Heart className="h-7 w-7" /> : <Search className="h-7 w-7" />}
      </div>
      <p className="mt-4 font-display text-xl text-primary">
        {isFavFilter ? "Pas encore de favoris" : hasQuery ? "Aucune recette trouvée" : "Rien ici"}
      </p>
      <p className="mt-1 font-serif italic text-muted-foreground">
        {isFavFilter
          ? "Touche le cœur sur une recette pour la retrouver ici."
          : hasQuery
            ? "Essaye un autre mot-clé ou change de catégorie."
            : "Change de filtre pour voir plus de recettes."}
      </p>
      <button onClick={onReset} className="mt-4 rounded-full bg-primary px-5 py-2 text-xs uppercase tracking-widest text-primary-foreground">
        Réinitialiser
      </button>
    </div>
  );
}
