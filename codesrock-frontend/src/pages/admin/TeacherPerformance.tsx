import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, TrendingUp, Users, Award, BookOpen, Search, Mail, GraduationCap, CheckCircle2, Trophy, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

export default function TeacherPerformance() {
  const { id: teacherId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (teacherId) loadPerformanceData();
  }, [teacherId]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getTeacherDetailedPerformance(teacherId!);
      setPerformanceData(response);
    } catch (error) {
      console.error('Failed to load teacher performance:', error);
      toast.error('Failed to load detailed teacher performance metrics');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = performanceData?.students?.filter((s: any) => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.className.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  const { teacher, ownProgress, students, classes } = performanceData || {};
  if (!teacher) return <div className="p-8 text-center text-muted-foreground font-black uppercase tracking-widest">Teacher Not Found</div>;

  const totalStudentXP = students.reduce((sum: number, s: any) => sum + s.xp, 0);
  const avgMastery = students.length > 0 
    ? (students.reduce((sum: number, s: any) => sum + s.masteryCount, 0) / students.length).toFixed(1)
    : 0;

  return (
    <div className="p-8 space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.history.back()}
            className="group -ml-2 text-muted-foreground hover:text-primary transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </Button>
          <h1 className="text-4xl font-black text-deep-purple tracking-tighter flex items-center gap-3">
            <Trophy className="h-10 w-10 text-primary" />
            {teacher.name}
          </h1>
          <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">
            {teacher.school} • {classes.length} ACTIVE CLASSES
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-sm py-1.5 px-4 rounded-full font-black">
            TEACHER SCORE: {ownProgress.length * 100}
          </Badge>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-panel border-primary/20 hover:border-primary/40 transition-all group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Training Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-primary">{ownProgress.length}</div>
            <p className="text-xs font-bold text-muted-foreground mt-1">Modules completed by instructor</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-secondary/20 hover:border-secondary/40 transition-all group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Flame className="h-12 w-12 text-secondary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Avg. Student Mastery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-secondary">{avgMastery}</div>
            <p className="text-xs font-bold text-muted-foreground mt-1">Concepts mastered per student</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-green-500/20 hover:border-green-500/40 transition-all group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-12 w-12 text-green-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Class Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-green-500">{totalStudentXP.toLocaleString()}</div>
            <p className="text-xs font-bold text-muted-foreground mt-1">Total XP generated by students</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Col: Training Details */}
        <Card className="lg:col-span-1 glass-panel">
          <CardHeader>
            <CardTitle className="text-xl font-black text-deep-purple">Training Roadmap</CardTitle>
            <CardDescription className="font-medium uppercase text-[10px]">Instructor Certification Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ownProgress.length > 0 ? (
                ownProgress.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-deep-purple leading-tight">{p.courses?.title}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Certified on {new Date(p.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground opacity-50 italic text-sm">
                  No training modules completed yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Col: Student Performance */}
        <Card className="lg:col-span-2 glass-panel">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-black text-deep-purple">Student Roster</CardTitle>
                <CardDescription className="font-medium uppercase text-[10px]">Detailed outcomes per learner</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Filter students..." 
                  className="pl-9 h-9 rounded-xl border-muted bg-white/50 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-muted/50 overflow-hidden bg-white/30 backdrop-blur-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Student</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Class</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Mastery</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-right">Experience</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student: any) => (
                      <TableRow key={student.id} className="hover:bg-primary/5 transition-all group">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-black text-deep-purple text-sm">{student.name}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium italic">
                              LVL {student.level} • {student.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[10px] font-black uppercase border-muted rounded-full">
                            {student.className}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-black text-sm text-deep-purple">{student.masteryCount}</span>
                            <div className="h-1 w-12 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-secondary transition-all" 
                                style={{ width: `${Math.min((student.masteryCount / 10) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-black text-secondary">
                          {student.xp.toLocaleString()} XP
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-20">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground opacity-50">
                          <Users className="h-12 w-12" />
                          <p className="font-black text-sm uppercase tracking-widest">No matching students found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
