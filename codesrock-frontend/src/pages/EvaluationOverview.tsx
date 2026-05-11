import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Trophy, Star, ArrowRight, ClipboardCheck, Clock, Award, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminService, dashboardService, authService } from "@/services";

export default function EvaluationOverview() {
  const navigate = useNavigate();
  const user = authService.getStoredUser();

  // Fetch all evaluations
  const { data: evaluations, isLoading: loadingEvaluations } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => adminService.getAllEvaluations(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch dashboard for progress
  const { data: dashboard, isLoading: loadingDashboard } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: () => dashboardService.getUserDashboard(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingEvaluations || loadingDashboard;

  // Merge evaluations with progress
  const mergedEvaluations = useMemo(() => {
    if (!evaluations?.data) return [];
    
    const progressMap = new Map();
    dashboard?.evaluations?.forEach((p: any) => {
      // The progress record might have evaluation_id or we might need to match by title
      // Based on dashboardController.ts, it returns evaluation_progress records
      progressMap.set(p.evaluation_id || p.evaluation?.id, p);
    });

    return evaluations.data.map((ev: any) => ({
      ...ev,
      progress: progressMap.get(ev.id)
    }));
  }, [evaluations, dashboard]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Skeleton className="h-48 w-full rounded-[2.5rem]" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-[2rem]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in-up pb-10">
      {/* Header Section */}
      <section className="relative mt-6">
        <div className="bg-gradient-to-br from-orange-500 to-primary p-10 md:p-14 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-20 -mb-20 blur-3xl" />
          
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="relative shrink-0 animate-float">
               <div className="absolute -inset-4 bg-white/20 rounded-full blur-2xl" />
               <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center p-6">
                  <ClipboardCheck className="w-full h-full text-orange-500" />
               </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <h1 className="text-4xl md:text-6xl font-black font-heading tracking-tight italic">
                Mastery Challenges
              </h1>
              <p className="text-white/90 text-xl max-w-2xl font-bold leading-relaxed">
                Test your knowledge and earn massive XP! Complete the finale for each module to unlock badges and certificates.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none font-black px-4 py-2 rounded-full backdrop-blur-md">
                   {mergedEvaluations.length} TOTAL CHALLENGES
                </Badge>
                <Badge className="bg-green-500/80 text-white border-none font-black px-4 py-2 rounded-full shadow-lg">
                   {mergedEvaluations.filter(e => e.progress?.passed).length} COMPLETED
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Evaluations Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {mergedEvaluations.map((ev: any) => {
          const isPassed = ev.progress?.passed;
          const isSubmitted = ev.progress?.status === 'submitted';
          
          return (
            <Card 
              key={ev.id} 
              className={`glass-panel border-2 transition-all duration-500 group overflow-hidden rounded-[2.5rem]
                ${isPassed ? 'border-green-500/20 bg-green-50/30' : 'border-primary/10 hover:border-primary/30 hover:shadow-2xl hover:-translate-y-2'}`}
            >
              <CardHeader className="pb-4 relative">
                {isPassed && (
                  <div className="absolute top-6 right-6 z-10">
                    <div className="bg-green-500 text-white p-2 rounded-full shadow-lg animate-bounce-subtle">
                      <Award className="h-6 w-6" />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-12
                    ${isPassed ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                    <CheckSquare className="h-8 w-8" />
                  </div>
                  <Badge variant="outline" className="font-black uppercase tracking-widest text-[10px] py-1 border-2">
                    {ev.xp_reward} XP REWARD
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-black text-deep-purple leading-tight group-hover:text-primary transition-colors">
                  {ev.title}
                </CardTitle>
                <CardDescription className="text-base font-bold text-muted-foreground line-clamp-2">
                  {ev.description || "Master the concepts in this module with our finale challenge."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-0">
                <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground">
                  <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full">
                    <Clock className="h-4 w-4" />
                    <span>~10 Mins</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full">
                    <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                    <span>Mastery</span>
                  </div>
                </div>

                {isPassed ? (
                  <div className="bg-green-500/10 p-5 rounded-2xl border-2 border-green-500/20 space-y-2">
                    <div className="flex justify-between items-center text-green-700">
                      <span className="font-black uppercase text-xs tracking-widest">Result: Passed</span>
                      <span className="font-black text-xl">{ev.progress.score}%</span>
                    </div>
                    <p className="text-xs font-bold text-green-600/80 italic">You've rocked this challenge! 🤘</p>
                  </div>
                ) : isSubmitted ? (
                  <div className="bg-orange-500/10 p-5 rounded-2xl border-2 border-orange-500/20 space-y-2">
                    <div className="flex justify-between items-center text-orange-700">
                      <span className="font-black uppercase text-xs tracking-widest">Status: Pending Review</span>
                      <span className="font-black">Reviewing...</span>
                    </div>
                  </div>
                ) : null}

                <Button 
                  onClick={() => navigate(`/evaluation/${ev.topic_id || ev.id}`)}
                  className={`w-full py-7 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl transition-all duration-300
                    ${isPassed 
                      ? 'bg-green-500 hover:bg-green-600 shadow-green-200' 
                      : 'bg-primary hover:bg-primary/90 shadow-primary/20 group-hover:scale-[1.02]'}`}
                >
                  {isPassed ? "Review Results" : isSubmitted ? "View Submission" : "Start Finale 🚀"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {mergedEvaluations.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-6 glass-panel rounded-[3rem]">
            <div className="bg-muted/30 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-16 w-16 text-muted-foreground opacity-20" />
            </div>
            <h2 className="text-3xl font-black text-deep-purple">No evaluations found!</h2>
            <p className="text-muted-foreground text-lg font-bold max-w-md mx-auto">
              Our team is working on setting up the mastery challenges for your current modules. Check back soon!
            </p>
          </div>
        )}
      </div>

      {/* Rocky Motivation Footer */}
      <section className="bg-gradient-to-br from-deep-purple/5 to-secondary/5 rounded-[3rem] p-10 md:p-14 border border-white/40 backdrop-blur-sm relative group overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all duration-700 group-hover:scale-125" />
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <img src="/assets/rocky/idea-transparent.webp" alt="Rocky" className="w-28 h-28 object-contain animate-float" />
          <div className="space-y-4 text-center md:text-left flex-1">
             <h3 className="text-2xl font-black text-deep-purple italic">"Every line of code you write is a logic spark! ✨"</h3>
             <p className="text-muted-foreground font-bold text-lg">
                Completing evaluations not only proves your mastery but also helps you level up faster and earn badges to showcase your expertise. Keep rocking the journey!
             </p>
          </div>
          <Button 
            variant="outline" 
            className="rounded-2xl border-2 h-14 px-8 font-black uppercase tracking-widest text-deep-purple"
            onClick={() => navigate('/videos')}
          >
            Go to Lessons
          </Button>
        </div>
      </section>
    </div>
  );
}
