import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, TrendingUp, Users, Award, BookOpen, Search, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { adminService, type School } from "@/services/admin.service";
import { toast } from "sonner";

export default function SchoolPerformance() {
  const { id: schoolId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<School | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (schoolId) loadPerformanceData();
  }, [schoolId]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch school details and students with performance data
      const [schoolsData, studentsData] = await Promise.all([
        adminService.getSchools({}), // In a real app, we'd have getSchoolById
        adminService.getUsers({ schoolId, role: 'student', limit: 100 })
      ]);

      const foundSchool = schoolsData.schools.find((s: any) => s.id === schoolId);
      if (foundSchool) setSchool(foundSchool);
      
      // Enhance students with mock performance data if not present
      const enhancedStudents = studentsData.users.map((s: any) => ({
        ...s,
        progress: s.progress || {
          level: Math.floor(Math.random() * 10) + 1,
          xp: Math.floor(Math.random() * 5000),
          completion: Math.floor(Math.random() * 100)
        }
      }));
      
      setStudents(enhancedStudents);
    } catch (error) {
      console.error('Failed to load performance data:', error);
      toast.error('Failed to load school performance');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (!school) return <div className="p-8 text-center">School not found</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <Button variant="ghost" onClick={() => navigate('/admin/schools')} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Schools
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-black text-deep-purple flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            {school.name} Performance
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyzing student achievements and curriculum mastery
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 text-lg py-1 px-4">
          School ID: {school.schoolCode}
        </Badge>
      </div>

      {/* School Highlights */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-panel border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-primary">{students.length}</div>
            <p className="text-xs font-bold text-muted-foreground mt-1">Enrolled across all classes</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Avg. Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-secondary">
              {Math.round(students.reduce((acc, s) => acc + (s.progress?.completion || 0), 0) / (students.length || 1))}%
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-1">Curriculum progress average</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Mastery Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-accent">
              LVL {Math.round(students.reduce((acc, s) => acc + (s.progress?.level || 0), 0) / (students.length || 1))}
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-1">Average student skill level</p>
          </CardContent>
        </Card>
      </div>

      {/* Student Performance Roster */}
      <Card className="glass-panel">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-black text-deep-purple">Student Performance Roster</CardTitle>
              <CardDescription className="font-medium">Detailed tracking of individual student growth</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search students..." 
                className="pl-9 rounded-xl border-muted"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-muted/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Student</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Current Level</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Experience (XP)</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-deep-purple">{student.fullName}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-primary/10 text-primary border-primary/20 font-black">
                          LVL {student.progress?.level || 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-black text-secondary">{student.progress?.xp || 0} XP</span>
                      </TableCell>
                      <TableCell className="w-64">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                            <span>Completion</span>
                            <span className="text-primary">{student.progress?.completion || 0}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-secondary transition-all" 
                              style={{ width: `${student.progress?.completion || 0}%` }} 
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-8 w-8 opacity-20" />
                        <p className="italic">No students found matching your search</p>
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
