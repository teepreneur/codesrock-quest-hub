import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, CheckCircle2, XCircle, Award, ArrowRight, ArrowLeft, Star } from "lucide-react";
import { toast } from "sonner";
import { adminService } from "@/services/admin.service";
import { authService } from "@/services/auth.service";

export default function Evaluation() {
  const { id: topicId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (topicId) {
      loadEvaluation();
    }
  }, [topicId]);

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      const response = await adminService.getEvaluation(topicId!);
      if (response.data) {
        setEvaluation(response.data);
      } else {
        toast.error("No evaluation found for this module");
        navigate("/videos");
      }
    } catch (error) {
      toast.error("Failed to load evaluation");
      navigate("/videos");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answer
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < evaluation.evaluation_questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    evaluation.evaluation_questions.forEach((q: any, idx: number) => {
      if (selectedAnswers[idx] === q.correct_answer) {
        correctCount++;
      }
    });
    return Math.round((correctCount / evaluation.evaluation_questions.length) * 100);
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length < evaluation.evaluation_questions.length) {
      return toast.warning("Please answer all questions before submitting");
    }

    const finalScore = calculateScore();
    setScore(finalScore);
    const passed = finalScore >= 80; // 80% pass mark

    try {
      setSubmitting(true);
      const user = authService.getStoredUser();
      if (!user) return;

      // Call the new submit endpoint
      await adminService.submitEvaluation({
        userId: user.id,
        evaluationId: evaluation.id,
        score: finalScore,
        passed
      });

      setShowResults(true);
      if (passed) {
        toast.success(`🎉 Congratulations! You passed with ${finalScore}%!`);
      } else {
        toast.error(`Study a bit more! You got ${finalScore}%. You need 80% to pass.`);
      }
    } catch (error) {
      toast.error("Failed to submit evaluation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading your finale challenge... 🚀</div>;
  }

  if (showResults) {
    const passed = score >= 80;
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 animate-fade-in">
        <Card className="border-4 border-primary/20 rounded-[3rem] overflow-hidden shadow-2xl">
          <CardContent className="p-12 text-center space-y-8">
            <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-white shadow-xl ${passed ? 'bg-green-500' : 'bg-orange-500'}`}>
              {passed ? <Award className="h-16 w-16" /> : <HelpCircle className="h-16 w-16" />}
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-deep-purple italic">
                {passed ? "MODULE MASTERED!" : "KEEP ROCKING!"}
              </h1>
              <p className="text-muted-foreground text-lg font-bold">
                {passed 
                  ? `Incredible job! You've successfully completed the ${evaluation.title}.` 
                  : `You're almost there! You need a score of 80% to pass.`}
              </p>
            </div>

            <div className="bg-muted/30 p-8 rounded-[2rem] border-2 border-dashed border-muted">
              <div className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-2">Your Score</div>
              <div className={`text-6xl font-black ${passed ? 'text-green-500' : 'text-orange-500'}`}>{score}%</div>
            </div>

            {passed && (
               <div className="flex items-center justify-center gap-4 bg-primary/10 p-4 rounded-2xl border-2 border-primary/20 animate-bounce-subtle">
                <Star className="h-6 w-6 text-primary fill-primary" />
                <span className="text-xl font-black text-primary">+{evaluation.xp_reward} XP EARNED!</span>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              {passed ? (
                <Button className="flex-1 h-16 rounded-2xl text-lg font-black uppercase tracking-widest bg-primary hover:scale-[1.02] shadow-xl" onClick={() => navigate("/videos")}>
                  Return to Journey <ArrowRight className="ml-2" />
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="flex-1 h-16 rounded-2xl text-lg font-black uppercase border-2" onClick={() => { setShowResults(false); setCurrentQuestionIndex(0); setSelectedAnswers({}); }}>
                    Try Again
                  </Button>
                  <Button className="flex-1 h-16 rounded-2xl text-lg font-black uppercase bg-deep-purple" onClick={() => navigate("/videos")}>
                    Back to Lessons
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = evaluation.evaluation_questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / evaluation.evaluation_questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg">
            <HelpCircle className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-deep-purple italic leading-none">{evaluation.title}</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1 uppercase tracking-widest">Mastery Challenge</p>
          </div>
        </div>
        <div className="text-right">
          <Badge variant="secondary" className="bg-orange-500 text-white font-black px-4 py-2 rounded-full text-sm">
            +{evaluation.xp_reward} XP
          </Badge>
        </div>
      </div>

      <Card className="border-4 border-primary/10 rounded-[2.5rem] overflow-hidden shadow-xl bg-white/50 backdrop-blur-sm">
        <div className="h-2 bg-muted w-full">
          <Progress value={progress} className="h-full rounded-none bg-orange-500" />
        </div>
        
        <CardContent className="p-10 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center font-black text-sm">
                {currentQuestionIndex + 1}
              </span>
              <span className="text-sm font-black text-muted-foreground uppercase tracking-widest">Question {currentQuestionIndex + 1} of {evaluation.evaluation_questions.length}</span>
            </div>
            <h2 className="text-2xl font-black text-deep-purple leading-tight">
              {currentQuestion.question_text}
            </h2>
          </div>

          <div className="grid gap-4">
            {currentQuestion.options.map((option: string, idx: number) => (
              <Button
                key={idx}
                variant="outline"
                className={`h-auto py-6 px-8 justify-start text-left text-lg font-bold rounded-2xl border-2 transition-all duration-300
                  ${selectedAnswers[currentQuestionIndex] === option 
                    ? 'border-primary bg-primary/5 text-primary scale-[1.01] shadow-md' 
                    : 'border-muted hover:border-primary/40 hover:bg-white'}`}
                onClick={() => handleAnswerSelect(option)}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center mr-4 font-black transition-all
                  ${selectedAnswers[currentQuestionIndex] === option ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                {option}
              </Button>
            ))}
          </div>

          <div className="flex justify-between items-center pt-8 border-t border-muted/20">
            <Button
              variant="ghost"
              className="font-black uppercase tracking-widest text-muted-foreground hover:text-primary"
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            {currentQuestionIndex === evaluation.evaluation_questions.length - 1 ? (
              <Button
                className="bg-orange-500 hover:bg-orange-600 font-black uppercase tracking-widest px-10 h-14 rounded-2xl shadow-xl shadow-orange-200 animate-pulse-slow"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Finish Challenge 🚀"}
              </Button>
            ) : (
              <Button
                className="bg-primary font-black uppercase tracking-widest px-10 h-14 rounded-2xl shadow-xl shadow-primary/20"
                onClick={nextQuestion}
                disabled={!selectedAnswers[currentQuestionIndex]}
              >
                Next Question <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
