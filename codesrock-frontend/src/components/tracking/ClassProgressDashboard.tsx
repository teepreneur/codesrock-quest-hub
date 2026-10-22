import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight, ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ClassProgress } from "@/services/tracking.service";
import { FLAG_LABELS, formatDate, scoreText } from "./labels";
import { LevelLegend, ModeGapChart, SkillChart, StatTile, TrendChart, UnitScoreChart, scoreColor } from "./charts";

export default function ClassProgressDashboard({
  classId, progress, canLog, onLogLesson,
}: {
  classId: string;
  progress: ClassProgress;
  canLog: boolean;
  onLogLesson: () => void;
}) {
  const { summary, needsAttention, learners, units } = progress;

  if (summary.lessonCount === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-10 text-center space-y-4">
          <ClipboardList className="h-10 w-10 mx-auto text-primary" />
          <div>
            <p className="text-lg font-heading font-black">No lessons logged yet</p>
            <p className="text-muted-foreground max-w-md mx-auto">
              After each CodesRock class, log what you covered and how each child did. Progress charts for the class
              and every child build up from there.
            </p>
          </div>
          {canLog && <Button onClick={onLogLesson}>Log your first lesson</Button>}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Book covered"
          value={summary.coveragePercent === null ? "—" : `${summary.coveragePercent}%`}
          caption={`${summary.activitiesCovered} of ${summary.activitiesTotal} activities`}
        />
        <StatTile
          label="On their own"
          value={summary.independentRate === null ? "—" : `${summary.independentRate}%`}
          caption="of children's latest ratings"
        />
        <StatTile
          label="Lessons logged"
          value={String(summary.lessonCount)}
          caption={`Last: ${formatDate(summary.lastLessonDate)}`}
        />
        <StatTile
          label="Attendance"
          value={summary.attendanceRate === null ? "—" : `${summary.attendanceRate}%`}
          caption={`${summary.learnerCount} children in class`}
        />
      </div>

      <Card className={needsAttention.length ? "border-amber-400/60" : undefined}>
        <CardHeader>
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
            Needs attention
          </CardTitle>
          <CardDescription>
            {needsAttention.length
              ? "These children may need extra support. Open a child to see what they are finding hard."
              : "No child is flagged right now."}
          </CardDescription>
        </CardHeader>
        {needsAttention.length > 0 && (
          <CardContent className="space-y-2">
            {needsAttention.map((l) => (
              <Link
                key={l.learnerId}
                to={`/classes/${classId}/learners/${l.learnerId}`}
                className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{l.name}</p>
                  <ul className="text-xs text-muted-foreground">
                    {l.flags.filter((f) => f !== "not_yet_assessed").map((f) => (
                      <li key={f} className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" aria-hidden /> {FLAG_LABELS[f]}
                      </li>
                    ))}
                  </ul>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <UnitScoreChart units={units} />
        <div className="space-y-6">
          <TrendChart points={progress.trend} />
          <ModeGapChart units={units} />
        </div>
      </div>

      <SkillChart skills={progress.skills} />

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="text-base font-heading">Every child, unit by unit</CardTitle>
            <CardDescription>Average rating per unit. Open a child for their full report.</CardDescription>
          </div>
          <LevelLegend />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-1">
            <thead>
              <tr className="text-[11px] text-muted-foreground">
                <th className="text-left font-semibold sticky left-0 bg-card min-w-[140px]">Child</th>
                {units.map((u) => (
                  <th key={u.unitId} className="font-semibold min-w-[44px]" title={u.title} scope="col">
                    <abbr title={u.title} className="no-underline">U{u.position}</abbr>
                  </th>
                ))}
                <th className="font-semibold min-w-[64px]">Attend.</th>
              </tr>
            </thead>
            <tbody>
              {learners.map((l) => (
                <tr key={l.learnerId}>
                  <th scope="row" className="text-left font-semibold sticky left-0 bg-card pr-2">
                    <Link to={`/classes/${classId}/learners/${l.learnerId}`} className="hover:underline text-deep-purple dark:text-white">
                      {l.name}
                    </Link>
                  </th>
                  {units.map((u) => {
                    const score = l.unitScores[u.unitId];
                    return (
                      <td key={u.unitId} className="p-0">
                        <div
                          className="h-9 rounded-md flex items-center justify-center text-xs font-semibold tabular-nums"
                          style={{
                            backgroundColor: score === null ? "var(--chart-empty)" : `color-mix(in srgb, ${scoreColor(score)} 35%, transparent)`,
                            border: score === null ? undefined : `2px solid ${scoreColor(score)}`,
                          }}
                          title={`${l.name} – ${u.title}: ${scoreText(score)}`}
                        >
                          {score === null ? <span className="text-muted-foreground">·</span> : score}
                        </div>
                      </td>
                    );
                  })}
                  <td className="text-center text-xs tabular-nums text-muted-foreground">
                    {l.attendanceRate === null ? "—" : `${l.attendanceRate}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-muted-foreground mt-2">
            Numbers are 0–100: 0 = Not yet, 50 = With help, 100 = On their own. “·” = not rated yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
