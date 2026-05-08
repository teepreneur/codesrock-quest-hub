import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, TrendingUp, Users, Award, BookOpen, Search, Mail, GraduationCap, CheckCircle2, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

interface TeacherStat {
  id: string;
  name: string;
  email: string;
  ownCompletions: number;
  studentCount: number;
  avgStudentXP: number;
  lastLogin: string;
}

export default function SchoolPerformance() {
  const { id: schoolId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (schoolId) loadPerformanceData();
  }, [schoolId]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSchoolPerformance(schoolId!);
      setPerformanceData(response);
    } catch (error) {
      console.error('Failed to load performance data:', error);
      toast.error('Failed to load school performance metrics');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = performanceData?.teachers?.filter((t: TeacherStat) => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
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

  const { school, teachers } = performanceData || {};
  if (!school) return <div className="p-8 text-center text-muted-foreground font-black uppercase tracking-widest">School Not Found</div>;

  const totalStudents = teachers.reduce((sum: number, t: any) => sum + t.studentCount, 0);
  const avgCompletion = teachers.length > 0 
    ? Math.round(teachers.reduce((sum: number, t: any) => sum + t.ownCompletions, 0) / teachers.length)
    : 0;

  return (
    <div className="p-8 space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin/analytics')}
            className="group -ml-2 text-muted-foreground hover:text-primary transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Analytics
          </Button>
          <h1 className="text-4xl font-black text-deep-purple tracking-tighter flex items-center gap-3">
            <GraduationCap className="h-10 w-10 text-primary" />
            {school.name}
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl">
            Detailed performance tracking for school instructors and student outcomes.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-sm py-1.5 px-4 rounded-full font-black">
            {school.school_code}
          </Badge>
          <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-sm py-1.5 px-4 rounded-full font-black">
            {school.district || 'Standard'} DISTRICT
          </Badge>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="glass-panel border-primary/20 hover:border-primary/40 transition-all group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Users className="h-12 w-12 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">School Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-primary">{teachers.length}</div>
            <p className="text-xs font-bold text-muted-foreground mt-1">Verified instructors</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-secondary/20 hover:border-secondary/40 transition-all group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <UserCheck className="h-12 w-12 text-secondary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-secondary">{totalStudents}</div>
            <p className="text-xs font-bold text-muted-foreground mt-1">Managed by school staff</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-green-500/20 hover:border-green-500/40 transition-all group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Avg. Instructor Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-green-500">{avgCompletion}</div>
            <p className="text-xs font-bold text-muted-foreground mt-1">Modules completed per teacher</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-purple-500/20 hover:border-purple-500/40 transition-all group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-12 w-12 text-purple-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">School Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-purple-500">
              {teachers.length > 0 ? 'High' : 'Low'}
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-1">Activity velocity rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Performance Matrix */}
      <Card className="glass-panel">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-black text-deep-purple">Teacher Performance Matrix</CardTitle>
              <CardDescription className="font-medium italic">Comparing instructor engagement with student success rates</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search teachers..." 
                className="pl-9 rounded-xl border-muted bg-white/50"
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
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Instructor</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Training Status</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Managed Students</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Avg Student XP</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher: TeacherStat) => (
                    <TableRow key={teacher.id} className="hover:bg-primary/5 transition-all group">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-black text-deep-purple text-base">{teacher.name}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                            <Mail className="h-3 w-3" />
                            {teacher.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-black">
                            {teacher.ownCompletions} MODULES
                          </Badge>
                          <span className="text-[10px] font-black text-muted-foreground uppercase">Certified</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-black text-lg text-primary">{teacher.studentCount}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-black text-lg text-secondary">{teacher.avgStudentXP.toLocaleString()}</span>
                          <span className="text-[10px] font-black text-muted-foreground uppercase">XP / Student</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-full font-black text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all border-primary/20"
                          onClick={() => navigate(`/admin/teachers/${teacher.id}/performance`)}
                        >
                          DRILL DOWN
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground opacity-50">
                        <Users className="h-12 w-12" />
                        <p className="font-black text-sm uppercase tracking-widest">No matching instructors found</p>
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
  );
}
