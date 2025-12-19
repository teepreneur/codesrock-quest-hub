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
import type { Resource, ResourceCategory, FileType, GradeLevel } from "@/types/content.types";

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: Resource | null;
  onSuccess: () => void;
}

export function ResourceFormDialog({ open, onOpenChange, resource, onSuccess }: ResourceFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Guides" as ResourceCategory,
    fileType: "PDF" as FileType,
    fileUrl: "",
    thumbnailUrl: "",
    gradeLevel: "All" as GradeLevel,
    subject: "",
    tags: "",
    xpReward: 10,
    fileSize: 0,
    isActive: true,
  });

  // Reset form when dialog opens/closes or resource changes
  useEffect(() => {
    if (open && resource) {
      setFormData({
        title: resource.title || "",
        description: resource.description || "",
        category: resource.category || "Guides",
        fileType: resource.fileType || "PDF",
        fileUrl: resource.fileUrl || "",
        thumbnailUrl: resource.thumbnailUrl || "",
        gradeLevel: resource.gradeLevel || "All",
        subject: resource.subject || "",
        tags: resource.tags?.join(", ") || "",
        xpReward: resource.xpReward || 10,
        fileSize: resource.fileSize || 0,
        isActive: resource.isActive !== undefined ? resource.isActive : true,
      });
    } else if (open && !resource) {
      setFormData({
        title: "",
        description: "",
        category: "Guides",
        fileType: "PDF",
        fileUrl: "",
        thumbnailUrl: "",
        gradeLevel: "All",
        subject: "",
        tags: "",
        xpReward: 10,
        fileSize: 0,
        isActive: true,
      });
    }
  }, [open, resource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.description || !formData.subject || !formData.fileUrl) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.fileSize < 0) {
      toast.error("File size must be a positive number");
      return;
    }

    try {
      setLoading(true);

      const tagsArray = formData.tags
        ? formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag)
        : [];

      const resourceData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        fileType: formData.fileType,
        fileUrl: formData.fileUrl,
        thumbnailUrl: formData.thumbnailUrl || "https://via.placeholder.com/400x300?text=Resource",
        gradeLevel: formData.gradeLevel,
        subject: formData.subject,
        tags: tagsArray,
        xpReward: formData.xpReward,
        fileSize: formData.fileSize,
        isActive: formData.isActive,
      };

      if (resource) {
        // Update existing resource
        await adminService.updateResource(resource.id, resourceData);
        toast.success("Resource updated successfully");
      } else {
        // Create new resource
        await adminService.createResource(resourceData);
        toast.success("Resource created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || "Failed to save resource");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{resource ? "Edit Resource" : "Create New Resource"}</DialogTitle>
            <DialogDescription>
              {resource ? "Update resource information and settings" : "Add a new resource to the library"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="HTML Basics Worksheet"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A comprehensive worksheet covering HTML fundamentals..."
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as ResourceCategory })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lesson Plans">Lesson Plans</SelectItem>
                    <SelectItem value="Worksheets">Worksheets</SelectItem>
                    <SelectItem value="Projects">Projects</SelectItem>
                    <SelectItem value="Guides">Guides</SelectItem>
                    <SelectItem value="Templates">Templates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fileType">File Type *</Label>
                <Select
                  value={formData.fileType}
                  onValueChange={(value) => setFormData({ ...formData, fileType: value as FileType })}
                >
                  <SelectTrigger id="fileType">
                    <SelectValue placeholder="Select file type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="DOC">DOC</SelectItem>
                    <SelectItem value="DOCX">DOCX</SelectItem>
                    <SelectItem value="PPT">PPT</SelectItem>
                    <SelectItem value="PPTX">PPTX</SelectItem>
                    <SelectItem value="ZIP">ZIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="gradeLevel">Grade Level *</Label>
                <Select
                  value={formData.gradeLevel}
                  onValueChange={(value) => setFormData({ ...formData, gradeLevel: value as GradeLevel })}
                >
                  <SelectTrigger id="gradeLevel">
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Elementary">Elementary</SelectItem>
                    <SelectItem value="Middle">Middle</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="All">All Levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Web Development"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fileUrl">File URL *</Label>
              <Input
                id="fileUrl"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="https://example.com/resource.pdf"
                required
              />
              <p className="text-xs text-muted-foreground">
                Direct link to the resource file
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fileSize">File Size (bytes) *</Label>
                <Input
                  id="fileSize"
                  type="number"
                  min="0"
                  value={formData.fileSize}
                  onChange={(e) => setFormData({ ...formData, fileSize: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="xpReward">XP Reward</Label>
                <Input
                  id="xpReward"
                  type="number"
                  min="0"
                  value={formData.xpReward}
                  onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 10 })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
              <Input
                id="thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                placeholder="https://example.com/thumbnail.jpg"
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
                placeholder="html, worksheet, beginner"
              />
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
              {resource ? "Update Resource" : "Create Resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
