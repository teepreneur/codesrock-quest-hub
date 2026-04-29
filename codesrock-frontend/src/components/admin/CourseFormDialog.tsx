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
import type { Course, CourseDifficulty } from "@/types/content.types";

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
    difficulty: "Beginner" as CourseDifficulty,
    xpReward: 100,
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    if (open && course) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
        thumbnail: course.thumbnail || "",
        difficulty: course.difficulty || "Beginner",
        xpReward: course.xpReward || (course as any).xp_reward || 100,
        order: course.order || (course as any).order_index || 0,
        isActive: course.isActive !== undefined ? course.isActive : (course as any).is_active !== undefined ? (course as any).is_active : true,
      });
    } else if (open && !course) {
      setFormData({ title: "", description: "", thumbnail: "", difficulty: "Beginner", xpReward: 100, order: 0, isActive: true });
    }
  }, [open, course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const courseData = {
        title: formData.title,
        description: formData.description,
        thumbnail: formData.thumbnail || "https://via.placeholder.com/400x225?text=Course+Thumbnail",
        difficulty: formData.difficulty,
        xpReward: formData.xpReward,
      };

      if (course) {
        await adminService.updateCourse(course.id || (course as any)._id, courseData);
        toast.success("Course updated successfully");
      } else {
        await adminService.createCourse(courseData);
        toast.success("Course created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{course ? "Edit Course" : "Create New Course"}</DialogTitle>
            <DialogDescription>
              {course ? "Update course details. Topics and videos are managed inside the course." : "Create a new course container. Add topics and videos after creation."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Course Name *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. CodesRock 1 - Computational Thinking" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="What will students learn in this course?" rows={3} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value as CourseDifficulty })}>
                <SelectTrigger id="difficulty"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input id="thumbnail" value={formData.thumbnail} onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })} placeholder="https://example.com/image.jpg" />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded border-gray-300" />
              <Label htmlFor="isActive" className="cursor-pointer">Active (visible to users)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
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
