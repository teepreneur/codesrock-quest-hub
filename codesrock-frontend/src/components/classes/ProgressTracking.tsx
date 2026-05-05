import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Circle, Save, FileText, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { classService } from "@/services/class.service";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProgressTrackingProps {
  classId: string;
}

export default function ProgressTracking({ classId }: ProgressTrackingProps) {
  const [data, setData] = useState<{
    students: { id: string, name: string }[],
    topics: { id: string, title: string, order_index: number }[],
    progress: { student_id: string, topic_id: string }[]
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, [classId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const res = await classService.getProgress(classId);
      setData(res);
    } catch (error) {
      console.error("Failed to load progress:", error);
      toast.error("Failed to load student progress");
    } finally {
      setLoading(false);
    }
  };

  const toggleMastery = async (studentId: string, topicId: string, currentStatus: boolean) => {
    const key = `${studentId}-${topicId}`;
    try {
      setUpdating(key);
      await classService.updateProgress(classId, {
        studentId,
        topicId,
        completed: !currentStatus
      });
      
      // Update local state
      setData(prev => {
        if (!prev) return prev;
        const newProgress = !currentStatus 
          ? [...prev.progress, { student_id: studentId, topic_id: topicId }]
          : prev.progress.filter(p => !(p.student_id === studentId && p.topic_id === topicId));
        
        return { ...prev, progress: newProgress };
      });
      
      toast.success(currentStatus ? "Marked as incomplete" : "Mastery recorded!");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update progress");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (!data || data.topics.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <HelpCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-bold">No Course Assigned</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Assign a course to this class first to start tracking student mastery against its topics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fade-in">
        <Card className="glass-panel overflow-hidden border-primary/10">
          <CardHeader className="bg-primary/5 pb-6">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-black text-deep-purple">Topic Mastery Matrix</CardTitle>
                <CardDescription>Click a cell to mark a student's completion of a specific curriculum topic.</CardDescription>
              </div>
              <Badge variant="outline" className="bg-background/80 font-bold px-3 py-1">
                {data.students.length} Students • {data.topics.length} Topics
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b">
                    <th className="p-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground sticky left-0 bg-muted/30 z-10 w-48">Student Name</th>
                    {data.topics.map(topic => (
                      <th key={topic.id} className="p-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground min-w-[120px] text-center border-l">
                        <Tooltip>
                          <TooltipTrigger className="cursor-help hover:text-primary transition-colors">
                            Topic {topic.order_index}: {topic.title}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-bold">{topic.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.students.map(student => (
                    <tr key={student.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="p-4 font-bold text-deep-purple sticky left-0 bg-background group-hover:bg-primary/5 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        {student.name}
                      </td>
                      {data.topics.map(topic => {
                        const isMastered = data.progress.some(p => p.student_id === student.id && p.topic_id === topic.id);
                        const isUpdating = updating === `${student.id}-${topic.id}`;
                        
                        return (
                          <td key={topic.id} className="p-4 text-center border-l border-muted/20">
                            <button
                              onClick={() => toggleMastery(student.id, topic.id, isMastered)}
                              disabled={!!updating}
                              className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center transition-all transform active:scale-90 ${
                                isMastered 
                                  ? 'bg-green-100 text-green-600 shadow-sm' 
                                  : 'bg-muted/20 text-muted-foreground/30 hover:bg-primary/10 hover:text-primary/50'
                              } ${isUpdating ? 'animate-pulse opacity-50' : ''}`}
                            >
                              {isMastered ? <CheckCircle className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-primary/5 border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Class Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-primary">
                {Math.round((data.progress.length / (data.students.length * data.topics.length)) * 100) || 0}%
              </div>
              <p className="text-[10px] text-muted-foreground font-bold mt-1">TOTAL TOPIC MASTERY</p>
            </CardContent>
          </Card>
          
          <div className="md:col-span-2 flex items-center justify-end gap-4">
             <Button variant="outline" className="rounded-xl font-bold border-primary/20" onClick={() => toast.info("Class report generation coming up!")}>
               <FileText className="mr-2 h-4 w-4" />
               Generate Class Report
             </Button>
             <Button className="rounded-xl font-bold bg-primary shadow-lg shadow-primary/20">
               <Save className="mr-2 h-4 w-4" />
               Save Progress
             </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
