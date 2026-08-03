import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Search, Star, FileText } from "lucide-react";
import { resourceService, authService } from "@/services";
import { toast } from "sonner";

export default function Resources() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [resourcesList, setResourcesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = searchParams.get("search");
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await resourceService.getResources();
      setResourcesList(data || []);
    } catch (error) {
      console.error("Failed to load resources:", error);
      toast.error("Failed to load teaching resources");
    } finally {
      setLoading(false);
    }
  };

  const types = ["all", "lesson-plan", "worksheet", "slides", "handout", "assessment", "guide", "teaching"];
  const typeLabels: Record<string, string> = {
    all: "All Resources",
    "lesson-plan": "Lesson Plans",
    worksheet: "Worksheets",
    slides: "Slides",
    handout: "Handouts",
    assessment: "Assessments",
    guide: "Guides",
    teaching: "Teaching",
  };

  const getThumbnailIcon = (category?: string, fileType?: string) => {
    const cat = (category || "").toLowerCase();
    const ft = (fileType || "").toLowerCase();
    if (cat.includes("slide") || ft.includes("ppt") || ft.includes("slide")) return "📊";
    if (cat.includes("worksheet") || cat.includes("quiz")) return "📝";
    if (cat.includes("guide") || cat.includes("setup")) return "🏫";
    if (cat.includes("template") || cat.includes("letter")) return "💌";
    if (ft.includes("docx") || ft.includes("doc")) return "📝";
    return "📄";
  };

  const filteredResources = resourcesList.filter((resource) => {
    const title = (resource.title || "").toLowerCase();
    const desc = (resource.description || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = title.includes(query) || desc.includes(query);

    const cat = (resource.category || "").toLowerCase().replace(/\s+/g, "-");
    const ft = (resource.file_type || resource.fileType || "").toLowerCase();
    
    let matchesType = selectedType === "all";
    if (!matchesType) {
      if (selectedType === "lesson-plan") matchesType = cat.includes("lesson") || cat.includes("plan") || title.includes("lesson");
      else if (selectedType === "worksheet") matchesType = cat.includes("worksheet") || title.includes("worksheet");
      else if (selectedType === "slides") matchesType = cat.includes("slide") || ft.includes("ppt") || title.includes("slide");
      else if (selectedType === "handout") matchesType = cat.includes("handout") || title.includes("handout");
      else if (selectedType === "assessment") matchesType = cat.includes("assessment") || cat.includes("quiz") || title.includes("assessment");
      else if (selectedType === "guide") matchesType = cat.includes("guide") || title.includes("guide");
      else if (selectedType === "teaching") matchesType = cat.includes("teaching") || title.includes("teaching");
      else matchesType = cat.includes(selectedType);
    }

    return matchesSearch && matchesType;
  });

  const handleDownload = async (resource: any) => {
    const user = authService.getStoredUser();
    const resourceId = resource.id;

    try {
      if (user?.id && resourceId) {
        await resourceService.downloadResource(user.id, resourceId);
      }
    } catch (e) {
      console.warn("Could not log download interaction:", e);
    }

    const url = resource.file_url || resource.fileUrl;
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.success(`📥 Downloading: ${resource.title}`, {
        description: `+10 XP earned!`,
      });
    }

    // Refresh list to update download count
    loadResources();
  };

  const mostDownloaded = [...resourcesList]
    .sort((a, b) => (b.download_count || b.downloadCount || 0) - (a.download_count || a.downloadCount || 0))
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Materials & Resources 📚</h1>
        <p className="text-muted-foreground">
          Download teaching materials, lesson plans, and student worksheets
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Most Downloaded */}
          {mostDownloaded.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-accent" />
                Most Downloaded
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {mostDownloaded.map((resource) => {
                  const downloads = resource.download_count || resource.downloadCount || 0;
                  const rating = resource.average_rating || resource.rating || 5;
                  const icon = getThumbnailIcon(resource.category, resource.file_type || resource.fileType);

                  return (
                    <Card key={resource.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="text-4xl">{icon}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm mb-1 line-clamp-2">{resource.title}</h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <div className="flex items-center">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < Math.floor(rating)
                                        ? "fill-accent text-accent"
                                        : "text-muted"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span>({downloads} downloads)</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          variant="outline"
                          onClick={() => handleDownload(resource)}
                        >
                          <Download className="mr-2 h-3 w-3" />
                          Download
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Type Tabs */}
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
              {types.map((type) => (
                <TabsTrigger key={type} value={type}>
                  {typeLabels[type]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedType} className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {filteredResources.map((resource) => {
                  const fileType = resource.file_type || resource.fileType || "PDF";
                  const fileSize = resource.file_size || resource.fileSize ? `${resource.file_size || resource.fileSize} MB` : "File";
                  const rating = resource.average_rating || resource.rating || 5;
                  const downloads = resource.download_count || resource.downloadCount || 0;
                  const icon = getThumbnailIcon(resource.category, fileType);
                  const grade = resource.grade_level || resource.gradeLevel || "All";

                  return (
                    <Card
                      key={resource.id}
                      className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-3xl flex-shrink-0">
                            {icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1">{resource.title}</h3>
                            {resource.description && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{resource.description}</p>
                            )}

                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              {resource.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {resource.category}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {grade}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>{fileType}</span>
                              </div>
                              <span>{fileSize}</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-accent text-accent" />
                                <span>{rating}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="flex-1 bg-primary hover:bg-primary/90"
                                onClick={() => handleDownload(resource)}
                              >
                                <Download className="mr-2 h-3 w-3" />
                                Download
                              </Button>
                              {(resource.file_url || resource.fileUrl) && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => window.open(resource.file_url || resource.fileUrl, "_blank")}
                                >
                                  Preview
                                </Button>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground mt-2">
                              {downloads} downloads
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredResources.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No resources found matching your filter.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
