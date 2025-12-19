import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { adminService } from "@/services/admin.service";
import { Loader2 } from "lucide-react";
import type { Course, CourseCategory, CourseDifficulty } from "@/types/content.types";

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
  onSuccess: () => void;
}

export function CourseFormDialog({ open, onOpenChange, course, onSuccess }: CourseFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    youtubeVideoId: "",
    category: "HTML/CSS" as CourseCategory,
    difficulty: "Beginner" as CourseDifficulty,
    duration: 10,
    xpReward: 50,
    order: 0,
    tags: "",
    isActive: true,
  });

  // Reset form when dialog opens/closes or course changes
  useEffect(() => {
    if (open && course) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
        thumbnail: course.thumbnail || "",
        youtubeVideoId: course.youtubeVideoId || "",
        category: course.category || "HTML/CSS",
        difficulty: course.difficulty || "Beginner",
        duration: course.duration || 10,
        xpReward: course.xpReward || 50,
        order: course.order || 0,
        tags: course.tags?.join(", ") || "",
        isActive: course.isActive !== undefined ? course.isActive : true,
      });
    } else if (open && !course) {
      setFormData({
        title: "",
        description: "",
        thumbnail: "",
        youtubeVideoId: "",
        category: "HTML/CSS",
        difficulty: "Beginner",
        duration: 10,
        xpReward: 50,
        order: 0,
        tags: "",
        isActive: true,
      });
    }
  }, [open, course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.duration < 1) {
      toast.error("Duration must be at least 1 minute");
      return;
    }

    if (formData.xpReward < 25 || formData.xpReward > 100) {
      toast.error("XP Reward must be between 25 and 100");
      return;
    }

    try {
      setLoading(true);

      const tagsArray = formData.tags
        ? formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag)
        : [];

      // Build video URL from YouTube Video ID if provided
      // Handle both full URLs and video IDs
      let videoUrl: string | undefined;
      if (formData.youtubeVideoId) {
        const input = formData.youtubeVideoId.trim();
        // Check if it's already a full URL
        if (input.includes('youtube.com') || input.includes('youtu.be')) {
          videoUrl = input;
        } else {
          // It's just a video ID, build the full URL
          videoUrl = `https://www.youtube.com/watch?v=${input}`;
        }
      }

      const courseData = {
        title: formData.title,
        description: formData.description,
        thumbnail: formData.thumbnail || "https://via.placeholder.com/400x225?text=Course+Thumbnail",
        videoUrl: videoUrl,
        category: formData.category,
        difficulty: formData.difficulty,
        duration: formData.duration,
        xpReward: formData.xpReward,
      };

      if (course) {
        // Update existing course
        await adminService.updateCourse(course.id, courseData);
        toast.success("Course updated successfully");
      } else {
        // Create new course
        await adminService.createCourse(courseData);
        toast.success("Course created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{course ? "Edit Course" : "Create New Course"}</DialogTitle>
            <DialogDescription>
              {course ? "Update course information and settings" : "Add a new course to the platform"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Introduction to HTML"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Learn the fundamentals of HTML..."
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as CourseCategory })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HTML/CSS">HTML/CSS</SelectItem>
                    <SelectItem value="JavaScript">JavaScript</SelectItem>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Creative Coding">Creative Coding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="difficulty">Difficulty *</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value as CourseDifficulty })}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="xpReward">XP Reward (25-100) *</Label>
                <Input
                  id="xpReward"
                  type="number"
                  min="25"
                  max="100"
                  value={formData.xpReward}
                  onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 50 })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="youtubeVideoId">YouTube Video ID</Label>
              <Input
                id="youtubeVideoId"
                value={formData.youtubeVideoId}
                onChange={(e) => setFormData({ ...formData, youtubeVideoId: e.target.value })}
                placeholder="dQw4w9WgXcQ"
              />
              <p className="text-xs text-muted-foreground">
                Extract from youtube.com/watch?v=<strong>VIDEO_ID</strong>
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default placeholder
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="html, web, beginner"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (visible to users)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {course ? "Update Course" : "Create Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
