import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, BookOpen, FileText, ChevronRight, Download, Video, Star, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { searchService, SearchResult } from "@/services/search.service";
import { toast } from "sonner";

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(query);

  useEffect(() => {
    if (query) {
      handleSearch(query);
      setInputValue(query);
    }
  }, [query]);

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      const data = await searchService.search(searchTerm);
      setResults(data);
    } catch (error: any) {
      toast.error("Failed to fetch search results");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    }
  };

  const handleDownload = (resource: any) => {
    toast.success(`📥 Starting download: ${resource.title}`, {
      description: "+10 XP earned!",
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-black text-deep-purple flex items-center gap-3">
          <Search className="h-10 w-10 text-primary" />
          Search Central
        </h1>
        <p className="text-muted-foreground font-medium max-w-2xl">
          Finding everything related to "{query}" across courses, topics, and teaching materials.
        </p>
      </div>

      {/* Search Input Area */}
      <form onSubmit={onSearchSubmit} className="relative max-w-2xl group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search topics, resources, or lessons..."
          className="pl-12 pr-4 h-14 text-lg rounded-2xl border-muted/30 focus:ring-primary/20 shadow-xl transition-all"
        />
        <Button 
          type="submit" 
          className="absolute right-2 top-2 h-10 rounded-xl px-6 bg-primary hover:bg-primary/90 font-bold"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-muted-foreground font-bold animate-pulse">Scanning the Hub...</p>
        </div>
      ) : results ? (
        <div className="grid gap-8 lg:grid-cols-2">
          
          {/* Topics Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-muted/30 pb-4">
              <h2 className="text-2xl font-black text-deep-purple flex items-center gap-2">
                <Video className="h-6 w-6 text-primary" />
                Learning Topics
              </h2>
              <Badge variant="secondary" className="rounded-full px-4 py-1 font-bold">
                {results.topics.length} Matches
              </Badge>
            </div>

            {results.topics.length === 0 ? (
              <Card className="border-dashed border-muted/50 bg-muted/5">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-2">
                  <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-muted-foreground font-medium">No topics found for this query.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {results.topics.map((topic) => (
                  <Card 
                    key={topic.id} 
                    className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-xl overflow-hidden"
                    onClick={() => navigate(`/classes`)} // In a real app, go to course viewer
                  >
                    <CardContent className="p-0">
                      <div className="flex h-full">
                        <div className="w-2 bg-primary group-hover:w-4 transition-all" />
                        <div className="p-6 flex-1 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs uppercase font-black tracking-widest text-primary border-primary/20 bg-primary/5">
                              {topic.courses?.title || "Course"}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">
                              Topic #{topic.order_index}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-deep-purple group-hover:text-primary transition-colors leading-tight mb-1">
                              {topic.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {topic.description}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-4 border-t border-muted/30">
                            <div className="flex items-center gap-2 text-primary">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Video className="h-4 w-4" />
                              </div>
                              <span className="text-xs font-black uppercase">View Lessons</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Resources Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-muted/30 pb-4">
              <h2 className="text-2xl font-black text-deep-purple flex items-center gap-2">
                <FileText className="h-6 w-6 text-secondary" />
                Teaching Materials
              </h2>
              <Badge variant="secondary" className="rounded-full px-4 py-1 font-bold bg-secondary/10 text-secondary border-secondary/20">
                {results.resources.length} Matches
              </Badge>
            </div>

            {results.resources.length === 0 ? (
              <Card className="border-dashed border-muted/50 bg-muted/5">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-2">
                  <FileText className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-muted-foreground font-medium">No materials found for this query.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {results.resources.map((resource) => (
                  <Card 
                    key={resource.id} 
                    className="hover:border-secondary/50 transition-all hover:shadow-xl border-muted/30"
                  >
                    <CardHeader className="p-6 pb-2 flex flex-row items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-secondary text-secondary-foreground text-[10px] uppercase font-black">
                            {resource.file_type || "PDF"}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">
                            {resource.category || "General"}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg font-black text-deep-purple leading-tight">
                          {resource.title}
                        </CardTitle>
                      </div>
                      <div className="h-12 w-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-2xl flex-shrink-0">
                        {resource.thumbnail || "📚"}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-2 space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {resource.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          <span>{resource.download_count || 0} Downloads</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{resource.average_rating || 5.0} Rating</span>
                        </div>
                      </div>
                      <div className="pt-2 flex gap-2">
                        <Button 
                          onClick={() => handleDownload(resource)} 
                          className="flex-1 bg-secondary hover:bg-secondary/90 font-bold rounded-xl h-11"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Material
                        </Button>
                        <Button 
                          variant="outline" 
                          className="rounded-xl h-11 px-4 border-muted/30 font-bold hover:bg-muted/50"
                        >
                          Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center">
            <Search className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-deep-purple">Ready to explore?</h3>
            <p className="text-muted-foreground">Enter a search term above to scan the entire Hub.</p>
          </div>
        </div>
      )}
    </div>
  );
}
