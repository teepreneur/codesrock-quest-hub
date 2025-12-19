import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Lock, CheckCircle, Search, Clock, Star, X } from "lucide-react";
import { toast } from "sonner";

import { courseService, type CourseWithProgress } from "@/services/course.service";
import { authService } from "@/services/auth.service";
import { YouTubePlayer } from "@/components/video/YouTubePlayer";

// Helper function to extract YouTube video ID from URL
const extractYouTubeVideoId = (url: string | undefined): string | null => {
  if (!url) return null;

  // Handle malformed URLs like "https://www.youtube.com/watch?v=https://www.youtube.com/watch?v=VIDEO_ID"
  // by finding the last occurrence of a video ID pattern
  const allMatches: string[] = [];

  // Pattern to match YouTube video IDs (11 characters)
  const videoIdPattern = /[?&]v=([a-zA-Z0-9_-]{11})|youtu\.be\/([a-zA-Z0-9_-]{11})|embed\/([a-zA-Z0-9_-]{11})/g;

  let match;
  while ((match = videoIdPattern.exec(url)) !== null) {
    const videoId = match[1] || match[2] || match[3];
    if (videoId) allMatches.push(videoId);
  }

  // Return the last valid video ID found (handles malformed double URLs)
  if (allMatches.length > 0) {
    return allMatches[allMatches.length - 1];
  }

  // Check if the input is just a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }

  return null;
};

export default function Videos() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [watchingCourse, setWatchingCourse] = useState<CourseWithProgress | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const user = authService.getStoredUser();

      if (!user?.id) {
        toast.error('Please login to view courses');
        return;
      }

      const data = await courseService.getCourses({ userId: user.id });
      console.log('Courses loaded:', data);
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleWatchVideo = (course: CourseWithProgress) => {
    const user = authService.getStoredUser();

    if (!user?.id) {
      toast.error('Please login to watch videos');
      return;
    }

    if (course.isLocked) {
      toast.error(`🔒 This video is locked. Complete prerequisites first.`);
      return;
    }

    // Check if course has a video URL and extract YouTube ID
    const videoId = extractYouTubeVideoId((course as any).video_url);
    if (!videoId) {
      toast.error('Video not available');
      return;
    }

    setWatchingCourse(course);
    setIsPlayerOpen(true);
  };

  const handleProgressUpdate = async (seconds: number, total: number) => {
    setWatchedSeconds(seconds);
    setTotalSeconds(total);

    // Update progress every 10 seconds
    if (Math.floor(seconds) % 10 === 0 && watchingCourse) {
      const user = authService.getStoredUser();
      if (!user?.id) return;

      try {
        await courseService.updateVideoProgress(
          user.id,
          watchingCourse.id,
          seconds,
          total
        );
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }
  };

  const handleVideoComplete = async () => {
    if (!watchingCourse) return;

    const user = authService.getStoredUser();
    if (!user?.id) return;

    try {
      const result = await courseService.updateVideoProgress(
        user.id,
        watchingCourse.id,
        totalSeconds,
        totalSeconds
      );

      // Check if just completed (backend returns justCompleted flag)
      if (result.justCompleted) {
        toast.success(`🎉 Completed "${watchingCourse.title}"! XP earned!`, {
          description: 'Great job! Keep learning!'
        });
      }

      // Reload courses to update progress
      await loadCourses();
    } catch (error: any) {
      console.error('Failed to complete video:', error);
      toast.error(error.message || 'Failed to complete video');
    }
  };

  const closePlayer = () => {
    setIsPlayerOpen(false);
    setWatchingCourse(null);
    setWatchedSeconds(0);
    setTotalSeconds(0);
    // Reload courses to reflect any progress changes
    loadCourses();
  };

  const categories = ['All', ...Array.from(new Set(courses.map(c => c.category)))];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const inProgressCourses = courses.filter(c => (c.progress || 0) > 0 && (c.progress || 0) < 100);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Video Library 🎥</h1>
        <p className="text-muted-foreground">
          Learn at your own pace with our comprehensive video courses
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search videos..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Continue Watching Section */}
      {inProgressCourses.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Continue Watching</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgressCourses.slice(0, 2).map(course => (
              <Card key={course.id} className="border-primary/20">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-32 h-20 bg-secondary/20 rounded flex items-center justify-center flex-shrink-0">
                      <Play className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{course.title}</h3>
                      <div className="space-y-2">
                        <Progress value={course.progress || 0} />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{course.progress || 0}% complete</span>
                          <span>{course.duration} min</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => handleWatchVideo(course)}
                      >
                        Continue Watching
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          {categories.map(category => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => {
              const isCompleted = course.isCompleted || (course.progress || 0) >= 100;
              const isLocked = course.isLocked || false;
              const progress = course.progress || 0;

              return (
                <Card
                  key={course.id}
                  className={`hover:shadow-lg transition-shadow ${
                    isCompleted ? 'border-green-500/30' : ''
                  } ${isLocked ? 'opacity-60' : ''}`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{course.title}</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="secondary">{course.category}</Badge>
                          <Badge variant="outline">{course.difficulty}</Badge>
                          {isCompleted && (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    <div className="space-y-3">
                      {/* Duration and XP */}
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {course.duration} min
                        </span>
                        <span className="flex items-center gap-1 text-primary font-semibold">
                          <Star className="h-4 w-4" />
                          +{course.xpReward} XP
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {progress > 0 && !isCompleted && (
                        <div>
                          <Progress value={progress} />
                          <p className="text-xs text-muted-foreground mt-1">
                            {progress}% complete
                          </p>
                        </div>
                      )}

                      {/* Watch Button */}
                      <Button
                        className="w-full"
                        onClick={() => handleWatchVideo(course)}
                        disabled={isLocked}
                        variant={isCompleted ? 'outline' : 'default'}
                      >
                        {isLocked ? (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Locked
                          </>
                        ) : isCompleted ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Review
                          </>
                        ) : progress > 0 ? (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Continue
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Start
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredCourses.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  No courses found{searchQuery && ` for "${searchQuery}"`}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* YouTube Player Dialog */}
      <Dialog open={isPlayerOpen} onOpenChange={closePlayer}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{watchingCourse?.title}</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={closePlayer}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {watchingCourse && (
            <div className="space-y-4">
              <YouTubePlayer
                videoId={extractYouTubeVideoId((watchingCourse as any).video_url) || ''}
                title={watchingCourse.title}
                onProgressUpdate={handleProgressUpdate}
                onComplete={handleVideoComplete}
                showControls={true}
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{watchingCourse.category}</Badge>
                  <Badge variant="outline">{watchingCourse.difficulty}</Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {watchingCourse.duration} min
                  </span>
                </div>
                <span className="flex items-center gap-1 text-primary font-semibold">
                  <Star className="h-4 w-4" />
                  +{watchingCourse.xpReward} XP
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {watchingCourse.description}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
