import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, BookOpen, School, ArrowRight, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { classService, type Class } from "@/services/class.service";
import { courseService, type Course } from "@/services/course.service";
import { authService } from "@/services/auth.service";

export default function Classes() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Form state
  const [newClassName, setNewClassName] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = authService.getStoredUser();
      if (!user?.id) return;

      const [classesData, coursesData] = await Promise.all([
        classService.getTeacherClasses(user.id),
        courseService.getCourses()
      ]);

      setClasses(classesData);
      setCourses(coursesData);
    } catch (err: any) {
      console.error('Failed to load classes or courses:', err);
      setError(err.message || 'Failed to load class data. Please check your connection or contact an administrator.');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName) {
      toast.error('Class name is required');
      return;
    }

    try {
      setCreating(true);
      const user = authService.getStoredUser();
      if (!user?.id) return;

      await classService.createClass({
        name: newClassName,
        teacherId: user.id,
        courseId: selectedCourseId || undefined
      });

      toast.success('Class created successfully!');
      setIsCreateDialogOpen(false);
      setNewClassName("");
      setSelectedCourseId("");
      loadData();
    } catch (error) {
      console.error('Failed to create class:', error);
      toast.error('Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="border-destructive/20 bg-destructive/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Plus className="rotate-45 h-5 w-5" />
              Failed to load Classes
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadData} variant="outline" className="border-destructive/20 text-destructive hover:bg-destructive/10">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Classes 🏫</h1>
          <p className="text-muted-foreground">
            Manage your student sections and track their learning progress
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              New Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Class Name</label>
                <Input 
                  placeholder="e.g. Grade 5 Alpha" 
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign Course (Optional)</label>
                <Select onValueChange={setSelectedCourseId} value={selectedCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleCreateClass} disabled={creating}>
                {creating ? "Creating..." : "Create Class"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length > 0 ? (
          classes.map((cls) => (
            <Card key={cls.id} className="hover:shadow-lg transition-all border-primary/10 group overflow-hidden">
              <div className="h-2 bg-primary/40 group-hover:bg-primary transition-colors" />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{cls.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <School className="h-3 w-3" />
                      {cls.schools?.name || 'Local High School'}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{cls.studentCount} Students</span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10">
                    Active
                  </Badge>
                </div>

                {cls.courses ? (
                  <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg text-sm group-hover:bg-primary/5 transition-colors">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="truncate font-medium">{cls.courses.title}</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic p-2 border border-dashed rounded-lg">
                    No course assigned
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                  onClick={() => navigate(`/classes/${cls.id}`)}
                >
                  Manage Students
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <School className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No classes created yet</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                Start by creating your first class to manage your students and assign courses.
              </p>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Class
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
