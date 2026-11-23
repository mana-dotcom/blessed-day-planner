import { createFileRoute } from "@tanstack/react-router";
import { Page, Card } from "@/components/ui-kit";
import { useStore, update, progress } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [
    { title: "Profil — Blessings" },
    { name: "description", content: "Votre prénom et vos préférences pour Blessings." },
    { property: "og:title", content: "Profil — Blessings" },
    { property: "og:description", content: "Personnalisez votre espace Blessings." },
  ] }),
  component: Profile,
});

function Profile() {
  const [s, ready] = useStore();
  return (
    <Page eyebrow="Moi" title="Profile." subtitle="Ton espace, rien qu'à toi.">
      <Card title="Prénom">
        <input value={ready ? s.name : ""} onChange={(e) => update((st) => ({ ...st, name: e.target.value }))} placeholder="Ton prénom…"
          className="w-full rounded-full border border-border bg-card px-4 py-2.5 font-serif text-lg outline-none focus:border-accent-strong" />
      </Card>
      <Card title="Aujourd'hui"><p className="font-display text-5xl text-accent-strong">{ready ? progress(s) : 0}%</p>
        <p className="mt-1 font-serif italic text-muted-foreground">Les coches se réinitialisent chaque nouveau jour. Tes étapes restent.</p></Card>
      <Card title="Données">
        <button onClick={() => { if (confirm("Tout effacer ?")) { localStorage.clear(); location.reload(); } }}
          className="rounded-full bg-destructive px-5 py-2.5 text-sm uppercase tracking-widest text-destructive-foreground">Tout réinitialiser</button>
      </Card>
    </Page>
  );
}
