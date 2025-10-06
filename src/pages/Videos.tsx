import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Lock, CheckCircle, Search, Clock } from "lucide-react";
import { videos } from "@/lib/mockData";
import { toast } from "sonner";

export default function Videos() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", ...Array.from(new Set(videos.map(v => v.category)))];

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePlayVideo = (video: typeof videos[0]) => {
    if (video.locked) {
      toast.error(`🔒 This video is locked. ${video.prerequisite || "Complete previous videos first."}`);
    } else {
      toast.success(`🎥 Starting: ${video.title}`, {
        description: `You'll earn ${video.xpReward} XP upon completion!`
      });
    }
  };

  const continueWatching = videos.filter(v => v.progress > 0 && v.progress < 100);

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

      {/* Continue Watching */}
      {continueWatching.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Continue Watching</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {continueWatching.map((video) => (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-3xl flex-shrink-0">
                      {video.thumbnail}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">{video.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Clock className="h-3 w-3" />
                        <span>{video.duration} min</span>
                        <span>•</span>
                        <span className="text-primary font-medium">+{video.xpReward} XP</span>
                      </div>
                      <Progress value={video.progress} className="h-2 mb-2" />
                      <p className="text-xs text-muted-foreground">{video.progress}% complete</p>
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
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category === "all" ? "All Videos" : category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.map((video) => (
              <Card
                key={video.id}
                className={`overflow-hidden hover:shadow-lg transition-all ${
                  video.locked ? "opacity-60" : "hover:-translate-y-1"
                }`}
              >
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="aspect-video bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center text-6xl">
                      {video.thumbnail}
                    </div>
                    {video.completed && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    )}
                    {video.locked && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Lock className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={
                            video.difficulty === "Beginner"
                              ? "secondary"
                              : video.difficulty === "Intermediate"
                              ? "default"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {video.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{video.duration} min</span>
                        <span className="text-xs text-primary font-medium">+{video.xpReward} XP</span>
                      </div>
                    </div>

                    {video.progress > 0 && !video.completed && (
                      <Progress value={video.progress} className="h-2" />
                    )}

                    <Button
                      className={`w-full ${
                        video.locked
                          ? "bg-muted text-muted-foreground"
                          : "bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                      }`}
                      onClick={() => handlePlayVideo(video)}
                      disabled={video.locked}
                    >
                      {video.locked ? (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Locked
                        </>
                      ) : video.completed ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Rewatch
                        </>
                      ) : video.progress > 0 ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Continue
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Start Course
                        </>
                      )}
                    </Button>

                    {video.locked && video.prerequisite && (
                      <p className="text-xs text-muted-foreground text-center">
                        {video.prerequisite}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredVideos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No videos found matching your search.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
