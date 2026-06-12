import React from 'react';
import { Outlet, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 transition-colors">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 hidden md:flex flex-col">
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-bold mr-2 text-sm shadow-md">N</div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">NECLEAP Admin</h2>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          <Link to="/admin/dashboard" className="block px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Dashboard</Link>
          <Link to="/admin/upload" className="block px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Upload PDF</Link>
          <Link to="/admin/manage" className="block px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Manage PDFs</Link>
          {user.role === 'super_admin' && (
            <>
              <Link to="/admin/teachers" className="block px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Teachers</Link>
              <Link to="/admin/branches" className="block px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Branches</Link>
            </>
          )}
          <Link to="/admin/subjects" className="block px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Subjects</Link>
          <Link to="/admin/settings" className="block px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Settings</Link>
        </nav>
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-black font-bold mr-3">{user.name?.[0] || 'U'}</div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{user.name}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{user.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full text-sm border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={handleLogout}>Log out</Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-bold text-xs shadow-md">N</div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Admin</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-zinc-600 dark:text-zinc-400" onClick={handleLogout}>Logout</Button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 text-zinc-900 dark:text-zinc-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
