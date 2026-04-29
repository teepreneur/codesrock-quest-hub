import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { adminService } from "@/services/admin.service";
import { Loader2 } from "lucide-react";

interface TopicFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  topic?: any | null;
  onSuccess: () => void;
}

export function TopicFormDialog({ open, onOpenChange, courseId, topic, onSuccess }: TopicFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    orderIndex: 0,
  });

  useEffect(() => {
    if (open && topic) {
      setFormData({
        title: topic.title || "",
        description: topic.description || "",
        thumbnail: topic.thumbnail || "",
        orderIndex: topic.order_index || 0,
      });
    } else if (open && !topic) {
      setFormData({ title: "", description: "", thumbnail: "", orderIndex: 0 });
    }
  }, [open, topic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("Topic title is required");
      return;
    }

    try {
      setLoading(true);
      if (topic) {
        await adminService.updateTopic(topic.id, formData);
        toast.success("Topic updated successfully");
      } else {
        await adminService.createTopic(courseId, formData);
        toast.success("Topic created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save topic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{topic ? "Edit Topic" : "Add New Topic"}</DialogTitle>
            <DialogDescription>
              {topic ? "Update topic details" : "Add a new topic to this course"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="topicTitle">Title *</Label>
              <Input
                id="topicTitle"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Algorithm"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="topicDescription">Description</Label>
              <Textarea
                id="topicDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What will students learn in this topic?"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="topicThumbnail">Thumbnail URL</Label>
              <Input
                id="topicThumbnail"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="topicOrder">Display Order</Label>
              <Input
                id="topicOrder"
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
              {topic ? "Update Topic" : "Create Topic"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
