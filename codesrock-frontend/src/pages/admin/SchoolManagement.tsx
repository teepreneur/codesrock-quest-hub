import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building2, Search, Plus, Edit, Trash2, RefreshCw, Copy, AlertCircle, Users, CheckCircle } from "lucide-react";
import { adminService, type School, type CreateSchoolData, type UpdateSchoolData } from "@/services/admin.service";
import { toast } from "sonner";

export default function SchoolManagement() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSchools, setTotalSchools] = useState(0);

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [createdSchool, setCreatedSchool] = useState<School | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateSchoolData>({
    name: "",
    address: "",
    region: "",
    district: "",
    contactEmail: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  const loadSchools = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        page,
        limit: 10,
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (statusFilter === "active") {
        filters.isActive = true;
      } else if (statusFilter === "inactive") {
        filters.isActive = false;
      }

      const response = await adminService.getSchools(filters);
      setSchools(response.schools);
      setTotalPages(response.pagination.pages);
      setTotalSchools(response.pagination.total);
    } catch (err: any) {
      console.error('Error loading schools:', err);
      setError(err.message || 'Failed to load schools');
      toast.error('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, [page, searchTerm, statusFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleCreateSchool = () => {
    setSelectedSchool(null);
    setFormData({
      name: "",
      address: "",
      region: "",
      district: "",
      contactEmail: "",
    });
    setFormDialogOpen(true);
  };

  const handleEditSchool = (school: School) => {
    setSelectedSchool(school);
    setFormData({
      name: school.name,
      address: school.address || "",
      region: school.region || "",
      district: school.district || "",
      contactEmail: school.contactEmail || "",
    });
    setFormDialogOpen(true);
  };

  const handleDeleteSchool = (school: School) => {
    setSchoolToDelete(school);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("School name is required");
      return;
    }

    setFormLoading(true);

    try {
      if (selectedSchool) {
        // Update existing school
        const updateData: UpdateSchoolData = {
          name: formData.name,
          address: formData.address || undefined,
          region: formData.region || undefined,
          district: formData.district || undefined,
          contactEmail: formData.contactEmail || undefined,
        };

        await adminService.updateSchool(selectedSchool.id, updateData);
        toast.success("School updated successfully");
        setFormDialogOpen(false);
        loadSchools();
      } else {
        // Create new school
        const response = await adminService.createSchool(formData);
        toast.success("School created successfully");
        setFormDialogOpen(false);
        setCreatedSchool(response.school);
        loadSchools();
      }
    } catch (err: any) {
      console.error("Error saving school:", err);
      toast.error(err.message || "Failed to save school");
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!schoolToDelete) return;

    try {
      await adminService.deactivateSchool(schoolToDelete.id);
      toast.success("School deactivated successfully");
      setDeleteDialogOpen(false);
      setSchoolToDelete(null);
      loadSchools();
    } catch (err: any) {
      console.error("Error deleting school:", err);
      toast.error(err.message || "Failed to deactivate school");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && schools.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            School Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage schools and their configurations
          </p>
        </div>
        <Button onClick={handleCreateSchool}>
          <Plus className="mr-2 h-4 w-4" />
          Add School
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter schools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or school code..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Schools ({totalSchools})</CardTitle>
              <CardDescription>
                Showing {schools.length} of {totalSchools} total schools
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadSchools}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Schools</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadSchools} variant="default">
                Try Again
              </Button>
            </div>
          ) : schools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Schools Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating a new school"}
              </p>
              <Button onClick={handleCreateSchool}>
                <Plus className="mr-2 h-4 w-4" />
                Add School
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School Name</TableHead>
                      <TableHead>School ID</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Teachers</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school) => (
                      <TableRow key={school.id}>
                        <TableCell className="font-medium">
                          {school.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                              {school.schoolCode}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(school.schoolCode, "School ID")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {school.region || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {school.teacherCount}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={school.isActive ? "default" : "secondary"}>
                            {school.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {school.createdAt ? formatDate(school.createdAt) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSchool(school)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSchool(school)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* School Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedSchool ? "Edit School" : "Create New School"}
            </DialogTitle>
            <DialogDescription>
              {selectedSchool
                ? "Update school information"
                : "Add a new school to the system. A unique School ID will be generated automatically."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">School Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter school name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="Region"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="District"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@school.edu"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading
                  ? "Saving..."
                  : selectedSchool
                  ? "Update School"
                  : "Create School"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Created School Dialog - Shows the new school code */}
      <Dialog open={!!createdSchool} onOpenChange={() => setCreatedSchool(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              School Created Successfully
            </DialogTitle>
            <DialogDescription>
              Share this School ID with administrators and teachers at this school.
            </DialogDescription>
          </DialogHeader>

          {createdSchool && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">School Name</span>
                  <span className="font-medium">{createdSchool.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">School ID</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-3 py-1 rounded font-mono text-lg">
                      {createdSchool.schoolCode}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(createdSchool.schoolCode, "School ID")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Teachers will use this School ID along with their username and password to log in.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setCreatedSchool(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate <span className="font-semibold">{schoolToDelete?.name}</span> and
              all teachers associated with this school will be unable to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Deactivate School
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
