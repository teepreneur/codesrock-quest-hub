import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, BookOpen, ArrowLeft, Mail, Search, Trash2, CheckCircle, BarChart, Trophy, Award } from "lucide-react";
import { toast } from "sonner";

import { classService, type Class, type ClassEnrollment, type ClassAnalytics } from "@/services/class.service";
import { authService } from "@/services/auth.service";
import ProgressTracking from "@/components/classes/ProgressTracking";

export default function ClassDetails() {
  const { id: classId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cls, setCls] = useState<Class | null>(null);
  const [students, setStudents] = useState<ClassEnrollment[]>([]);
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newStudentFirstName, setNewStudentFirstName] = useState("");
  const [newStudentLastName, setNewStudentLastName] = useState("");

  useEffect(() => {
    if (classId) loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      const user = authService.getStoredUser();
      
      const [allClasses, studentsData, analyticsData] = await Promise.all([
        classService.getTeacherClasses(user?.id || ""),
        classService.getClassStudents(classId!),
        classService.getClassAnalytics(classId!)
      ]);

      const foundClass = allClasses.find(c => c.id === classId);
      if (foundClass) setCls(foundClass);
      setStudents(studentsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load class data:', error);
      toast.error('Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async () => {
    if (!newStudentFirstName || !newStudentLastName) {
      toast.error("Please enter both first and last name");
      return;
    }
    
    try {
      setLoading(true);
      await classService.enrollManually(classId!, newStudentFirstName, newStudentLastName);
      toast.success("Student added successfully!");
      setNewStudentFirstName("");
      setNewStudentLastName("");
      loadClassData();
    } catch (error: any) {
      console.error('Manual add error:', error);
      toast.error(error.message || "Failed to add student.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!cls) return <div className="p-8 text-center">Class not found</div>;

  const filteredStudents = students.filter(s => 
    s.student?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student?.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student?.last_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate('/classes')} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Classes
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">{cls.name}</h1>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {cls.courses?.title || 'No course assigned'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {students.length} Students
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">Class ID: {cls.id.slice(0, 8)}</Badge>
          <Badge className="bg-green-500">Active</Badge>
        </div>
      </div>

      <Tabs defaultValue="roster" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-6">
          <TabsTrigger value="roster" className="rounded-lg font-black uppercase text-[10px] tracking-widest px-8">Roster</TabsTrigger>
          <TabsTrigger value="progress" className="rounded-lg font-black uppercase text-[10px] tracking-widest px-8">
            <CheckCircle className="mr-2 h-3 w-3" />
            Progress Tracking
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg font-black uppercase text-[10px] tracking-widest px-8">Live Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="roster">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Student Management */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Class Roster
                </CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search students..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <div className="grid grid-cols-5 p-3 bg-muted/50 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span className="col-span-2">Student</span>
                    <span className="text-center">Level/XP</span>
                    <span className="text-center">Completion</span>
                    <span className="text-right">Activity</span>
                  </div>
                  <div className="divide-y">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((enrollment) => (
                        <div key={enrollment.id} className="grid grid-cols-5 p-4 items-center text-sm hover:bg-muted/30 transition-colors">
                          <div className="col-span-2 space-y-1">
                            <div className="font-bold text-deep-purple">
                              {enrollment.student?.first_name} {enrollment.student?.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              {enrollment.student?.email.includes('@codesrock.internal') ? (
                                <Badge variant="outline" className="text-[9px] h-4 bg-muted/30 border-none px-1">Manual Entry</Badge>
                              ) : (
                                <>
                                  <Mail className="h-3 w-3" />
                                  {enrollment.student?.email}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-black text-primary">LVL {enrollment.progress?.level || 1}</div>
                            <div className="text-[10px] text-muted-foreground font-bold">{enrollment.progress?.xp || 0} XP</div>
                          </div>
                          <div className="px-4">
                            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                              <span>{enrollment.progress?.completion_percentage || 0}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-accent" 
                                style={{ width: `${enrollment.progress?.completion_percentage || 0}%` }} 
                              />
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">
                              {enrollment.progress?.last_active ? new Date(enrollment.progress.last_active).toLocaleDateString() : 'Never'}
                            </div>
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-primary hover:bg-primary/10"
                                onClick={() => navigate(`/classes/${classId}/students/${enrollment.student_id}/report`)}
                                title="View Achievement Report"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center text-muted-foreground italic">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        No students enrolled yet.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Side Info */}
            <div className="space-y-6">
              <Card className="glass-panel border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-deep-purple flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Direct Student Add
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase">No email required for early grades</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">First Name</label>
                    <Input 
                      placeholder="e.g. John" 
                      className="rounded-xl border-muted bg-background/50"
                      value={newStudentFirstName}
                      onChange={(e) => setNewStudentFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Last Name</label>
                    <Input 
                      placeholder="e.g. Doe" 
                      className="rounded-xl border-muted bg-background/50"
                      value={newStudentLastName}
                      onChange={(e) => setNewStudentLastName(e.target.value)}
                    />
                  </div>
                  <Button className="w-full rounded-xl font-bold" onClick={handleManualAdd}>
                    Add to Roster
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-panel border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-deep-purple">Class Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Avg Completion</span>
                    <span className="text-3xl font-black text-primary">{analytics?.average_completion || 0}%</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000" 
                      style={{ width: `${analytics?.average_completion || 0}%` }} 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="progress">
           <ProgressTracking classId={classId!} />
        </TabsContent>

        <TabsContent value="activity">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-secondary" />
                Live Student Tracking
              </CardTitle>
              <CardDescription>Real-time view of student milestones and activity.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { student: "Alice Johnson", action: "Completed 'Intro to Logic'", time: "2 mins ago", type: "success" },
                  { student: "Bob Smith", action: "Earned 'Code Cadet' Badge", time: "15 mins ago", type: "badge" },
                  { student: "Charlie Davis", action: "Reached Level 5", time: "1 hour ago", type: "level" },
                  { student: "Diana Prince", action: "Logged in", time: "2 hours ago", type: "login" }
                ].map((log, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-muted/20 border border-transparent hover:border-secondary/20 transition-all">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      log.type === 'success' ? 'bg-green-100 text-green-600' :
                      log.type === 'badge' ? 'bg-amber-100 text-amber-600' :
                      log.type === 'level' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {log.type === 'success' ? <CheckCircle className="h-5 w-5" /> :
                       log.type === 'badge' ? <Trophy className="h-5 w-5" /> :
                       log.type === 'level' ? <Award className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-deep-purple">{log.student}</h4>
                        <span className="text-[10px] font-black text-muted-foreground uppercase">{log.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
