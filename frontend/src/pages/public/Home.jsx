import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      <header className="w-full py-4 px-6 md:px-12 flex justify-between items-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-bold shadow-md">N</div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            NEC LEAP
          </h1>
        </div>
        <nav className="flex gap-4 items-center">
          <Link to="/calculator" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:underline">
            GPA Calculator
          </Link>
          <Link to="/admin/login" className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors">
            Admin Login
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative z-10 max-w-4xl mx-auto">
        <h2 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-zinc-50 dark:via-zinc-300 dark:to-zinc-500">NEC LEAP</span>
        </h2>
        <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          The ultimate dynamic platform to access and organize course files, PDFs, and academic resources seamlessly.
        </p>
        
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/explorer" className="px-8 py-4 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all transform hover:-translate-y-0.5">
            Browse PDFs
          </Link>
          <Link to="/search" className="px-8 py-4 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold shadow-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all transform hover:-translate-y-0.5">
            Search Subjects
          </Link>
          <Link to="/calculator" className="px-8 py-4 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold shadow-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all transform hover:-translate-y-0.5">
            GPA Calculator
          </Link>
        </div>
      </main>

      {/* Decorative subtle background highlights */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-zinc-300/10 dark:bg-zinc-700/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-zinc-300/10 dark:bg-zinc-700/5 rounded-full blur-3xl -z-10"></div>
    </div>
  );
}
