import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LessonSummary } from "@/services/tracking.service";
import { formatDate } from "./labels";

export default function LessonsList({
  classId, lessons, canLog, onLogLesson,
}: {
  classId: string;
  lessons: LessonSummary[];
  canLog: boolean;
  onLogLesson: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="font-heading">Lessons</CardTitle>
          <CardDescription>Every CodesRock lesson logged for this class. Open one to correct it.</CardDescription>
        </div>
        {canLog && (
          <Button onClick={onLogLesson}>
            <Plus className="h-4 w-4 mr-1" /> Log a lesson
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {lessons.length === 0 && <p className="text-muted-foreground text-sm py-6 text-center">No lessons logged yet.</p>}
        {lessons.map((l) => {
          const content = (
            <>
              <CalendarDays className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{formatDate(l.date)}</p>
                <p className="text-xs text-muted-foreground">
                  {l.activityCount} {l.activityCount === 1 ? "activity" : "activities"} · {l.presentCount} of {l.learnerCount} present
                  {l.notes ? ` · ${l.notes}` : ""}
                </p>
              </div>
              {canLog && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </>
          );
          return canLog ? (
            <Link key={l.id} to={`/classes/${classId}/lessons/${l.id}`} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50">
              {content}
            </Link>
          ) : (
            <div key={l.id} className="flex items-center gap-3 rounded-xl border p-3">{content}</div>
          );
        })}
      </CardContent>
    </Card>
  );
}
