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
  const name = snap.name ? (lang === "fr" ? `${snap.name}, ` : `${snap.name}, `) : "";
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
  const fr = (t: string, d: string) => ({ title: t, detail: d });
  const en = (t: string, d: string) => ({ title: t, detail: d });
  const L = lang === "fr" ? fr : en;

  // Time-aware priority
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

  // Fall back to whichever bucket has the most remaining
  const cands: { key: string; left: number; title: string; detail: string }[] = [
    { key: "prayers", left: snap.pendingPrayers.length, title: lang === "fr" ? "Prières" : "Prayers", detail: lang === "fr" ? `${snap.pendingPrayers.length} prières restantes.` : `${snap.pendingPrayers.length} prayers left.` },
    { key: "tasks", left: snap.pendingTasks.length, title: lang === "fr" ? "Tâches" : "Tasks", detail: lang === "fr" ? `${snap.pendingTasks.length} tâches à faire.` : `${snap.pendingTasks.length} tasks to do.` },
    { key: "morning", left: snap.pendingMorning.length, title: lang === "fr" ? "Routine du matin" : "Morning routine", detail: lang === "fr" ? `${snap.pendingMorning.length} étapes restantes.` : `${snap.pendingMorning.length} steps left.` },
    { key: "evening", left: snap.pendingEvening.length, title: lang === "fr" ? "Routine du soir" : "Evening routine", detail: lang === "fr" ? `${snap.pendingEvening.length} étapes restantes.` : `${snap.pendingEvening.length} steps left.` },
    { key: "water", left: snap.waterMl < snap.waterGoalMl ? Math.ceil((snap.waterGoalMl - snap.waterMl) / 250) : 0, title: lang === "fr" ? "Hydratation" : "Hydration", detail: lang === "fr" ? `${Math.ceil((snap.waterGoalMl - snap.waterMl) / 250)} verres restants.` : `${Math.ceil((snap.waterGoalMl - snap.waterMl) / 250)} glasses left.` },
    { key: "athkar", left: snap.athkarDone ? 0 : 1, title: "Athkar", detail: lang === "fr" ? "Tes athkar du jour." : "Today's athkar." },
  ];
  const best = cands.filter((c) => c.left > 0).sort((a, b) => b.left - a.left)[0];
  if (best) return L(best.title, best.detail);
  return L(lang === "fr" ? "Tout est fait" : "All done", lang === "fr" ? "Alhamdulillah, ta journée est complète ♡" : "Alhamdulillah, your day is complete ♡");
}

const has = (q: string, ...keys: string[]) => keys.some((k) => q.includes(k));

export function botReply(text: string, snap: Snapshot, lang: Lang): string {
  const q = text.toLowerCase().trim();
  const fr = lang === "fr";

  if (has(q, "bonjour", "salut", "hello", "hi", "salam", "assalam") || q === "")
    return fr
      ? `Wa alaykum salam ${snap.name ? snap.name : ""}♡ Je suis ton assistant local. Pose-moi une question ou tape une commande comme « prières », « eau », « tâches », « résumé ».`
      : `Hello ${snap.name ? snap.name : ""}♡ I'm your local assistant. Ask me something or try a command like "prayers", "water", "tasks", "summary".`;

  if (has(q, "résumé", "resume", "summary", "recap", "bilan", "overview"))
    return dailySummary(snap, lang);

  if (has(q, "priorité", "priorite", "priority", "quoi faire", "what next", "what should i"))
    return fr ? `Priorité : ${topPriority(snap, lang).title}. ${topPriority(snap, lang).detail}` : `Priority: ${topPriority(snap, lang).title}. ${topPriority(snap, lang).detail}`;

  if (has(q, "prière", "priere", "salat", "prayer", "namaz"))
    return fr
      ? snap.pendingPrayers.length === 0 ? "Toutes tes prières sont faites, alhamdulillah ♡" : `Il te reste : ${snap.pendingPrayers.join(", ")}.`
      : snap.pendingPrayers.length === 0 ? "All your prayers are done, alhamdulillah ♡" : `Remaining: ${snap.pendingPrayers.join(", ")}.`;

  if (has(q, "athkar", "dhikr", "dikhr"))
    return fr
      ? snap.athkarDone ? "Athkar validés, bravo ♡" : `Athkar : ${snap.athkarCount}/${snap.athkarGoal}. Continue !`
      : snap.athkarDone ? "Athkar done, well done ♡" : `Athkar: ${snap.athkarCount}/${snap.athkarGoal}. Keep going!`;

  if (has(q, "skincare", "routine", "glow", "morning", "matin", "soir", "evening", "night routine"))
    return fr
      ? `Matin ${snap.morningDone}/${snap.morningTotal} · Soir ${snap.eveningDone}/${snap.eveningTotal}.` +
        (snap.pendingMorning.length ? ` Matin à faire : ${snap.pendingMorning.join(", ")}.` : "") +
        (snap.pendingEvening.length ? ` Soir à faire : ${snap.pendingEvening.join(", ")}.` : "")
      : `Morning ${snap.morningDone}/${snap.morningTotal} · Evening ${snap.eveningDone}/${snap.eveningTotal}.` +
        (snap.pendingMorning.length ? ` Morning left: ${snap.pendingMorning.join(", ")}.` : "") +
        (snap.pendingEvening.length ? ` Evening left: ${snap.pendingEvening.join(", ")}.` : "");

  if (has(q, "eau", "water", "hydrate", "boire", "drink"))
    return fr
      ? snap.waterMl >= snap.waterGoalMl ? "Objectif eau atteint, bravo ♡" : `${(snap.waterMl / 1000).toFixed(2)} L / ${(snap.waterGoalMl / 1000).toFixed(1)} L. Encore ${Math.ceil((snap.waterGoalMl - snap.waterMl) / 250)} verres.`
      : snap.waterMl >= snap.waterGoalMl ? "Water goal reached, well done ♡" : `${(snap.waterMl / 1000).toFixed(2)} L / ${(snap.waterGoalMl / 1000).toFixed(1)} L. ${Math.ceil((snap.waterGoalMl - snap.waterMl) / 250)} glasses to go.`;

  if (has(q, "tâche", "tache", "task", "todo", "block", "temps", "time block", "to do"))
    return fr
      ? snap.pendingTasks.length === 0 ? "Aucune tâche en attente ♡" : `${snap.pendingTasks.length} tâche(s) à faire : ${snap.pendingTasks.map((t) => t.label).join(", ")}.`
      : snap.pendingTasks.length === 0 ? "No pending tasks ♡" : `${snap.pendingTasks.length} task(s) left: ${snap.pendingTasks.map((t) => t.label).join(", ")}.`;

  if (has(q, "motiv", "courage", "encourage", "quote", "verset", "ayah", "rappel", "reminder")) {
    const frQ = ["« Certes, avec la difficulté vient la facilité. » — 94:6", "« Et quand Mon serviteur t'interroge sur Moi, alors Je suis proche. » — 2:186", "« Ne faiblissez pas et ne vous affligez pas. » — 3:139"];
    const enQ = ["\"Indeed, with hardship comes ease.\" — 94:6", "\"And when My servants ask you about Me, I am near.\" — 2:186", "\"Do not weaken and do not grieve.\" — 3:139"];
    const arr = fr ? frQ : enQ;
    return arr[Math.floor(Math.random() * arr.length)]!;
  }

  if (has(q, "merci", "thank", "shukran", "baraka"))
    return fr ? "Avec plaisir ♡ Continue, tu gères." : "You're welcome ♡ Keep going, you've got this.";

  if (has(q, "aide", "help", "commande", "command", "que sais-tu", "what can you"))
    return fr
      ? "Je peux te résumer ta journée, te donner ta priorité, et te dire où tu en es sur prières, athkar, skincare, eau et tâches. Essaie : « résumé », « priorité », « prières », « eau », « tâches », « verset »."
      : "I can summarize your day, tell you your top priority, and check prayers, athkar, skincare, water and tasks. Try: \"summary\", \"priority\", \"prayers\", \"water\", \"tasks\", \"verse\".";

  if (has(q, "langue", "language", "français", "anglais", "english", "french", "fr", "en"))
    return fr ? "Change la langue avec le bouton EN / FR en haut de la page." : "Switch language with the EN / FR button at the top of the page.";

  return fr
    ? "Je ne suis pas sûr de comprendre. Tape « aide » pour voir ce que je sais faire ♡"
    : "I'm not sure I understand. Type \"help\" to see what I can do ♡";
}

export const QUICK_ACTIONS: Record<Lang, { label: string; q: string }[]> = {
  fr: [
    { label: "Résumé", q: "résumé" },
    { label: "Priorité", q: "priorité" },
    { label: "Prières", q: "prieres" },
    { label: "Eau", q: "eau" },
    { label: "Tâches", q: "taches" },
    { label: "Verset", q: "verset" },
  ],
  en: [
    { label: "Summary", q: "summary" },
    { label: "Priority", q: "priority" },
    { label: "Prayers", q: "prayers" },
    { label: "Water", q: "water" },
    { label: "Tasks", q: "tasks" },
    { label: "Verse", q: "verse" },
  ],
};
