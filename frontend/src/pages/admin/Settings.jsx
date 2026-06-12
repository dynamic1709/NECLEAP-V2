import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { FaSun, FaMoon, FaCheckCircle } from 'react-icons/fa';

export default function Settings() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('necleap-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const selectTheme = (selected) => {
    setTheme(selected);
    if (selected === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('necleap-theme', selected);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          Manage system configurations, design templates, and global application options.
        </p>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          <CardTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            🎨 Appearance
          </CardTitle>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Customize the look and feel of your admin dashboard and navigation portals.
          </p>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">

            {/* Light Mode Card */}
            <div
              onClick={() => selectTheme('light')}
              className={`group relative rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${theme === 'light'
                  ? 'gradient-border glow-shadow p-[2px]'
                  : 'border border-zinc-200 dark:border-zinc-800 p-0.5 hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}
            >
              <div className="rounded-[14px] bg-white dark:bg-zinc-900 p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-bold">
                    <FaSun className="w-5 h-5 text-amber-500" />
                    <span>Light Mode</span>
                  </div>
                  {theme === 'light' && (
                    <FaCheckCircle className="w-5 h-5 text-blue-600 animate-scale-pop" />
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Clean and bright appearance, optimized for high visibility during daytime.
                </p>

                {/* Visual Preview Dashboard */}
                <div className="border border-zinc-100 rounded-lg p-3 bg-[#F8FAFC] space-y-2 select-none shadow-sm pointer-events-none">
                  {/* Top Header Mockup */}
                  <div className="flex justify-between items-center bg-white border border-zinc-100 p-1.5 rounded-md">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-zinc-900 rounded-full"></div>
                      <div className="w-8 h-2 bg-zinc-200 rounded"></div>
                    </div>
                    <div className="w-4 h-2 bg-zinc-100 rounded"></div>
                  </div>
                  {/* Dashboard Cards Mockup */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded-md border border-zinc-100 space-y-1.5">
                      <div className="w-6 h-1.5 bg-zinc-200 rounded"></div>
                      <div className="w-10 h-3 bg-[#2563EB] rounded"></div>
                    </div>
                    <div className="bg-white p-2 rounded-md border border-zinc-100 space-y-1.5">
                      <div className="w-6 h-1.5 bg-zinc-200 rounded"></div>
                      <div className="w-10 h-3 bg-zinc-300 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Mode Card */}
            <div
              onClick={() => selectTheme('dark')}
              className={`group relative rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${theme === 'dark'
                  ? 'gradient-border glow-shadow p-[2px]'
                  : 'border border-zinc-200 dark:border-zinc-800 p-0.5 hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}
            >
              <div className="rounded-[14px] bg-white dark:bg-zinc-900 p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-bold">
                    <FaMoon className="w-5 h-5 text-cyan-400" />
                    <span>Dark Mode</span>
                  </div>
                  {theme === 'dark' && (
                    <FaCheckCircle className="w-5 h-5 text-cyan-400 animate-scale-pop" />
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Elegant dark layout, perfect for reduced eye strain and code editing focus.
                </p>

                {/* Visual Preview Dashboard */}
                <div className="border border-zinc-800 rounded-lg p-3 bg-[#0B1120] space-y-2 select-none shadow-sm pointer-events-none">
                  {/* Top Header Mockup */}
                  <div className="flex justify-between items-center bg-[#111827] border border-zinc-800 p-1.5 rounded-md">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                      <div className="w-8 h-2 bg-zinc-700 rounded"></div>
                    </div>
                    <div className="w-4 h-2 bg-zinc-800 rounded"></div>
                  </div>
                  {/* Dashboard Cards Mockup */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#111827] p-2 rounded-md border border-zinc-800 space-y-1.5">
                      <div className="w-6 h-1.5 bg-zinc-700 rounded"></div>
                      <div className="w-10 h-3 bg-[#3B82F6] rounded"></div>
                    </div>
                    <div className="bg-[#111827] p-2 rounded-md border border-zinc-800 space-y-1.5">
                      <div className="w-6 h-1.5 bg-zinc-700 rounded"></div>
                      <div className="w-10 h-3 bg-zinc-600 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
