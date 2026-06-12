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
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]); // Array of { file, title }

  const [editingSubject, setEditingSubject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFilesChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map(file => ({
        file,
        title: file.name.replace('.pdf', ''),
        unit: ''
      }));
      setSelectedFiles([...selectedFiles, ...filesArray]);
    }
  };

  const removeSelectedFile = (idx) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== idx));
  };

  const updateFileTitle = (idx, value) => {
    const updated = [...selectedFiles];
    updated[idx].title = value;
    setSelectedFiles(updated);
  };

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
    if (selectedBranches.length === 0) {
      setMessage('Please select at least one branch.');
      return;
    }

    setLoading(true);
    setMessage('');

    const branchString = `,${selectedBranches.join(',')},`;

    const formData = new FormData();
    formData.append('branch', branchString);
    formData.append('year', year);
    formData.append('semester', semester);
    formData.append('subject_name', subjectName);
    
    selectedFiles.forEach((fileObj) => {
      formData.append('pdfFiles', fileObj.file);
      formData.append('pdfTitles', fileObj.title);
    });

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
      setSelectedBranches([]);
      setYear('');
      setSemester('');
      setSubjectName('');
      setSelectedFiles([]);
      
      // Reset file input element manually
      const fileInput = document.getElementById('subject-pdf-files');
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
    
    // Parse branch list
    let branchesArr = [];
    if (sub.branch.startsWith(',') && sub.branch.endsWith(',')) {
      branchesArr = sub.branch.split(',').filter(Boolean);
    } else {
      branchesArr = [sub.branch];
    }
    setSelectedBranches(branchesArr);

    setYear(sub.year);
    setSemester(sub.semester);
    setSubjectName(sub.subject_name);
    setSelectedFiles([]);
    setMessage('');

    // Reset file input element manually
    const fileInput = document.getElementById('subject-pdf-files');
    if (fileInput) fileInput.value = '';
  };

  const cancelEdit = () => {
    setEditingSubject(null);
    setSelectedBranches([]);
    setYear('');
    setSemester('');
    setSubjectName('');
    setSelectedFiles([]);
    setMessage('');

    // Reset file input element manually
    const fileInput = document.getElementById('subject-pdf-files');
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
                <label className="text-sm font-semibold">Map to Branches</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {branches.map(b => {
                    const isSelected = selectedBranches.includes(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedBranches(selectedBranches.filter(x => x !== b));
                          } else {
                            setSelectedBranches([...selectedBranches, b]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          isSelected 
                            ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-sm' 
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
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
                  {editingSubject ? 'Attach More Notes PDFs (Optional)' : 'Attach Notes PDFs (Optional)'}
                </label>
                <input 
                  id="subject-pdf-files"
                  type="file" 
                  accept="application/pdf"
                  multiple
                  onChange={handleFilesChange}
                  className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-zinc-300 hover:file:bg-zinc-200 cursor-pointer"
                />

                {selectedFiles.length > 0 && (
                  <div className="space-y-2 mt-2.5 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl max-h-60 overflow-y-auto">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Files to Upload ({selectedFiles.length})</span>
                    {selectedFiles.map((f, idx) => (
                      <div key={idx} className="space-y-1.5 p-2 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-lg">
                        <div className="flex justify-between items-center text-xs">
                          <span className="truncate max-w-[150px] font-semibold text-zinc-500">{f.file.name}</span>
                          <button 
                            type="button" 
                            onClick={() => removeSelectedFile(idx)} 
                            className="text-red-500 hover:text-red-655 font-bold"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={f.unit || ''}
                            onChange={(e) => {
                              const updated = [...selectedFiles];
                              updated[idx].unit = e.target.value;
                              if (e.target.value && e.target.value !== 'Other') {
                                const cleanTitle = f.title.replace(/^Unit \d+:?\s*/i, '');
                                updated[idx].title = `${e.target.value}${cleanTitle ? `: ${cleanTitle}` : ''}`;
                              }
                              setSelectedFiles(updated);
                            }}
                            className="h-8 text-xs border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-black"
                          >
                            <option value="">Select Unit</option>
                            <option value="Unit 1">Unit 1</option>
                            <option value="Unit 2">Unit 2</option>
                            <option value="Unit 3">Unit 3</option>
                            <option value="Unit 4">Unit 4</option>
                            <option value="Unit 5">Unit 5</option>
                            <option value="Unit 6">Unit 6</option>
                            <option value="Other">Other</option>
                          </select>
                          <div className="col-span-2">
                            <Input 
                              placeholder="PDF Title" 
                              value={f.title}
                              onChange={(e) => updateFileTitle(idx, e.target.value)}
                              className="h-8 text-xs border-zinc-200 dark:border-zinc-800 focus:ring-black focus:border-black"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                        <div className="flex flex-wrap gap-1">
                          {(sub.branch.startsWith(',') && sub.branch.endsWith(',') 
                            ? sub.branch.split(',').filter(Boolean)
                            : [sub.branch]
                          ).map(b => (
                            <span key={b} className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                              {b}
                            </span>
                          ))}
                        </div>
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
