import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  Circle, 
  Save, 
  FileText, 
  HelpCircle,
  AlertCircle,
  CircleDot,
  CheckCircle2,
  Award,
  Star,
  Calendar,
  X
} from "lucide-react";
import { toast } from "sonner";
import { classService } from "@/services/class.service";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ProgressTrackingProps {
  classId: string;
}

export default function ProgressTracking({ classId }: ProgressTrackingProps) {
  const [data, setData] = useState<{
    students: { id: string, name: string }[],
    topics: { id: string, title: string, order_index: number }[],
    progress: { 
      student_id: string, 
      topic_id: string,
      mastery_level?: 'struggling' | 'developing' | 'proficient' | 'advanced',
      engagement_score?: number,
      assessment_score?: number,
      max_assessment_score?: number,
      activity_type?: 'unplugged_game' | 'card_sorting' | 'robot_navigation' | 'activity_book',
      session_date?: string,
      notes?: string
    }[]
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Dialog & Form States
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    studentId: string;
    studentName: string;
    topicId: string;
    topicTitle: string;
    currentRecord: any;
  } | null>(null);
  
  const [formCompleted, setFormCompleted] = useState(false);
  const [formMasteryLevel, setFormMasteryLevel] = useState<'struggling' | 'developing' | 'proficient' | 'advanced'>('proficient');
  const [formEngagementScore, setFormEngagementScore] = useState<number>(3);
  const [formAssessmentScore, setFormAssessmentScore] = useState<string>("");
  const [formMaxAssessmentScore, setFormMaxAssessmentScore] = useState<string>("10");
  const [formActivityType, setFormActivityType] = useState<'unplugged_game' | 'card_sorting' | 'robot_navigation' | 'activity_book'>('activity_book');
  const [formSessionDate, setFormSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState<string>("");

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

  const handleCellClick = (studentId: string, studentName: string, topicId: string, topicTitle: string, existingRecord: any) => {
    setSelectedCell({
      studentId,
      studentName,
      topicId,
      topicTitle,
      currentRecord: existingRecord
    });
    
    if (existingRecord) {
      setFormCompleted(true);
      setFormMasteryLevel(existingRecord.mastery_level || 'proficient');
      setFormEngagementScore(existingRecord.engagement_score || 3);
      setFormAssessmentScore(existingRecord.assessment_score !== undefined && existingRecord.assessment_score !== null ? existingRecord.assessment_score.toString() : "");
      setFormMaxAssessmentScore(existingRecord.max_assessment_score !== undefined && existingRecord.max_assessment_score !== null ? existingRecord.max_assessment_score.toString() : "10");
      setFormActivityType(existingRecord.activity_type || 'activity_book');
      setFormSessionDate(existingRecord.session_date ? existingRecord.session_date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setFormNotes(existingRecord.notes || "");
    } else {
      setFormCompleted(false);
      setFormMasteryLevel('proficient');
      setFormEngagementScore(3);
      setFormAssessmentScore("");
      setFormMaxAssessmentScore("10");
      setFormActivityType('activity_book');
      setFormSessionDate(new Date().toISOString().split('T')[0]);
      setFormNotes("");
    }
    
    setIsRecordDialogOpen(true);
  };

  const handleSaveProgress = async () => {
    if (!selectedCell) return;
    const { studentId, topicId } = selectedCell;
    const key = `${studentId}-${topicId}`;
    try {
      setUpdating(key);
      
      const payload: any = {
        studentId,
        topicId,
        completed: formCompleted,
      };

      if (formCompleted) {
        payload.masteryLevel = formMasteryLevel;
        payload.engagementScore = formEngagementScore;
        payload.activityType = formActivityType;
        payload.sessionDate = formSessionDate;
        payload.notes = formNotes;
        if (formAssessmentScore.trim() !== "") {
          payload.assessmentScore = parseInt(formAssessmentScore, 10);
        }
        if (formMaxAssessmentScore.trim() !== "") {
          payload.maxAssessmentScore = parseInt(formMaxAssessmentScore, 10);
        }
      }

      await classService.updateProgress(classId, payload);
      
      // Update local state
      setData(prev => {
        if (!prev) return prev;
        
        let newProgress;
        if (formCompleted) {
          const record = {
            student_id: studentId,
            topic_id: topicId,
            mastery_level: formMasteryLevel,
            engagement_score: formEngagementScore,
            activity_type: formActivityType,
            session_date: formSessionDate,
            notes: formNotes,
            assessment_score: formAssessmentScore.trim() !== "" ? parseInt(formAssessmentScore, 10) : undefined,
            max_assessment_score: formMaxAssessmentScore.trim() !== "" ? parseInt(formMaxAssessmentScore, 10) : 10
          };
          
          const filtered = prev.progress.filter(p => !(p.student_id === studentId && p.topic_id === topicId));
          newProgress = [...filtered, record];
        } else {
          newProgress = prev.progress.filter(p => !(p.student_id === studentId && p.topic_id === topicId));
        }
        
        return { ...prev, progress: newProgress };
      });
      
      toast.success(formCompleted ? "Mastery recorded!" : "Marked as incomplete");
      setIsRecordDialogOpen(false);
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update progress");
    } finally {
      setUpdating(null);
    }
  };

  const getCellDisplay = (record: any) => {
    if (!record) {
      return {
        className: 'bg-muted/20 text-muted-foreground/30 hover:bg-primary/10 hover:text-primary/50 border border-transparent',
        icon: <Circle className="h-5 w-5 opacity-60" />,
        tooltip: 'Not started'
      };
    }

    switch (record.mastery_level) {
      case 'struggling':
        return {
          className: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200',
          icon: <AlertCircle className="h-5 w-5" />,
          tooltip: 'Struggling'
        };
      case 'developing':
        return {
          className: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200',
          icon: <CircleDot className="h-5 w-5" />,
          tooltip: 'Developing'
        };
      case 'proficient':
        return {
          className: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',
          icon: <CheckCircle2 className="h-5 w-5" />,
          tooltip: 'Proficient'
        };
      case 'advanced':
        return {
          className: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200',
          icon: <Award className="h-5 w-5" />,
          tooltip: 'Advanced Mastery'
        };
      default:
        return {
          className: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',
          icon: <CheckCircle className="h-5 w-5" />,
          tooltip: 'Completed'
        };
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
                <CardDescription>Click a cell to review and edit detailed student performance logs.</CardDescription>
              </div>
              <Badge variant="outline" className="bg-background/80 font-bold px-3 py-1 border-primary/20 text-primary">
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
                      <th key={topic.id} className="p-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground min-w-[140px] text-center border-l">
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
                        const record = data.progress.find(p => p.student_id === student.id && p.topic_id === topic.id);
                        const display = getCellDisplay(record);
                        const isUpdating = updating === `${student.id}-${topic.id}`;
                        
                        return (
                          <td key={topic.id} className="p-4 text-center border-l border-muted/20">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleCellClick(student.id, student.name, topic.id, topic.title, record)}
                                  disabled={!!updating}
                                  className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center transition-all transform active:scale-95 shadow-sm ${display.className} ${isUpdating ? 'animate-pulse opacity-50' : ''}`}
                                >
                                  {display.icon}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  <p className="font-black">{display.tooltip}</p>
                                  {record && (
                                    <div className="mt-1 space-y-0.5 text-muted-foreground font-bold">
                                      {record.activity_type && <p>Type: {record.activity_type.replace('_', ' ')}</p>}
                                      {record.engagement_score && <p>Engagement: {record.engagement_score}/5★</p>}
                                      {record.assessment_score !== undefined && record.assessment_score !== null && (
                                        <p>Score: {record.assessment_score}/{record.max_assessment_score || 10}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
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

        {/* Legend */}
        <Card className="border border-muted/30 bg-white/40">
          <CardContent className="p-4 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-muted-foreground">
            <span className="flex items-center gap-1.5"><Circle className="h-4 w-4 text-muted-foreground/30" /> Not Started</span>
            <span className="flex items-center gap-1.5"><AlertCircle className="h-4 w-4 text-rose-500" /> Struggling</span>
            <span className="flex items-center gap-1.5"><CircleDot className="h-4 w-4 text-amber-500" /> Developing</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Proficient</span>
            <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-indigo-500" /> Advanced</span>
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
          </div>
        </div>

        {/* Granular Progress Dialog */}
        <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
          <DialogContent className="max-w-lg rounded-[2rem] overflow-hidden border-none p-6 shadow-2xl bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-deep-purple italic">Record Lesson Progress</DialogTitle>
              <DialogDescription className="font-bold text-muted-foreground mt-1">
                Student: <span className="text-primary">{selectedCell?.studentName}</span><br />
                Topic: <span className="text-primary">{selectedCell?.topicTitle}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Toggle Completion */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl border border-muted/20">
                <div className="space-y-0.5">
                  <label className="text-sm font-black text-deep-purple">Lesson Completed</label>
                  <p className="text-xs text-muted-foreground font-bold">Has the student finished all required tasks?</p>
                </div>
                <Switch 
                  checked={formCompleted} 
                  onCheckedChange={setFormCompleted} 
                />
              </div>

              {formCompleted && (
                <div className="space-y-5 animate-fade-in">
                  
                  {/* Mastery Levels */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-deep-purple uppercase tracking-wider">Understanding / Mastery Level</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { level: 'struggling', label: 'Struggling', color: 'rose', border: 'border-rose-200', text: 'text-rose-700', activeBg: 'bg-rose-600' },
                        { level: 'developing', label: 'Developing', color: 'amber', border: 'border-amber-200', text: 'text-amber-700', activeBg: 'bg-amber-500' },
                        { level: 'proficient', label: 'Proficient', color: 'green', border: 'border-green-200', text: 'text-green-700', activeBg: 'bg-green-600' },
                        { level: 'advanced', label: 'Advanced', color: 'indigo', border: 'border-indigo-200', text: 'text-indigo-700', activeBg: 'bg-indigo-600' }
                      ].map(item => {
                        const isSelected = formMasteryLevel === item.level;
                        return (
                          <button
                            key={item.level}
                            type="button"
                            onClick={() => setFormMasteryLevel(item.level as any)}
                            className={`p-3 rounded-xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${
                              isSelected 
                                ? `${item.activeBg} text-white border-transparent shadow-md scale-105` 
                                : `bg-muted/10 border-muted/50 hover:bg-muted/20 ${item.text}`
                            }`}
                          >
                            {item.level === 'struggling' && <AlertCircle className="h-4 w-4" />}
                            {item.level === 'developing' && <CircleDot className="h-4 w-4" />}
                            {item.level === 'proficient' && <CheckCircle2 className="h-4 w-4" />}
                            {item.level === 'advanced' && <Award className="h-4 w-4" />}
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Engagement Score */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-deep-purple uppercase tracking-wider">Student Engagement</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormEngagementScore(star)}
                          className="p-1 focus:outline-none transition-transform active:scale-90"
                        >
                          <Star 
                            className={`h-7 w-7 transition-colors ${
                              star <= formEngagementScore 
                                ? 'text-amber-400 fill-amber-400' 
                                : 'text-muted-foreground/30 hover:text-amber-400'
                            }`} 
                          />
                        </button>
                      ))}
                      <span className="text-sm font-bold text-muted-foreground ml-2">
                        {formEngagementScore === 1 && 'Passive 😐'}
                        {formEngagementScore === 2 && 'Mild Interest 🙂'}
                        {formEngagementScore === 3 && 'Active Participant 😊'}
                        {formEngagementScore === 4 && 'Highly Engaged 🤩'}
                        {formEngagementScore === 5 && 'Logic Leader! 🚀'}
                      </span>
                    </div>
                  </div>

                  {/* Row: Activity Type & Session Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-deep-purple uppercase tracking-wider">Activity Mode</label>
                      <Select 
                        value={formActivityType} 
                        onValueChange={(val: any) => setFormActivityType(val)}
                      >
                        <SelectTrigger className="rounded-xl font-bold bg-muted/10 border-muted/50 h-10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unplugged_game">Unplugged Game 🏃‍♂️</SelectItem>
                          <SelectItem value="card_sorting">Card Sequencing 🎴</SelectItem>
                          <SelectItem value="robot_navigation">Robot Mat Mapping 🤖</SelectItem>
                          <SelectItem value="activity_book">Activity Book Page 📖</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-deep-purple uppercase tracking-wider">Session Date</label>
                      <div className="relative">
                        <Input 
                          type="date" 
                          value={formSessionDate}
                          onChange={(e) => setFormSessionDate(e.target.value)}
                          className="rounded-xl font-bold bg-muted/10 border-muted/50 h-10 pl-10"
                        />
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-60" />
                      </div>
                    </div>
                  </div>

                  {/* Assessment Scores */}
                  <div className="grid grid-cols-2 gap-4 bg-primary/5 p-3 rounded-2xl border border-primary/10">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-deep-purple uppercase tracking-wider">Assessment Score (Optional)</label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 8" 
                        value={formAssessmentScore}
                        onChange={(e) => setFormAssessmentScore(e.target.value)}
                        className="rounded-xl font-bold bg-white border-muted/50 h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-deep-purple uppercase tracking-wider">Max Score</label>
                      <Input 
                        type="number" 
                        placeholder="10" 
                        value={formMaxAssessmentScore}
                        onChange={(e) => setFormMaxAssessmentScore(e.target.value)}
                        className="rounded-xl font-bold bg-white border-muted/50 h-9"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-deep-purple uppercase tracking-wider">Observational Logs</label>
                    <textarea 
                      placeholder="Enter behavioral observations, challenges faced, or general performance comments..." 
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full min-h-[80px] rounded-xl border border-muted/50 bg-muted/10 px-3 py-2 text-sm font-bold shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-primary"
                    />
                  </div>

                </div>
              )}
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsRecordDialogOpen(false)}
                className="rounded-xl font-bold border-muted/30"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveProgress}
                disabled={!!updating}
                className="rounded-xl font-bold bg-primary shadow-lg shadow-primary/20"
              >
                {updating ? 'Saving...' : 'Save Performance Log'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
