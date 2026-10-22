import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BarChart3, ClipboardList, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { authService } from "@/services/auth.service";
import { trackingService, type ClassProgress, type Learner, type LessonSummary } from "@/services/tracking.service";
import ClassProgressDashboard from "@/components/tracking/ClassProgressDashboard";
import LessonsList from "@/components/tracking/LessonsList";
import RosterPanel from "@/components/tracking/RosterPanel";

const TABS = ["progress", "lessons", "roster"] as const;
type Tab = (typeof TABS)[number];

export default function ClassDetails() {
  const { id: classId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : "progress";

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ClassProgress | null>(null);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);

  const user = authService.getStoredUser();
  // The API decides which classes a user can open; content admins are read-only
  const canEdit = user?.role !== "content_admin";
  const isAdmin = ["super_admin", "school_admin", "content_admin"].includes(user?.role || "");

  const load = useCallback(async () => {
    if (!classId) return;
    try {
      const [p, ls, roster] = await Promise.all([
        trackingService.getClassProgress(classId),
        trackingService.getLessons(classId),
        trackingService.getLearners(classId),
      ]);
      setProgress(p);
      setLessons(ls);
      setLearners(roster);
    } catch (error: any) {
      toast.error(error.message || "Failed to load class");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    load();
  }, [load]);

  const logLesson = () => {
    if (learners.length === 0) {
      toast.info("Add the children in this class first");
      setSearchParams({ tab: "roster" });
      return;
    }
    navigate(`/classes/${classId}/lessons/new`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!progress) return <div className="p-8 text-center">Class not found</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(isAdmin ? "/admin/progress" : "/classes")} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {isAdmin ? "Back to student progress" : "Back to classes"}
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-deep-purple dark:text-white">{progress.class.name}</h1>
          <div className="flex items-center gap-3 text-muted-foreground text-sm mt-1">
            <Badge variant="outline">CodesRock 1 Activity Book</Badge>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> {learners.length} children
            </span>
          </div>
        </div>
        {canEdit && (
          <Button onClick={logLesson} size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
            <Plus className="h-4 w-4 mr-1" /> Log a lesson
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-6">
          <TabsTrigger value="progress" className="rounded-lg font-bold px-4 sm:px-6">
            <BarChart3 className="mr-2 h-4 w-4" /> Progress
          </TabsTrigger>
          <TabsTrigger value="lessons" className="rounded-lg font-bold px-4 sm:px-6">
            <ClipboardList className="mr-2 h-4 w-4" /> Lessons
          </TabsTrigger>
          <TabsTrigger value="roster" className="rounded-lg font-bold px-4 sm:px-6">
            <Users className="mr-2 h-4 w-4" /> Roster
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress">
          <ClassProgressDashboard classId={classId!} progress={progress} canLog={canEdit} onLogLesson={logLesson} />
        </TabsContent>

        <TabsContent value="lessons">
          <LessonsList classId={classId!} lessons={lessons} canLog={canEdit} onLogLesson={logLesson} />
        </TabsContent>

        <TabsContent value="roster">
          <RosterPanel classId={classId!} learners={learners} canEdit={canEdit} onChange={load} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
