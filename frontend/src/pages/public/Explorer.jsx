import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { API_URL } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const DEFAULT_BRANCHES = ['CSE', 'AIML', 'AI', 'DS', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
const YEARS = ['1', '2', '3', '4'];
const SEMESTERS = ['1', '2'];

export default function Explorer() {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);

  // Fetch branches dynamically from server
  const { data: branches = DEFAULT_BRANCHES } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/branches`);
      return res.data.map(b => (typeof b === 'string' ? b : b.name));
    }
  });

  useEffect(() => {
    const saved = localStorage.getItem('necleap_bookmarks');
    if (saved) setBookmarks(JSON.parse(saved));
  }, []);

  const toggleBookmark = (pdf) => {
    let updated;
    if (bookmarks.some(b => b.id === pdf.id)) {
      updated = bookmarks.filter(b => b.id !== pdf.id);
    } else {
      updated = [...bookmarks, pdf];
    }
    setBookmarks(updated);
    localStorage.setItem('necleap_bookmarks', JSON.stringify(updated));
  };

  // Fetch subjects from server
  const { data: subjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects', selectedBranch, selectedYear, selectedSemester],
    queryFn: async () => {
      if (!selectedBranch || !selectedYear || !selectedSemester) return [];
      const res = await axios.get(`${API_URL}/subjects`, {
        params: { branch: selectedBranch, year: selectedYear, semester: selectedSemester }
      });
      return res.data;
    },
    enabled: !!(selectedBranch && selectedYear && selectedSemester)
  });

  // Fetch PDFs from server
  const { data: pdfs = [], isLoading: loadingPdfs } = useQuery({
    queryKey: ['pdfs', selectedBranch, selectedYear, selectedSemester, selectedSubject],
    queryFn: async () => {
      if (!selectedBranch || !selectedYear || !selectedSemester || !selectedSubject) return [];
      const res = await axios.get(`${API_URL}/pdfs`, {
        params: {
          branch: selectedBranch,
          year: selectedYear,
          semester: selectedSemester,
          subject: selectedSubject,
          status: 'Approved'
        }
      });
      return res.data;
    },
    enabled: !!(selectedBranch && selectedYear && selectedSemester && selectedSubject)
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation / Header */}
        <header className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div>
            <Link to="/" className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:underline">← Back to Home</Link>
            <h1 className="text-4xl font-extrabold tracking-tight mt-2">PDF Explorer</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/search">
              <Button variant="secondary" size="sm" className="border-zinc-300 dark:border-zinc-700">Search PDFs</Button>
            </Link>
          </div>
        </header>

        {/* 1. Branch selection */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-zinc-400">1. Select Branch</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {branches.map(branch => (
              <button
                key={branch}
                onClick={() => {
                  setSelectedBranch(branch);
                  setSelectedYear(null);
                  setSelectedSemester(null);
                  setSelectedSubject(null);
                }}
                className={`py-3 px-2 rounded-xl border font-bold text-center transition-all ${
                  selectedBranch === branch 
                    ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' 
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {branch}
              </button>
            ))}
          </div>
        </section>

        {/* 2. Year & Semester selection */}
        {selectedBranch && (
          <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
            {/* Year Selection */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold tracking-wider uppercase text-zinc-400">2. Select Year</h2>
              <div className="flex gap-2">
                {YEARS.map(year => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      setSelectedSemester(null);
                      setSelectedSubject(null);
                    }}
                    className={`flex-1 py-3 rounded-xl border font-bold text-center transition-all ${
                      selectedYear === year 
                        ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' 
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Year {year}
                  </button>
                ))}
              </div>
            </section>

            {/* Semester Selection */}
            {selectedYear && (
              <section className="space-y-3 animate-fade-in">
                <h2 className="text-sm font-semibold tracking-wider uppercase text-zinc-400">3. Select Semester</h2>
                <div className="flex gap-2">
                  {SEMESTERS.map(sem => (
                    <button
                      key={sem}
                      onClick={() => {
                        setSelectedSemester(sem);
                        setSelectedSubject(null);
                      }}
                      className={`flex-1 py-3 rounded-xl border font-bold text-center transition-all ${
                        selectedSemester === sem 
                          ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' 
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      Semester {sem}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* 3. Subjects list */}
        {selectedBranch && selectedYear && selectedSemester && (
          <section className="space-y-3 animate-fade-in">
            <h2 className="text-sm font-semibold tracking-wider uppercase text-zinc-400">4. Select Subject</h2>
            {loadingSubjects ? (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-10 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : subjects.length === 0 ? (
              <p className="text-zinc-500 text-sm">No subjects found for this selection.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subjects.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubject(sub.subject_name)}
                    className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                      selectedSubject === sub.subject_name 
                        ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-md' 
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {sub.subject_name}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 4. PDFs List */}
        {selectedSubject && (
          <section className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-bold border-b border-zinc-200 dark:border-zinc-800 pb-2">Available PDFs</h2>
            {loadingPdfs ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(n => (
                  <div key={n} className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl p-6 space-y-4 animate-pulse">
                    <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-3 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                    <div className="flex justify-between mt-4">
                      <div className="h-3 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-3 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <div className="h-9 flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                      <div className="h-9 flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pdfs.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-500">No approved PDFs available for this subject yet.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pdfs.map(pdf => (
                  <Card key={pdf.id} className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-lg transition-all flex flex-col justify-between">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                          {pdf.subject}
                        </span>
                        <button 
                          onClick={() => toggleBookmark(pdf)} 
                          className="text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          {bookmarks.some(b => b.id === pdf.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                      <CardTitle className="text-lg font-bold mt-2 text-zinc-900 dark:text-zinc-50">
                        {pdf.pdf_title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {pdf.description || 'No description provided.'}
                      </p>
                      <div className="flex justify-between items-center text-xs text-zinc-400">
                        <span>By {pdf.teacher_name}</span>
                        <span>Downloads: {pdf.downloads}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Link to={`/pdf/${pdf.slug}`} className="flex-1">
                          <Button size="sm" className="w-full bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 text-xs font-semibold">
                            View PDF
                          </Button>
                        </Link>
                        <a href={pdf.storage_url} download className="flex-1">
                          <Button size="sm" variant="secondary" className="w-full text-xs font-semibold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                            Download
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
