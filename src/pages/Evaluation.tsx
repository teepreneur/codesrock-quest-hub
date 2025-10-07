import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Circle, Clock, Award } from "lucide-react";
import { checklistItems } from "@/lib/mockData";
import { toast } from "sonner";

export default function Evaluation() {
  const completedItems = checklistItems.filter((item) => item.completed).length;
  const totalItems = checklistItems.length;
  const completionPercentage = Math.round((completedItems / totalItems) * 100);

  const itemsByCategory = {
    videos: checklistItems.filter((item) => item.category === "videos"),
    readings: checklistItems.filter((item) => item.category === "readings"),
    assessments: checklistItems.filter((item) => item.category === "assessments"),
    quiz: checklistItems.filter((item) => item.category === "quiz"),
  };

  const handleToggleItem = (itemId: string) => {
    const item = checklistItems.find((i) => i.id === itemId);
    if (item && !item.completed) {
      toast.success(`✅ Item completed! +${item.xpReward} XP earned`, {
        description: item.title,
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Evaluation Checklist ✅</h1>
        <p className="text-muted-foreground">
          Track your progress through the required training components
        </p>
      </div>

      {/* Overall Progress Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Overall Completion
          </CardTitle>
          <CardDescription>
            {completedItems} of {totalItems} requirements completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={completionPercentage} className="h-4" />
            </div>
            <div className="text-3xl font-bold text-primary">{completionPercentage}%</div>
          </div>

          {completionPercentage === 100 ? (
            <Button className="w-full bg-accent hover:bg-accent/90 text-foreground font-bold">
              <Award className="mr-2 h-5 w-5" />
              Submit for Certification
            </Button>
          ) : (
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">
                Complete all items to unlock certification submission
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Estimated time remaining:</span>
            </div>
            <span className="font-medium">~3 hours</span>
          </div>
        </CardContent>
      </Card>

      {/* Video Courses Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="text-2xl">🎥</div>
            Video Courses
          </CardTitle>
          <CardDescription>
            {itemsByCategory.videos.filter((i) => i.completed).length} of{" "}
            {itemsByCategory.videos.length} completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {itemsByCategory.videos.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                item.completed
                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                  : "bg-card border-border hover:bg-muted/50"
              }`}
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => handleToggleItem(item.id)}
                className="h-5 w-5"
              />
              {item.completed ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${item.completed ? "text-muted-foreground" : ""}`}>
                  {item.title}
                </p>
              </div>
              <Badge variant={item.completed ? "default" : "secondary"} className="ml-auto">
                +{item.xpReward} XP
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Required Readings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="text-2xl">📖</div>
            Required Readings
          </CardTitle>
          <CardDescription>
            {itemsByCategory.readings.filter((i) => i.completed).length} of{" "}
            {itemsByCategory.readings.length} completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {itemsByCategory.readings.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                item.completed
                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                  : "bg-card border-border hover:bg-muted/50"
              }`}
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => handleToggleItem(item.id)}
                className="h-5 w-5"
              />
              {item.completed ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${item.completed ? "text-muted-foreground" : ""}`}>
                  {item.title}
                </p>
              </div>
              <Badge variant={item.completed ? "default" : "secondary"} className="ml-auto">
                +{item.xpReward} XP
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Practical Assessments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="text-2xl">📝</div>
            Practical Assessments
          </CardTitle>
          <CardDescription>
            {itemsByCategory.assessments.filter((i) => i.completed).length} of{" "}
            {itemsByCategory.assessments.length} completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {itemsByCategory.assessments.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                item.completed
                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                  : "bg-card border-border hover:bg-muted/50"
              }`}
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => handleToggleItem(item.id)}
                className="h-5 w-5"
              />
              {item.completed ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${item.completed ? "text-muted-foreground" : ""}`}>
                  {item.title}
                </p>
              </div>
              <Badge variant={item.completed ? "default" : "secondary"} className="ml-auto">
                +{item.xpReward} XP
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Certification Quiz Section */}
      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="text-2xl">🎯</div>
            Certification Quiz
          </CardTitle>
          <CardDescription>
            Final assessment required for certification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {itemsByCategory.quiz.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                item.completed
                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                  : "bg-card border-accent/20 hover:bg-accent/5"
              }`}
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => handleToggleItem(item.id)}
                className="h-5 w-5"
              />
              {item.completed ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${item.completed ? "text-muted-foreground" : ""}`}>
                  {item.title}
                </p>
                {item.dueDate && !item.completed && (
                  <p className="text-sm text-muted-foreground">Due: {item.dueDate}</p>
                )}
              </div>
              <Badge variant="default" className="ml-auto bg-accent">
                +{item.xpReward} XP
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
