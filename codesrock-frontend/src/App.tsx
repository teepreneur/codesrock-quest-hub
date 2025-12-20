import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Get basename for GitHub Pages deployment
const basename = import.meta.env.PROD ? "/codesrock-quest-hub" : "";
import { AppLayout } from "./components/layout/AppLayout";
import { AdminRoute } from "./components/AdminRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TestDashboard from "./pages/TestDashboard";
import Videos from "./pages/Videos";
import Resources from "./pages/Resources";
import Evaluation from "./pages/Evaluation";
import Achievements from "./pages/Achievements";
import Certificates from "./pages/Certificates";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import ContentManagement from "./pages/admin/ContentManagement";
import Analytics from "./pages/admin/Analytics";
import SchoolManagement from "./pages/admin/SchoolManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/test-dashboard" element={<TestDashboard />} />
          <Route path="/videos" element={<AppLayout><Videos /></AppLayout>} />
          <Route path="/resources" element={<AppLayout><Resources /></AppLayout>} />
          <Route path="/evaluation" element={<AppLayout><Evaluation /></AppLayout>} />
          <Route path="/achievements" element={<AppLayout><Achievements /></AppLayout>} />
          <Route path="/certificates" element={<AppLayout><Certificates /></AppLayout>} />
          <Route path="/calendar" element={<AppLayout><Calendar /></AppLayout>} />
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AppLayout><AdminDashboard /></AppLayout></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AppLayout><UserManagement /></AppLayout></AdminRoute>} />
          <Route path="/admin/content" element={<AdminRoute><AppLayout><ContentManagement /></AppLayout></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><AppLayout><Analytics /></AppLayout></AdminRoute>} />
          <Route path="/admin/schools" element={<AdminRoute><AppLayout><SchoolManagement /></AppLayout></AdminRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
