import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { adminService, type User, type School, type UserCredentials } from "@/services/admin.service";
import { Loader2, Copy, CheckCircle } from "lucide-react";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess: () => void;
}

export function UserFormDialog({ open, onOpenChange, user, onSuccess }: UserFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [credentials, setCredentials] = useState<UserCredentials | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    role: "teacher" as "teacher" | "school_admin" | "content_admin" | "super_admin",
    schoolId: "",
  });

  // Load schools for the dropdown
  useEffect(() => {
    const loadSchools = async () => {
      try {
        setLoadingSchools(true);
        const response = await adminService.getSchools({ limit: 100, isActive: true });
        setSchools(response.schools);
      } catch (error) {
        console.error("Error loading schools:", error);
        toast.error("Failed to load schools");
      } finally {
        setLoadingSchools(false);
      }
    };

    if (open && !user) {
      loadSchools();
    }
  }, [open, user]);

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open && user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        role: user.role as any || "teacher",
        schoolId: user.schoolId || "",
      });
      setCredentials(null);
    } else if (open && !user) {
      setFormData({
        firstName: "",
        lastName: "",
        role: "teacher",
        schoolId: "",
      });
      setCredentials(null);
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!user && !formData.schoolId) {
      toast.error("Please select a school");
      return;
    }

    try {
      setLoading(true);

      if (user) {
        // Update existing user
        await adminService.updateUser(user.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          schoolId: formData.schoolId || undefined,
        });
        toast.success("User updated successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        // Create new user - credentials will be auto-generated
        const response = await adminService.createUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          schoolId: formData.schoolId,
        });

        // Show credentials
        if (response.credentials) {
          setCredentials(response.credentials);
        } else {
          toast.success("User created successfully");
          onSuccess();
          onOpenChange(false);
        }
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const copyAllCredentials = () => {
    if (!credentials) return;
    const text = `School ID: ${credentials.schoolCode}\nUsername: ${credentials.username}\nPassword: ${credentials.password}`;
    navigator.clipboard.writeText(text);
    toast.success("All credentials copied to clipboard");
  };

  const handleClose = () => {
    if (credentials) {
      onSuccess();
    }
    setCredentials(null);
    onOpenChange(false);
  };

  // Show credentials dialog after user creation
  if (credentials) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              User Created Successfully
            </DialogTitle>
            <DialogDescription>
              Share these login credentials with the user. They will use these to log in.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">School</span>
                  <p className="font-medium">{credentials.schoolName}</p>
                </div>
              </div>

              <div className="border-t pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">School ID</span>
                    <p className="font-mono font-medium">{credentials.schoolCode}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.schoolCode, "School ID")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">Username</span>
                    <p className="font-mono font-medium">{credentials.username}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.username, "Username")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">Password</span>
                    <p className="font-mono font-medium">{credentials.password}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.password, "Password")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={copyAllCredentials}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy All Credentials
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Make sure to save these credentials - the password cannot be retrieved later.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{user ? "Edit User" : "Create New User"}</DialogTitle>
            <DialogDescription>
              {user
                ? "Update user information and role"
                : "Add a new user. Username and password will be generated automatically."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                required
              />
            </div>

            {!user && (
              <div className="grid gap-2">
                <Label htmlFor="school">School *</Label>
                <Select
                  value={formData.schoolId}
                  onValueChange={(value) => setFormData({ ...formData, schoolId: value })}
                >
                  <SelectTrigger id="school">
                    <SelectValue placeholder={loadingSchools ? "Loading schools..." : "Select a school"} />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name} ({school.schoolCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The user will be assigned to this school
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as any })}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="school_admin">School Admin</SelectItem>
                  <SelectItem value="content_admin">Content Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!user && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Auto-generated credentials</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Username will be generated from the user's name (e.g., jdoe01)</li>
                  <li>A secure password will be generated automatically</li>
                  <li>You will see the credentials after creation</li>
                </ul>
              </div>
            )}
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
              {user ? "Update User" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
