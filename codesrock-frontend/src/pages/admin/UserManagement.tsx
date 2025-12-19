import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, Search, Plus, Edit, Trash2, RefreshCw, Key, AlertCircle, Copy, CheckCircle } from "lucide-react";
import { adminService, type User, type UserCredentials } from "@/services/admin.service";
import { toast } from "sonner";
import { UserFormDialog } from "@/components/admin/UserFormDialog";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [resetCredentials, setResetCredentials] = useState<UserCredentials | null>(null);

  const loadUsers = async () => {
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

      if (roleFilter !== "all") {
        filters.role = roleFilter;
      }

      if (statusFilter === "active") {
        filters.isActive = true;
      } else if (statusFilter === "inactive") {
        filters.isActive = false;
      }

      const response = await adminService.getUsers(filters);
      setUsers(response.users);
      setTotalPages(response.totalPages);
      setTotalUsers(response.total);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users');
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, searchTerm, roleFilter, statusFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page on search
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await adminService.deleteUser(userToDelete.id);
      toast.success('User deactivated successfully');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error(err.message || 'Failed to deactivate user');
    }
  };

  const handleResetPassword = async (user: User) => {
    if (!confirm(`Reset password for ${user.firstName} ${user.lastName}? A new password will be generated automatically.`)) {
      return;
    }

    try {
      const response = await adminService.resetUserPassword(user.id);
      setResetCredentials(response.credentials);
      toast.success('Password reset successfully');
    } catch (err: any) {
      console.error('Error resetting password:', err);
      toast.error(err.message || 'Failed to reset password');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const copyAllCredentials = () => {
    if (!resetCredentials) return;
    const text = `School ID: ${resetCredentials.schoolCode}\nUsername: ${resetCredentials.username}\nPassword: ${resetCredentials.password}`;
    navigator.clipboard.writeText(text);
    toast.success("All credentials copied to clipboard");
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'school_admin':
        return 'default';
      case 'content_admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && users.length === 0) {
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
            <Users className="h-8 w-8 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button onClick={handleCreateUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="school_admin">School Admin</SelectItem>
                <SelectItem value="content_admin">Content Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>

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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users ({totalUsers})</CardTitle>
              <CardDescription>
                Showing {users.length} of {totalUsers} total users
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadUsers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Users</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadUsers} variant="default">
                Try Again
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating a new user"}
              </p>
              <Button onClick={handleCreateUser}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {user.isOnline && (
                              <span className="h-2 w-2 rounded-full bg-green-500" title="Online" />
                            )}
                            {user.firstName} {user.lastName}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {user.username || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.schoolName || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {formatRole(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetPassword(user)}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
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
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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

      {/* User Form Dialog */}
      <UserFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        user={selectedUser}
        onSuccess={loadUsers}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the user{' '}
              <span className="font-semibold">
                {userToDelete?.firstName} {userToDelete?.lastName}
              </span>
              . They will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Deactivate User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Credentials Dialog */}
      <Dialog open={!!resetCredentials} onOpenChange={() => setResetCredentials(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Password Reset Successfully
            </DialogTitle>
            <DialogDescription>
              Share these new login credentials with the user.
            </DialogDescription>
          </DialogHeader>

          {resetCredentials && (
            <div className="space-y-4 py-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                {resetCredentials.schoolName && (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">School</span>
                      <p className="font-medium">{resetCredentials.schoolName}</p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-3 space-y-3">
                  {resetCredentials.schoolCode && (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-muted-foreground">School ID</span>
                        <p className="font-mono font-medium">{resetCredentials.schoolCode}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(resetCredentials.schoolCode, "School ID")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">Username</span>
                      <p className="font-mono font-medium">{resetCredentials.username}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(resetCredentials.username, "Username")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">New Password</span>
                      <p className="font-mono font-medium">{resetCredentials.password}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(resetCredentials.password, "Password")}
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
          )}

          <DialogFooter>
            <Button onClick={() => setResetCredentials(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
