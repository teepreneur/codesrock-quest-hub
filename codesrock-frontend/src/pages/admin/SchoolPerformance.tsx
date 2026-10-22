import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ChevronRight, GraduationCap, Search } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { adminService, type TeacherStatus } from "@/services/admin.service";
import { StatTile } from "@/components/tracking/charts";
import { formatDate } from "@/components/tracking/labels";

export const STATUS_LABELS: Record<TeacherStatus, string> = {
  active: "Active",
  inactive: "Not active in 30 days",
  never_logged_in: "Never logged in",
};

export function StatusBadge({ status }: { status: TeacherStatus }) {
  if (status === "active") return <Badge variant="outline" className="border-primary text-primary">{STATUS_LABELS.active}</Badge>;
  return (
    <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-400">
      <AlertTriangle className="h-3 w-3 mr-1" aria-hidden /> {STATUS_LABELS[status]}
    </Badge>
  );
}

const lastLoginText = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Never";

export default function SchoolPerformance() {
  const { id: schoolId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-school", schoolId],
    queryFn: () => adminService.getSchoolPerformance(schoolId!),
    enabled: !!schoolId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="p-8 text-center text-muted-foreground">School not found or you don't have access.</div>;
  }

  const { school, summary, teachers } = data;
  const filtered = teachers.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate("/admin/schools")} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to schools
      </Button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-heading font-black text-deep-purple dark:text-white flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" /> {school.name}
          </h1>
          <p className="text-muted-foreground">
            {[school.school_code, school.district, school.region].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Teachers active"
          value={`${summary.activeTeachers} / ${summary.teacherCount}`}
          caption={summary.neverLoggedIn ? `${summary.neverLoggedIn} never logged in` : "logged in within 30 days"}
        />
        <StatTile label="Classes" value={String(summary.classCount)} caption={`${summary.learnerCount} children`} />
        <StatTile label="Lessons logged" value={String(summary.lessonCount)} caption={`Last: ${formatDate(summary.lastLessonDate)}`} />
        <StatTile
          label="On their own"
          value={summary.independentRate === null ? "No data yet" : `${summary.independentRate}%`}
          caption={summary.coveragePercent === null ? "of activity-book ratings" : `${summary.coveragePercent}% of the book covered`}
        />
      </div>

      {(summary.neverLoggedIn > 0 || (summary.teacherCount > 0 && summary.classCount === 0)) && (
        <Card className="border-amber-400/60">
          <CardContent className="p-4 space-y-1 text-sm">
            {summary.neverLoggedIn > 0 && (
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
                {summary.neverLoggedIn} of {summary.teacherCount} teachers have never logged in. Their login details may need resending.
              </p>
            )}
            {summary.teacherCount > 0 && summary.classCount === 0 && (
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
                No classes have been set up at this school yet.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="font-heading">Teachers</CardTitle>
            <CardDescription>Login, training and classroom activity for each teacher</CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search teachers" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No teachers found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3">Teacher</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3 text-right">Last login</th>
                  <th className="py-2 pr-3 text-right">Videos done</th>
                  <th className="py-2 pr-3 text-right">Quizzes passed</th>
                  <th className="py-2 pr-3 text-right">Classes</th>
                  <th className="py-2 pr-3 text-right">Lessons</th>
                  <th className="py-2" aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b last:border-0 hover:bg-muted/40 cursor-pointer"
                    onClick={() => navigate(`/admin/teachers/${t.id}/performance`)}
                  >
                    <td className="py-2 pr-3">
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.email}</p>
                    </td>
                    <td className="py-2 pr-3"><StatusBadge status={t.status} /></td>
                    <td className="py-2 pr-3 text-right tabular-nums">{lastLoginText(t.lastLogin)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{t.videosCompleted}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{t.quizzesPassed}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{t.classCount}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{t.lessonCount}</td>
                    <td className="py-2 text-right"><ChevronRight className="h-4 w-4 text-muted-foreground inline" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
