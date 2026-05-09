import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, Eye, Share2, CheckCircle, Printer, X } from "lucide-react";
import { certificateService, Certificate } from "@/services/certificate.service";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const user = authService.getStoredUser();
      if (!user) return;
      const data = await certificateService.getUserCertificates(user.id);
      setCertificates(data);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  const handleViewCertificate = (certificate: Certificate) => {
    setSelectedCert(certificate);
    setIsModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = (certificate: Certificate) => {
    navigator.clipboard.writeText(`${window.location.origin}/verify/${certificate.certificateId}`);
    toast.success(`🔗 Certificate link copied!`, {
      description: "Share your achievement on social media",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-80" />)}
        </div>
      </div>
    );
  }

  const user = authService.getStoredUser();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Certificates 📜</h1>
        <p className="text-muted-foreground">
          View and download your earned certificates of completion
        </p>
      </div>

      {/* Summary Card */}
      <Card className="border-accent/30 bg-accent/5">
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
              <div className="relative aspect-[4/3] bg-primary/10 flex items-center justify-center border-b border-border">
                <div className="text-center p-6">
                  <div className="text-6xl mb-4">📜</div>
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
                    <span className="text-sm font-semibold">
                      {new Date(certificate.dateEarned).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Certificate ID</span>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {certificate.certificateId}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
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
                    onClick={() => handleShare(certificate)}
                    className="flex-col h-auto py-2 gap-1"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="text-xs">Share Link</span>
                  </Button>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => handleViewCertificate(certificate)}
                >
                  View Full Certificate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {certificates.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Complete courses and level up to earn certificates!
            </p>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => window.location.href = '/learning-path'}>
              Start Learning
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Certificate Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-8 border-double border-primary/20">
          <div className="p-12 relative overflow-hidden print:p-0">
            {/* Background elements for premium look */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full -ml-32 -mb-32" />

            <div className="relative z-10 border-4 border-primary/30 p-12 text-center space-y-8 min-h-[600px] flex flex-col justify-center">
              <div className="space-y-2">
                <div className="flex justify-center mb-6">
                   <img src="/assets/logo.png" alt="CodesRock" className="h-20 object-contain" />
                </div>
                <h1 className="text-4xl font-serif font-bold text-gray-800 uppercase tracking-widest">Certificate of Completion</h1>
                <p className="text-xl text-muted-foreground italic">This is to certify that</p>
              </div>

              <div className="space-y-4">
                <h2 className="text-5xl font-serif font-black text-primary border-b-2 border-primary/20 pb-4 inline-block px-12">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-xl text-gray-700">has successfully completed the teacher training course</p>
                <h3 className="text-3xl font-bold text-gray-900">{selectedCert?.title}</h3>
              </div>

              <div className="pt-12 grid grid-cols-2 gap-24 text-center">
                <div className="space-y-2">
                  <div className="border-b border-gray-400 font-serif text-lg py-2">
                    {new Date(selectedCert?.dateEarned || "").toLocaleDateString()}
                  </div>
                  <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Date Issued</p>
                </div>
                <div className="space-y-2">
                  <div className="border-b border-gray-400 font-serif text-lg py-2">
                    {selectedCert?.certificateId}
                  </div>
                  <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Certificate ID</p>
                </div>
              </div>

              <div className="pt-12 flex justify-between items-end">
                <div className="text-left opacity-30">
                  <img src="/assets/rocky/waving-transparent.webp" alt="Rocky" className="h-24 w-24 object-contain" />
                </div>
                <div className="text-right">
                  <p className="font-serif italic text-xl">The CodesRock Team</p>
                  <p className="text-xs uppercase font-bold text-muted-foreground tracking-tighter">Verified Achievement</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-muted p-4 flex justify-between print:hidden">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
            <div className="flex gap-2">
              <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90">
                <Printer className="mr-2 h-4 w-4" />
                Print / Save PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
