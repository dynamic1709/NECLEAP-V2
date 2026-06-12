import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import axios from 'axios';

export default function ManagePdfs() {
  const { token } = useAuth();
  const [pdfs, setPdfs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadPdfs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/pdfs/admin`, {
        params: { _t: Date.now() },
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      setPdfs(res.data);
    } catch (err) {
      console.error('Failed to fetch PDFs:', err);
      setPdfs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPdfs();
    }
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this PDF note? This will also remove the file from storage.')) return;
    try {
      await axios.delete(`${API_URL}/pdfs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadPdfs();
    } catch (err) {
      console.error('Failed to delete PDF:', err);
      alert(err.response?.data?.message || 'Failed to delete PDF notes. You may not be authorized to delete this PDF.');
    }
  };

  const filteredPdfs = pdfs.filter(pdf => 
    (pdf.pdf_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pdf.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pdf.teacher_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Manage Study Materials</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            Review uploaded course files and remove outdated study materials.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Input 
          type="search" 
          placeholder="Filter notes..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-zinc-200 dark:border-zinc-800"
        />
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="p-4">Title / Subject</th>
                  <th className="p-4">Teacher</th>
                  <th className="p-4">Academic Category</th>
                  <th className="p-4">Downloads</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-zinc-500">Loading PDFs...</td>
                  </tr>
                ) : filteredPdfs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-zinc-500">No matching PDFs found.</td>
                  </tr>
                ) : (
                  filteredPdfs.map(pdf => (
                    <tr key={pdf.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{pdf.pdf_title}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{pdf.subject}</div>
                      </td>
                      <td className="p-4 text-zinc-600 dark:text-zinc-300">{pdf.teacher_name}</td>
                      <td className="p-4">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                          {pdf.branch} • {pdf.year}-{pdf.semester}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-zinc-600 dark:text-zinc-300">{pdf.downloads}</td>
                      <td className="p-4 text-right">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-600 dark:hover:bg-red-950/20 hover:bg-red-50 text-xs font-semibold px-2.5 py-1"
                          onClick={() => handleDelete(pdf.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
