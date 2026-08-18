import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, Eye, Share2, CheckCircle, Printer, Loader2 } from "lucide-react";
import { certificateService, Certificate } from "@/services/certificate.service";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdultCertificateTemplate, AdultCertificateData } from "@/components/certificates/AdultCertificateTemplate";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

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
    const url = `${window.location.origin}/verify/${certificate.certificateId}`;
    navigator.clipboard.writeText(url);
    toast.success(`🔗 Certificate verification link copied!`, {
      description: "Share your achievement credential on social media",
    });
  };

  const handleDownloadPDF = async () => {
    if (!selectedCert || !certRef.current) return;
    setDownloadingPdf(true);
    const toastId = toast.loading("Generating high-resolution PDF certificate...");

    try {
      // High resolution HTML canvas capture
      const element = certRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5, // 2.5x resolution scaling for crisp vector-like text
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      // Landscape A4 proportions
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Codesrock_Certificate_${selectedCert.certificateId}.pdf`);

      toast.success("Certificate downloaded successfully! 📄", { id: toastId });
    } catch (error) {
      console.error("Error downloading PDF via canvas:", error);
      // Try fallback backend PDF download
      try {
        const blob = await certificateService.downloadBackendPDF(selectedCert.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Codesrock_Certificate_${selectedCert.certificateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Downloaded backend PDF certificate!", { id: toastId });
      } catch (fallbackErr) {
        console.error("Fallback PDF download failed:", fallbackErr);
        toast.error("Failed to generate PDF. Please try printing to PDF.", { id: toastId });
      }
    } finally {
      setDownloadingPdf(false);
    }
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
  const recipientName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username
    : "STEM Educator";

  const getTemplateData = (cert: Certificate): AdultCertificateData => ({
    id: cert.id,
    certificateId: cert.certificateId,
    title: cert.title || "Level 1: Unplugged Computational Thinking",
    recipientName: recipientName,
    schoolName: cert.schoolName,
    type: cert.type,
    dateEarned: cert.dateEarned,
    citation: cert.citation,
    questsExplored: cert.questsExplored,
    badges: cert.badges || [
      {
        name: cert.title ? `${cert.title} Specialist` : "Logic Master",
        description: "Passed all module challenges & unplugged logic missions",
        icon: "🎖️",
      },
    ],
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Teacher Credentials & Certificates 📜</h1>
        <p className="text-muted-foreground">
          View and download your official Codesrock STEM coaching credentials and level certificates
        </p>
      </div>

      {/* Summary Card */}
      <Card className="border-accent/30 bg-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-accent" />
            Teacher Certificate Collection
          </CardTitle>
          <CardDescription>You've earned {certificates.length} credentials so far!</CardDescription>
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
              <p className="text-sm text-muted-foreground">Program Certification</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {certificates.map((certificate) => (
          <Card
            key={certificate.id}
            className="overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 border-accent/20 flex flex-col justify-between"
          >
            <CardContent className="p-0">
              {/* Certificate Preview Card Header */}
              <div className="relative aspect-[16/10] bg-gradient-to-br from-purple-900/90 via-slate-900 to-indigo-950 flex flex-col justify-between p-5 text-white border-b border-border overflow-hidden">
                {/* Rocky Thumbnail Preview */}
                <img
                  src="/rocky_celebration_pose.png"
                  alt="Rocky 3D"
                  className="absolute right-2 bottom-1 w-24 h-auto object-contain opacity-90 drop-shadow"
                />

                <div className="flex justify-between items-start z-10">
                  <Badge variant="secondary" className="bg-amber-400 text-purple-950 font-bold">
                    {certificate.type === "course"
                      ? "Course Completion"
                      : certificate.type === "level"
                      ? "Level Milestone"
                      : "Program Certification"}
                  </Badge>
                  <div className="bg-emerald-500/20 text-emerald-300 rounded-full p-1 border border-emerald-400/40">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>

                <div className="z-10 space-y-1">
                  <p className="text-xs uppercase font-extrabold tracking-wider text-teal-300">
                    CodesRock Teacher Hub
                  </p>
                  <h3 className="font-bold text-base leading-snug line-clamp-2">{certificate.title}</h3>
                </div>

                <div className="z-10 flex items-center justify-between text-xs text-slate-300 border-t border-white/10 pt-2">
                  <span>ID: {certificate.certificateId}</span>
                  <span>{new Date(certificate.dateEarned).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Certificate Info Body */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-lg">
                    🏅
                  </div>
                  <div>
                    <p className="text-xs font-bold text-purple-900">Module Badge Conferred</p>
                    <p className="text-[11px] text-muted-foreground">
                      Level Badge & Official Educator Credential
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewCertificate(certificate)}
                    className="flex items-center justify-center gap-1 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(certificate)}
                    className="flex items-center justify-center gap-1 text-xs"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Verify Link
                  </Button>
                </div>

                <Button
                  className="w-full bg-purple-900 hover:bg-purple-950 text-white font-bold"
                  onClick={() => handleViewCertificate(certificate)}
                >
                  <Award className="mr-2 h-4 w-4 text-amber-400" />
                  View & Download PDF
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
              Complete teacher training modules and level challenges to earn your credentials!
            </p>
            <Button className="bg-purple-900 hover:bg-purple-950" onClick={() => window.location.href = '/learning-path'}>
              Start Learning Path
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Adult Certificate Preview & PDF Download Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-slate-900 text-white border-0">
          <DialogHeader className="p-4 bg-purple-950 border-b border-purple-800 flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Award className="h-5 w-5 text-amber-400" />
              Teacher PDF Credential Preview
            </DialogTitle>
          </DialogHeader>

          {/* Certificate Container Modal Body */}
          <div className="p-6 bg-slate-950 flex items-center justify-center overflow-x-auto min-h-[500px]">
            {selectedCert && (
              <div className="shadow-2xl rounded-lg overflow-hidden border border-purple-500/30">
                <AdultCertificateTemplate
                  ref={certRef}
                  data={getTemplateData(selectedCert)}
                  scale={0.8}
                />
              </div>
            )}
          </div>

          {/* Modal Action Bar */}
          <div className="bg-slate-900 p-4 border-t border-slate-800 flex justify-between items-center">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white">
              Close
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handlePrint} className="border-slate-700 text-slate-200 hover:bg-slate-800">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
              >
                {downloadingPdf ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Official PDF Credential
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
