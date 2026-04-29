import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Play, CheckCircle, Search, Clock, Star, Video, BookOpen, ChevronDown, ChevronRight, ArrowLeft, Layers } from "lucide-react";
import { toast } from "sonner";

import { courseService, type CourseWithProgress, type CourseDetail, type VideoItem } from "@/services/course.service";
import { authService } from "@/services/auth.service";
import { YouTubePlayer } from "@/components/video/YouTubePlayer";

// Helper function to extract YouTube video ID from URL
const extractYouTubeVideoId = (url: string | undefined): string | null => {
  if (!url) return null;
  const allMatches: string[] = [];
  const videoIdPattern = /[?&]v=([a-zA-Z0-9_-]{11})|youtu\.be\/([a-zA-Z0-9_-]{11})|embed\/([a-zA-Z0-9_-]{11})/g;
  let match;
  while ((match = videoIdPattern.exec(url)) !== null) {
    const videoId = match[1] || match[2] || match[3];
    if (videoId) allMatches.push(videoId);
  }
  if (allMatches.length > 0) return allMatches[allMatches.length - 1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
};

export default function Videos() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Course detail view
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<CourseDetail | null>(null);
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  // Video player
  const [watchingVideo, setWatchingVideo] = useState<VideoItem | null>(null);
  const [watchingCourseId, setWatchingCourseId] = useState<string>("");
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const user = authService.getStoredUser();
      if (!user?.id) { toast.error("Please login to view courses"); return; }
      const data = await courseService.getCourses({ userId: user.id });
      setCourses(data);
    } catch (error) {
      console.error("Failed to load courses:", error);
      toast.error("Failed to load courses");
    } finally { setLoading(false); }
  };

  const openCourse = async (course: CourseWithProgress) => {
    try {
      setCourseDetailLoading(true);
      const user = authService.getStoredUser();
      const detail = await courseService.getCourseById(course.id, user?.id);
      setSelectedCourseDetail(detail);
      // Auto-expand first topic
      const firstTopic = detail.course?.topics?.[0];
      if (firstTopic) setExpandedTopics(new Set([firstTopic.id]));
    } catch (error) {
      toast.error("Failed to load course details");
    } finally { setCourseDetailLoading(false); }
  };

  const closeCourseDetail = () => { setSelectedCourseDetail(null); setExpandedTopics(new Set()); };

  const toggleTopic = (topicId: string) => {
    const next = new Set(expandedTopics);
    if (next.has(topicId)) next.delete(topicId); else next.add(topicId);
    setExpandedTopics(next);
  };

  const handleWatchVideo = (video: VideoItem, courseId: string) => {
    const videoId = extractYouTubeVideoId(video.video_url || "");
    if (!videoId) { toast.error("Video not available"); return; }
    setWatchingVideo(video);
    setWatchingCourseId(courseId);
    setIsPlayerOpen(true);
  };

  const handleProgressUpdate = async (seconds: number, total: number) => {
    setWatchedSeconds(seconds);
    setTotalSeconds(total);
    if (Math.floor(seconds) % 10 === 0 && watchingVideo) {
      const user = authService.getStoredUser();
      if (!user?.id) return;
      try {
        await courseService.updateVideoProgress(user.id, watchingVideo.id, watchingCourseId, seconds, total);
      } catch (error) { console.error("Failed to update progress:", error); }
    }
  };

  const handleVideoComplete = async () => {
    if (!watchingVideo) return;
    const user = authService.getStoredUser();
    if (!user?.id) return;
    try {
      const result = await courseService.updateVideoProgress(user.id, watchingVideo.id, watchingCourseId, totalSeconds, totalSeconds);
      if (result.justCompleted) {
        toast.success(`🎉 Completed "${watchingVideo.title}"! +${watchingVideo.xp_reward} XP`, { description: "Great job! Keep learning!" });
      }
      // Refresh course detail
      if (selectedCourseDetail) {
        const detail = await courseService.getCourseById(selectedCourseDetail.course.id, user.id);
        setSelectedCourseDetail(detail);
      }
      await loadCourses();
    } catch (error: any) { toast.error(error.message || "Failed to complete video"); }
  };

  const closePlayer = () => { setIsPlayerOpen(false); setWatchingVideo(null); setWatchedSeconds(0); setTotalSeconds(0); };

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-60" />)}
        </div>
      </div>
    );
  }

  // ========== COURSE DETAIL VIEW ==========
  if (selectedCourseDetail) {
    const { course, courseProgress } = selectedCourseDetail;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={closeCourseDetail}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground text-sm">{course.description}</p>
          </div>
        </div>

        {/* Course Progress Bar */}
        {courseProgress && (
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Course Progress</span>
                <span className="text-sm text-muted-foreground">{courseProgress.completedVideos}/{courseProgress.totalVideos} videos</span>
              </div>
              <Progress value={courseProgress.progressPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{courseProgress.progressPercentage}% complete</p>
            </CardContent>
          </Card>
        )}

        {/* Topics & Videos */}
        <div className="space-y-3">
          {(course.topics || []).map((topic, tIdx) => {
            const isExpanded = expandedTopics.has(topic.id);
            const topicCompletedCount = (topic.videos || []).filter((v: any) => v.userProgress?.completed).length;
            const topicTotalCount = topic.videos?.length || 0;

            return (
              <Card key={topic.id} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleTopic(topic.id)}>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                          <div className="text-left">
                            <CardTitle className="text-base">{tIdx + 1}. {topic.title}</CardTitle>
                            {topic.description && <p className="text-xs text-muted-foreground mt-0.5">{topic.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{topicCompletedCount}/{topicTotalCount} videos</Badge>
                          {topicCompletedCount === topicTotalCount && topicTotalCount > 0 && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                      <div className="space-y-2 ml-8">
                        {(topic.videos || []).map((video: any, vIdx: number) => {
                          const isCompleted = video.userProgress?.completed;
                          const hasVideoUrl = !!extractYouTubeVideoId(video.video_url);

                          return (
                            <div key={video.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isCompleted ? "bg-green-500/5 border-green-500/20" : "hover:bg-muted/50"}`}>
                              <div className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0" style={{ background: isCompleted ? "var(--green-500, #22c55e)" : "var(--primary, hsl(var(--primary)))", color: "white", opacity: isCompleted ? 1 : 0.8 }}>
                                {isCompleted ? <CheckCircle className="h-4 w-4" /> : <span className="text-xs font-bold">{vIdx + 1}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isCompleted ? "text-green-700 dark:text-green-400" : ""}`}>{video.title}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{video.duration} min</span>
                                  <span className="flex items-center gap-1"><Star className="h-3 w-3" />+{video.xp_reward} XP</span>
                                </div>
                              </div>
                              <Button size="sm" variant={isCompleted ? "outline" : "default"} disabled={!hasVideoUrl} onClick={() => handleWatchVideo(video, course.id)} className="flex-shrink-0">
                                <Play className="h-3 w-3 mr-1" />
                                {isCompleted ? "Review" : "Watch"}
                              </Button>
                            </div>
                          );
                        })}
                        {(topic.videos || []).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No videos in this topic yet</p>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>

        {/* Player Dialog */}
        <Dialog open={isPlayerOpen} onOpenChange={closePlayer}>
          <DialogContent className="max-w-5xl">
            <DialogHeader><DialogTitle>{watchingVideo?.title}</DialogTitle></DialogHeader>
            {watchingVideo && (
              <div className="space-y-4">
                <YouTubePlayer videoId={extractYouTubeVideoId(watchingVideo.video_url || "") || ""} title={watchingVideo.title} onProgressUpdate={handleProgressUpdate} onComplete={handleVideoComplete} showControls={true} />
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{watchingVideo.duration} min</span>
                  <span className="flex items-center gap-1"><Star className="h-4 w-4" />+{watchingVideo.xp_reward} XP</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ========== COURSES LIST VIEW ==========
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg"><Video className="h-6 w-6 text-primary" /></div>
          <h1 className="text-3xl font-bold">Video Library</h1>
        </div>
        <p className="text-muted-foreground">Learn at your own pace with our comprehensive video courses</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search courses..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map(course => {
          const progress = course.userProgress?.progressPercentage || 0;
          const isCompleted = course.userProgress?.isCompleted || false;

          return (
            <Card key={course.id} className={`hover:shadow-lg transition-all cursor-pointer group overflow-hidden ${isCompleted ? "border-green-500/30" : ""}`} onClick={() => openCourse(course)}>
              <div className={`h-1.5 w-full ${isCompleted ? "bg-green-500" : progress > 0 ? "bg-primary" : "bg-primary/20 group-hover:bg-primary/40 transition-colors"}`} style={!isCompleted && progress > 0 ? { background: `linear-gradient(to right, hsl(var(--primary)) ${progress}%, hsl(var(--muted)) ${progress}%)` } : {}} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                    </div>
                    {isCompleted && <Badge className="bg-green-500 text-xs">Completed</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground"><Layers className="h-3 w-3" />{course.topicCount || 0} topics</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><Video className="h-3 w-3" />{course.videoCount || 0} videos</span>
                  </div>
                  {progress > 0 && (
                    <div>
                      <Progress value={progress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
                    </div>
                  )}
                  <Button size="sm" className="w-full" variant={isCompleted ? "outline" : "default"}>
                    {isCompleted ? "Review Course" : progress > 0 ? "Continue" : "Start Course"}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <Card><CardContent className="text-center py-12"><p className="text-muted-foreground">No courses found{searchQuery && ` for "${searchQuery}"`}</p></CardContent></Card>
      )}
    </div>
  );
}
