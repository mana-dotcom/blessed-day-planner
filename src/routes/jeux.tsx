import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout, Star, Grid3x3, ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/jeux")({
  head: () => ({
    meta: [
      { title: "Jeux — Blessings" },
      { name: "description", content: "Choisis ton mini-jeu : Jardin cozy ou Sudoku.exe." },
      { property: "og:title", content: "Jeux — Blessings" },
      { property: "og:description", content: "Mini-jeux pour gagner des njoum." },
    ],
  }),
  component: Jeux,
});

function Jeux() {
  const [s, ready] = useStore();
  const stars = ready ? s.farm.stars : 0;

  return (
    <div className="mx-auto min-h-screen max-w-xl px-5 pb-32 pt-10">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Retour à l'accueil"
          className="glass grid h-10 w-10 shrink-0 place-items-center rounded-full text-accent-strong"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <p className="eyebrow">Mini-jeux</p>
      </div>
      <h1 className="mt-2 font-display text-5xl leading-none text-primary">Jeux.</h1>
      <p className="mt-3 font-serif text-xl italic text-muted-foreground">Choisis ton jeu et gagne des njoum ♡</p>
      <div className="mt-5 h-px w-16 bg-border" />

      {/* Stars counter */}
      <div className="glass mt-6 flex items-center gap-3 rounded-3xl p-4">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-accent-strong">
          <Star className="h-5 w-5 fill-current" />
        </div>
        <div>
          <p className="font-display text-2xl leading-none text-primary">{stars}</p>
          <p className="eyebrow mt-1 text-[10px]">Njoum</p>
        </div>
      </div>

      {/* Game cards */}
      <div className="mt-6 space-y-4">
        <Link
          to="/jardin"
          className="glass flex items-center gap-4 rounded-3xl p-5 transition hover:-translate-y-0.5"
        >
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#86c66f] to-[#5b8a47] text-white shadow-md">
            <Sprout className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl text-primary">Jardin cozy</p>
            <p className="font-serif italic text-muted-foreground">Arrose, récolte, gagne des njoum</p>
          </div>
          <span className="eyebrow shrink-0">Play →</span>
        </Link>

        <Link
          to="/jeux-sudoku"
          className="glass flex items-center gap-4 rounded-3xl p-5 transition hover:-translate-y-0.5"
        >
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#f9a8d4] to-[#e11d48] text-white shadow-md">
            <Grid3x3 className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl text-primary">Sudoku.exe</p>
            <p className="font-serif italic text-muted-foreground">Cute retro pastel sudoku</p>
          </div>
          <span className="eyebrow shrink-0">Play →</span>
        </Link>
      </div>
    </div>
  );
}
