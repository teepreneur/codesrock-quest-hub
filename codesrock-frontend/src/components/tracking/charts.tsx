import { ReactNode, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Table2 } from "lucide-react";
import type { SkillProgress, UnitProgress } from "@/services/tracking.service";
import { LEVELS, MODE_COLORS, MODE_LABELS, SKILL_LABELS, formatDate, scoreText } from "./labels";

/* Chart conventions (dataviz skill): thin marks with rounded data ends,
   solid hairline grid, a tooltip on hover, a legend for 2+ series, and a
   table view of the same numbers for every chart. */

const AXIS = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };
const GRID = "var(--chart-grid)";

/** Legend label in the normal text colour; the swatch carries the series colour. */
export const legendText = (value: string) => <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>;

/** Card with a Chart/Table toggle so every value is readable without colour. */
export function ChartCard({
  title, description, chart, table, empty,
}: {
  title: string;
  description?: string;
  chart: ReactNode;
  table: ReactNode;
  empty?: string | false;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base font-heading">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {!empty && (
          <div className="flex rounded-lg border p-0.5 shrink-0" role="group" aria-label={`${title} view`}>
            {(["chart", "table"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${view === v ? "bg-muted" : "text-muted-foreground"}`}
              >
                {v === "chart" ? <BarChart3 className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
                {v === "chart" ? "Chart" : "Table"}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {empty ? <p className="text-sm text-muted-foreground py-6 text-center">{empty}</p> : view === "chart" ? chart : table}
      </CardContent>
    </Card>
  );
}

function TooltipBox({ title, rows }: { title: string; rows: [string, string, string?][] }) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-bold mb-1">{title}</p>
      {rows.map(([label, value, color]) => (
        <p key={label} className="flex items-center gap-2">
          {color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
          <span className="text-muted-foreground">{label}</span>
          <span className="ml-auto font-semibold tabular-nums">{value}</span>
        </p>
      ))}
    </div>
  );
}

function SimpleTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            {head.map((h, i) => <th key={h} className={`py-2 pr-3 font-semibold ${i > 0 ? "text-right" : ""}`}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0">
              {r.map((c, j) => <td key={j} className={`py-2 pr-3 ${j > 0 ? "text-right tabular-nums" : ""}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Legend for the three ratings (ordinal teal ramp). */
export function LevelLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground" aria-label="Rating key">
      {LEVELS.map((l) => (
        <span key={l.level} className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: l.color }} /> {l.label}
        </span>
      ))}
    </div>
  );
}

/** Score 0-100 -> the rating colour it is closest to. */
export const scoreColor = (score: number | null) =>
  score === null ? "var(--chart-empty)" : score < 34 ? LEVELS[0].color : score < 67 ? LEVELS[1].color : LEVELS[2].color;

/** Average score per unit of the book (single series). */
export function UnitScoreChart({ units, title = "Progress through the book", description }: {
  units: UnitProgress[]; title?: string; description?: string;
}) {
  const data = units.map((u) => ({ name: `${u.position}. ${u.title}`, ...u }));
  const anyRated = units.some((u) => u.avgScore !== null);
  return (
    <ChartCard
      title={title}
      description={description ?? "Average rating per unit (0% = Not yet, 50% = With help, 100% = On their own)"}
      empty={!anyRated && "No ratings yet. Log a lesson to see progress here."}
      chart={
        <ResponsiveContainer width="100%" height={Math.max(220, data.length * 34 + 40)}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }} barCategoryGap={6}>
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis type="number" domain={[0, 100]} tick={AXIS} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={170} tick={AXIS} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const u = payload[0].payload as UnitProgress & { name: string };
                const covered = u.activitiesCovered ?? u.activitiesRated ?? 0;
                return (
                  <TooltipBox
                    title={u.name}
                    rows={[
                      ["Average", scoreText(u.avgScore), "var(--chart-series)"],
                      ["On their own", u.independentRate === null ? "—" : `${u.independentRate}%`],
                      [u.activitiesCovered !== undefined ? "Activities covered" : "Activities rated", `${covered} of ${u.activitiesTotal}`],
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="avgScore" fill="var(--chart-series)" radius={[0, 4, 4, 0]} maxBarSize={18} name="Average" />
          </BarChart>
        </ResponsiveContainer>
      }
      table={
        <SimpleTable
          head={["Unit", "Average", "On their own", "Covered"]}
          rows={units.map((u) => [
            `${u.position}. ${u.title}`,
            scoreText(u.avgScore),
            u.independentRate === null ? "—" : `${u.independentRate}%`,
            `${u.activitiesCovered ?? u.activitiesRated ?? 0}/${u.activitiesTotal}`,
          ])}
        />
      }
    />
  );
}

/** Practical vs In the book for units that have both (mats, robot). */
export function ModeGapChart({ units }: { units: UnitProgress[] }) {
  const data = units
    .filter((u) => u.hasBothModes)
    .map((u) => ({ name: u.title, practical: u.practicalScore ?? null, book: u.bookScore ?? null }));
  const anyRated = data.some((d) => d.practical !== null || d.book !== null);
  return (
    <ChartCard
      title="Hands-on vs in the book"
      description="Coding mats and robot mouse missions, rated with the tools and in the book. A gap means children can do it but struggle to write the code."
      empty={!anyRated && "No mat or robot missions rated in both ways yet."}
      chart={
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ left: 0, right: 8, top: 20, bottom: 4 }} barGap={2}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={AXIS} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TooltipBox
                    title={String(label)}
                    rows={payload.map((p) => [String(p.name), scoreText(p.value as number | null), String(p.color)])}
                  />
                ) : null
              }
            />
            <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} formatter={legendText} />
            <Bar dataKey="practical" name={MODE_LABELS.practical} fill={MODE_COLORS.practical} radius={[4, 4, 0, 0]} maxBarSize={36} label={{ position: "top", fontSize: 11, fill: "hsl(var(--foreground))", formatter: (v: number | null) => (v === null ? "" : `${v}%`) }} />
            <Bar dataKey="book" name={MODE_LABELS.book} fill={MODE_COLORS.book} radius={[4, 4, 0, 0]} maxBarSize={36} label={{ position: "top", fontSize: 11, fill: "hsl(var(--foreground))", formatter: (v: number | null) => (v === null ? "" : `${v}%`) }} />
          </BarChart>
        </ResponsiveContainer>
      }
      table={
        <SimpleTable
          head={["Unit", MODE_LABELS.practical, MODE_LABELS.book, "Gap"]}
          rows={data.map((d) => [
            d.name,
            scoreText(d.practical),
            scoreText(d.book),
            d.practical !== null && d.book !== null ? `${d.practical - d.book} pts` : "—",
          ])}
        />
      }
    />
  );
}

/** Skill scores (single series, nominal categories -> one colour). */
export function SkillChart({ skills }: { skills: SkillProgress[] }) {
  const data = skills.map((s) => ({ name: SKILL_LABELS[s.skill], ...s }));
  const anyRated = skills.some((s) => s.avgScore !== null);
  return (
    <ChartCard
      title="Skills"
      description="Each activity in the book builds one or more of these skills"
      empty={!anyRated && "No ratings yet."}
      chart={
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }} barCategoryGap={6}>
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis type="number" domain={[0, 100]} tick={AXIS} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={160} tick={AXIS} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const s = payload[0].payload as SkillProgress & { name: string };
                return (
                  <TooltipBox
                    title={s.name}
                    rows={[
                      ["Average", scoreText(s.avgScore), "var(--chart-series)"],
                      ["Ratings", String(s.ratedCount)],
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="avgScore" fill="var(--chart-series)" radius={[0, 4, 4, 0]} maxBarSize={18} name="Average" />
          </BarChart>
        </ResponsiveContainer>
      }
      table={
        <SimpleTable
          head={["Skill", "Average", "Ratings"]}
          rows={data.map((s) => [s.name, scoreText(s.avgScore), s.ratedCount])}
        />
      }
    />
  );
}

/** "% On their own" per lesson over time (single series line). */
export function TrendChart({ points, title = "Lesson by lesson" }: {
  points: { date: string; independentRate: number | null; avgScore: number | null; attendanceRate?: number | null }[];
  title?: string;
}) {
  // Number lessons that share a date so every point has its own label
  const seen = new Map<string, number>();
  const data = points
    .filter((p) => p.independentRate !== null)
    .map((p) => {
      const n = (seen.get(p.date) || 0) + 1;
      seen.set(p.date, n);
      const sameDay = points.filter((q) => q.date === p.date && q.independentRate !== null).length > 1;
      return { ...p, label: sameDay ? `${formatDate(p.date)} (${n})` : formatDate(p.date) };
    });
  return (
    <ChartCard
      title={title}
      description="Share of ratings that were “On their own” in each lesson"
      empty={data.length < 2 && "The trend appears after two lessons with ratings."}
      chart={
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} minTickGap={16} />
            <YAxis domain={[0, 100]} tick={AXIS} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as (typeof data)[number];
                return (
                  <TooltipBox
                    title={p.label}
                    rows={[
                      ["On their own", `${p.independentRate}%`, "var(--chart-series)"],
                      ["Average", scoreText(p.avgScore)],
                      ...(p.attendanceRate != null ? [["Attendance", `${p.attendanceRate}%`] as [string, string]] : []),
                    ]}
                  />
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="independentRate"
              name="On their own"
              stroke="var(--chart-series)"
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))", fill: "var(--chart-series)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      }
      table={
        <SimpleTable
          head={["Lesson", "On their own", "Average", "Attendance"]}
          rows={data.map((p) => [
            p.label,
            `${p.independentRate}%`,
            scoreText(p.avgScore),
            p.attendanceRate == null ? "—" : `${p.attendanceRate}%`,
          ])}
        />
      }
    />
  );
}

/** Stat tile: one number with a short caption. */
export function StatTile({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <Card className="glass-panel">
      <CardContent className="p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-3xl font-heading font-black text-deep-purple dark:text-white mt-1">{value}</p>
        {caption && <p className="text-xs text-muted-foreground mt-1">{caption}</p>}
      </CardContent>
    </Card>
  );
}
