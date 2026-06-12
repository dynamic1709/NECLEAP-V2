import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors">
      
      {/* Top Navbar */}
      <header className="w-full py-4 px-6 md:px-12 flex justify-between items-center bg-zinc-100/80 dark:bg-zinc-900/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/85 sticky top-0 z-50 transition-colors">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-bold shadow-md">N</div>
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            NEC LEAP
          </span>
        </Link>
        <nav className="flex gap-4 items-center">
          <Link to="/" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:underline">
            Back to Home
          </Link>
          <Link to="/calculator" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:underline">
            GPA Calculator
          </Link>
          <Link to="/explorer" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:underline">
            Browse PDFs
          </Link>
          <Link to="/search" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:underline">
            Search
          </Link>
        </nav>
      </header>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-zinc-900 dark:text-zinc-50 font-bold">Admin Login</CardTitle>
            <p className="text-sm text-center text-zinc-400 dark:text-zinc-500">
              Sign in to manage course materials and academic subjects.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-zinc-700 dark:text-zinc-300">Email</label>
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-zinc-200 dark:border-zinc-800 focus:ring-black dark:focus:ring-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-zinc-700 dark:text-zinc-300">Password</label>
                <Input 
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-zinc-200 dark:border-zinc-800 focus:ring-black dark:focus:ring-white"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
              <Button type="submit" className="w-full bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-semibold transition-all cursor-pointer" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
