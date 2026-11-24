import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Clock, Heart, Search, UtensilsCrossed } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { createPersisted } from "@/lib/persisted";
import { cn } from "@/lib/utils";
import { recipeCategories, recipes, type Recipe, type RecipeTag } from "@/lib/content";

export const Route = createFileRoute("/recipes")({
  head: () => ({
    meta: [
      { title: "Healthy Recipes — Blessings" },
      {
        name: "description",
        content:
          "Recettes healthy à filtrer : ingrédients, étapes, temps de préparation et favoris.",
      },
      { property: "og:title", content: "Healthy Recipes — Blessings" },
      {
        property: "og:description",
        content: "Des idées saines classées par moment de la journée.",
      },
    ],
  }),
  component: RecipesPage,
});

// Favorites live in localStorage, independent from the main planner state.
const favorites = createPersisted<{ ids: string[] }>(
  "recipes-favorites-v1",
  () => ({ ids: [] }),
  (raw) => ({
    ids: Array.isArray(raw.ids) ? raw.ids.filter((x): x is string => typeof x === "string") : [],
  }),
);

const chip = (active: boolean) =>
  `flex items-center gap-1.5 rounded-full px-4 py-2 text-xs uppercase tracking-widest transition ${
    active
      ? "bg-primary text-primary-foreground"
      : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
  }`;

function RecipesPage() {
  const [fav] = favorites.use();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"Tous" | RecipeTag>("Tous");
  const [onlyFav, setOnlyFav] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return recipes.filter((r) => {
      if (cat !== "Tous" && r.tag !== cat) return false;
      if (onlyFav && !fav.ids.includes(r.id)) return false;
      if (
        s &&
        !`${r.name} ${r.note} ${r.tags.join(" ")} ${r.ingredients.join(" ")}`
          .toLowerCase()
          .includes(s)
      )
        return false;
      return true;
    });
  }, [q, cat, onlyFav, fav.ids]);

  const active = openId ? (recipes.find((r) => r.id === openId) ?? null) : null;
  const toggleFav = (id: string) =>
    favorites.update((f) => ({
      ids: f.ids.includes(id) ? f.ids.filter((x) => x !== id) : [...f.ids, id],
    }));

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-5 pb-24 pt-10">
      <div className="flex items-center gap-3">
        <Link
          to="/health"
          aria-label="Retour à Health"
          className="glass grid h-10 w-10 shrink-0 place-items-center rounded-full text-accent-strong"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <p className="eyebrow">Bien-être</p>
      </div>
      <h1 className="mt-2 font-display text-5xl leading-none text-primary">Healthy Recipes.</h1>
      <p className="mt-3 font-serif text-xl italic text-muted-foreground">
        Des idées saines, rapides et gourmandes ♡
      </p>
      <div className="mt-5 h-px w-16 bg-border" />

      {/* Search + category filters */}
      <div className="mt-6 flex flex-col gap-3">
        <label className="glass flex items-center gap-3 rounded-full px-5 py-3">
          <Search className="h-4 w-4 shrink-0 text-accent-strong" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une recette, un ingrédient…"
            className="min-w-0 flex-1 bg-transparent font-serif text-lg outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {recipeCategories.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={chip(cat === c)}>
              {c}
            </button>
          ))}
          <button
            onClick={() => setOnlyFav((v) => !v)}
            aria-pressed={onlyFav}
            className={chip(onlyFav)}
          >
            <Heart className={cn("h-3.5 w-3.5", onlyFav && "fill-current")} /> Favoris
          </button>
        </div>
      </div>

      <p className="eyebrow mt-5">
        {list.length} recette{list.length > 1 ? "s" : ""}
      </p>

      {/* Responsive grid: 4 cols desktop, 2 tablet, 1 mobile */}
      {list.length === 0 ? (
        <p className="glass mt-4 rounded-3xl p-8 text-center font-serif italic text-muted-foreground">
          Aucune recette ne correspond… essaie un autre filtre ♡
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              favorite={fav.ids.includes(r.id)}
              onOpen={() => setOpenId(r.id)}
              onToggleFav={() => toggleFav(r.id)}
            />
          ))}
        </div>
      )}

      <Drawer
        open={!!active}
        onOpenChange={(o) => {
          if (!o) setOpenId(null);
        }}
      >
        <DrawerContent className="max-h-[90vh]">
          {active && (
            <RecipeDetail
              recipe={active}
              favorite={fav.ids.includes(active.id)}
              onToggleFav={() => toggleFav(active.id)}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function RecipeCard({
  recipe,
  favorite,
  onOpen,
  onToggleFav,
}: {
  recipe: Recipe;
  favorite: boolean;
  onOpen: () => void;
  onToggleFav: () => void;
}) {
  return (
    <div className="glass group relative overflow-hidden rounded-3xl transition hover:-translate-y-0.5">
      <button onClick={onOpen} className="block w-full text-left">
        <RecipePhoto recipe={recipe} className="aspect-[4/3] w-full" />
        <div className="p-4">
          <p className="font-serif text-lg leading-snug text-primary">{recipe.name}</p>
          <p className="eyebrow mt-1.5 flex items-center gap-1 text-[10px]">
            <Clock className="h-3 w-3" />
            {recipe.time}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{recipe.note}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {recipe.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-secondary/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-secondary-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </button>
      <button
        onClick={onToggleFav}
        aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={favorite}
        className={cn(
          "absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition",
          favorite
            ? "bg-primary text-primary-foreground"
            : "bg-card/80 text-accent-strong hover:bg-card",
        )}
      >
        <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
      </button>
    </div>
  );
}

function RecipePhoto({ recipe, className }: { recipe: Recipe; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={recipe.name}
        className={cn(
          "grid place-items-center bg-gradient-to-br from-[#ffd2ec] via-[#ffe6f3] to-[#fdf2f8]",
          className,
        )}
      >
        <UtensilsCrossed className="h-8 w-8 text-[#830c4f]/50" />
      </div>
    );
  }
  return (
    <img
      src={recipe.photo}
      alt={recipe.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}

function RecipeDetail({
  recipe,
  favorite,
  onToggleFav,
}: {
  recipe: Recipe;
  favorite: boolean;
  onToggleFav: () => void;
}) {
  return (
    <>
      <RecipePhoto recipe={recipe} className="h-48 w-full shrink-0" />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-10">
        <DrawerHeader className="px-0 text-left">
          <div className="flex items-start justify-between gap-3">
            <DrawerTitle className="font-display text-3xl leading-tight text-primary">
              {recipe.name}
            </DrawerTitle>
            <button
              onClick={onToggleFav}
              aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-pressed={favorite}
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-full transition",
                favorite
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-accent-strong hover:bg-secondary/70",
              )}
            >
              <Heart className={cn("h-5 w-5", favorite && "fill-current")} />
            </button>
          </div>
        </DrawerHeader>

        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow flex items-center gap-1 text-[10px]">
            <Clock className="h-3 w-3" />
            {recipe.time}
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-secondary-foreground">
            {recipe.tag}
          </span>
          {recipe.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-secondary/70 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-secondary-foreground"
            >
              {t}
            </span>
          ))}
        </div>

        <p className="mt-3 font-serif text-lg italic text-muted-foreground">{recipe.note}</p>

        <h3 className="mt-6 font-display text-xl text-primary">Ingrédients</h3>
        <ul className="mt-2 space-y-1.5">
          {recipe.ingredients.map((i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-strong" />
              {i}
            </li>
          ))}
        </ul>

        <h3 className="mt-6 font-display text-xl text-primary">Étapes</h3>
        <ol className="mt-2 space-y-2.5">
          {recipe.steps.map((s, i) => (
            <li key={s} className="flex items-start gap-3 text-sm text-foreground">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-accent-strong">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
