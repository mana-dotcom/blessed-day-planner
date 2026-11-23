import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Heart, Send, Sparkles, Languages, AlertCircle, Loader2 } from "lucide-react";
import { Page, Card } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import {
  loadAgent, saveAgent, mkMsg, snapshot, dailySummary, topPriority, aiReply, isAiConfigured,
  QUICK_ACTIONS, type AgentState, type Lang,
} from "@/lib/agent";

export const Route = createFileRoute("/agent")({
  head: () => ({ meta: [
    { title: "Agent — Assistant IA | Blessings" },
    { name: "description", content: "Assistant IA : résumé du jour, priorité et chat libre multilingue." },
    { property: "og:title", content: "Agent — Blessings" },
    { property: "og:description", content: "Ton assistant de journée, propulsé par l'IA." },
  ] }),
  component: Agent,
});

function Agent() {
  const [s, ready] = useStore();
  const [agent, setAgent] = useState<AgentState>(() => loadAgent());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const lang = agent.lang;
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { saveAgent(agent); }, [agent]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [agent.messages]);

  const snap = ready ? snapshot(s) : null;
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    const userMsg = mkMsg("user", clean);
    setAgent((a) => ({ ...a, messages: [...a.messages, userMsg] }));
    setInput("");
    setBusy(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const history = agent.messages;
    const reply = await aiReply(history, clean, snap, lang, ctrl.signal);
    abortRef.current = null;

    if (reply) {
      setAgent((a) => ({ ...a, messages: [...a.messages, mkMsg("bot", reply)] }));
    }
    setBusy(false);
  };

  const setLang = (l: Lang) => setAgent((a) => ({ ...a, lang: l }));
  const clearChat = () => setAgent((a) => ({ ...a, messages: [] }));

  return (
    <Page eyebrow={t("Assistant", "Assistant")} title="Agent." subtitle={t("Ton coach de journée, propulsé par l'IA.", "Your day coach, powered by AI.")}>
      {!isAiConfigured() && (
        <section className="glass flex items-start gap-3 rounded-3xl border border-destructive/40 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-display text-lg text-primary">{t("Clé API manquante", "Missing API key")}</p>
            <p className="mt-1 font-serif text-base italic text-muted-foreground">
              {t(
                "Ajoute VITE_GEMINI_API_KEY dans le fichier .env pour activer le chat IA. Le résumé et la priorité du jour restent disponibles.",
                "Add VITE_GEMINI_API_KEY to the .env file to enable AI chat. Today's summary and priority remain available.",
              )}
            </p>
          </div>
        </section>
      )}

      <Card right={
        <div className="flex gap-1">
          <button onClick={() => setLang("fr")} className={`rounded-full px-3 py-1 text-xs uppercase tracking-widest ${lang === "fr" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>FR</button>
          <button onClick={() => setLang("en")} className={`rounded-full px-3 py-1 text-xs uppercase tracking-widest ${lang === "en" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>EN</button>
        </div>
      }>
        <p className="eyebrow">{t("Résumé du jour", "Today's summary")}</p>
        {snap ? (
          <p className="mt-2 font-serif text-lg italic text-muted-foreground">{dailySummary(snap, lang)}</p>
        ) : (
          <p className="mt-2 font-serif text-lg italic text-muted-foreground">{t("Chargement…", "Loading…")}</p>
        )}
      </Card>

      <section className="hero-card rounded-3xl p-5 text-primary-foreground">
        <p className="eyebrow !text-primary-foreground/80">{t("Priorité du moment", "Current priority")}</p>
        {snap ? (
          <>
            <p className="mt-1 font-display text-3xl">{topPriority(snap, lang).title}</p>
            <p className="mt-1 font-serif text-lg italic">{topPriority(snap, lang).detail}</p>
          </>
        ) : (
          <p className="mt-1 font-serif text-lg italic">{t("Chargement…", "Loading…")}</p>
        )}
      </section>

      <Card title={t("Chat", "Chat")} right={
        <button onClick={clearChat} className="rounded-full bg-secondary px-3 py-1.5 text-xs uppercase tracking-widest text-secondary-foreground">{t("Effacer", "Clear")}</button>
      }>
        <div ref={scrollRef} className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {agent.messages.length === 0 && (
            <div className="flex gap-3">
              <Avatar />
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-2.5">
                <p className="font-serif text-lg">{t(
                  "Bonjour ♡ Je suis ton assistant IA. Pose-moi n'importe quelle question, dans la langue que tu veux.",
                  "Hello ♡ I'm your AI assistant. Ask me anything, in whatever language you like.",
                )}</p>
              </div>
            </div>
          )}
          {agent.messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.from === "user" ? "flex-row-reverse" : ""}`}>
              {m.from === "bot" ? <Avatar /> : <UserAvatar />}
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 ${m.from === "bot" ? "glass rounded-tl-sm" : "bg-primary rounded-tr-sm text-primary-foreground"}`}>
                <p className="font-serif text-lg">{m.text}</p>
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex gap-3">
              <Avatar />
              <div className="glass flex items-center gap-2 rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-accent-strong" />
                <span className="font-serif text-lg italic text-muted-foreground">{t("Réflexion…", "Thinking…")}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_ACTIONS[lang].map((qa) => (
            <button key={qa.label} disabled={busy} onClick={() => send(qa.q)}
              className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs uppercase tracking-widest text-secondary-foreground transition hover:bg-accent-strong hover:text-primary-foreground disabled:opacity-50">
              <Sparkles className="h-3.5 w-3.5" />{qa.label}
            </button>
          ))}
        </div>

        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("Écris ton message…", "Type your message…")}
            className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2.5 font-serif text-lg outline-none focus:border-accent-strong" />
          <button disabled={busy} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50" aria-label={t("Envoyer", "Send")}>
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center gap-2 text-accent-strong">
          <Languages className="h-4 w-4" />
          <span className="eyebrow">{t("Multilingue (FR · EN · Tunisien · العربية)", "Multilingual (FR · EN · Tunisian · العربية)")}</span>
        </div>
        <p className="mt-2 font-serif text-lg italic text-muted-foreground">
          {t(
            "L'assistant connaît ta journée (prières, athkar, skincare, eau, tâches) et peut répondre à toute question. Répond dans la langue que tu utilises.",
            "The assistant knows your day (prayers, athkar, skincare, water, tasks) and can answer any question. Replies in the language you use.",
          )}
        </p>
      </Card>
    </Page>
  );
}

function Avatar() {
  return <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-accent-strong"><Heart className="h-5 w-5" /></div>;
}
function UserAvatar() {
  return <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-strong text-primary-foreground font-display text-sm">M</div>;
}
