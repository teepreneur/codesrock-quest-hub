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

interface TrainingSessionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: any | null;
  onSuccess: () => void;
}

export function TrainingSessionFormDialog({ open, onOpenChange, session, onSuccess }: TrainingSessionFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructor: "",
    startTime: "",
    endTime: "",
    type: "live" as "live" | "recorded",
    meetingLink: "",
    recordingUrl: "",
    maxParticipants: 50,
    tagsString: "",
    xpReward: 25,
    status: "scheduled" as "scheduled" | "live" | "completed" | "cancelled",
    isActive: true,
  });

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (open && session) {
      setFormData({
        title: session.title || "",
        description: session.description || "",
        instructor: session.instructor || "",
        startTime: formatDateForInput(session.start_time || session.startTime),
        endTime: formatDateForInput(session.end_time || session.endTime),
        type: session.type || "live",
        meetingLink: session.meeting_link || session.meetingLink || "",
        recordingUrl: session.recording_url || session.recordingUrl || "",
        maxParticipants: session.max_participants || session.maxParticipants || 50,
        tagsString: Array.isArray(session.tags) ? session.tags.join(", ") : (session.tags || ""),
        xpReward: session.xp_reward || session.xpReward || 25,
        status: session.status || "scheduled",
        isActive: session.is_active !== undefined ? session.is_active : (session.isActive !== undefined ? session.isActive : true),
      });
    } else if (open && !session) {
      // Set defaults for new session
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      setFormData({
        title: "",
        description: "",
        instructor: "",
        startTime: formatDateForInput(now.toISOString()),
        endTime: formatDateForInput(oneHourLater.toISOString()),
        type: "live",
        meetingLink: "",
        recordingUrl: "",
        maxParticipants: 50,
        tagsString: "training, coding",
        xpReward: 25,
        status: "scheduled",
        isActive: true,
      });
    }
  }, [open, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.startTime || !formData.endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const tags = formData.tagsString
        ? formData.tagsString.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const payload = {
        title: formData.title,
        description: formData.description,
        instructor: formData.instructor,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        type: formData.type,
        meetingLink: formData.meetingLink || null,
        recordingUrl: formData.recordingUrl || null,
        maxParticipants: parseInt(formData.maxParticipants as any) || 50,
        tags,
        xpReward: parseInt(formData.xpReward as any) || 25,
        status: formData.status,
        isActive: formData.isActive,
      };

      if (session) {
        await adminService.updateTrainingSession(session.id || session._id, payload);
        toast.success("Training session updated successfully");
      } else {
        await adminService.createTrainingSession(payload);
        toast.success("Training session scheduled successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{session ? "Edit Training Session 📅" : "Schedule Live Training Session 📅"}</DialogTitle>
            <DialogDescription>
              {session ? "Update meeting links, status, and details." : "Schedule a new online professional development meeting for teachers."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid gap-2">
              <Label htmlFor="title">Session Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. CodesRock 1 - Curriculum Onboarding"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What will teachers learn or discuss in this session?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="instructor">Instructor / Speaker</Label>
                <Input
                  id="instructor"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  placeholder="e.g. Sarah Johnson"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Session Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                >
                  <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Live Stream (Google Meet)</SelectItem>
                    <SelectItem value="recorded">Recorded / Archive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Date & Time *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Date & Time *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="meetingLink">Google Meet URL</Label>
              <Input
                id="meetingLink"
                type="url"
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                placeholder="https://meet.google.com/abc-defg-hij"
              />
            </div>

            {formData.type === "recorded" && (
              <div className="grid gap-2">
                <Label htmlFor="recordingUrl">Recording Playback URL</Label>
                <Input
                  id="recordingUrl"
                  type="url"
                  value={formData.recordingUrl}
                  onChange={(e) => setFormData({ ...formData, recordingUrl: e.target.value })}
                  placeholder="https://youtube.com/... or google drive video"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="maxParticipants">Max Spots</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="xpReward">XP Reward</Label>
                <Input
                  id="xpReward"
                  type="number"
                  value={formData.xpReward}
                  onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Session Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="live">🔴 Live Now</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tagsString}
                onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
                placeholder="training, robotics, computational thinking"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 h-4 w-4 accent-primary"
              />
              <Label htmlFor="isActive" className="cursor-pointer font-bold text-sm">
                Active (visible to teachers on their Calendar)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {session ? "Update Session" : "Schedule Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
