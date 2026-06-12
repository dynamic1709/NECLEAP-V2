import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IoMenu, IoClose, IoChatbubbleEllipsesOutline, IoDocumentTextOutline, IoStatsChartOutline, IoSearchOutline, IoCalculatorOutline, IoLogInOutline } from 'react-icons/io5';
import FeedbackModal from '../ui/FeedbackModal';

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: 'Browse PDFs', path: '/explorer', icon: IoDocumentTextOutline },
    { name: 'Search', path: '/search', icon: IoSearchOutline },
    { name: 'GPA Calculator', path: '/calculator', icon: IoCalculatorOutline },
    { name: 'Results', path: '/results', icon: IoStatsChartOutline },
  ];

  return (
    <>
      <header className="w-full py-4 px-6 md:px-12 flex justify-between items-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50 sticky top-0 z-50 transition-colors duration-300">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-bold shadow-md transition-transform group-hover:scale-105">
            N
          </div>
          <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            NEC LEAP
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-semibold hover:text-black dark:hover:text-white transition-colors duration-200 ${
                isActive(link.path)
                  ? 'text-black dark:text-white border-b-2 border-black dark:border-white pb-1 mt-0.5'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <button
            onClick={() => setFeedbackOpen(true)}
            className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer transition-colors duration-200"
          >
            Give Feedback
          </button>
          <span className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800" />
          <Link
            to="/admin/login"
            className="px-4 py-2 rounded-lg text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 transition-all hover:scale-102"
          >
            Admin Login
          </Link>
        </nav>

        {/* Mobile Menu Buttons */}
        <div className="flex items-center gap-4 md:hidden">
          <button
            onClick={() => setFeedbackOpen(true)}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title="Give Feedback"
          >
            <IoChatbubbleEllipsesOutline size={22} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[69px] z-40 md:hidden bg-white dark:bg-zinc-950 animate-fade-in flex flex-col p-6 space-y-6 overflow-y-auto border-t border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 py-3 px-4 rounded-xl text-base font-bold transition-all ${
                    isActive(link.path)
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <Icon size={20} />
                  {link.name}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setFeedbackOpen(true);
              }}
              className="flex items-center gap-3 py-3 px-4 rounded-xl text-base font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-left bg-transparent border-none cursor-pointer w-full transition-all"
            >
              <IoChatbubbleEllipsesOutline size={20} />
              Give Feedback
            </button>
          </div>

          <div className="border-t border-zinc-150 dark:border-zinc-850 pt-6">
            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all text-center"
            >
              <IoLogInOutline size={20} />
              Admin Login
            </Link>
          </div>
        </div>
      )}

      {/* Global Feedback Modal */}
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}
