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
                placeholder="dQw4w9WgXcQ or https://youtube.com/watch?v=..."
              />
              <p className="text-xs text-muted-foreground">
                Paste a YouTube URL or just the video ID
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="videoDuration">Duration (minutes)</Label>
                <Input
                  id="videoDuration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
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
