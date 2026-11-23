import type { State } from "@/lib/store";
import { progress } from "@/lib/store";

export type Lang = "fr" | "en";

export type ChatMsg = { id: string; from: "user" | "bot"; text: string; ts: number };

export type AgentState = { lang: Lang; messages: ChatMsg[] };

const KEY = "blessings-agent-v1";
const uid = () => Math.random().toString(36).slice(2, 9);

export function loadAgent(): AgentState {
  if (typeof window === "undefined") return { lang: "fr", messages: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<AgentState>;
      return { lang: p.lang === "en" ? "en" : "fr", messages: Array.isArray(p.messages) ? p.messages : [] };
    }
  } catch { /* ignore */ }
  return { lang: "fr", messages: [] };
}

export function saveAgent(st: AgentState) {
  try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* ignore */ }
}

export const mkMsg = (from: "user" | "bot", text: string): ChatMsg => ({ id: uid(), from, text, ts: Date.now() });

export function timeOfDay(hour: number): "morning" | "midday" | "afternoon" | "evening" | "night" {
  if (hour < 5) return "night";
  if (hour < 11) return "morning";
  if (hour < 14) return "midday";
  if (hour < 18) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
}

export type Snapshot = {
  progress: number;
  prayersDone: number; prayersTotal: number;
  pendingPrayers: string[];
  athkarCount: number; athkarGoal: number; athkarDone: boolean;
  morningDone: number; morningTotal: number; pendingMorning: string[];
  eveningDone: number; eveningTotal: number; pendingEvening: string[];
  waterMl: number; waterGoalMl: number;
  tasksDone: number; tasksTotal: number; pendingTasks: { label: string; time: string }[];
  hour: number; part: ReturnType<typeof timeOfDay>;
  name: string;
};

export function snapshot(s: State, hour = new Date().getHours()): Snapshot {
  const pend = <T extends { done: boolean; label: string }>(a: T[]) => a.filter((x) => !x.done).map((x) => x.label);
  const pendTask = s.blocks.filter((x) => !x.done).map((x) => ({ label: x.label, time: x.time }));
  return {
    progress: progress(s),
    prayersDone: s.prayers.filter((p) => p.done).length,
    prayersTotal: s.prayers.length,
    pendingPrayers: s.prayers.filter((p) => !p.done).map((p) => p.name),
    athkarCount: s.athkar.count,
    athkarGoal: s.athkar.goal,
    athkarDone: s.athkar.done,
    morningDone: s.morning.filter((x) => x.done).length,
    morningTotal: s.morning.length,
    pendingMorning: pend(s.morning),
    eveningDone: s.evening.filter((x) => x.done).length,
    eveningTotal: s.evening.length,
    pendingEvening: pend(s.evening),
    waterMl: s.water.glasses * s.water.glassMl,
    waterGoalMl: s.water.goalMl,
    tasksDone: s.blocks.filter((x) => x.done).length,
    tasksTotal: s.blocks.length,
    pendingTasks: pendTask,
    hour,
    part: timeOfDay(hour),
    name: s.name,
  };
}

export function dailySummary(snap: Snapshot, lang: Lang): string {
  const name = snap.name ? `${snap.name}, ` : "";
  const fr = `${name}tu es à ${snap.progress}% de ta journée. ` +
    `Prières ${snap.prayersDone}/${snap.prayersTotal}, athkar ${snap.athkarDone ? "fait" : `${snap.athkarCount}/${snap.athkarGoal}`}, ` +
    `skincare matin ${snap.morningDone}/${snap.morningTotal} · soir ${snap.eveningDone}/${snap.eveningTotal}, ` +
    `eau ${(snap.waterMl / 1000).toFixed(2)} / ${(snap.waterGoalMl / 1000).toFixed(1)} L, ` +
    `tâches ${snap.tasksDone}/${snap.tasksTotal}.`;
  const en = `${name}you're at ${snap.progress}% of your day. ` +
    `Prayers ${snap.prayersDone}/${snap.prayersTotal}, athkar ${snap.athkarDone ? "done" : `${snap.athkarCount}/${snap.athkarGoal}`}, ` +
    `skincare morning ${snap.morningDone}/${snap.morningTotal} · evening ${snap.eveningDone}/${snap.eveningTotal}, ` +
    `water ${(snap.waterMl / 1000).toFixed(2)} / ${(snap.waterGoalMl / 1000).toFixed(1)} L, ` +
    `tasks ${snap.tasksDone}/${snap.tasksTotal}.`;
  return lang === "fr" ? fr : en;
}

export function topPriority(snap: Snapshot, lang: Lang): { title: string; detail: string } {
  const L = (t: string, d: string) => ({ title: t, detail: d });

  if (snap.part === "morning") {
    if (snap.pendingPrayers.includes("Fajr"))
      return L("Fajr", lang === "fr" ? "La prière de l'aube est encore à faire." : "The dawn prayer is still pending.");
    if (snap.morningDone < snap.morningTotal)
      return L("Morning routine", lang === "fr" ? `Encore ${snap.morningTotal - snap.morningDone} étapes skincare du matin.` : `${snap.morningTotal - snap.morningDone} morning skincare steps left.`);
    if (snap.athkarCount === 0 && !snap.athkarDone)
      return L("Athkar", lang === "fr" ? "Commence tes athkar du matin." : "Start your morning athkar.");
  }
  if (snap.part === "midday" || snap.part === "afternoon") {
    if (snap.pendingPrayers.includes("Dhuhr"))
      return L("Dhuhr", lang === "fr" ? "Prière du midi à faire." : "Midday prayer pending.");
    if (snap.part === "afternoon" && snap.pendingPrayers.includes("Asr"))
      return L("Asr", lang === "fr" ? "Prière de l'après-midi à faire." : "Afternoon prayer pending.");
    if (snap.waterMl < snap.waterGoalMl * 0.5)
      return L("Hydratation", lang === "fr" ? "Tu as bu moins de la moitié de ton eau." : "You've had less than half your water.");
    const upcoming = snap.pendingTasks.find((t) => t.time && t.time >= `${String(snap.hour).padStart(2, "0")}:00`);
    if (upcoming)
      return L(upcoming.label, lang === "fr" ? `Bloc prévu vers ${upcoming.time}.` : `Time block around ${upcoming.time}.`);
  }
  if (snap.part === "evening") {
    if (snap.pendingPrayers.includes("Maghrib"))
      return L("Maghrib", lang === "fr" ? "Prière du coucher à faire." : "Sunset prayer pending.");
    if (snap.eveningDone < snap.eveningTotal)
      return L("Night routine", lang === "fr" ? `Encore ${snap.eveningTotal - snap.eveningDone} étapes skincare du soir.` : `${snap.eveningTotal - snap.eveningDone} evening skincare steps left.`);
  }
  if (snap.part === "night") {
    if (snap.pendingPrayers.includes("Isha"))
      return L("Isha", lang === "fr" ? "Prière de la nuit à faire avant de dormir." : "Night prayer pending before sleep.");
    if (snap.eveningDone < snap.eveningTotal)
      return L("Night routine", lang === "fr" ? "Termine ta routine du soir." : "Finish your evening routine.");
  }

  const cands: { left: number; title: string; detail: string }[] = [
    { left: snap.pendingPrayers.length, title: lang === "fr" ? "Prières" : "Prayers", detail: lang === "fr" ? `${snap.pendingPrayers.length} prières restantes.` : `${snap.pendingPrayers.length} prayers left.` },
    { left: snap.pendingTasks.length, title: lang === "fr" ? "Tâches" : "Tasks", detail: lang === "fr" ? `${snap.pendingTasks.length} tâches à faire.` : `${snap.pendingTasks.length} tasks to do.` },
    { left: snap.pendingMorning.length, title: lang === "fr" ? "Routine du matin" : "Morning routine", detail: lang === "fr" ? `${snap.pendingMorning.length} étapes restantes.` : `${snap.pendingMorning.length} steps left.` },
    { left: snap.pendingEvening.length, title: lang === "fr" ? "Routine du soir" : "Evening routine", detail: lang === "fr" ? `${snap.pendingEvening.length} étapes restantes.` : `${snap.pendingEvening.length} steps left.` },
    { left: snap.waterMl < snap.waterGoalMl ? Math.ceil((snap.waterGoalMl - snap.waterMl) / 250) : 0, title: lang === "fr" ? "Hydratation" : "Hydration", detail: lang === "fr" ? `${Math.ceil((snap.waterGoalMl - snap.waterMl) / 250)} verres restants.` : `${Math.ceil((snap.waterGoalMl - snap.waterMl) / 250)} glasses left.` },
    { left: snap.athkarDone ? 0 : 1, title: "Athkar", detail: lang === "fr" ? "Tes athkar du jour." : "Today's athkar." },
  ];
  const best = cands.filter((c) => c.left > 0).sort((a, b) => b.left - a.left)[0];
  if (best) return L(best.title, best.detail);
  return L(lang === "fr" ? "Tout est fait" : "All done", lang === "fr" ? "Alhamdulillah, ta journée est complète ♡" : "Alhamdulillah, your day is complete ♡");
}

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function apiKey(): string | undefined {
  return import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
}

export function isAiConfigured(): boolean {
  return Boolean(apiKey());
}

function systemPrompt(snap: Snapshot | null, lang: Lang): string {
  const name = snap?.name || "friend";
  const context = snap
    ? `Today's planner progress (${lang === "fr" ? "French interface" : "English interface"}):
- Overall progress: ${snap.progress}%
- Prayers (Salat): ${snap.prayersDone}/${snap.prayersTotal} done${snap.pendingPrayers.length ? ` — still pending: ${snap.pendingPrayers.join(", ")}` : ""}
- Athkar (remembrance): ${snap.athkarDone ? "completed" : `${snap.athkarCount}/${snap.athkarGoal}`}
- Morning skincare routine: ${snap.morningDone}/${snap.morningTotal}${snap.pendingMorning.length ? ` — remaining: ${snap.pendingMorning.join(", ")}` : ""}
- Evening skincare routine: ${snap.eveningDone}/${snap.eveningTotal}${snap.pendingEvening.length ? ` — remaining: ${snap.pendingEvening.join(", ")}` : ""}
- Water: ${(snap.waterMl / 1000).toFixed(2)} L of ${(snap.waterGoalMl / 1000).toFixed(1)} L goal
- Tasks/time blocks: ${snap.tasksDone}/${snap.tasksTotal} done${snap.pendingTasks.length ? ` — to do: ${snap.pendingTasks.map((t) => t.label).join(", ")}` : ""}
- Current time of day: ${snap.part} (hour ${snap.hour})`
    : "Today's planner progress is not loaded yet.";

  return `You are the Blessed Day Planner assistant, a warm and encouraging companion for ${name}, a Muslim user who plans their day around faith and self-care.

${context}

Guidelines:
- Answer freely on ANY topic the user asks about — general questions, product advice, explanations, recommendations, life, faith, skincare, study tips, etc. You are not limited to the planner.
- When the user asks about their day, prayers, routines, water or tasks, use the planner context above to give a precise, helpful answer.
- Reply in the SAME language and script the user writes in. The user may write in French, English, Tunisian Arabic in Latin script (derja), or Arabic script — always match them naturally and switch if they switch.
- Keep a gentle, encouraging, faith-oriented tone. You may use a soft "♡" occasionally but do not overdo it.
- Be concise: prefer short, useful answers over long essays, unless the user asks for detail.`;
}

type GeminiContent = { role: "user" | "model"; parts: { text: string }[] };

export async function aiReply(
  history: ChatMsg[],
  userText: string,
  snap: Snapshot | null,
  lang: Lang,
  signal?: AbortSignal,
): Promise<string> {
  const key = apiKey();
  if (!key) {
    return lang === "fr"
      ? "Je n'ai pas de clé API configurée (VITE_GEMINI_API_KEY). Ajoute-la dans le fichier .env pour activer l'assistant IA ♡"
      : "No API key configured (VITE_GEMINI_API_KEY). Add it to the .env file to enable the AI assistant ♡";
  }

  const contents: GeminiContent[] = history.slice(-12).map((m) => ({
    role: m.from === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));
  contents.push({ role: "user", parts: [{ text: userText }] });

  const body = {
    system_instruction: { parts: [{ text: systemPrompt(snap, lang) }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
  };

  try {
    const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return lang === "fr"
        ? `L'assistant IA a renvoyé une erreur (${res.status}). ${detail ? "Détail : " + detail.slice(0, 200) : ""}`
        : `The AI assistant returned an error (${res.status}). ${detail ? "Detail: " + detail.slice(0, 200) : ""}`;
    }
    const data = await res.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ??
      data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return lang === "fr"
        ? "Je n'ai pas pu générer de réponse. Essaie de reformuler ♡"
        : "I couldn't generate a reply. Try rephrasing ♡";
    }
    return text.trim();
  } catch (err) {
    if ((err as Error).name === "AbortError") return "";
    return lang === "fr"
      ? "Je n'arrive pas à joindre l'assistant IA. Vérifie ta connexion internet et réessaie ♡"
      : "I can't reach the AI assistant. Check your internet connection and try again ♡";
  }
}

export const QUICK_ACTIONS: Record<Lang, { label: string; q: string }[]> = {
  fr: [
    { label: "Résumé", q: "Donne-moi un résumé de ma journée." },
    { label: "Priorité", q: "Quelle est ma priorité maintenant ?" },
    { label: "Prières", q: "Quelles prières me reste-t-il ?" },
    { label: "Eau", q: "Combien d'eau me reste-t-il à boire ?" },
    { label: "Tâches", q: "Quelles sont mes tâches en attente ?" },
    { label: "Verset", q: "Donne-moi un verset du Coran avec son sens." },
  ],
  en: [
    { label: "Summary", q: "Give me a summary of my day." },
    { label: "Priority", q: "What's my priority right now?" },
    { label: "Prayers", q: "Which prayers do I have left?" },
    { label: "Water", q: "How much water do I still need to drink?" },
    { label: "Tasks", q: "What are my pending tasks?" },
    { label: "Verse", q: "Give me a Quran verse with its meaning." },
  ],
};
