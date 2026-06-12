import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useAuth, API_URL } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];

export default function Dashboard() {
  const { user, token } = useAuth();
  const [analytics, setAnalytics] = useState({
    totalPdfs: 0,
    totalDownloads: 0,
    totalSubjects: 0,
    recentUploads: [],
    chartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // 1. Fetch all PDFs in the entire application
        const pdfsRes = await axios.get(`${API_URL}/pdfs`, {
          params: { status: 'all', _t: Date.now() },
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const pdfList = pdfsRes.data;

        // 2. Fetch Subjects
        const subjectsRes = await axios.get(`${API_URL}/subjects`, {
          params: { _t: Date.now() },
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const subjectList = subjectsRes.data;

        // 3. Process data
        const totalPdfs = pdfList.length;
        const totalDownloads = pdfList.reduce((sum, item) => sum + (item.downloads || 0), 0);
        const totalSubjects = subjectList.length;

        // Group by branch for chart
        const branchCounts = {};
        pdfList.forEach(item => {
          branchCounts[item.branch] = (branchCounts[item.branch] || 0) + 1;
        });
        const chartData = Object.keys(branchCounts).map(b => ({
          name: b,
          Count: branchCounts[b]
        }));

        // Sort by uploaded_at descending to show recent uploads
        const recentUploads = [...pdfList]
          .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
          .slice(0, 5);

        setAnalytics({
          totalPdfs,
          totalDownloads,
          totalSubjects,
          recentUploads,
          chartData
        });
      } catch (err) {
        console.error('API error fetching dashboard analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          Overview of platform activity, uploads, and download analytics.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(n => (
            <Card key={n} className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm animate-pulse p-6">
              <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
              <div className="h-8 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total PDFs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{analytics.totalPdfs}</div>
              </CardContent>
            </Card>
            
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Downloads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{analytics.totalDownloads}</div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{analytics.totalSubjects}</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {/* Bar Chart: Branch Distribution */}
            <Card className="md:col-span-3 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">PDF Distribution by Branch</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                {analytics.chartData.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-20">No data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.chartData}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                      <Bar dataKey="Count" fill="#18181b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.recentUploads.length === 0 ? (
                <p className="text-sm text-zinc-500">No uploads recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {analytics.recentUploads.map((pdf) => (
                    <div key={pdf.id} className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 last:border-0 last:pb-0">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{pdf.pdf_title}</h4>
                        <p className="text-xs text-zinc-500">{pdf.subject} • By {pdf.teacher_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
