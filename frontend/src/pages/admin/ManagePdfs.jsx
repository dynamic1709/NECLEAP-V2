import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const DEFAULT_BRANCHES = ['CSE', 'AIML', 'AI', 'DS', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
const YEARS = ['1', '2', '3', '4'];
const SEMESTERS = ['1', '2'];

export default function ManagePdfs() {
  const { token, user } = useAuth();
  const [pdfs, setPdfs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit form states
  const [editingPdf, setEditingPdf] = useState(null);
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editSemester, setEditSemester] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('Pending');
  const [editMessage, setEditMessage] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Fetch branches dynamically
  const { data: branches = DEFAULT_BRANCHES } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/branches`);
      return res.data.map(b => (typeof b === 'string' ? b : b.name));
    }
  });

  // Fetch subjects dynamically based on selected branch, year, semester in edit form
  const { data: editSubjectsList = [] } = useQuery({
    queryKey: ['editSubjectsList', editBranch, editYear, editSemester],
    queryFn: async () => {
      if (!editBranch || !editYear || !editSemester) return [];
      const res = await axios.get(`${API_URL}/subjects`, {
        params: { branch: editBranch, year: editYear, semester: editSemester }
      });
      return res.data;
    },
    enabled: !!(editBranch && editYear && editSemester)
  });

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

  const startEdit = (pdf) => {
    setEditingPdf(pdf);
    setEditTeacherName(pdf.teacher_name || '');
    let branchVal = pdf.branch || '';
    if (branchVal.startsWith(',') && branchVal.endsWith(',')) {
      branchVal = branchVal.split(',').filter(Boolean)[0] || '';
    }
    setEditBranch(branchVal);
    setEditYear(pdf.year || '');
    setEditSemester(pdf.semester || '');
    setEditSubject(pdf.subject || '');
    setEditTitle(pdf.pdf_title || '');
    setEditDescription(pdf.description || '');
    setEditStatus(pdf.status || 'Pending');
    setEditMessage('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditMessage('');

    try {
      await axios.put(`${API_URL}/pdfs/${editingPdf.id}`, {
        teacher_name: editTeacherName,
        branch: editBranch,
        year: editYear,
        semester: editSemester,
        subject: editSubject,
        pdf_title: editTitle,
        description: editDescription,
        status: editStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEditingPdf(null);
      loadPdfs();
    } catch (err) {
      console.error('Failed to update PDF:', err);
      setEditMessage(err.response?.data?.message || 'Failed to update PDF');
    } finally {
      setEditLoading(false);
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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {user?.role === 'super_admin' ? 'Manage All Study Materials' : 'Your Uploaded Materials'}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            {user?.role === 'super_admin'
              ? 'Review all uploaded course files. Edit or remove any study materials.'
              : 'Review your uploaded course files. Edit or remove your study materials.'}
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
                  <th className="p-4">Author / Teacher</th>
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
                      <td className="p-4 text-right space-x-2">
                        {(user?.role === 'super_admin' || pdf.uploaded_by === user?.id) && (
                          <>
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="text-xs font-semibold px-2.5 py-1"
                              onClick={() => startEdit(pdf)}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold px-2.5 py-1"
                              onClick={() => handleDelete(pdf.id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit PDF Modal Overlay */}
      {editingPdf && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold">Edit Study Material</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500">Author / Teacher Name</label>
                    <Input 
                      value={editTeacherName} 
                      onChange={(e) => setEditTeacherName(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500">Branch</label>
                    <select 
                      value={editBranch} 
                      onChange={(e) => setEditBranch(e.target.value)}
                      className="w-full h-10 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-black text-zinc-800 dark:text-zinc-200"
                      required
                    >
                      <option value="">Select Branch</option>
                      {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500">Year</label>
                    <select 
                      value={editYear} 
                      onChange={(e) => setEditYear(e.target.value)}
                      className="w-full h-10 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-black text-zinc-800 dark:text-zinc-200"
                      required
                    >
                      <option value="">Select Year</option>
                      {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500">Semester</label>
                    <select 
                      value={editSemester} 
                      onChange={(e) => setEditSemester(e.target.value)}
                      className="w-full h-10 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-black text-zinc-800 dark:text-zinc-200"
                      required
                    >
                      <option value="">Select Semester</option>
                      {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500">Subject</label>
                  <select 
                    value={editSubject} 
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full h-10 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-black text-zinc-800 dark:text-zinc-200"
                    required
                    disabled={!editBranch || !editYear || !editSemester}
                  >
                    <option value="">
                      {!editBranch || !editYear || !editSemester 
                        ? "Select Branch, Year, and Semester first" 
                        : "Select Subject"}
                    </option>
                    {Array.from(new Set(editSubjectsList.map(s => s.subject_name))).map(subName => (
                      <option key={subName} value={subName}>
                        {subName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500">PDF Title</label>
                  <Input 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)} 
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500">Description (Optional)</label>
                  <textarea 
                    value={editDescription} 
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full min-h-[60px] p-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-black text-zinc-850 dark:text-zinc-150"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500">Approval Status</label>
                  <select 
                    value={editStatus} 
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full h-10 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-black text-zinc-800 dark:text-zinc-200"
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {editMessage && <p className="text-sm text-red-500 font-semibold">{editMessage}</p>}

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setEditingPdf(null)}>Cancel</Button>
                  <Button type="submit" disabled={editLoading} className="bg-black text-white dark:bg-white dark:text-black">
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
