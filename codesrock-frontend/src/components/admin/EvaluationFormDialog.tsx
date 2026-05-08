import { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { adminService } from "@/services/admin.service";

interface EvaluationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string;
  topicTitle: string;
}

export function EvaluationFormDialog({ open, onOpenChange, topicId, topicTitle }: EvaluationFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [xpReward, setXpReward] = useState(500);
  const [questions, setQuestions] = useState<any[]>([]);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);

  useEffect(() => {
    if (open && topicId) {
      loadEvaluation();
    }
  }, [open, topicId]);

  const loadEvaluation = async () => {
    try {
      setFetching(true);
      const response = await adminService.getEvaluation(topicId);
      if (response && response.id) {
        setTitle(response.title || "");
        setDescription(response.description || "");
        setXpReward(response.xp_reward || 500);
        
        if (response.evaluation_questions) {
          const mappedQuestions = response.evaluation_questions.map((q: any) => ({
            questionText: q.question_text,
            questionType: q.question_type,
            options: q.options || [],
            correctAnswer: q.correct_answer
          }));
          setQuestions(mappedQuestions);
          setEvaluationId(response.id);
        }
      } else {
        setEvaluationId(null);
        // Defaults for new evaluation
        setTitle(`${topicTitle} Mastery Quiz`);
        setDescription(`Prove your knowledge of ${topicTitle} and earn bonus XP!`);
        setQuestions([{
          questionText: "",
          questionType: "multiple_choice",
          options: ["", "", "", ""],
          correctAnswer: ""
        }]);
      }
    } catch (error) {
      console.error("Failed to load evaluation", error);
    } finally {
      setFetching(false);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      questionText: "",
      questionType: "multiple_choice",
      options: ["", "", "", ""],
      correctAnswer: ""
    }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    if (!topicId) return toast.error("Topic ID is missing. Please close and try again.");
    if (!title) return toast.error("Title is required");
    if (questions.length === 0) return toast.error("At least one question is required");
    
    // Validate questions
    for (const q of questions) {
      if (!q.questionText) return toast.error("All questions must have text");
      if (!q.correctAnswer) return toast.error("All questions must have a correct answer");
      if (q.questionType === 'multiple_choice' && q.options.some((o: string) => !o)) {
        return toast.error("All multiple choice options must be filled");
      }
    }

    try {
      setLoading(true);
      await adminService.saveEvaluation({
        topicId,
        title,
        description,
        xpReward,
        questions
      });
      toast.success("Evaluation saved successfully!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save evaluation");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!evaluationId) return;
    if (!window.confirm("Are you sure you want to delete this evaluation? This cannot be undone.")) return;

    try {
      setLoading(true);
      await adminService.deleteEvaluation(evaluationId);
      toast.success("Evaluation deleted successfully!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete evaluation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Module Evaluation: {topicTitle}
          </DialogTitle>
          <DialogDescription>
            Create a final quiz for this module. Teachers must pass this to complete the module.
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="py-20 text-center">Loading evaluation data...</div>
        ) : (
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mastery Quiz" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="xp">Completion XP Reward</Label>
                <Input id="xp" type="number" value={xpReward} onChange={(e) => setXpReward(parseInt(e.target.value))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will they learn?" />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Questions ({questions.length})</h3>
                <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-2" /> Add Question
                </Button>
              </div>

              {questions.map((q, qIdx) => (
                <Card key={qIdx} className="border-muted/50">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        {qIdx + 1}
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-2">
                            <Label>Question Text</Label>
                            <Input value={q.questionText} onChange={(e) => updateQuestion(qIdx, "questionText", e.target.value)} placeholder="Enter your question here..." />
                          </div>
                          <div className="w-48 space-y-2">
                            <Label>Type</Label>
                              <Select value={q.questionType} onValueChange={(val) => {
                                updateQuestion(qIdx, "questionType", val);
                                updateQuestion(qIdx, "correctAnswer", ""); // Reset answer on type change
                                if (val === 'true_false') {
                                  updateQuestion(qIdx, "options", ["True", "False"]);
                                } else {
                                  updateQuestion(qIdx, "options", ["", "", "", ""]);
                                }
                              }}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                <SelectItem value="true_false">True / False</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button variant="ghost" size="icon" className="mt-8 text-destructive" onClick={() => removeQuestion(qIdx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {q.questionType === 'multiple_choice' ? (
                          <div className="grid grid-cols-2 gap-3">
                            {q.options.map((opt: string, oIdx: number) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center border font-bold ${q.correctAnswer === opt && opt !== "" ? 'bg-green-500 text-white border-green-600' : 'bg-muted'}`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </div>
                                <Input value={opt} onChange={(e) => updateOption(qIdx, oIdx, e.target.value)} placeholder={`Option ${oIdx + 1}`} />
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className={q.correctAnswer === opt && opt !== "" ? "text-green-500" : "text-muted-foreground"}
                                  onClick={() => updateQuestion(qIdx, "correctAnswer", opt)}
                                >
                                  <CheckCircle2 className="h-5 w-5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex gap-4">
                             <Button 
                              variant={q.correctAnswer === "True" ? "default" : "outline"} 
                              className="flex-1"
                              onClick={() => updateQuestion(qIdx, "correctAnswer", "True")}
                            >
                              True
                            </Button>
                            <Button 
                              variant={q.correctAnswer === "False" ? "default" : "outline"} 
                              className="flex-1"
                              onClick={() => updateQuestion(qIdx, "correctAnswer", "False")}
                            >
                              False
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t flex justify-between items-center sm:justify-between">
          <div>
            {evaluationId && (
              <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={loading}>
                Delete Quiz
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Evaluation"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
