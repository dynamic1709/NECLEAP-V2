import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import axios from 'axios';
import { API_URL, useAuth } from '../../context/AuthContext';

const DEFAULT_BRANCHES = ['CSE', 'AIML', 'AI', 'DS', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
const YEARS = ['1', '2', '3', '4'];
const SEMESTERS = ['1', '2'];

export default function ManageSubjects() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Fetch branches dynamically from server
  const { data: branches = DEFAULT_BRANCHES } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/branches`);
      return res.data.map(b => (typeof b === 'string' ? b : b.name));
    }
  });

  useEffect(() => {
    if (user && user.role !== 'super_admin' && user.role !== 'teacher_admin') {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const [subjects, setSubjects] = useState([]);
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [pdfFile, setPdfFile] = useState(null);

  const [editingSubject, setEditingSubject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadSubjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjects(res.data);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  useEffect(() => {
    if (token) {
      loadSubjects();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('branch', branch);
    formData.append('year', year);
    formData.append('semester', semester);
    formData.append('subject_name', subjectName);
    if (pdfFile) {
      formData.append('pdfFile', pdfFile);
    }

    try {
      if (editingSubject) {
        await axios.put(`${API_URL}/subjects/${editingSubject.id}`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setMessage('Subject updated successfully!');
        setEditingSubject(null);
      } else {
        await axios.post(`${API_URL}/subjects`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setMessage('Subject added successfully!');
      }
      setBranch('');
      setYear('');
      setSemester('');
      setSubjectName('');
      setPdfFile(null);
      
      // Reset file input element manually
      const fileInput = document.getElementById('subject-pdf-file');
      if (fileInput) fileInput.value = '';

      loadSubjects();
    } catch (err) {
      console.error('Error saving subject:', err);
      setMessage(err.response?.data?.message || 'Error saving subject');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (sub) => {
    setEditingSubject(sub);
    setBranch(sub.branch);
    setYear(sub.year);
    setSemester(sub.semester);
    setSubjectName(sub.subject_name);
    setPdfFile(null);
    setMessage('');

    // Reset file input element manually
    const fileInput = document.getElementById('subject-pdf-file');
    if (fileInput) fileInput.value = '';
  };

  const cancelEdit = () => {
    setEditingSubject(null);
    setBranch('');
    setYear('');
    setSemester('');
    setSubjectName('');
    setPdfFile(null);
    setMessage('');

    // Reset file input element manually
    const fileInput = document.getElementById('subject-pdf-file');
    if (fileInput) fileInput.value = '';
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject? This will permanently delete all associated PDF notes records and files from storage.')) {
      return;
    }
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/subjects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Subject and associated PDFs deleted successfully!');
      loadSubjects();
    } catch (err) {
      console.error('Error deleting subject:', err);
      setMessage(err.response?.data?.message || 'Error deleting subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      
      {/* Add / Edit Subject form */}
      <div className="md:col-span-1">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm sticky top-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              {editingSubject ? 'Edit Subject' : 'Add Subject'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Branch</label>
                <select 
                  value={branch} 
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full h-10 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Year</label>
                <select 
                  value={year} 
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full h-10 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  required
                >
                  <option value="">Select Year</option>
                  {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Semester</label>
                <select 
                  value={semester} 
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full h-10 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  required
                >
                  <option value="">Select Semester</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Subject Name</label>
                <Input 
                  placeholder="e.g. Computer Networks" 
                  value={subjectName} 
                  onChange={(e) => setSubjectName(e.target.value)} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  {editingSubject ? 'Replace Notes PDF (Optional)' : 'Attach Notes PDF (Optional)'}
                </label>
                <input 
                  id="subject-pdf-file"
                  type="file" 
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  className="w-full text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-zinc-300 hover:file:bg-zinc-200"
                />
              </div>

              {message && <p className="text-sm text-green-600 font-semibold">{message}</p>}
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800" disabled={loading}>
                  {loading ? 'Saving...' : editingSubject ? 'Update Subject' : 'Add Subject'}
                </Button>
                {editingSubject && (
                  <Button type="button" variant="secondary" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Subjects list */}
      <div className="md:col-span-2">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Configured Subjects</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="p-4 text-zinc-900 dark:text-zinc-300">Subject Name</th>
                    <th className="p-4 text-zinc-900 dark:text-zinc-300">Branch</th>
                    <th className="p-4 text-zinc-900 dark:text-zinc-300">Academic Period</th>
                    <th className="p-4 text-right text-zinc-900 dark:text-zinc-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                  {subjects.map(sub => (
                    <tr key={sub.id}>
                      <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">{sub.subject_name}</td>
                      <td className="p-4">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                          {sub.branch}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-500">Year {sub.year} • Sem {sub.semester}</td>
                      <td className="p-4 text-right space-x-2">
                        <Button variant="secondary" size="sm" onClick={() => startEdit(sub)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteSubject(sub.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                  {subjects.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-zinc-500">No subjects configured.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
