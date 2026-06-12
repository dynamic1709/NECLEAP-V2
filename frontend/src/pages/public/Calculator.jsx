import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const DEFAULT_BRANCHES = ['CSE', 'AIML', 'AI', 'DS', 'CS', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
const YEARS = ['1', '2', '3', '4'];
const SEMESTERS = ['1', '2'];

// Fallback legacy subject lists if API is unseeded (to preserve old calculators)
const LEGACY_SUBJECTS = {
  'AIML-2-1': [
    { name: 'DMGT', credits: 3 },
    { name: 'UHV', credits: 3 },
    { name: 'ADSAA', credits: 3 },
    { name: 'JAVA', credits: 3 },
    { name: 'AI', credits: 3 },
    { name: 'ADSAA LAB', credits: 1.5 },
    { name: 'JAVA LAB', credits: 1.5 },
    { name: 'PYTHON LAB', credits: 1.5 }
  ],
  'CSE-3-1': [
    { name: 'DBMS', credits: 3 },
    { name: 'SE', credits: 3 },
    { name: 'CN', credits: 3 },
    { name: 'DAA', credits: 3 },
    { name: 'DBMS LAB', credits: 1.5 },
    { name: 'CN LAB', credits: 1.5 },
    { name: 'SOFT SKILLS LAB', credits: 1 }
  ]
};

export default function Calculator() {
  const [activeTab, setActiveTab] = useState('sgpa');
  
  // SGPA states
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [sgpaSubjects, setSgpaSubjects] = useState([]);
  const [sgpaResult, setSgpaResult] = useState(null);
  const [sgpaError, setSgpaError] = useState('');

  // Fetch branches dynamically from server
  const { data: branches = DEFAULT_BRANCHES } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/branches`);
      return res.data.map(b => (typeof b === 'string' ? b : b.name));
    }
  });

  // CGPA states
  const [cgpaSemesters, setCgpaSemesters] = useState([{ id: 1, name: 'Semester 1', sgpa: '' }]);
  const [cgpaResult, setCgpaResult] = useState(null);
  
  // Dynamic fetch subjects from API
  const { data: dbSubjects = [] } = useQuery({
    queryKey: ['calculator-subjects', branch, year, semester],
    queryFn: async () => {
      if (!branch || !year || !semester) return [];
      try {
        const res = await axios.get(`${API_URL}/subjects`, {
          params: { branch, year, semester }
        });
        return res.data;
      } catch (err) {
        console.warn('API error fetching calculator subjects. Using legacy mock fallback.');
        return [];
      }
    },
    enabled: !!(branch && year && semester)
  });

  // Load subjects when parameters change
  useEffect(() => {
    if (branch && year && semester) {
      const dbList = dbSubjects.map(s => ({ name: s.subject_name, credits: 3, grade: '' }));
      if (dbList.length > 0) {
        setSgpaSubjects(dbList);
      } else {
        const legacyKey = `${branch}-${year}-${semester}`;
        const legacyList = LEGACY_SUBJECTS[legacyKey] || [
          { name: 'Subject 1', credits: 3 },
          { name: 'Subject 2', credits: 3 },
          { name: 'Subject 3', credits: 3 },
          { name: 'Subject 4', credits: 3 }
        ];
        setSgpaSubjects(legacyList.map(s => ({ ...s, grade: '' })));
      }
      setSgpaResult(null);
      setSgpaError('');
    }
  }, [branch, year, semester, dbSubjects]);

  const handleSgpaChange = (index, field, value) => {
    const updated = [...sgpaSubjects];
    
    if (field === 'credits') {
      const val = parseFloat(value);
      if (val > 3) {
        alert('Credit cannot be more than 3.');
        return;
      }
      if (val < 0) {
        alert('Credit must be at least 0.');
        return;
      }
    }
    
    if (field === 'grade') {
      const val = parseFloat(value);
      if (value !== '' && (val < 5 || val > 10)) {
        alert('Grade point must be between 5 and 10. Grade below 5 is considered a FAIL.');
        return;
      }
    }

    updated[index][field] = value;
    setSgpaSubjects(updated);
  };

  const addCustomSgpaSubject = () => {
    setSgpaSubjects([...sgpaSubjects, { name: `Subject ${sgpaSubjects.length + 1}`, credits: 3, grade: '' }]);
  };

  const removeSgpaSubject = (index) => {
    setSgpaSubjects(sgpaSubjects.filter((_, i) => i !== index));
  };

  const calculateSGPA = () => {
    let totalCredits = 0;
    let totalPoints = 0;
    let hasFail = false;

    for (const sub of sgpaSubjects) {
      const credit = parseFloat(sub.credits);
      const grade = parseFloat(sub.grade);

      if (isNaN(credit) || isNaN(grade)) {
        continue;
      }

      if (grade < 5) {
        hasFail = true;
        continue;
      }

      totalCredits += credit;
      totalPoints += credit * grade;
    }

    if (totalCredits === 0) {
      setSgpaError('Please enter valid grade points and credits.');
      setSgpaResult(null);
    } else {
      setSgpaError('');
      const sgpa = totalPoints / totalCredits;
      setSgpaResult({
        value: sgpa.toFixed(2),
        hasFail
      });
    }
  };

  // CGPA calculations
  const addCgpaSemester = () => {
    const nextId = cgpaSemesters.length + 1;
    setCgpaSemesters([...cgpaSemesters, { id: nextId, name: `Semester ${nextId}`, sgpa: '' }]);
  };

  const handleCgpaChange = (id, value) => {
    setCgpaSemesters(cgpaSemesters.map(sem => sem.id === id ? { ...sem, sgpa: value } : sem));
  };

  const calculateCGPA = () => {
    let sum = 0;
    let count = 0;
    cgpaSemesters.forEach(sem => {
      const val = parseFloat(sem.sgpa);
      if (!isNaN(val)) {
        sum += val;
        count++;
      }
    });

    if (count === 0) {
      alert('Please enter at least one SGPA.');
      return;
    }

    setCgpaResult((sum / count).toFixed(2));
  };

  const cgpaChartData = cgpaSemesters
    .filter(sem => !isNaN(parseFloat(sem.sgpa)))
    .map(sem => ({
      name: sem.name,
      SGPA: parseFloat(sem.sgpa)
    }));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 py-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <header className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div>
            <Link to="/" className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:underline">← Back to Home</Link>
            <h1 className="text-4xl font-extrabold tracking-tight mt-2">Academic GPA Calculator</h1>
            <p className="text-zinc-500 mt-1">Free utility to calculate your JNTUK SGPA and CGPA results dynamically.</p>
          </div>
        </header>

        {/* Tab Buttons */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('sgpa')}
            className={`flex-1 py-3 text-center font-bold border-b-2 text-sm transition-all ${
              activeTab === 'sgpa' ? 'border-black dark:border-white text-zinc-900 dark:text-zinc-50' : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            SGPA Calculator
          </button>
          <button
            onClick={() => setActiveTab('cgpa')}
            className={`flex-1 py-3 text-center font-bold border-b-2 text-sm transition-all ${
              activeTab === 'cgpa' ? 'border-black dark:border-white text-zinc-900 dark:text-zinc-50' : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            CGPA Calculator
          </button>
        </div>

        {/* SGPA Section */}
        {activeTab === 'sgpa' && (
          <div className="space-y-6">
            
            {/* Filter selectors */}
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase">Branch</label>
                  <select 
                    value={branch} 
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full h-10 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm focus:outline-none"
                  >
                    <option value="">Select Branch</option>
                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase">Year</label>
                  <select 
                    value={year} 
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full h-10 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm focus:outline-none"
                  >
                    <option value="">Select Year</option>
                    {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase">Semester</label>
                  <select 
                    value={semester} 
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full h-10 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm focus:outline-none"
                  >
                    <option value="">Select Semester</option>
                    {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>
            </Card>

            {/* Subjects configuration */}
            {sgpaSubjects.length > 0 && (
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="font-bold text-lg">Subjects & Credits</h3>
                  <Button variant="secondary" size="sm" onClick={addCustomSgpaSubject}>+ Add Custom Subject</Button>
                </div>

                <div className="space-y-3">
                  {sgpaSubjects.map((sub, idx) => (
                    <div key={idx} className="flex gap-4 items-center flex-wrap sm:flex-nowrap">
                      <div className="flex-1 min-w-[150px]">
                        <Input 
                          value={sub.name} 
                          onChange={(e) => handleSgpaChange(idx, 'name', e.target.value)}
                          className="border-zinc-200 dark:border-zinc-800 text-sm font-semibold"
                        />
                      </div>
                      <div className="w-32">
                        <Input 
                          type="number" 
                          placeholder="Grade Point"
                          value={sub.grade}
                          onChange={(e) => handleSgpaChange(idx, 'grade', e.target.value)}
                          className="border-zinc-200 dark:border-zinc-800 text-sm"
                          step="1"
                        />
                      </div>
                      <div className="w-32 flex items-center gap-2">
                        <Input 
                          type="number" 
                          placeholder="Credits"
                          value={sub.credits}
                          onChange={(e) => handleSgpaChange(idx, 'credits', e.target.value)}
                          className="border-zinc-200 dark:border-zinc-800 text-sm"
                          step="0.5"
                        />
                      </div>
                      <button 
                        onClick={() => removeSgpaSubject(idx)} 
                        className="text-red-500 hover:text-red-600 text-sm font-bold px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex flex-col items-center gap-4">
                  <Button onClick={calculateSGPA} className="w-full bg-black text-white dark:bg-white dark:text-black font-semibold">
                    Calculate SGPA
                  </Button>
                  
                  {sgpaError && <p className="text-red-500 text-sm font-medium">{sgpaError}</p>}
                  
                  {sgpaResult && (
                    <div className="text-center p-6 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full animate-fade-in">
                      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Result</div>
                      <div className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">{sgpaResult.value}</div>
                      {sgpaResult.hasFail && (
                        <p className="text-xs text-orange-500 font-semibold mt-2">Note: Some subjects failed (Grade &lt; 5).</p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

          </div>
        )}

        {/* CGPA Section */}
        {activeTab === 'cgpa' && (
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Input cards */}
            <div className="md:col-span-1 space-y-4">
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">Semesters</h3>
                  <Button variant="secondary" size="sm" onClick={addCgpaSemester}>+ Add</Button>
                </div>
                <div className="space-y-3">
                  {cgpaSemesters.map(sem => (
                    <div key={sem.id} className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-400">{sem.name} SGPA</label>
                      <Input 
                        type="number"
                        placeholder="e.g. 8.4"
                        value={sem.sgpa}
                        onChange={(e) => handleCgpaChange(sem.id, e.target.value)}
                        className="border-zinc-200 dark:border-zinc-800"
                        step="0.01"
                      />
                    </div>
                  ))}
                </div>
                <Button onClick={calculateCGPA} className="w-full bg-black text-white dark:bg-white dark:text-black font-semibold">
                  Calculate CGPA
                </Button>
              </Card>
            </div>

            {/* Output metrics & Charts */}
            <div className="md:col-span-2 space-y-4">
              {cgpaResult && (
                <>
                  <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-center shadow-sm">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cumulative CGPA</div>
                    <div className="text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">{cgpaResult}</div>
                  </Card>

                  {cgpaChartData.length > 0 && (
                    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                      <h3 className="font-bold text-sm text-zinc-400 uppercase mb-4 tracking-wider">SGPA Trend Across Semesters</h3>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={cgpaChartData}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis domain={[4, 10]} stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="SGPA" stroke="#18181b" strokeWidth={2} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
