import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, BookOpen, ArrowLeft, Mail, Search, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { classService, type Class, type ClassEnrollment } from "@/services/class.service";

export default function ClassDetails() {
  const { id: classId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cls, setCls] = useState<Class | null>(null);
  const [students, setStudents] = useState<ClassEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");

  useEffect(() => {
    if (classId) loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      // For now we get all teacher classes and find this one, or we could add getById
      // Since I didn't add getById to service, I'll use list filtered for now or just fetch students
      const [allClasses, studentsData] = await Promise.all([
        classService.getTeacherClasses(""), // Service handles fetching by teacher internally or we pass it
        classService.getClassStudents(classId!)
      ]);

      const foundClass = allClasses.find(c => c.id === classId);
      if (foundClass) setCls(foundClass);
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to load class data:', error);
      toast.error('Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentEmail) return;
    
    try {
      setLoading(true);
      await classService.enrollByEmail(classId!, newStudentEmail);
      toast.success("Student enrolled successfully!");
      setNewStudentEmail("");
      loadClassData(); // Refresh list
    } catch (error: any) {
      console.error('Enrollment error:', error);
      toast.error(error.message || "Failed to enroll student. Make sure they are registered.");
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Student Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Roster
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
            <div className="rounded-md border">
              <div className="grid grid-cols-3 p-3 bg-muted/50 font-medium text-xs uppercase tracking-wider">
                <span>Student</span>
                <span>Email</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((enrollment) => (
                    <div key={enrollment.id} className="grid grid-cols-3 p-3 items-center text-sm">
                      <div className="font-medium">
                        {enrollment.student?.first_name} {enrollment.student?.last_name}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {enrollment.student?.email}
                      </div>
                      <div className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground italic">
                    No students enrolled yet.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enrollment Side Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Enroll</CardTitle>
              <CardDescription>Add a student by their email address.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Student Email</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="student@email.com" 
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                  />
                  <Button size="icon" onClick={handleAddStudent}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-xs text-primary font-medium mb-1">PRO TIP</p>
                <p className="text-xs text-muted-foreground">
                  You can also share the Class ID with students so they can join themselves!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Class Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-medium">Average Completion</span>
                <span className="text-2xl font-bold text-primary">0%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '0%' }} />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3" />
                No assignments completed yet
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
