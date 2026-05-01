import { useState, useEffect } from "react";
import { FileText, BookOpen, Plus, Search, Pencil, Trash2, Eye, ChevronRight, ArrowLeft, Video, Layers } from "lucide-react";
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
import { TopicFormDialog } from "@/components/admin/TopicFormDialog";
import { VideoFormDialog } from "@/components/admin/VideoFormDialog";
import { ResourceFormDialog } from "@/components/admin/ResourceFormDialog";
import type { Course, Resource } from "@/types/content.types";

type ViewLevel = "courses" | "topics" | "videos";

export default function ContentManagement() {
  // Navigation state
  const [viewLevel, setViewLevel] = useState<ViewLevel>("courses");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);

  // Courses
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; item: any } | null>(null);

  // Topics
  const [topics, setTopics] = useState<any[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any>(null);

  // Videos
  const [videos, setVideos] = useState<any[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);

  // Resources
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourceSearchTerm, setResourceSearchTerm] = useState("");
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // Stats
  const [stats, setStats] = useState({ totalCourses: 0, activeCourses: 0, totalResources: 0, activeResources: 0 });

  // Load functions
  const loadCourses = async () => {
    try {
      setCoursesLoading(true);
      const params: any = { page: 1, limit: 50 };
      if (courseSearchTerm) params.search = courseSearchTerm;
      const response = await adminService.getAllCourses(params);
      setCourses(response.courses || response.data?.courses || []);
    } catch (error: any) {
      toast.error("Failed to load courses");
    } finally {
      setCoursesLoading(false);
    }
  };

  const loadTopics = async (courseId: string) => {
    try {
      setTopicsLoading(true);
      const response = await adminService.getTopics(courseId);
      // Handle both { topics: [] } and raw [] formats
      const topicsData = response.topics || response.data?.topics || (Array.isArray(response) ? response : response.data || []);
      setTopics(topicsData);
    } catch (error: any) {
      toast.error("Failed to load topics");
    } finally {
      setTopicsLoading(false);
    }
  };

  const loadVideos = async (topicId: string) => {
    try {
      setVideosLoading(true);
      const response = await adminService.getVideos(topicId);
      // Handle both { videos: [] } and raw [] formats
      const videosData = response.videos || response.data?.videos || (Array.isArray(response) ? response : response.data || []);
      setVideos(videosData);
    } catch (error: any) {
      toast.error("Failed to load videos");
    } finally {
      setVideosLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      setResourcesLoading(true);
      const params: any = { page: 1, limit: 50 };
      if (resourceSearchTerm) params.search = resourceSearchTerm;
      const response = await adminService.getAllResources(params);
      setResources(response.resources || response.data?.resources || []);
    } catch (error: any) {
      toast.error("Failed to load resources");
    } finally {
      setResourcesLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminService.getContentStats();
      setStats({ totalCourses: response.totalCourses || response.data?.totalCourses || 0, activeCourses: response.activeCourses || response.data?.activeCourses || 0, totalResources: response.totalResources || response.data?.totalResources || 0, activeResources: response.activeResources || response.data?.activeResources || 0 });
    } catch { /* ignore */ }
  };

  useEffect(() => { loadCourses(); loadResources(); loadStats(); }, []);
  useEffect(() => { loadCourses(); }, [courseSearchTerm]);
  useEffect(() => { loadResources(); }, [resourceSearchTerm]);

  // Navigation
  const navigateToTopics = (course: any) => { setSelectedCourse(course); setViewLevel("topics"); loadTopics(course.id || course._id); };
  const navigateToVideos = (topic: any) => { setSelectedTopic(topic); setViewLevel("videos"); loadVideos(topic.id || topic._id); };
  const navigateBack = () => {
    if (viewLevel === "videos") { setViewLevel("topics"); setSelectedTopic(null); }
    else if (viewLevel === "topics") { setViewLevel("courses"); setSelectedCourse(null); }
  };

  // Delete handler
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "course") { await adminService.deleteCourse(deleteTarget.item.id || deleteTarget.item._id); loadCourses(); loadStats(); }
      else if (deleteTarget.type === "topic") { await adminService.deleteTopic(deleteTarget.item.id || deleteTarget.item._id); loadTopics(selectedCourse.id || selectedCourse._id); }
      else if (deleteTarget.type === "video") { await adminService.deleteVideo(deleteTarget.item.id || deleteTarget.item._id); loadVideos(selectedTopic.id || selectedTopic._id); }
      else if (deleteTarget.type === "resource") { await adminService.deleteResource(deleteTarget.item.id || deleteTarget.item._id); loadResources(); loadStats(); }
      toast.success(`${deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1)} deleted`);
    } catch (error: any) { toast.error(error.message || "Delete failed"); }
    setDeleteTarget(null);
  };

  // Breadcrumb
  const renderBreadcrumb = () => {
    if (viewLevel === "courses") return null;
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Button variant="ghost" size="sm" onClick={() => { setViewLevel("courses"); setSelectedCourse(null); setSelectedTopic(null); }}>
          Courses
        </Button>
        {selectedCourse && (
          <><ChevronRight className="h-4 w-4" />
          <Button variant="ghost" size="sm" onClick={() => { setViewLevel("topics"); setSelectedTopic(null); }} className="font-semibold text-foreground">
            {selectedCourse.title}
          </Button></>
        )}
        {selectedTopic && (
          <><ChevronRight className="h-4 w-4" />
          <span className="font-semibold text-foreground">{selectedTopic.title}</span></>
        )}
      </div>
    );
  };

  // Courses view
  const renderCoursesView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle>Course Library</CardTitle><CardDescription>Manage courses — click a course to manage its topics and videos</CardDescription></div>
          <Button onClick={() => { setEditingCourse(null); setCourseDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Course</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search courses..." value={courseSearchTerm} onChange={(e) => setCourseSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Course</TableHead><TableHead>Topics</TableHead><TableHead>Videos</TableHead><TableHead>Views</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {coursesLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : courses.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No courses found</TableCell></TableRow>
              ) : courses.map((course: any) => (
                <TableRow key={course.id || course._id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigateToTopics(course)}>
                  <TableCell className="font-medium"><div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" />{course.title}</div></TableCell>
                  <TableCell><Badge variant="outline"><Layers className="h-3 w-3 mr-1" />{course.stats?.topicCount ?? "—"}</Badge></TableCell>
                  <TableCell><Badge variant="outline"><Video className="h-3 w-3 mr-1" />{course.stats?.videoCount ?? "—"}</Badge></TableCell>
                  <TableCell>{course.view_count || 0}</TableCell>
                  <TableCell>{course.is_active ? <Badge className="bg-green-500">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => navigateToTopics(course)}><ChevronRight className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingCourse(course); setCourseDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget({ type: "course", item: course })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  // Topics view
  const renderTopicsView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={navigateBack}><ArrowLeft className="h-4 w-4" /></Button>
            <div><CardTitle>{selectedCourse?.title} — Topics</CardTitle><CardDescription>Manage topics — click to view videos</CardDescription></div>
          </div>
          <Button onClick={() => { setEditingTopic(null); setTopicDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Topic</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Order</TableHead><TableHead>Topic</TableHead><TableHead>Videos</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {topicsLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : topics.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No topics yet. Add one to get started.</TableCell></TableRow>
              ) : topics.map((topic: any) => (
                <TableRow key={topic.id || topic._id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigateToVideos(topic)}>
                  <TableCell className="w-16 text-center font-mono">{topic.order_index}</TableCell>
                  <TableCell className="font-medium"><div className="flex items-center gap-2"><Layers className="h-4 w-4 text-primary" />{topic.title}</div></TableCell>
                  <TableCell><Badge variant="outline"><Video className="h-3 w-3 mr-1" />{topic.videoCount ?? 0}</Badge></TableCell>
                  <TableCell>{topic.is_active ? <Badge className="bg-green-500">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => navigateToVideos(topic)}><ChevronRight className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingTopic(topic); setTopicDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget({ type: "topic", item: topic })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  // Videos view
  const renderVideosView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={navigateBack}><ArrowLeft className="h-4 w-4" /></Button>
            <div><CardTitle>{selectedTopic?.title} — Videos</CardTitle><CardDescription>Manage individual video lessons</CardDescription></div>
          </div>
          <Button onClick={() => { setEditingVideo(null); setVideoDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Video</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Order</TableHead><TableHead>Title</TableHead><TableHead>Duration</TableHead><TableHead>XP</TableHead><TableHead>Views</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {videosLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : videos.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No videos yet. Add one to get started.</TableCell></TableRow>
              ) : videos.map((video: any) => (
                <TableRow key={video.id || video._id}>
                  <TableCell className="w-16 text-center font-mono">{video.order_index}</TableCell>
                  <TableCell className="font-medium"><div className="flex items-center gap-2"><Video className="h-4 w-4 text-primary" />{video.title}</div></TableCell>
                  <TableCell>{video.duration} min</TableCell>
                  <TableCell>{video.xp_reward} XP</TableCell>
                  <TableCell>{video.view_count || 0}</TableCell>
                  <TableCell>{video.is_active ? <Badge className="bg-green-500">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingVideo(video); setVideoDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget({ type: "video", item: video })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-3xl font-bold flex items-center gap-2"><FileText className="h-8 w-8 text-primary" />Content Management</h1><p className="text-muted-foreground mt-1">Manage courses, topics, videos, and resources</p></div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Courses</CardTitle><BookOpen className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{stats.totalCourses}</div><p className="text-xs text-muted-foreground">{stats.activeCourses} active</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Courses</CardTitle><Eye className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{stats.activeCourses}</div><p className="text-xs text-muted-foreground">Visible to users</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Resources</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-cyan-500">{stats.totalResources}</div><p className="text-xs text-muted-foreground">{stats.activeResources} active</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Resources</CardTitle><Eye className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-purple-500">{stats.activeResources}</div><p className="text-xs text-muted-foreground">Available for download</p></CardContent></Card>
      </div>

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList><TabsTrigger value="courses">Courses</TabsTrigger><TabsTrigger value="resources">Resources</TabsTrigger></TabsList>

        <TabsContent value="courses" className="space-y-4">
          {renderBreadcrumb()}
          {viewLevel === "courses" && renderCoursesView()}
          {viewLevel === "topics" && renderTopicsView()}
          {viewLevel === "videos" && renderVideosView()}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Resource Library</CardTitle><CardDescription>Manage lesson plans, worksheets, and templates</CardDescription></div>
                <Button onClick={() => { setEditingResource(null); setResourceDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Resource</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative max-w-md mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search resources..." value={resourceSearchTerm} onChange={(e) => setResourceSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {resourcesLoading ? (<TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                    ) : resources.length === 0 ? (<TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No resources found</TableCell></TableRow>
                    ) : resources.map((resource: any) => (
                      <TableRow key={resource.id || resource._id}>
                        <TableCell className="font-medium">{resource.title}</TableCell>
                        <TableCell><Badge variant="outline">{resource.category}</Badge></TableCell>
                        <TableCell><Badge>{resource.file_type || resource.fileType}</Badge></TableCell>
                        <TableCell>{(resource.is_active ?? resource.isActive) ? <Badge className="bg-green-500">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingResource(resource); setResourceDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget({ type: "resource", item: resource })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CourseFormDialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen} course={editingCourse} onSuccess={() => { loadCourses(); loadStats(); }} />
      {selectedCourse && <TopicFormDialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen} courseId={selectedCourse.id || selectedCourse._id} topic={editingTopic} onSuccess={() => loadTopics(selectedCourse.id || selectedCourse._id)} />}
      {selectedTopic && <VideoFormDialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen} topicId={selectedTopic.id || selectedTopic._id} video={editingVideo} onSuccess={() => loadVideos(selectedTopic.id || selectedTopic._id)} />}
      <ResourceFormDialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen} resource={editingResource} onSuccess={() => { loadResources(); loadStats(); }} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {deleteTarget?.type}?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{deleteTarget?.item?.title}"? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
