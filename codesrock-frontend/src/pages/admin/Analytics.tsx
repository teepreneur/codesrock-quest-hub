import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BarChart as BarChartIcon } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { adminService } from "@/services/admin.service";
import { ChartCard, StatTile } from "@/components/tracking/charts";
import { formatDate } from "@/components/tracking/labels";

const AXIS = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };
const GRID = "var(--chart-grid)";

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "No data yet" : `${v}%`);

const ACTIVITY_LABELS: Record<string, string> = {
  login: "Logins",
  video_started: "Videos started",
  video_completed: "Videos completed",
  evaluation_completed: "Quizzes passed",
  badge_earned: "Badges & certificates",
  level_up: "Levels reached",
  resource_downloaded: "Resources downloaded",
  session_registered: "Live sessions joined",
};

function MiniTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-bold">{label}</p>
      <p>{payload[0].value} {unit}</p>
    </div>
  );
}

function SimpleTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            {head.map((h, i) => <th key={h} className={`py-2 pr-3 font-semibold ${i ? "text-right" : ""}`}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0">
              {r.map((c, j) => <td key={j} className={`py-2 pr-3 ${j ? "text-right tabular-nums" : ""}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Analytics() {
  const navigate = useNavigate();
  const [days, setDays] = useState("30");

  // All four load in parallel; the period only affects engagement
  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: () => adminService.getAnalyticsOverview() });
  const courses = useQuery({ queryKey: ["admin-courses"], queryFn: () => adminService.getCourseAnalytics() });
  const schools = useQuery({ queryKey: ["admin-schools"], queryFn: () => adminService.getSchoolAnalytics() });
  const engagement = useQuery({
    queryKey: ["admin-engagement", days],
    queryFn: () => adminService.getEngagementMetrics(Number(days)),
    placeholderData: (prev) => prev,
  });

  const stats = overview.data?.stats;
  const eng = engagement.data;

  const activeUsersData = (eng?.dailyActiveUsers || []).map((d) => ({ label: formatDate(d.date), count: d.count }));
  const lessonsData = (eng?.lessonsLogged || []).map((d) => ({ label: formatDate(d.date), count: d.count }));
  const breakdown = (eng?.activityBreakdown || []).map((a) => ({ name: ACTIVITY_LABELS[a.type] || a.type.replace(/_/g, " "), count: a.count }));
  const courseRows = courses.data?.courses || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-deep-purple dark:text-white flex items-center gap-2">
            <BarChartIcon className="h-7 w-7 text-primary" /> Analytics
          </h1>
          <p className="text-muted-foreground">Teacher activity, training and children's progress, from recorded data only.</p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-44" aria-label="Period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Headline figures */}
      {overview.isLoading || !stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatTile
            label="Active teachers"
            value={`${stats.activeTeachers} / ${stats.totalTeachers}`}
            caption={`logged in within 30 days${stats.neverLoggedIn ? ` · ${stats.neverLoggedIn} never` : ""}`}
          />
          <StatTile label="Children tracked" value={String(stats.totalStudents)} caption={`in ${stats.classCount} classes`} />
          <StatTile label="Lessons logged" value={String(stats.lessonsLast30Days)} caption="in the last 30 days" />
          <StatTile label="On their own" value={pct(stats.studentCompletionRate)} caption="of activity-book ratings" />
          <StatTile label="Quiz pass rate" value={pct(stats.evaluationSuccessRate)} caption="teacher training quizzes" />
        </div>
      )}

      {stats && stats.neverLoggedIn > 0 && (
        <Card className="border-amber-400/60">
          <CardContent className="p-4 flex flex-wrap items-center gap-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
            <span className="font-semibold">
              {stats.neverLoggedIn} of {stats.totalTeachers} teachers have never logged in.
            </span>
            <button className="text-primary font-semibold hover:underline" onClick={() => navigate("/admin/users")}>
              Review in User Management
            </button>
          </CardContent>
        </Card>
      )}

      {/* Schools */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Schools</CardTitle>
          <CardDescription>Ranked by lessons logged, then children and active teachers. Open a school for its teachers.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {schools.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3">School</th>
                  <th className="py-2 pr-3 text-right">Teachers active</th>
                  <th className="py-2 pr-3 text-right">Never logged in</th>
                  <th className="py-2 pr-3 text-right">Classes</th>
                  <th className="py-2 pr-3 text-right">Children</th>
                  <th className="py-2 pr-3 text-right">Lessons</th>
                  <th className="py-2 pr-3 text-right">Book covered</th>
                  <th className="py-2 text-right">On their own</th>
                </tr>
              </thead>
              <tbody>
                {(schools.data?.schools || []).map((s) => (
                  <tr
                    key={s.id}
                    className="border-b last:border-0 hover:bg-muted/40 cursor-pointer"
                    onClick={() => navigate(`/admin/schools/${s.id}/performance`)}
                  >
                    <td className="py-2 pr-3">
                      <span className="font-semibold">{s.name}</span>
                      {!s.isActive && <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{s.activeTeachers} / {s.teacherCount}</td>
                    <td className={`py-2 pr-3 text-right tabular-nums ${s.neverLoggedIn ? "text-amber-700 dark:text-amber-400 font-semibold" : ""}`}>
                      {s.neverLoggedIn}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{s.classCount}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{s.learnerCount}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{s.lessonCount}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{s.coveragePercent === null ? "—" : `${s.coveragePercent}%`}</td>
                    <td className="py-2 text-right tabular-nums">{s.independentRate === null ? "—" : `${s.independentRate}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Active users per day"
          description={`People who did anything on the portal, last ${days} days`}
          empty={activeUsersData.length === 0 && "No activity in this period."}
          chart={
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={activeUsersData} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} minTickGap={16} />
                <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} width={32} />
                <Tooltip content={<MiniTooltip unit="active users" />} />
                <Line type="monotone" dataKey="count" stroke="var(--chart-series)" strokeWidth={2} dot={{ r: 4, fill: "var(--chart-series)" }} />
              </LineChart>
            </ResponsiveContainer>
          }
          table={<SimpleTable head={["Day", "Active users"]} rows={activeUsersData.map((d) => [d.label, d.count])} />}
        />

        <ChartCard
          title="Lessons logged per day"
          description={`CodesRock lessons teachers logged, last ${days} days`}
          empty={lessonsData.length === 0 && "No lessons logged in this period."}
          chart={
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={lessonsData} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} minTickGap={16} />
                <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} width={32} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} content={<MiniTooltip unit="lessons" />} />
                <Bar dataKey="count" fill="var(--chart-series)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          }
          table={<SimpleTable head={["Day", "Lessons"]} rows={lessonsData.map((d) => [d.label, d.count])} />}
        />

        <ChartCard
          title="What people did"
          description={`Recorded activity by type, last ${days} days`}
          empty={breakdown.length === 0 && "No activity in this period."}
          chart={
            <ResponsiveContainer width="100%" height={Math.max(160, breakdown.length * 34 + 40)}>
              <BarChart data={breakdown} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }} barCategoryGap={6}>
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={150} tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} content={<MiniTooltip unit="" />} />
                <Bar dataKey="count" fill="var(--chart-series)" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          }
          table={<SimpleTable head={["Activity", "Count"]} rows={breakdown.map((b) => [b.name, b.count])} />}
        />

        <ChartCard
          title="Teacher training by course"
          description="Average share of videos completed by teachers who started the course"
          empty={courseRows.every((c) => c.teachersStarted === 0) && "No teacher has started a training course yet."}
          chart={
            <ResponsiveContainer width="100%" height={Math.max(160, courseRows.length * 40 + 40)}>
              <BarChart
                data={courseRows.map((c) => ({ ...c, name: c.title, value: c.avgCompletion ?? 0 }))}
                layout="vertical"
                margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                barCategoryGap={8}
              >
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={170} tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const c = payload[0].payload as (typeof courseRows)[number];
                    return (
                      <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md space-y-0.5">
                        <p className="font-bold">{c.title}</p>
                        <p>{c.teachersStarted} teachers started · {c.teachersCompleted} finished</p>
                        <p>Average {c.avgCompletion ?? 0}% of {c.videosTotal} videos</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" fill="var(--chart-series)" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          }
          table={
            <SimpleTable
              head={["Course", "Videos", "Started", "Finished", "Avg done"]}
              rows={courseRows.map((c) => [c.title, c.videosTotal, c.teachersStarted, c.teachersCompleted, c.avgCompletion === null ? "—" : `${c.avgCompletion}%`])}
            />
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">In the last {days} days</CardTitle>
        </CardHeader>
        <CardContent>
          {eng ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
              {[
                ["Teachers active", `${eng.activeTeachers} / ${eng.teacherCount}`],
                ["Quiz attempts", eng.quizAttempts],
                ["Quizzes passed", eng.quizzesPassed],
                ["Certificates", eng.certificatesIssued],
                ["Badges", eng.badgesEarned],
                ["Resource downloads", eng.totalDownloads],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xl font-heading font-black">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          ) : (
            <Skeleton className="h-20 w-full" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
