import { useEffect, useState } from 'react';
import { debugAuth, testDashboardAPI } from '@/utils/debug';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/services/auth.service';
import { dashboardService } from '@/services/dashboard.service';

export default function TestDashboard() {
  const [authData, setAuthData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Debug auth state
      const auth = debugAuth();
      setAuthData(auth);

      // Get user from localStorage
      const user = authService.getStoredUser();
      console.log('Stored user:', user);

      if (!user?.id) {
        setError('No user found in localStorage. Please login first.');
        return;
      }

      // Fetch dashboard using service
      console.log('Fetching dashboard for user ID:', user.id);
      const data = await dashboardService.getUserDashboard(user.id);
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const testAPIDirectly = async () => {
    console.log('=== TESTING API DIRECTLY ===');
    const result = await testDashboardAPI();
    console.log('Direct API test result:', result);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold">Test Dashboard - Debug View</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth State */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <strong>User:</strong>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(authData?.user, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Token:</strong>
                <p className="text-xs mt-1 break-all">
                  {authData?.token ? `${authData.token.substring(0, 50)}...` : 'null'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading/Error State */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-blue-600">Loading dashboard...</p>}
            {error && (
              <div className="text-red-600">
                <p className="font-bold">Error:</p>
                <p>{error}</p>
              </div>
            )}
            {!loading && !error && dashboardData && (
              <p className="text-green-600 font-bold">✓ Dashboard loaded successfully!</p>
            )}

            <div className="mt-4 space-x-2">
              <Button onClick={loadData} variant="outline" size="sm">
                Reload Dashboard
              </Button>
              <Button onClick={testAPIDirectly} variant="outline" size="sm">
                Test API Directly
              </Button>
              <Button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                variant="destructive"
                size="sm"
              >
                Clear & Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Data */}
      {dashboardData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>User Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(dashboardData.progress, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(dashboardData.stats, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(dashboardData.recentActivities, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Full Dashboard Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(dashboardData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
