import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Link } from 'react-router-dom';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const saved = localStorage.getItem('necleap_recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', debouncedTerm],
    queryFn: async () => {
      if (!debouncedTerm) return [];
      const res = await axios.get(`${API_URL}/pdfs`, {
        params: { search: debouncedTerm }
      });
      return res.data;
    },
    enabled: debouncedTerm.length > 0,
    staleTime: 0,
    gcTime: 0
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('necleap_recent_searches', JSON.stringify(updated));
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('necleap_recent_searches');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 py-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="flex flex-col gap-2">
          <Link to="/" className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:underline">← Back to Home</Link>
          <h1 className="text-4xl font-extrabold tracking-tight">Search Platform Resources</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Instantly look up titles, subjects, teachers, branches, or notes.</p>
        </header>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <Input 
            type="search"
            placeholder="Search by Title, Subject, Branch, or Teacher name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-base py-6 focus:ring-black dark:focus:ring-white"
          />
          <Button type="submit" className="bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-100 font-bold px-6">
            Search
          </Button>
        </form>

        {recentSearches.length > 0 && !searchTerm && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <span>Recent Searches</span>
              <button onClick={clearRecent} className="hover:underline">Clear all</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map(term => (
                <button
                  key={term}
                  onClick={() => setSearchTerm(term)}
                  className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {debouncedTerm && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              Search Results ({results.length})
            </h2>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(n => (
                  <div key={n} className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 rounded-2xl space-y-3 animate-pulse">
                    <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-6 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <p className="text-zinc-500">No results found matching "{debouncedTerm}"</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {results.map(pdf => (
                  <Card key={pdf.id} className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                          {pdf.branch} • Year {pdf.year}
                        </span>
                        <span className="text-xs text-zinc-400">{pdf.subject}</span>
                      </div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{pdf.pdf_title}</h3>
                      <p className="text-sm text-zinc-500 mt-1">Uploaded by: {pdf.teacher_name}</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <Link to={`/pdf/${pdf.slug}`} className="flex-1 md:flex-initial">
                        <Button size="sm" className="w-full bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100">
                          View
                        </Button>
                      </Link>
                      <a href={pdf.storage_url} download className="flex-1 md:flex-initial">
                        <Button size="sm" variant="secondary" className="w-full border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                          Download
                        </Button>
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
