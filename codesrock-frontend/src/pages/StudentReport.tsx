import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer, Download, CheckCircle, Award, Star, BookOpen, GraduationCap } from "lucide-react";
import { classService } from "@/services/class.service";
import { toast } from "sonner";

export default function StudentReport() {
  const { classId, studentId } = useParams<{ classId: string, studentId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classId && studentId) loadReport();
  }, [classId, studentId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await classService.getStudentReport(classId!, studentId!);
      setReport(data);
    } catch (error) {
      console.error("Failed to load report:", error);
      toast.error("Failed to load student report");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8"><Skeleton className="h-96 w-full rounded-2xl" /></div>;
  if (!report) return <div className="p-8 text-center">Report not found</div>;

  const { student, class: classInfo, course, mastery, stats } = report;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Actions Bar - Hidden on Print */}
        <div className="flex justify-between items-center print:hidden">
          <Button variant="ghost" onClick={() => navigate(`/classes/${classId}`)} className="text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Class
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl font-bold border-primary/20" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
            <Button className="rounded-xl font-bold bg-primary shadow-lg shadow-primary/20" onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" />
              Save PDF
            </Button>
          </div>
        </div>

        {/* The Actual Report/Certificate */}
        <Card className="relative overflow-hidden border-none shadow-2xl bg-white print:shadow-none print:border-2 print:border-primary/10">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />
          
          <CardContent className="p-12 space-y-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                  <Award className="h-4 w-4" />
                  Achievement Report
                </div>
                <h1 className="text-5xl font-black text-deep-purple leading-tight">
                  {student.name}
                </h1>
                <div className="flex flex-col gap-1">
                  <p className="text-xl text-muted-foreground font-medium">{classInfo.school}</p>
                  <p className="font-black text-primary uppercase text-xs tracking-tighter">{classInfo.name}</p>
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors" />
                <div className="relative w-40 h-40 rounded-full border-8 border-white bg-gradient-to-br from-primary to-secondary flex flex-col items-center justify-center text-white shadow-xl">
                  <span className="text-5xl font-black">{stats.completionPercentage}%</span>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Complete</span>
                </div>
              </div>
            </div>

            <hr className="border-muted/30" />

            {/* Course Mastery Section */}
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-black text-deep-purple">Course Journey</h3>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-primary">{course.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {course.description || "The student has been exploring the foundations of technology and creativity through our interactive curriculum."}
                  </p>
                </div>

                <div className="bg-muted/30 p-6 rounded-2xl space-y-4 border border-muted/50">
                   <div className="flex items-center gap-2 text-deep-purple">
                     <Star className="h-5 w-5 fill-primary text-primary" />
                     <span className="font-black uppercase text-xs tracking-widest">Mastery Summary</span>
                   </div>
                   <p className="text-sm font-medium text-muted-foreground italic">
                     "{student.name} has shown exceptional curiosity and problem-solving skills while navigating the challenges of this course."
                   </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-black text-deep-purple">Skills Mastered</h3>
                </div>

                <div className="grid gap-3">
                  {mastery.map((topic: any) => (
                    <div key={topic.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      topic.completed ? 'bg-green-50 border-green-100 text-green-700' : 'bg-muted/10 border-transparent text-muted-foreground opacity-50'
                    }`}>
                      {topic.completed ? <CheckCircle className="h-5 w-5 shrink-0" /> : <Star className="h-5 w-5 shrink-0" />}
                      <div className="flex-1">
                        <p className="font-bold text-sm leading-tight">{topic.title}</p>
                        {topic.completed && topic.completed_at && (
                           <p className="text-[10px] font-bold opacity-60">Completed on {new Date(topic.completed_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer / Authentication */}
            <div className="pt-12 flex flex-col md:flex-row justify-between items-end gap-8">
               <div className="space-y-2 border-t-2 border-muted pt-4 w-full md:w-64">
                 <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Instructor Signature</p>
                 <div className="h-10" /> {/* Placeholder for signature */}
               </div>
               
               <div className="flex items-center gap-4 bg-muted/20 px-6 py-4 rounded-3xl border border-muted/50">
                 <img src="/logo.png" alt="CodesRock" className="h-8 grayscale opacity-50" />
                 <div className="h-8 w-px bg-muted" />
                 <p className="text-[10px] font-black text-muted-foreground uppercase leading-tight tracking-tighter">
                   Official Student Record<br/>CodesRock Quest Hub
                 </p>
               </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest py-8 print:hidden">
          © 2026 CodesRock Labs • Empowering the next generation of innovators.
        </p>
      </div>
    </div>
  );
}
