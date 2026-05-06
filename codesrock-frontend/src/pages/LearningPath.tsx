import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, CheckCircle, Clock, Star, ChevronRight, Layout, Map as MapIcon, Info, X } from "lucide-react";
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

  const getYouTubeThumbnail = (url: string | undefined): string | undefined => {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return undefined;
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };

  const handleWatchVideo = (node: MissionNode) => {
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
      const detail = await courseService.getCourseById(selectedCourse.id, user.id);
      setCourseDetail(detail);
    } catch (error: any) { toast.error("Failed to save mission progress"); }
  };

  if (loading) {
    return (
      <div className="flex gap-6 animate-fade-in h-[calc(100vh-140px)]">
        <Skeleton className="w-80 h-full rounded-[2rem]" />
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
    thumbnail: v.thumbnail || getYouTubeThumbnail(v.video_url)
  }));

  return (
    <div className="flex gap-8 animate-fade-in pb-4 h-[calc(100vh-120px)] overflow-hidden">
      
      {/* LEFT COLUMN: MISSION BRIEFING SIDEBAR */}
      <div className="w-80 flex flex-col gap-6 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-muted/20 p-6 shadow-sm overflow-hidden shrink-0">
        <div className="flex flex-col h-full overflow-hidden">
           <div className="flex items-center gap-2 mb-6 px-2">
              <div className="w-8 h-8 rounded-lg bg-deep-purple/10 flex items-center justify-center">
                 <Info className="h-4 w-4 text-deep-purple" />
              </div>
              <h1 className="text-[10px] font-black text-deep-purple uppercase tracking-[0.4em] opacity-80">Mission Briefing</h1>
           </div>
           
           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-6">
              {(courseDetail?.course?.topics || []).map((topic, idx) => {
                const isActive = selectedTopicId === topic.id;
                const isCompleted = (topic.videos || []).every((v: any) => v.userProgress?.completed);

                return (
                  <Card 
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`
                      relative group cursor-pointer transition-all duration-300 rounded-[1.5rem] border-2
                      ${isActive ? 'bg-white border-primary shadow-xl scale-[1.02]' : 'bg-white/50 border-transparent hover:border-primary/20'}
                    `}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0
                        ${isCompleted ? 'bg-green-100 text-green-600 shadow-sm' : isActive ? 'bg-primary text-white shadow-lg' : 'bg-muted/50 text-muted-foreground'}
                      `}>
                        {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Play className="h-4 w-4 ml-0.5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`}>
                           Region {idx} {isActive && '• SCANNING'}
                        </p>
                        <h3 className={`text-xs font-black leading-tight truncate ${isActive ? 'text-deep-purple' : 'text-muted-foreground'}`}>
                           {topic.title}
                        </h3>
                      </div>
                      {isActive && <ChevronRight className="h-5 w-5 text-primary animate-pulse-slow" />}
                    </CardContent>
                  </Card>
                );
              })}
           </div>

           {courses.length > 1 && (
              <div className="pt-6 border-t border-muted/20">
                 <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-3">Expedition Track</p>
                 <div className="grid gap-2">
                    {courses.filter(c => c.id !== selectedCourse?.id).map(c => (
                       <Button key={c.id} variant="outline" className="w-full justify-start rounded-2xl border-muted/20 text-[10px] font-bold h-12 px-4 hover:border-primary/40 bg-white/30" onClick={() => handleCourseSelect(c)}>
                          <Layout className="mr-2 h-4 w-4 text-primary opacity-60" />
                          <span className="truncate">{c.title}</span>
                       </Button>
                    ))}
                 </div>
              </div>
           )}
        </div>
      </div>

      {/* RIGHT COLUMN: EXPEDITION MAP */}
      <div className="flex-1 h-full">
        {detailLoading ? (
           <Skeleton className="w-full h-full rounded-[3rem]" />
        ) : currentTopic ? (
           <MissionMap 
              nodes={missionNodes} 
              onNodeClick={handleWatchVideo}
              moduleTitle={currentTopic.title}
           />
        ) : (
           <div className="w-full h-full bg-muted/5 rounded-[3rem] border-4 border-dashed border-muted/10 flex flex-col items-center justify-center text-center p-10 gap-4">
              <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                 <MapIcon className="h-10 w-10 text-muted-foreground/20" />
              </div>
              <div className="space-y-1">
                 <h3 className="text-xl font-black text-deep-purple italic">Ready for Expedition?</h3>
                 <p className="text-sm text-muted-foreground max-w-xs font-bold">Select a mission region from the briefing to begin.</p>
              </div>
           </div>
        )}
      </div>

      {/* Video Expedition Player - Perfectly Framed */}
      <Dialog open={isPlayerOpen} onOpenChange={setIsPlayerOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] w-[95vw] rounded-[2.5rem] overflow-hidden border-none p-0 bg-transparent shadow-none flex flex-col">
          {watchingVideo && (
            <div className="bg-white rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl flex flex-col h-full">
              {/* Header - More Compact */}
              <div className="px-8 py-5 bg-deep-purple text-white flex justify-between items-center shrink-0 relative">
                <div className="space-y-0.5">
                   <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-60">Expedition Playback</p>
                   <DialogTitle className="text-xl font-black italic tracking-tight truncate max-w-md">{watchingVideo.title}</DialogTitle>
                </div>
                <div className="flex gap-4 items-center pr-10">
                   <div className="bg-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-[10px] font-black">{watchingVideo.duration}m</span>
                   </div>
                   <div className="bg-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary fill-primary" />
                      <span className="text-[10px] font-black">+{watchingVideo.xp_reward} XP</span>
                   </div>
                </div>
                <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 rounded-full" onClick={() => setIsPlayerOpen(false)}>
                   <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Player Area - Scrollable for safety */}
              <div className="flex-1 overflow-y-auto bg-muted/5 custom-scrollbar">
                <div className="p-1">
                  <YouTubePlayer 
                    videoId={extractYouTubeVideoId(watchingVideo.video_url || "") || ""} 
                    title={watchingVideo.title} 
                    onProgressUpdate={handleProgressUpdate} 
                    onComplete={handleVideoComplete} 
                    showControls={true} 
                  />
                </div>
                
                {/* Footer - More Compact */}
                <div className="p-6 flex items-center justify-center">
                  <Button 
                    className="rounded-2xl font-black px-12 h-14 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform" 
                    onClick={() => setIsPlayerOpen(false)}
                  >
                    Mission Complete 🤘
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
