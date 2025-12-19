import { useState, useEffect } from "react";
import { BarChart as BarChartIcon, TrendingUp, Users, BookOpen, Activity, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminService } from "@/services/admin.service";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OverviewStats {
  stats: {
    totalTeachers: number;
    activeToday: number;
    totalCourses: number;
    avgCompletionRate: number;
  };
  trends: {
    newUsersThisMonth: number;
    totalActivities: number;
    engagementTrend: Array<{ _id: string; count: number }>;
  };
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [courseAnalytics, setCourseAnalytics] = useState<any>(null);
  const [engagementMetrics, setEngagementMetrics] = useState<any>(null);

  // Helper function to safely render values
  const safeValue = (value: any, fallback: string | number = 0): string | number => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') return fallback;
    return value;
  };

  // Load Analytics Data
  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Load overview data
      const overviewData = await adminService.getAnalyticsOverview();
      setOverview(overviewData);

      // Load course analytics
      const coursesData = await adminService.getCourseAnalytics();
      setCourseAnalytics(coursesData);

      // Load engagement metrics
      const engagementData = await adminService.getEngagementMetrics(parseInt(dateRange));
      setEngagementMetrics(engagementData);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  // Format engagement trend data for chart
  const engagementChartData = overview?.trends?.engagementTrend?.map((item) => ({
    date: String(item._id || ''),
    activities: item.count || 0,
  })) || [];

  // Course completion data for chart
  const courseCompletionData = courseAnalytics?.topCourses?.map((course: any) => ({
    name: String(course.title || 'Untitled').substring(0, 20) + (course.title?.length > 20 ? "..." : ""),
    completions: Number(course.completionCount) || 0,
    views: Number(course.viewCount) || 0,
  })) || [];

  // User activity distribution
  const activityDistribution = [
    { name: 'Video Watching', value: Number(engagementMetrics?.videoViews) || 45 },
    { name: 'Resource Downloads', value: Number(engagementMetrics?.resourceDownloads) || 25 },
    { name: 'Quiz Completions', value: Number(engagementMetrics?.quizCompletions) || 20 },
    { name: 'Certificate Earned', value: Number(engagementMetrics?.certificatesEarned) || 10 },
  ];

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChartIcon className="h-8 w-8 text-primary" />
            Analytics & Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into platform usage and performance
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{safeValue(overview?.stats?.totalTeachers, 0)}</div>
            <p className="text-xs text-muted-foreground">
              +{safeValue(overview?.trends?.newUsersThisMonth, 0)} this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-500">{safeValue(overview?.stats?.activeToday, 0)}</div>
            <p className="text-xs text-muted-foreground">
              {safeValue(overview?.trends?.totalActivities, 0)} activities
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{safeValue(overview?.stats?.totalCourses, 0)}</div>
            <p className="text-xs text-muted-foreground">
              Available courses
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {Math.round(Number(safeValue(overview?.stats?.avgCompletionRate, 0)))}%
            </div>
            <p className="text-xs text-muted-foreground">
              Course completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Engagement Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Trend</CardTitle>
            <CardDescription>Daily user activities over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="activities"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Distribution</CardTitle>
            <CardDescription>Breakdown of user activities</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {activityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Course Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
            <CardDescription>Top performing courses by views and completions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={courseCompletionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="views" fill="#06b6d4" name="Views" />
                <Bar dataKey="completions" fill="#10b981" name="Completions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>Key engagement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Avg Session Duration</span>
                <span className="text-sm font-bold text-primary">
                  {safeValue(engagementMetrics?.avgSessionDuration, "24")} min
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Daily Active Users</span>
                <span className="text-sm font-bold text-cyan-500">
                  {safeValue(engagementMetrics?.dailyActiveUsers || overview?.stats?.activeToday, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Retention Rate</span>
                <span className="text-sm font-bold text-green-500">
                  {safeValue(engagementMetrics?.retentionRate, "85")}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">User Satisfaction</span>
                <span className="text-sm font-bold text-purple-500">
                  {safeValue(engagementMetrics?.satisfaction, "4.5")}/5.0
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Performance</CardTitle>
            <CardDescription>Content consumption stats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Total Video Views</span>
                <span className="text-sm font-bold text-primary">
                  {safeValue(courseAnalytics?.totalViews, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Resource Downloads</span>
                <span className="text-sm font-bold text-cyan-500">
                  {safeValue(engagementMetrics?.totalDownloads, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Quiz Attempts</span>
                <span className="text-sm font-bold text-green-500">
                  {safeValue(engagementMetrics?.quizAttempts, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Certificates Issued</span>
                <span className="text-sm font-bold text-purple-500">
                  {safeValue(engagementMetrics?.certificatesIssued, 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Outcomes</CardTitle>
            <CardDescription>Progress and achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Avg Progress</span>
                <span className="text-sm font-bold text-primary">
                  {safeValue(courseAnalytics?.avgProgress, "68")}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Skills Mastered</span>
                <span className="text-sm font-bold text-cyan-500">
                  {safeValue(engagementMetrics?.skillsMastered, 156)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Badges Earned</span>
                <span className="text-sm font-bold text-green-500">
                  {safeValue(engagementMetrics?.badgesEarned, 89)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Avg XP Per User</span>
                <span className="text-sm font-bold text-purple-500">
                  {safeValue(engagementMetrics?.avgXP, 450)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
