import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, Eye, Share2, CheckCircle } from "lucide-react";
import { certificates } from "@/lib/mockData";
import { toast } from "sonner";

export default function Certificates() {
  const handleViewCertificate = (certificate: typeof certificates[0]) => {
    toast.success(`📜 Opening certificate: ${certificate.title}`);
  };

  const handleDownload = (certificate: typeof certificates[0]) => {
    toast.success(`📥 Downloading certificate`, {
      description: `${certificate.title} - ID: ${certificate.certificateId}`,
    });
  };

  const handleShare = (certificate: typeof certificates[0]) => {
    toast.success(`🔗 Certificate link copied!`, {
      description: "Share your achievement on social media",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Certificates 📜</h1>
        <p className="text-muted-foreground">
          View and download your earned certificates of completion
        </p>
      </div>

      {/* Summary Card */}
      <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-accent" />
            Certificate Collection
          </CardTitle>
          <CardDescription>You've earned {certificates.length} certificates so far!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-card border border-border text-center">
              <div className="text-3xl mb-2">🎓</div>
              <p className="text-2xl font-bold text-primary">
                {certificates.filter((c) => c.type === "course").length}
              </p>
              <p className="text-sm text-muted-foreground">Course Certificates</p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border text-center">
              <div className="text-3xl mb-2">⭐</div>
              <p className="text-2xl font-bold text-secondary">
                {certificates.filter((c) => c.type === "level").length}
              </p>
              <p className="text-sm text-muted-foreground">Level Milestones</p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border text-center">
              <div className="text-3xl mb-2">🏅</div>
              <p className="text-2xl font-bold text-accent">
                {certificates.filter((c) => c.type === "program").length}
              </p>
              <p className="text-sm text-muted-foreground">Program Completion</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {certificates.map((certificate) => (
          <Card
            key={certificate.id}
            className="overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 border-accent/20"
          >
            <CardContent className="p-0">
              {/* Certificate Preview */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center border-b border-border">
                <div className="text-center p-6">
                  <div className="text-6xl mb-4">{certificate.thumbnail}</div>
                  <div className="space-y-2">
                    <div className="w-12 h-1 bg-accent mx-auto" />
                    <h3 className="font-bold text-lg">{certificate.title}</h3>
                    <div className="w-8 h-1 bg-secondary mx-auto" />
                    <p className="text-sm text-muted-foreground">CodesRock Teacher Training</p>
                    <Badge
                      variant={
                        certificate.type === "course"
                          ? "default"
                          : certificate.type === "level"
                          ? "secondary"
                          : "outline"
                      }
                      className="mt-2"
                    >
                      {certificate.type === "course"
                        ? "Course Completion"
                        : certificate.type === "level"
                        ? "Level Achievement"
                        : "Program Certificate"}
                    </Badge>
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>

              {/* Certificate Info */}
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Date Earned</span>
                    <span className="text-sm font-semibold">{certificate.dateEarned}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Certificate ID</span>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {certificate.certificateId}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewCertificate(certificate)}
                    className="flex-col h-auto py-2 gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="text-xs">View</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(certificate)}
                    className="flex-col h-auto py-2 gap-1"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-xs">Download</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(certificate)}
                    className="flex-col h-auto py-2 gap-1"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="text-xs">Share</span>
                  </Button>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  onClick={() => handleViewCertificate(certificate)}
                >
                  View Full Certificate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State (if no certificates) */}
      {certificates.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Complete courses and level up to earn certificates!
            </p>
            <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              Start Learning
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Certificate Verification Info */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-lg">Certificate Verification</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            All CodesRock certificates include a unique verification ID that can be validated by
            employers and educational institutions.
          </p>
          <p>
            To verify a certificate, visit{" "}
            <span className="text-primary font-medium">codesrock.edu/verify</span> and enter the
            certificate ID.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
