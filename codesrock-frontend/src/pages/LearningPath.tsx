import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, CheckCircle, Clock, Star, ChevronRight, Layout, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";

import { courseService, type CourseWithProgress, type CourseDetail, type VideoItem } from "@/services/course.service";
import { authService } from "@/services/auth.service";
import { YouTubePlayer } from "@/components/video/YouTubePlayer";
import { MissionMap, type MissionNode } from "@/components/learning/MissionMap";

export default function LearningPath() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected course and topic
  const [selectedCourse, setSelectedCourse] = useState<CourseWithProgress | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Video player
  const [watchingVideo, setWatchingVideo] = useState<VideoItem | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const user = authService.getStoredUser();
      if (!user?.id) return;
      const data = await courseService.getCourses({ userId: user.id });
      setCourses(data);
      
      // Auto-select first course if available
      if (data.length > 0) {
        handleCourseSelect(data[0]);
      }
    } catch (error) {
      toast.error("Failed to load learning path");
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = async (course: CourseWithProgress) => {
    try {
      setSelectedCourse(course);
      setDetailLoading(true);
      const user = authService.getStoredUser();
      const detail = await courseService.getCourseById(course.id, user?.id);
      setCourseDetail(detail);
      
      // Auto-select first topic
      if (detail.course?.topics?.length > 0) {
        setSelectedTopicId(detail.course.topics[0].id);
      }
    } catch (error) {
      toast.error("Failed to load course modules");
    } finally {
      setDetailLoading(false);
    }
  };

  const extractYouTubeVideoId = (url: string | undefined): string | null => {
    if (!url) return null;
    const videoIdPattern = /[?&]v=([a-zA-Z0-9_-]{11})|youtu\.be\/([a-zA-Z0-9_-]{11})|embed\/([a-zA-Z0-9_-]{11})/;
    const match = url.match(videoIdPattern);
    return match ? (match[1] || match[2] || match[3]) : url.length === 11 ? url : null;
  };

  const handleWatchVideo = (node: MissionNode) => {
    // Find the actual video object from the current topic
    const topic = courseDetail?.course?.topics?.find(t => t.id === selectedTopicId);
    const video = topic?.videos?.find((v: any) => v.id === node.id);
    
    if (!video) {
      toast.error("Video data not found");
      return;
    }

    const videoId = extractYouTubeVideoId(video.video_url || "");
    if (!videoId) { toast.error("Video not available"); return; }
    
    setWatchingVideo(video);
    setIsPlayerOpen(true);
  };

  const handleProgressUpdate = async (seconds: number, total: number) => {
    setTotalSeconds(total);
    if (Math.floor(seconds) % 10 === 0 && watchingVideo && selectedCourse) {
      const user = authService.getStoredUser();
      if (!user?.id) return;
      try {
        await courseService.updateVideoProgress(user.id, watchingVideo.id, selectedCourse.id, seconds, total);
      } catch (error) { console.error("Failed to update progress:", error); }
    }
  };

  const handleVideoComplete = async () => {
    if (!watchingVideo || !selectedCourse) return;
    const user = authService.getStoredUser();
    if (!user?.id) return;
    try {
      const result = await courseService.updateVideoProgress(user.id, watchingVideo.id, selectedCourse.id, totalSeconds, totalSeconds);
      if (result.justCompleted) {
        toast.success(`🎉 Mission Accomplished! +${watchingVideo.xp_reward} XP`, { description: `You've mastered "${watchingVideo.title}"!` });
      }
      // Refresh data
      const detail = await courseService.getCourseById(selectedCourse.id, user.id);
      setCourseDetail(detail);
    } catch (error: any) { toast.error("Failed to save mission progress"); }
  };

  if (loading) {
    return (
      <div className="flex gap-6 animate-fade-in h-[calc(100vh-140px)]">
        <Skeleton className="w-72 h-full rounded-[2rem]" />
        <Skeleton className="flex-1 h-full rounded-[2rem]" />
      </div>
    );
  }

  const currentTopic = courseDetail?.course?.topics?.find(t => t.id === selectedTopicId);
  const missionNodes: MissionNode[] = (currentTopic?.videos || []).map((v: any, idx: number) => ({
    id: v.id,
    title: v.title,
    status: v.userProgress?.completed ? 'watched' : (idx === 0 || (currentTopic?.videos[idx-1]?.userProgress?.completed)) ? 'active' : 'available',
    type: 'video',
    duration: v.duration,
    xpReward: v.xp_reward,
    thumbnail: v.thumbnail
  }));

  return (
    <div className="flex gap-8 animate-fade-in pb-4 h-[calc(100vh-120px)] overflow-hidden pr-4">
      
      {/* LEFT COLUMN: MODULES SIDEBAR */}
      <div className="w-80 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar shrink-0">
        <div className="px-1">
           <h1 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-6 opacity-60">Learning Path</h1>
           
           <div className="space-y-3">
              {(courseDetail?.course?.topics || []).map((topic, idx) => {
                const isActive = selectedTopicId === topic.id;
                const isCompleted = (topic.videos || []).every((v: any) => v.userProgress?.completed);

                return (
                  <Card 
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`
                      relative group cursor-pointer transition-all duration-300 rounded-[1.5rem] border-2
                      ${isActive ? 'bg-white border-primary shadow-xl scale-[1.02]' : 'bg-white/40 border-transparent hover:border-primary/20'}
                    `}
                  >
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={`
                        w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shrink-0
                        ${isCompleted ? 'bg-green-100 text-green-600 shadow-sm' : isActive ? 'bg-primary text-white shadow-lg' : 'bg-muted text-muted-foreground'}
                      `}>
                        {isCompleted ? <CheckCircle className="h-6 w-6" /> : <Play className="h-5 w-5 ml-0.5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`}>
                           Module {idx} {isActive && '• ACTIVE'}
                        </p>
                        <h3 className={`text-sm font-black leading-tight truncate ${isActive ? 'text-deep-purple' : 'text-muted-foreground'}`}>
                           {topic.title}
                        </h3>
                      </div>

                      {isActive && <ChevronRight className="h-5 w-5 text-primary animate-pulse-slow" />}
                    </CardContent>
                  </Card>
                );
              })}
           </div>
        </div>

        {/* Course Switcher */}
        {courses.length > 1 && (
           <div className="mt-auto px-1 pt-6 border-t border-muted/20">
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-3">Switch Track</p>
              <div className="grid gap-2">
                 {courses.filter(c => c.id !== selectedCourse?.id).map(c => (
                    <Button key={c.id} variant="outline" className="w-full justify-start rounded-xl border-muted/20 text-[10px] font-bold h-11 px-4 hover:border-primary/30" onClick={() => handleCourseSelect(c)}>
                       <Layout className="mr-2 h-4 w-4 text-primary" />
                       <span className="truncate">{c.title}</span>
                    </Button>
                 ))}
              </div>
           </div>
        )}
      </div>

      {/* RIGHT COLUMN: MISSION MAP */}
      <div className="flex-1 h-full">
        {detailLoading ? (
           <Skeleton className="w-full h-full rounded-[2.5rem]" />
        ) : currentTopic ? (
           <MissionMap 
              nodes={missionNodes} 
              onNodeClick={handleWatchVideo}
              moduleTitle={currentTopic.title}
           />
        ) : (
           <div className="w-full h-full bg-muted/5 rounded-[2.5rem] border-4 border-dashed border-muted/10 flex flex-col items-center justify-center text-center p-10 gap-4">
              <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                 <MapIcon className="h-10 w-10 text-muted-foreground/20" />
              </div>
              <div className="space-y-1">
                 <h3 className="text-xl font-black text-deep-purple italic">Begin Your Mission</h3>
                 <p className="text-sm text-muted-foreground max-w-xs font-bold">Select a module from the track to start your learning journey.</p>
              </div>
           </div>
        )}
      </div>

      {/* Video Player Dialog */}
      <Dialog open={isPlayerOpen} onOpenChange={setIsPlayerOpen}>
        <DialogContent className="max-w-5xl rounded-[3rem] overflow-hidden border-none p-0 bg-transparent shadow-none">
          {watchingVideo && (
            <div className="bg-white rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl">
              <div className="p-8 bg-deep-purple text-white flex justify-between items-center">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Currently Viewing</p>
                   <DialogTitle className="text-2xl font-black italic">{watchingVideo.title}</DialogTitle>
                </div>
                <div className="flex gap-4">
                   <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-xs font-black">{watchingVideo.duration}m</span>
                   </div>
                   <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary fill-primary" />
                      <span className="text-xs font-black">+{watchingVideo.xp_reward} XP</span>
                   </div>
                </div>
              </div>
              <div className="p-2 bg-muted/5">
                <YouTubePlayer 
                  videoId={extractYouTubeVideoId(watchingVideo.video_url || "") || ""} 
                  title={watchingVideo.title} 
                  onProgressUpdate={handleProgressUpdate} 
                  onComplete={handleVideoComplete} 
                  showControls={true} 
                />
              </div>
              <div className="p-8 flex items-center justify-center">
                <Button className="rounded-2xl font-black px-12 h-14 text-lg shadow-xl shadow-primary/20" onClick={() => setIsPlayerOpen(false)}>
                  Complete Mission
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
