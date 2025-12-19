import { useState, useEffect } from "react";
import { FileText, BookOpen, Plus, Search, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { adminService } from "@/services/admin.service";
import { CourseFormDialog } from "@/components/admin/CourseFormDialog";
import { ResourceFormDialog } from "@/components/admin/ResourceFormDialog";
import type { Course, Resource } from "@/types/content.types";

export default function ContentManagement() {
  // Courses State
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [courseCategoryFilter, setCourseCategoryFilter] = useState<string>("all");
  const [currentCoursePage, setCurrentCoursePage] = useState(1);
  const [totalCoursePages, setTotalCoursePages] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [courseDeleteDialogOpen, setCourseDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  // Resources State
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourceSearchTerm, setResourceSearchTerm] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all");
  const [currentResourcePage, setCurrentResourcePage] = useState(1);
  const [totalResourcePages, setTotalResourcePages] = useState(1);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [resourceDeleteDialogOpen, setResourceDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);

  // Stats State
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalResources: 0,
    activeResources: 0,
  });

  // Load Courses
  const loadCourses = async () => {
    try {
      setCoursesLoading(true);
      const params: any = {
        page: currentCoursePage,
        limit: 10,
      };
      if (courseSearchTerm) params.search = courseSearchTerm;
      if (courseCategoryFilter && courseCategoryFilter !== "all") params.category = courseCategoryFilter;

      const response = await adminService.getAllCourses(params);
      setCourses(response.courses || []);
      setTotalCoursePages(response.totalPages || 1);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      toast.error("Failed to load courses");
    } finally {
      setCoursesLoading(false);
    }
  };

  // Load Resources
  const loadResources = async () => {
    try {
      setResourcesLoading(true);
      const params: any = {
        page: currentResourcePage,
        limit: 10,
      };
      if (resourceSearchTerm) params.search = resourceSearchTerm;
      if (resourceTypeFilter && resourceTypeFilter !== "all") params.type = resourceTypeFilter;

      const response = await adminService.getAllResources(params);
      setResources(response.resources || []);
      setTotalResourcePages(response.totalPages || 1);
    } catch (error: any) {
      console.error('Error loading resources:', error);
      toast.error("Failed to load resources");
    } finally {
      setResourcesLoading(false);
    }
  };

  // Load Stats
  const loadStats = async () => {
    try {
      const response = await adminService.getContentStats();
      setStats({
        totalCourses: response.totalCourses || 0,
        activeCourses: response.activeCourses || 0,
        totalResources: response.totalResources || 0,
        activeResources: response.activeResources || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Initial Load
  useEffect(() => {
    loadCourses();
    loadResources();
    loadStats();
  }, []);

  // Reload courses when filters change
  useEffect(() => {
    loadCourses();
  }, [currentCoursePage, courseSearchTerm, courseCategoryFilter]);

  // Reload resources when filters change
  useEffect(() => {
    loadResources();
  }, [currentResourcePage, resourceSearchTerm, resourceTypeFilter]);

  // Course Actions
  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setCourseDialogOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setCourseDialogOpen(true);
  };

  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course);
    setCourseDeleteDialogOpen(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      await adminService.deleteCourse(courseToDelete.id);
      toast.success("Course deleted successfully");
      loadCourses();
      loadStats();
      setCourseDeleteDialogOpen(false);
      setCourseToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete course");
    }
  };

  const handleCourseSuccess = () => {
    loadCourses();
    loadStats();
  };

  // Resource Actions
  const handleCreateResource = () => {
    setSelectedResource(null);
    setResourceDialogOpen(true);
  };

  const handleEditResource = (resource: Resource) => {
    setSelectedResource(resource);
    setResourceDialogOpen(true);
  };

  const handleDeleteResource = (resource: Resource) => {
    setResourceToDelete(resource);
    setResourceDeleteDialogOpen(true);
  };

  const confirmDeleteResource = async () => {
    if (!resourceToDelete) return;

    try {
      await adminService.deleteResource(resourceToDelete.id);
      toast.success("Resource deleted successfully");
      loadResources();
      loadStats();
      setResourceDeleteDialogOpen(false);
      setResourceToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete resource");
    }
  };

  const handleResourceSuccess = () => {
    loadResources();
    loadStats();
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Content Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage courses, resources, and training materials
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCourses} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.activeCourses}</div>
            <p className="text-xs text-muted-foreground">
              Visible to users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-500">{stats.totalResources}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeResources} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Resources</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{stats.activeResources}</div>
            <p className="text-xs text-muted-foreground">
              Available for download
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Course Library</CardTitle>
                  <CardDescription>Manage video courses and lessons</CardDescription>
                </div>
                <Button onClick={handleCreateCourse}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    value={courseSearchTerm}
                    onChange={(e) => {
                      setCourseSearchTerm(e.target.value);
                      setCurrentCoursePage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={courseCategoryFilter}
                  onValueChange={(value) => {
                    setCourseCategoryFilter(value);
                    setCurrentCoursePage(1);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="HTML/CSS">HTML/CSS</SelectItem>
                    <SelectItem value="JavaScript">JavaScript</SelectItem>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Coding">Coding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Courses Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>XP</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coursesLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Loading courses...
                        </TableCell>
                      </TableRow>
                    ) : courses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No courses found
                        </TableCell>
                      </TableRow>
                    ) : (
                      courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{course.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                course.difficulty === 'Beginner'
                                  ? 'default'
                                  : course.difficulty === 'Intermediate'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {course.difficulty}
                            </Badge>
                          </TableCell>
                          <TableCell>{course.duration} min</TableCell>
                          <TableCell>{course.xpReward} XP</TableCell>
                          <TableCell>{course.viewCount}</TableCell>
                          <TableCell>
                            {course.isActive ? (
                              <Badge className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCourse(course)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCourse(course)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalCoursePages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentCoursePage(currentCoursePage - 1)}
                    disabled={currentCoursePage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentCoursePage} of {totalCoursePages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentCoursePage(currentCoursePage + 1)}
                    disabled={currentCoursePage === totalCoursePages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resource Library</CardTitle>
                  <CardDescription>Manage lesson plans, worksheets, and templates</CardDescription>
                </div>
                <Button onClick={handleCreateResource}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resources..."
                    value={resourceSearchTerm}
                    onChange={(e) => {
                      setResourceSearchTerm(e.target.value);
                      setCurrentResourcePage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={resourceTypeFilter}
                  onValueChange={(value) => {
                    setResourceTypeFilter(value);
                    setCurrentResourcePage(1);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="File Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="DOC">DOC</SelectItem>
                    <SelectItem value="DOCX">DOCX</SelectItem>
                    <SelectItem value="PPT">PPT</SelectItem>
                    <SelectItem value="PPTX">PPTX</SelectItem>
                    <SelectItem value="ZIP">ZIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Resources Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resourcesLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Loading resources...
                        </TableCell>
                      </TableRow>
                    ) : resources.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No resources found
                        </TableCell>
                      </TableRow>
                    ) : (
                      resources.map((resource) => (
                        <TableRow key={resource.id}>
                          <TableCell className="font-medium">{resource.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{resource.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge>{resource.fileType}</Badge>
                          </TableCell>
                          <TableCell>{resource.subject}</TableCell>
                          <TableCell>{formatFileSize(resource.fileSize)}</TableCell>
                          <TableCell>{resource.downloadCount}</TableCell>
                          <TableCell>
                            {resource.isActive ? (
                              <Badge className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditResource(resource)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteResource(resource)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalResourcePages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentResourcePage(currentResourcePage - 1)}
                    disabled={currentResourcePage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentResourcePage} of {totalResourcePages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentResourcePage(currentResourcePage + 1)}
                    disabled={currentResourcePage === totalResourcePages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Course Form Dialog */}
      <CourseFormDialog
        open={courseDialogOpen}
        onOpenChange={setCourseDialogOpen}
        course={selectedCourse}
        onSuccess={handleCourseSuccess}
      />

      {/* Course Delete Confirmation */}
      <AlertDialog open={courseDeleteDialogOpen} onOpenChange={setCourseDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{courseToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCourse} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resource Form Dialog */}
      <ResourceFormDialog
        open={resourceDialogOpen}
        onOpenChange={setResourceDialogOpen}
        resource={selectedResource}
        onSuccess={handleResourceSuccess}
      />

      {/* Resource Delete Confirmation */}
      <AlertDialog open={resourceDeleteDialogOpen} onOpenChange={setResourceDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{resourceToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteResource} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
