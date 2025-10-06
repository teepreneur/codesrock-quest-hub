import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Search, Star, FileText } from "lucide-react";
import { resources } from "@/lib/mockData";
import { toast } from "sonner";

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const types = ["all", "lesson-plan", "worksheet", "slides", "handout", "assessment"];
  const typeLabels: Record<string, string> = {
    all: "All Resources",
    "lesson-plan": "Lesson Plans",
    worksheet: "Worksheets",
    slides: "Slides",
    handout: "Handouts",
    assessment: "Assessments",
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || resource.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleDownload = (resource: typeof resources[0]) => {
    toast.success(`📥 Downloading: ${resource.title}`, {
      description: `+10 XP earned! File size: ${resource.fileSize}`,
    });
  };

  const mostDownloaded = [...resources].sort((a, b) => b.downloads - a.downloads).slice(0, 3);

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

      {/* Most Downloaded */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-accent" />
          Most Downloaded
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {mostDownloaded.map((resource) => (
            <Card key={resource.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-4xl">{resource.thumbnail}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{resource.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(resource.rating)
                                ? "fill-accent text-accent"
                                : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span>({resource.downloads} downloads)</span>
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
          ))}
        </div>
      </div>

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
            {filteredResources.map((resource) => (
              <Card
                key={resource.id}
                className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-3xl flex-shrink-0">
                      {resource.thumbnail}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-2">{resource.title}</h3>

                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {resource.category}
                        </Badge>
                        {resource.gradeLevel.map((grade) => (
                          <Badge key={grade} variant="outline" className="text-xs">
                            {grade}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{resource.fileType}</span>
                        </div>
                        <span>{resource.fileSize}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-accent text-accent" />
                          <span>{resource.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                          onClick={() => handleDownload(resource)}
                        >
                          <Download className="mr-2 h-3 w-3" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline">
                          Preview
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground mt-2">
                        {resource.downloads} downloads
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No resources found matching your search.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
