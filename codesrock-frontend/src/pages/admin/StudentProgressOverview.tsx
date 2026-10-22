import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronRight, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { authService } from "@/services/auth.service";
import { trackingService, type OverviewRow, type SchoolOverview } from "@/services/tracking.service";
import { ChartCard, StatTile, legendText } from "@/components/tracking/charts";
import { ExportMenu } from "@/components/admin/ExportMenu";
import { MODE_COLORS, MODE_LABELS, formatDate, scoreText } from "@/components/tracking/labels";

const STALE_DAYS = 14;

const daysSince = (iso: string | null) =>
  iso ? Math.floor((Date.now() - new Date(`${iso}T00:00:00`).getTime()) / 86_400_000) : null;

const isStale = (iso: string | null) => {
  const d = daysSince(iso);
  return d === null || d > STALE_DAYS;
};

const pctOrDash = (v: number | null) => (v === null ? "—" : `${v}%`);

function LastLesson({ date }: { date: string | null }) {
  if (!isStale(date)) return <span>{formatDate(date)}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
      <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
      {date ? `${formatDate(date)} (${daysSince(date)} days ago)` : "Never"}
    </span>
  );
}

export default function StudentProgressOverview() {
  const navigate = useNavigate();
  const user = authService.getStoredUser();
  const isSuperAdmin = user?.role === "super_admin";

  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<SchoolOverview[]>([]);
  const [classes, setClasses] = useState<OverviewRow[]>([]);
  const [schoolFilter, setSchoolFilter] = useState<string>("all");

  useEffect(() => {
    trackingService
      .getOverview()
      .then((d) => {
        setSchools(d.schools);
        setClasses(d.classes);
      })
      .catch((error) => toast.error(error.message || "Could not load student progress"))
      .finally(() => setLoading(false));
  }, []);

  const visibleClasses = useMemo(
    () => (schoolFilter === "all" ? classes : classes.filter((c) => (c.schoolId || "none") === schoolFilter)),
    [classes, schoolFilter]
  );
  const visibleSchools = schoolFilter === "all" ? schools : schools.filter((s) => (s.schoolId || "none") === schoolFilter);

  const totals = useMemo(() => {
    const rated = visibleClasses.filter((c) => c.independentRate !== null);
    return {
      learners: visibleClasses.reduce((a, c) => a + c.learnerCount, 0),
      lessons: visibleClasses.reduce((a, c) => a + c.lessonCount, 0),
      stale: visibleClasses.filter((c) => isStale(c.lastLessonDate)).length,
      independent: rated.length ? Math.round(rated.reduce((a, c) => a + (c.independentRate || 0), 0) / rated.length) : null,
    };
  }, [visibleClasses]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const schoolChartData = visibleSchools.map((s) => ({
    name: s.schoolName,
    practical: s.practicalScore,
    book: s.bookScore,
    independent: s.independentRate,
    coverage: s.coveragePercent,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-deep-purple dark:text-white flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" /> Student progress
          </h1>
          <p className="text-muted-foreground">
            How children are doing in the CodesRock 1 activity book, from the lessons teachers log.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <ExportMenu types={["children"]} schoolId={schoolFilter === "all" || schoolFilter === "none" ? undefined : schoolFilter} />
        {isSuperAdmin && schools.length > 1 && (
          <Select value={schoolFilter} onValueChange={setSchoolFilter}>
            <SelectTrigger className="w-64" aria-label="Filter by school">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All schools</SelectItem>
              {schools.map((s) => (
                <SelectItem key={s.schoolId || "none"} value={s.schoolId || "none"}>{s.schoolName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Children" value={String(totals.learners)} caption={`in ${visibleClasses.length} classes`} />
        <StatTile label="Lessons logged" value={String(totals.lessons)} />
        <StatTile label="On their own" value={pctOrDash(totals.independent)} caption="average across classes" />
        <StatTile
          label="Quiet classes"
          value={String(totals.stale)}
          caption={`no lesson logged in ${STALE_DAYS}+ days`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Hands-on vs in the book, by school"
          description="Mat and robot missions. A big gap means children can do it but struggle to write the code."
          empty={!schoolChartData.some((d) => d.practical !== null || d.book !== null) && "No mat or robot missions rated yet."}
          chart={
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={schoolChartData} margin={{ left: 0, right: 8, top: 20, bottom: 4 }} barGap={2}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={44} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} formatter={(v: number | null) => scoreText(v)} />
                <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} formatter={legendText} />
                <Bar dataKey="practical" name={MODE_LABELS.practical} fill={MODE_COLORS.practical} radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="book" name={MODE_LABELS.book} fill={MODE_COLORS.book} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          }
          table={
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">School</th><th className="text-right">{MODE_LABELS.practical}</th><th className="text-right">{MODE_LABELS.book}</th>
                </tr>
              </thead>
              <tbody>
                {schoolChartData.map((d) => (
                  <tr key={d.name} className="border-b last:border-0">
                    <td className="py-2">{d.name}</td>
                    <td className="text-right tabular-nums">{scoreText(d.practical)}</td>
                    <td className="text-right tabular-nums">{scoreText(d.book)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading">Schools</CardTitle>
            <CardDescription>Coverage of the book and how children are doing</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-2">School</th>
                  <th className="text-right pr-2">Children</th>
                  <th className="text-right pr-2">Book covered</th>
                  <th className="text-right pr-2">On their own</th>
                  <th className="text-right">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {visibleSchools.map((s) => (
                  <tr key={s.schoolId || "none"} className="border-b last:border-0">
                    <td className="py-2 pr-2">
                      <p className="font-semibold">{s.schoolName}</p>
                      <p className="text-xs text-muted-foreground"><LastLesson date={s.lastLessonDate} /></p>
                    </td>
                    <td className="text-right tabular-nums pr-2">{s.learnerCount}</td>
                    <td className="text-right tabular-nums pr-2">{pctOrDash(s.coveragePercent)}</td>
                    <td className="text-right tabular-nums pr-2">{pctOrDash(s.independentRate)}</td>
                    <td className="text-right tabular-nums">{pctOrDash(s.attendanceRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Classes</CardTitle>
          <CardDescription>Open a class to see its charts, lessons and each child.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {visibleClasses.length === 0 && <p className="text-muted-foreground text-sm">No classes yet.</p>}
          {visibleClasses.map((c) => (
            <button
              key={c.classId}
              type="button"
              onClick={() => navigate(`/classes/${c.classId}`)}
              className="w-full text-left rounded-xl border p-3 hover:bg-muted/50 transition-colors flex items-center gap-3"
            >
              <div className="flex-1 min-w-0 grid gap-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] md:items-center">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{c.className}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.schoolName || "No school"} · {c.teacherName || "No teacher"} · {c.learnerCount} children
                  </p>
                </div>
                <p className="text-xs"><span className="text-muted-foreground md:hidden">Last lesson: </span><LastLesson date={c.lastLessonDate} /></p>
                <p className="text-xs tabular-nums"><span className="text-muted-foreground">Covered </span>{pctOrDash(c.coveragePercent)}</p>
                <p className="text-xs tabular-nums"><span className="text-muted-foreground">On own </span>{pctOrDash(c.independentRate)}</p>
                <p className="text-xs tabular-nums">
                  <span className="text-muted-foreground">Hands-on / book </span>
                  {c.practicalScore === null || c.bookScore === null ? "—" : `${c.practicalScore} / ${c.bookScore}`}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
