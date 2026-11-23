import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, Languages } from "lucide-react";
import { Page, Card } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import {
  loadAgent, saveAgent, mkMsg, snapshot, dailySummary, topPriority, botReply, QUICK_ACTIONS,
  type AgentState, type Lang,
} from "@/lib/agent";

export const Route = createFileRoute("/agent")({
  head: () => ({ meta: [
    { title: "Agent — Assistant local | Blessings" },
    { name: "description", content: "Assistant local et confidentiel : résumé du jour, priorité et chat." },
    { property: "og:title", content: "Agent — Blessings" },
    { property: "og:description", content: "Ton assistant de journée, 100% local." },
  ] }),
  component: Agent,
});

function Agent() {
  const [s, ready] = useStore();
  const [agent, setAgent] = useState<AgentState>(() => loadAgent());
  const [input, setInput] = useState("");
  const lang = agent.lang;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { saveAgent(agent); }, [agent]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [agent.messages]);

  const snap = ready ? snapshot(s) : null;
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const userMsg = mkMsg("user", clean);
    const reply = snap ? botReply(clean, snap, lang) : t("Chargement…", "Loading…");
    const botMsg = mkMsg("bot", reply);
    setAgent((a) => ({ ...a, messages: [...a.messages, userMsg, botMsg] }));
    setInput("");
  };

  const setLang = (l: Lang) => setAgent((a) => ({ ...a, lang: l }));
  const clearChat = () => setAgent((a) => ({ ...a, messages: [] }));

  return (
    <Page eyebrow={t("Assistant", "Assistant")} title="Agent." subtitle={t("Ton coach de journée, 100% local.", "Your day coach, 100% local.")}>
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
                <p className="font-serif text-lg">{t("Bonjour ♡ Pose-moi une question ou utilise un bouton ci-dessous.", "Hello ♡ Ask me something or use a button below.")}</p>
              </div>
            </div>
          )}
          {agent.messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.from === "user" ? "flex-row-reverse" : ""}`}>
              {m.from === "bot" ? <Avatar /> : <UserAvatar />}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.from === "bot" ? "glass rounded-tl-sm" : "bg-primary rounded-tr-sm text-primary-foreground"}`}>
                <p className="font-serif text-lg">{m.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_ACTIONS[lang].map((qa) => (
            <button key={qa.label} onClick={() => send(qa.q)}
              className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs uppercase tracking-widest text-secondary-foreground transition hover:bg-accent-strong hover:text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />{qa.label}
            </button>
          ))}
        </div>

        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("Écris ton message…", "Type your message…")}
            className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2.5 font-serif text-lg outline-none focus:border-accent-strong" />
          <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground" aria-label={t("Envoyer", "Send")}>
            <Send className="h-5 w-5" />
          </button>
        </form>
      </Card>

      <Card>
        <p className="font-serif text-lg italic text-muted-foreground">
          {t("Cet assistant est entièrement local : aucune donnée ne quitte ton appareil.", "This assistant is fully local: no data leaves your device.")}
        </p>
        <div className="mt-3 flex items-center gap-2 text-accent-strong">
          <Languages className="h-4 w-4" />
          <span className="eyebrow">{t("Bilingue FR / EN", "Bilingual FR / EN")}</span>
        </div>
      </Card>
    </Page>
  );
}

function Avatar() {
  return <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-accent-strong"><Bot className="h-5 w-5" /></div>;
}
function UserAvatar() {
  return <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-strong text-primary-foreground font-display text-sm">M</div>;
}
