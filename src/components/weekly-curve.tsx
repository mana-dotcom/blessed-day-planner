import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card } from "@/components/ui-kit";
import { useStore, dayKey, summarize } from "@/lib/store";

const config = { progress: { label: "Progression", color: "var(--accent-strong)" } } satisfies ChartConfig;

export function WeeklyCurve() {
  const [s, ready] = useStore();
  const now = new Date();
  const todayKey = dayKey(now);
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  const data = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const k = dayKey(d);
    const summary = !ready ? undefined : k === todayKey ? summarize(s) : s.history[k];
    const future = k > todayKey;
    return {
      day: d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
      progress: future ? null : summary?.progress ?? 0,
      prayers: future ? null : summary?.prayers ?? 0,
    };
  });

  const past = data.filter((d) => d.progress !== null);
  const avg = past.length ? Math.round(past.reduce((t, d) => t + (d.progress ?? 0), 0) / past.length) : 0;

  return (
    <Card title="Courbe de la semaine" right={<span className="eyebrow">Moy. {avg}%</span>}>
      <ChartContainer config={config} className="aspect-auto h-44 w-full">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="week-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-progress)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-progress)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
          <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v}%`} />} />
          <Area type="monotone" dataKey="progress" stroke="var(--color-progress)" strokeWidth={2.5} fill="url(#week-fill)"
            dot={{ r: 3, fill: "var(--color-progress)" }} connectNulls={false} isAnimationActive={false} />
        </AreaChart>
      </ChartContainer>
      <p className="eyebrow mt-2 text-[10px]">Calculée chaque jour à partir de tes prières, routines, tâches et habitudes.</p>
    </Card>
  );
}
