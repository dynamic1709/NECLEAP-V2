import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth, API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import axios from 'axios';

const DEFAULT_BRANCHES = ['CSE', 'AIML', 'AI', 'DS', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
const YEARS = ['1', '2', '3', '4'];
const SEMESTERS = ['1', '2'];

export default function UploadPdf() {
  const { token, user } = useAuth();
  
  const [file, setFile] = useState(null);
  const [teacherName, setTeacherName] = useState(user?.name || '');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [unit, setUnit] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [dragActive, setDragActive] = useState(false);

  // Fetch branches dynamically from server
  const { data: branches = DEFAULT_BRANCHES } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/branches`);
      return res.data.map(b => (typeof b === 'string' ? b : b.name));
    }
  });

  // Fetch subjects dynamically based on selected branch, year, semester
  const { data: subjectsList = [] } = useQuery({
    queryKey: ['subjectsList', branch, year, semester],
    queryFn: async () => {
      if (!branch || !year || !semester) return [];
      const res = await axios.get(`${API_URL}/subjects`, {
        params: { branch, year, semester }
      });
      return res.data;
    },
    enabled: !!(branch && year && semester)
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        setMessage({ type: 'error', text: 'Only PDF files are allowed' });
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: 'error', text: 'Please upload a PDF file' });
      return;
    }

    setLoading(true);
    setProgress(0);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('pdfFile', file);
    formData.append('teacher_name', teacherName);
    formData.append('branch', branch);
    formData.append('year', year);
    formData.append('semester', semester);
    formData.append('subject', subject);
    formData.append('pdf_title', title);
    formData.append('description', description);

    // Simulate progress bar smoothly
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 150);

    try {
      await axios.post(`${API_URL}/pdfs/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      clearInterval(interval);
      setProgress(100);
      setMessage({ type: 'success', text: 'PDF uploaded successfully!' });
      
      // Reset form
      setFile(null);
      setUnit('');
      setTitle('');
      setDescription('');
      setSubject('');
    } catch (err) {
      clearInterval(interval);
      setProgress(0);
      
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Server error during upload';
      setMessage({ 
        type: 'error', 
        text: `Upload failed: ${errMsg}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Upload Study Material</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          Upload PDF notes directly. They will be organized by Branch, Year, Semester, and Subject automatically.
        </p>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Drag & Drop File Input */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive 
                  ? 'border-black dark:border-white bg-zinc-50 dark:bg-zinc-800/55' 
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
              }`}
            >
              <input 
                type="file" 
                id="file-upload" 
                accept="application/pdf"
                className="hidden" 
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
                <div className="text-4xl">📄</div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {file ? file.name : "Drag and drop your PDF here, or click to browse"}
                </div>
                <div className="text-xs text-zinc-400">PDF documents only (Max size 10MB)</div>
              </label>
            </div>

            {/* Progress Bar */}
            {progress > 0 && (
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-black dark:bg-white h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}

            {/* Inputs Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Teacher Name</label>
                <Input 
                  value={teacherName} 
                  onChange={(e) => setTeacherName(e.target.value)} 
                  required
                />
              </div>

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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Subject</label>
              <select 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-10 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-black text-zinc-800 dark:text-zinc-200"
                required
                disabled={!branch || !year || !semester}
              >
                <option value="">
                  {!branch || !year || !semester 
                    ? "Select Branch, Year, and Semester first" 
                    : "Select Subject"}
                </option>
                {Array.from(new Set(subjectsList.map(s => s.subject_name))).map(subName => (
                  <option key={subName} value={subName}>
                    {subName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Unit / Section</label>
                <select 
                  value={unit} 
                  onChange={(e) => {
                    setUnit(e.target.value);
                    if (e.target.value && e.target.value !== 'Other') {
                      const cleanTitle = title.replace(/^Unit \d+:?\s*/i, '');
                      setTitle(`${e.target.value}${cleanTitle ? `: ${cleanTitle}` : ''}`);
                    }
                  }}
                  className="w-full h-10 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  required
                >
                  <option value="">Select Unit</option>
                  <option value="Unit 1">Unit 1</option>
                  <option value="Unit 2">Unit 2</option>
                  <option value="Unit 3">Unit 3</option>
                  <option value="Unit 4">Unit 4</option>
                  <option value="Unit 5">Unit 5</option>
                  <option value="Unit 6">Unit 6</option>
                  <option value="Other">Other / Full Notes</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">PDF Title</label>
                <Input 
                  placeholder="e.g. DBMS Introduction" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Description (Optional)</label>
              <textarea 
                className="w-full min-h-[80px] p-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Short summary of this PDF notes content..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {message.text && (
              <div className={`p-4 rounded-xl text-sm ${
                message.type === 'success' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50' : 'bg-red-50 text-red-500 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full bg-black text-white dark:bg-white dark:text-black font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Notes'}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
