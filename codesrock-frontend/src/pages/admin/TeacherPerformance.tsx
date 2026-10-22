import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Award, CheckCircle2, GraduationCap, XCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { adminService } from "@/services/admin.service";
import { StatTile } from "@/components/tracking/charts";
import { FLAG_LABELS, formatDate } from "@/components/tracking/labels";
import type { Flag } from "@/services/tracking.service";
import { StatusBadge } from "./SchoolPerformance";

const dateText = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function TeacherPerformance() {
  const { id: teacherId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-teacher", teacherId],
    queryFn: () => adminService.getTeacherDetailedPerformance(teacherId!),
    enabled: !!teacherId,
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
    return <div className="p-8 text-center text-muted-foreground">Teacher not found or you don't have access.</div>;
  }

  const { teacher, training, classes } = data;
  const learnerCount = classes.reduce((a, c) => a + c.learnerCount, 0);
  const lessonCount = classes.reduce((a, c) => a + c.lessonCount, 0);
  const lastLesson = classes.map((c) => c.lastLessonDate).filter(Boolean).sort().pop() || null;
  const quizzesPassed = training.quizzes.filter((q) => q.passed).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-heading font-black text-deep-purple dark:text-white">{teacher.name}</h1>
          <p className="text-muted-foreground">
            {[teacher.school, teacher.email].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Last login: {dateText(teacher.lastLogin)}</span>
          <StatusBadge status={teacher.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Training"
          value={training.courses.length ? `${training.courses.reduce((a, c) => a + c.videosCompleted, 0)} videos` : "Not started"}
          caption={`${training.courses.length} course${training.courses.length === 1 ? "" : "s"} started`}
        />
        <StatTile label="Quizzes passed" value={String(quizzesPassed)} caption={`${training.certificates.length} certificates`} />
        <StatTile label="Classes" value={String(classes.length)} caption={`${learnerCount} children`} />
        <StatTile label="Lessons logged" value={String(lessonCount)} caption={`Last: ${formatDate(lastLesson)}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" aria-hidden /> Training
            </CardTitle>
            <CardDescription>Teacher training courses, quizzes and certificates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {training.courses.length === 0 && <p className="text-sm text-muted-foreground">No training course started yet.</p>}
            {training.courses.map((c) => (
              <div key={c.courseId}>
                <div className="flex justify-between gap-2 text-sm mb-1">
                  <span className="font-semibold">{c.title}</span>
                  <span className="text-muted-foreground tabular-nums shrink-0">{c.videosCompleted} / {c.videosTotal}</span>
                </div>
                <Progress value={c.videosTotal ? (c.videosCompleted / c.videosTotal) * 100 : 0} className="h-2" aria-label={`${c.title} progress`} />
              </div>
            ))}

            {training.quizzes.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quizzes</p>
                {training.quizzes.map((q, i) => (
                  <p key={i} className="text-sm flex items-center gap-2">
                    {q.passed ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden /> : <XCircle className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />}
                    <span className="flex-1">{q.title}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{q.score ?? "—"}% · {q.passed ? "Passed" : "Not passed"}</span>
                  </p>
                ))}
              </div>
            )}

            {training.certificates.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Certificates</p>
                {training.certificates.map((c, i) => (
                  <p key={i} className="text-sm flex items-center gap-2">
                    <Award className="h-4 w-4 text-secondary shrink-0" aria-hidden />
                    <span className="flex-1">{c.title}</span>
                    <span className="text-xs text-muted-foreground">{dateText(c.dateEarned)}</span>
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-heading">Classes and children</CardTitle>
            <CardDescription>From the lessons this teacher logs in the activity book tracker</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {classes.length === 0 && <p className="text-sm text-muted-foreground">This teacher hasn't set up a class yet.</p>}
            {classes.map((c) => (
              <div key={c.classId} className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link to={`/classes/${c.classId}`} className="font-semibold hover:underline">{c.name}</Link>
                  <span className="text-xs text-muted-foreground">
                    {c.lessonCount} lessons · last {formatDate(c.lastLessonDate)} · {c.coveragePercent ?? 0}% of book ·{" "}
                    {c.independentRate === null ? "not rated yet" : `${c.independentRate}% on their own`}
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
                        <th className="py-2 px-3">Child</th>
                        <th className="py-2 px-3 text-right">Average</th>
                        <th className="py-2 px-3 text-right">On their own</th>
                        <th className="py-2 px-3 text-right">Attendance</th>
                        <th className="py-2 px-3">Needs attention</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.learners.length === 0 && (
                        <tr><td colSpan={5} className="py-4 px-3 text-muted-foreground">No children in this class yet.</td></tr>
                      )}
                      {c.learners.map((l) => (
                        <tr key={l.learnerId} className="border-b last:border-0">
                          <td className="py-2 px-3">
                            <Link to={`/classes/${c.classId}/learners/${l.learnerId}`} className="font-medium hover:underline">{l.name}</Link>
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">{l.avgScore === null ? "—" : `${l.avgScore}%`}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{l.independentRate === null ? "—" : `${l.independentRate}%`}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{l.attendanceRate === null ? "—" : `${l.attendanceRate}%`}</td>
                          <td className="py-2 px-3 text-xs">
                            {l.flags.filter((f) => f !== "not_yet_assessed").length === 0 ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              l.flags.filter((f) => f !== "not_yet_assessed").map((f) => (
                                <span key={f} className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                                  <AlertTriangle className="h-3 w-3" aria-hidden /> {FLAG_LABELS[f as Flag]}
                                </span>
                              ))
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
