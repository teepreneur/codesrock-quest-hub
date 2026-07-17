import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { adminService } from "@/services/admin.service";
import { Loader2 } from "lucide-react";

interface VideoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string;
  video?: any | null;
  onSuccess: () => void;
}

export function VideoFormDialog({ open, onOpenChange, topicId, video, onSuccess }: VideoFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingDuration, setFetchingDuration] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnail: "",
    duration: 5,
    xpReward: 25,
    orderIndex: 0,
  });

  useEffect(() => {
    if (open && video) {
      setFormData({
        title: video.title || "",
        description: video.description || "",
        videoUrl: video.video_url || "",
        thumbnail: video.thumbnail || "",
        duration: video.duration || 5,
        xpReward: video.xp_reward || 25,
        orderIndex: video.order_index || 0,
      });
    } else if (open && !video) {
      setFormData({ title: "", description: "", videoUrl: "", thumbnail: "", duration: 5, xpReward: 25, orderIndex: 0 });
    }
  }, [open, video]);

  const extractYouTubeVideoId = (url: string | undefined): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url.trim();
  };

  const handleUrlBlur = async () => {
    const videoId = extractYouTubeVideoId(formData.videoUrl);
    if (!videoId || videoId.length !== 11) return;

    // Auto-fill thumbnail if empty or standard placeholder
    if (!formData.thumbnail || formData.thumbnail.includes("example.com")) {
      const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      setFormData(prev => ({ ...prev, thumbnail: thumbUrl }));
    }

    try {
      setFetchingDuration(true);
      
      // Load YouTube script if not loaded
      if (!(window as any).YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const durationSeconds = await new Promise<number>((resolve, reject) => {
        const tempDivId = `temp-yt-player-${Math.random().toString(36).substr(2, 9)}`;
        const tempDiv = document.createElement('div');
        tempDiv.id = tempDivId;
        tempDiv.style.position = 'absolute';
        tempDiv.style.top = '-9999px';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '1px';
        tempDiv.style.height = '1px';
        tempDiv.style.opacity = '0';
        document.body.appendChild(tempDiv);

        let player: any = null;
        let timeoutId: any = null;

        const cleanup = () => {
          if (timeoutId) clearTimeout(timeoutId);
          if (player && typeof player.destroy === 'function') {
            player.destroy();
          }
          const element = document.getElementById(tempDivId);
          if (element && element.parentNode) {
            element.parentNode.removeChild(element);
          }
        };

        const checkReady = () => {
          if ((window as any).YT && (window as any).YT.Player) {
            createPlayer();
          } else {
            timeoutId = setTimeout(checkReady, 100);
          }
        };

        const createPlayer = () => {
          try {
            player = new (window as any).YT.Player(tempDivId, {
              videoId: videoId,
              playerVars: {
                autoplay: 0,
                controls: 0,
                showinfo: 0,
                rel: 0,
              },
              events: {
                onReady: (event: any) => {
                  try {
                    const secs = event.target.getDuration();
                    cleanup();
                    resolve(secs);
                  } catch (err) {
                    cleanup();
                    reject(err);
                  }
                },
                onError: (event: any) => {
                  cleanup();
                  reject(new Error(`YouTube player error: ${event.data}`));
                }
              }
            });
          } catch (err) {
            cleanup();
            reject(err);
          }
        };

        checkReady();

        // 8 seconds timeout
        setTimeout(() => {
          cleanup();
          reject(new Error("Timeout waiting for video metadata"));
        }, 8000);
      });

      if (durationSeconds > 0) {
        const minutes = Math.ceil(durationSeconds / 60);
        setFormData(prev => ({ ...prev, duration: minutes }));
        toast.success(`Automatically set duration to ${minutes} minutes`);
      }
    } catch (error) {
      console.warn("Failed to auto-fetch video duration:", error);
    } finally {
      setFetchingDuration(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("Video title is required");
      return;
    }

    try {
      setLoading(true);
      if (video) {
        await adminService.updateVideo(video.id, formData);
        toast.success("Video updated successfully");
      } else {
        await adminService.createVideo(topicId, formData);
        toast.success("Video created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{video ? "Edit Video" : "Add New Video"}</DialogTitle>
            <DialogDescription>
              {video ? "Update video details" : "Add a new video to this topic"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="videoTitle">Title *</Label>
              <Input
                id="videoTitle"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Algorithm Song"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="videoDescription">Description</Label>
              <Textarea
                id="videoDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does this video cover?"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="videoUrl">YouTube Video URL or ID</Label>
              <Input
                id="videoUrl"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                onBlur={handleUrlBlur}
                placeholder="dQw4w9WgXcQ or https://youtube.com/watch?v=..."
              />
              <p className="text-xs text-muted-foreground">
                Paste a YouTube URL or just the video ID
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="videoDuration" className="flex items-center gap-2">
                  Duration (minutes)
                  {fetchingDuration && (
                    <span className="text-xs font-normal text-amber-500 flex items-center gap-1 animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      fetching...
                    </span>
                  )}
                </Label>
                <Input
                  id="videoDuration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  disabled={fetchingDuration}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="videoXp">XP Reward</Label>
                <Input
                  id="videoXp"
                  type="number"
                  min="5"
                  max="100"
                  value={formData.xpReward}
                  onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 25 })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="videoThumbnail">Thumbnail URL</Label>
              <Input
                id="videoThumbnail"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="videoOrder">Display Order</Label>
              <Input
                id="videoOrder"
                type="number"
                min="0"
                value={formData.orderIndex}
                onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {video ? "Update Video" : "Add Video"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
