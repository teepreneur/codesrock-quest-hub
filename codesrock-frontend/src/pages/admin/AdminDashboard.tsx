import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertTriangle, BookOpenCheck, Building2, CheckCircle2, ChevronRight, ClipboardList, Copy, KeyRound, LayoutDashboard, UserX,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { authService } from "@/services/auth.service";
import { adminService, type ActivationOverview, type UserCredentials } from "@/services/admin.service";
import { ChartCard, StatTile } from "@/components/tracking/charts";
import { ExportMenu } from "@/components/admin/ExportMenu";

const AXIS = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };
const GRID = "var(--chart-grid)";

type FollowUp = ActivationOverview["followUps"][number];

const FOLLOW_UP_INFO: Record<FollowUp["type"], { icon: typeof UserX; title: (f: FollowUp) => string; detail: (f: FollowUp, days: number) => string }> = {
  school_no_classes: {
    icon: Building2,
    title: (f) => `${f.schoolName} has no classes yet`,
    detail: () => "Teachers have accounts but no class has been set up, so no children are being tracked.",
  },
  never_logged_in: {
    icon: UserX,
    title: (f) => `${f.teacherName} has never logged in`,
    detail: (f) => `${f.schoolName}${f.days !== null ? ` · account created ${f.days} days ago` : ""}. Their login details may need resending.`,
  },
  no_class: {
    icon: ClipboardList,
    title: (f) => `${f.teacherName} hasn't set up a class`,
    detail: (f) => `${f.schoolName} · has logged in but no class or children yet.`,
  },
  class_never_logged: {
    icon: BookOpenCheck,
    title: (f) => `${f.className}: no lessons logged yet`,
    detail: (f) => `${f.teacherName || "Teacher"} · ${f.schoolName}. The class has children but no lesson has been recorded.`,
  },
  class_quiet: {
    icon: BookOpenCheck,
    title: (f) => `${f.className}: no lesson for ${f.days} days`,
    detail: (f, days) => `${f.teacherName || "Teacher"} · ${f.schoolName}. Classes should log a lesson at least every ${days} days.`,
  },
};

const weekLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = authService.getStoredUser();
  const canFilter = user?.role === "super_admin" || user?.role === "content_admin";
  const [schoolId, setSchoolId] = useState<string>("all");
  const [showAll, setShowAll] = useState(false);
  const [resetTarget, setResetTarget] = useState<FollowUp | null>(null);
  const [credentials, setCredentials] = useState<(UserCredentials & { name: string }) | null>(null);
  const [resetting, setResetting] = useState(false);

  // Always fetch all schools once (for the filter list); refetch for a selected school
  const allQuery = useQuery({ queryKey: ["admin-activation", "all"], queryFn: () => adminService.getActivationOverview() });
  const schoolQuery = useQuery({
    queryKey: ["admin-activation", schoolId],
    queryFn: () => adminService.getActivationOverview(schoolId),
    enabled: schoolId !== "all",
  });
  const query = schoolId === "all" ? allQuery : schoolQuery;
  const data = query.data;

  const resetLogin = async () => {
    if (!resetTarget?.teacherId) return;
    try {
      setResetting(true);
      const res = await adminService.resetUserPassword(resetTarget.teacherId);
      setCredentials({ ...res.credentials, name: resetTarget.teacherName || "" });
      setResetTarget(null);
    } catch (error: any) {
      toast.error(error.message || "Could not reset the login");
    } finally {
      setResetting(false);
    }
  };

  const copyCredentials = () => {
    if (!credentials) return;
    const text = `CodesRock Teacher Hub login for ${credentials.name}\nSchool ID: ${credentials.schoolCode}\nUsername: ${credentials.username}\nPassword: ${credentials.password}`;
    navigator.clipboard.writeText(text).then(() => toast.success("Login details copied"));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-deep-purple dark:text-white flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7 text-primary" /> Overview
          </h1>
          <p className="text-muted-foreground">
            {data?.scope?.schoolName && !canFilter ? `${data.scope.schoolName} · ` : ""}
            Are teachers getting started, and are lessons happening?
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <ExportMenu schoolId={schoolId === "all" ? undefined : schoolId} />
        {canFilter && (allQuery.data?.schools.length || 0) > 1 && (
          <Select value={schoolId} onValueChange={setSchoolId}>
            <SelectTrigger className="w-64" aria-label="Filter by school">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All schools</SelectItem>
              {allQuery.data!.schools.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}{!s.isActive ? " (inactive)" : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        </div>
      </div>

      {query.isLoading || !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatTile label="Schools" value={String(data.kpis.activeSchools)} caption="active, with teachers" />
            <StatTile
              label="Teachers active"
              value={`${data.kpis.activeTeachers} / ${data.kpis.totalTeachers}`}
              caption={`logged in within ${data.activeWindowDays} days`}
            />
            <StatTile
              label="Classes logging"
              value={`${data.kpis.classesLoggingRegularly} / ${data.kpis.classes}`}
              caption={`a lesson in the last ${data.regularLoggingDays} days`}
            />
            <StatTile label="Children tracked" value={String(data.kpis.children)} caption="in teachers' class rosters" />
            <StatTile
              label="On their own"
              value={data.kpis.independentRate === null ? "No data yet" : `${data.kpis.independentRate}%`}
              caption="of activity-book ratings"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-5">
            <div className="xl:col-span-3 space-y-6">
              <ChartCard
                title="Teacher activation"
                description="How far teachers have got, from account to logging lessons regularly. Each step counts teachers who also reached the steps before it."
                empty={data.kpis.totalTeachers === 0 && "No teacher accounts yet."}
                chart={
                  <ResponsiveContainer width="100%" height={data.funnel.length * 40 + 30}>
                    <BarChart data={data.funnel} layout="vertical" margin={{ left: 8, right: 56, top: 4, bottom: 4 }} barCategoryGap={8}>
                      <CartesianGrid horizontal={false} stroke={GRID} />
                      <XAxis type="number" allowDecimals={false} domain={[0, data.kpis.totalTeachers]} tick={AXIS} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="label" width={190} tick={AXIS} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                        content={({ active, payload }) =>
                          active && payload?.length ? (
                            <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                              <p className="font-bold">{(payload[0].payload as any).label}</p>
                              <p>{(payload[0].payload as any).count} teachers ({(payload[0].payload as any).percent ?? 0}%)</p>
                            </div>
                          ) : null
                        }
                      />
                      <Bar dataKey="count" fill="var(--chart-series)" radius={[0, 4, 4, 0]} maxBarSize={20}>
                        <LabelList
                          dataKey="count"
                          position="right"
                          formatter={(v: number) => `${v}`}
                          style={{ fontSize: 12, fill: "hsl(var(--foreground))", fontWeight: 600 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                }
                table={
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="py-2">Step</th><th className="py-2 text-right">Teachers</th><th className="py-2 text-right">Of all</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.funnel.map((f) => (
                        <tr key={f.key} className="border-b last:border-0">
                          <td className="py-2">{f.label}</td>
                          <td className="py-2 text-right tabular-nums">{f.count}</td>
                          <td className="py-2 text-right tabular-nums">{f.percent === null ? "—" : `${f.percent}%`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
              />

              {schoolId === "all" && data.schools.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-heading">Activation by school</CardTitle>
                    <CardDescription>Teachers at each step. Click a school to see its teachers.</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="py-2 pr-3">School</th>
                          {data.funnel.map((f) => (
                            <th key={f.key} className="py-2 px-2 text-right font-semibold max-w-[90px] leading-tight">{f.label.replace(/ \(.*\)/, "")}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.schools.filter((s) => s.teacherCount > 0 || s.isActive).map((s) => (
                          <tr
                            key={s.id}
                            className="border-b last:border-0 hover:bg-muted/40 cursor-pointer"
                            onClick={() => navigate(`/admin/schools/${s.id}/performance`)}
                          >
                            <td className="py-2 pr-3 font-semibold">{s.name}</td>
                            {s.funnel.map((f, i) => {
                              // Highlight steps where teachers drop off
                              const prev = i === 0 ? null : s.funnel[i - 1].count;
                              const drop = prev !== null && prev > 0 && f.count < prev;
                              return (
                                <td key={f.key} className={`py-2 px-2 text-right tabular-nums ${drop ? "text-amber-700 dark:text-amber-400 font-semibold" : ""}`}>
                                  {f.count}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-[11px] text-muted-foreground mt-2">Amber = fewer teachers than the step before.</p>
                  </CardContent>
                </Card>
              )}

              <ChartCard
                title="Lessons logged per week"
                description="CodesRock lessons teachers recorded in the last 12 weeks"
                chart={
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data.weekly.map((w) => ({ ...w, label: weekLabel(w.weekStart) }))} margin={{ left: 0, right: 8, top: 16, bottom: 4 }}>
                      <CartesianGrid vertical={false} stroke={GRID} />
                      <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} width={32} />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                        content={({ active, payload }) =>
                          active && payload?.length ? (
                            <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                              <p className="font-bold">Week of {(payload[0].payload as any).label}</p>
                              <p>{(payload[0].payload as any).lessons} lessons · {(payload[0].payload as any).classes} classes</p>
                            </div>
                          ) : null
                        }
                      />
                      <Bar dataKey="lessons" fill="var(--chart-series)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                }
                table={
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="py-2">Week of</th><th className="py-2 text-right">Lessons</th><th className="py-2 text-right">Classes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.weekly.map((w) => (
                        <tr key={w.weekStart} className="border-b last:border-0">
                          <td className="py-2">{weekLabel(w.weekStart)}</td>
                          <td className="py-2 text-right tabular-nums">{w.lessons}</td>
                          <td className="py-2 text-right tabular-nums">{w.classes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
              />
              {data.weekly.every((w) => w.lessons === 0) && (
                <p className="text-sm text-muted-foreground -mt-4 px-1">
                  No lessons logged in the last 12 weeks. Teachers log lessons from their class page after each CodesRock session.
                </p>
              )}
            </div>

            <Card className="xl:col-span-2 h-fit">
              <CardHeader>
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden /> Needs follow-up
                  {data.followUps.length > 0 && <Badge variant="outline" className="ml-auto">{data.followUps.length}</Badge>}
                </CardTitle>
                <CardDescription>Most urgent first</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.followUps.length === 0 && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden /> Nothing needs following up right now.
                  </p>
                )}
                {(showAll ? data.followUps : data.followUps.slice(0, 8)).map((f, i) => {
                  const info = FOLLOW_UP_INFO[f.type];
                  const Icon = info.icon;
                  const link =
                    f.type === "school_no_classes" ? `/admin/schools/${f.schoolId}/performance`
                    : f.classId ? `/classes/${f.classId}`
                    : f.teacherId ? `/admin/teachers/${f.teacherId}/performance`
                    : null;
                  return (
                    <div key={`${f.type}-${f.teacherId || f.classId || f.schoolId}-${i}`} className="rounded-xl border p-3 flex gap-3">
                      <Icon className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" aria-hidden />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{info.title(f)}</p>
                        <p className="text-xs text-muted-foreground">{info.detail(f, data.regularLoggingDays)}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {f.type === "never_logged_in" && f.teacherId && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setResetTarget(f)}>
                              <KeyRound className="h-3.5 w-3.5 mr-1" /> Reset login
                            </Button>
                          )}
                          {link && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                              <Link to={link}>Open <ChevronRight className="h-3.5 w-3.5 ml-0.5" /></Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {data.followUps.length > 8 && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAll((v) => !v)}>
                    {showAll ? "Show fewer" : `Show all ${data.followUps.length}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Reset login: confirm, then show the new details once */}
      <AlertDialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset {resetTarget?.teacherName}'s login?</AlertDialogTitle>
            <AlertDialogDescription>
              A new password is created and their old one stops working. You'll see the new details once, to share with them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); resetLogin(); }} disabled={resetting}>
              {resetting ? "Resetting…" : "Reset login"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!credentials} onOpenChange={(open) => !open && setCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New login for {credentials?.name}</DialogTitle>
            <DialogDescription>Share these with the teacher. They won't be shown again.</DialogDescription>
          </DialogHeader>
          {credentials && (
            <dl className="grid grid-cols-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">School ID</dt><dd className="col-span-2 font-mono">{credentials.schoolCode}</dd>
              <dt className="text-muted-foreground">Username</dt><dd className="col-span-2 font-mono">{credentials.username}</dd>
              <dt className="text-muted-foreground">Password</dt><dd className="col-span-2 font-mono">{credentials.password}</dd>
            </dl>
          )}
          <Button onClick={copyCredentials}><Copy className="h-4 w-4 mr-1" /> Copy login details</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
