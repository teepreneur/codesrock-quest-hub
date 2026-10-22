import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Printer } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { trackingService, type LearnerProgress as LearnerProgressData } from "@/services/tracking.service";
import { FLAG_LABELS, LEVELS, MODE_LABELS, formatDate, levelLabel } from "@/components/tracking/labels";
import { LevelLegend, SkillChart, StatTile, TrendChart, UnitScoreChart } from "@/components/tracking/charts";

export default function LearnerProgress() {
  const { id: classId, learnerId } = useParams<{ id: string; learnerId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<LearnerProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId || !learnerId) return;
    trackingService
      .getLearnerProgress(classId, learnerId)
      .then(setData)
      .catch((error) => toast.error(error.message || "Could not load this child's progress"))
      .finally(() => setLoading(false));
  }, [classId, learnerId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  if (!data) return <div className="p-8 text-center">Child not found</div>;

  const { learner, units, skills, timeline, transferGaps } = data;
  const flags = learner.flags.filter((f) => f !== "not_yet_assessed");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Button variant="ghost" onClick={() => navigate(`/classes/${classId}?tab=progress`)} className="-ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to {data.class.name}
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Print report
        </Button>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CodesRock progress report</p>
        <h1 className="text-3xl font-heading font-black text-deep-purple dark:text-white">{learner.name}</h1>
        <p className="text-muted-foreground">{data.class.name} · CodesRock 1 Activity Book</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="On their own"
          value={learner.independentRate === null ? "—" : `${learner.independentRate}%`}
          caption={`of ${learner.ratedCount} activity ratings`}
        />
        <StatTile label="Average" value={learner.avgScore === null ? "—" : `${learner.avgScore}%`} caption="0 = Not yet, 100 = On their own" />
        <StatTile
          label="Lessons attended"
          value={String(learner.lessonsAttended)}
          caption={learner.attendanceRate === null ? undefined : `${learner.attendanceRate}% attendance`}
        />
        <StatTile
          label="Hands-on vs book"
          value={learner.practicalScore === null || learner.bookScore === null ? "—" : `${learner.practicalScore} / ${learner.bookScore}`}
          caption="Practical / in the book"
        />
      </div>

      {flags.length > 0 && (
        <Card className="border-amber-400/60">
          <CardContent className="p-4 space-y-1">
            {flags.map((f) => (
              <p key={f} className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden /> {FLAG_LABELS[f]}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <UnitScoreChart units={units} title="Units of the book" description="Average rating in each unit the child has been rated on" />
        <div className="space-y-6">
          <SkillChart skills={skills} />
          <TrendChart points={timeline} title="Lesson by lesson" />
        </div>
      </div>

      {transferGaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading">Can do it hands-on, not yet in the book</CardTitle>
            <CardDescription>
              Missions where {learner.name} did better with the mats or robot than when writing the code in the book.
              Practise writing these sequences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {transferGaps.map((g) => (
              <div key={g.activityId} className="flex flex-wrap items-center gap-2 rounded-xl border p-3 text-sm">
                <span className="font-semibold flex-1">{g.activityTitle}</span>
                <Badge variant="outline" style={{ borderColor: "var(--chart-practical)" }}>
                  {MODE_LABELS.practical}: {levelLabel(g.practical)}
                </Badge>
                <Badge variant="outline" style={{ borderColor: "var(--chart-book)" }}>
                  {MODE_LABELS.book}: {levelLabel(g.book)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="text-base font-heading">Lesson history</CardTitle>
            <CardDescription>Every lesson, newest first</CardDescription>
          </div>
          <LevelLegend />
        </CardHeader>
        <CardContent className="space-y-3">
          {timeline.length === 0 && <p className="text-muted-foreground text-sm">No lessons recorded yet.</p>}
          {[...timeline].reverse().map((t) => (
            <div key={t.sessionId} className="rounded-xl border p-3 space-y-2 break-inside-avoid">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatDate(t.date)}</span>
                {t.present === false && <Badge variant="outline">Absent</Badge>}
              </div>
              {t.note && <p className="text-sm italic text-muted-foreground">“{t.note}”</p>}
              {t.results.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {t.results.map((r) => {
                    const lv = LEVELS.find((l) => l.level === r.level)!;
                    return (
                      <li
                        key={`${r.activityId}-${r.mode}`}
                        className="text-xs rounded-md border-2 px-2 py-1 flex items-center gap-1.5"
                        style={{ borderColor: lv.color }}
                      >
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: lv.color }} aria-hidden />
                        <span>{r.activityTitle}</span>
                        {/* Only missions done both ways need the mode spelled out */}
                        {r.bothModes && (
                          <span className="text-muted-foreground">({MODE_LABELS[r.mode]})</span>
                        )}
                        <span className="font-semibold">· {lv.label}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
