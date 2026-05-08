import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AdminRoute } from "./components/AdminRoute";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy Load Pages
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TestDashboard = lazy(() => import("./pages/TestDashboard"));
const LearningPath = lazy(() => import("./pages/LearningPath"));
const Resources = lazy(() => import("./pages/Resources"));
const Evaluation = lazy(() => import("./pages/Evaluation"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Calendar = lazy(() => import("./pages/Calendar"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Classes = lazy(() => import("./pages/Classes"));
const ClassDetails = lazy(() => import("./pages/ClassDetails"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const ContentManagement = lazy(() => import("./pages/admin/ContentManagement"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const SchoolManagement = lazy(() => import("./pages/admin/SchoolManagement"));
const SchoolPerformance = lazy(() => import("./pages/admin/SchoolPerformance"));
const StudentReport = lazy(() => import("./pages/StudentReport"));
const SearchResults = lazy(() => import("./pages/SearchResults"));

// Loading fallback
const PageLoader = () => (
  <div className="p-8 space-y-6 animate-pulse">
    <Skeleton className="h-48 w-full rounded-3xl" />
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute global stale time
      gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
      refetchOnWindowFocus: false, // Prevent redundant background fetches on tab switch
      retry: 1, // Fail faster on errors, specific queries can override
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes Wrapper */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/videos" element={<LearningPath />} />
              <Route path="/learning-path" element={<LearningPath />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/evaluation/:id" element={<Evaluation />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/certificates" element={<Certificates />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/classes/:id" element={<ClassDetails />} />
              <Route path="/classes/:classId/students/:studentId/report" element={<StudentReport />} />
              <Route path="/search" element={<SearchResults />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
              <Route path="/admin/content" element={<AdminRoute><ContentManagement /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
              <Route path="/admin/schools" element={<AdminRoute><SchoolManagement /></AdminRoute>} />
              <Route path="/admin/schools/:id/performance" element={<AdminRoute><SchoolPerformance /></AdminRoute>} />
            </Route>
  
            <Route path="/test-dashboard" element={<TestDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
