import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import axios from 'axios';
import { API_URL, useAuth } from '../../context/AuthContext';

export default function ManageTeachers() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const [teachers, setTeachers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dept, setDept] = useState('');
  const [desig, setDesig] = useState('');
  const [role, setRole] = useState('teacher_admin');
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadTeachers = async () => {
    try {
      const res = await axios.get(`${API_URL}/teachers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(res.data);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    }
  };

  useEffect(() => {
    if (token) {
      loadTeachers();
    }
  }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const payload = { name, email, department: dept, designation: desig, role, password };

    try {
      await axios.post(`${API_URL}/teachers`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadTeachers();
      setName('');
      setEmail('');
      setPassword('');
      setDept('');
      setDesig('');
      setMessage('Teacher account created successfully!');
    } catch (err) {
      console.error('Error creating teacher:', err);
      setMessage(err.response?.data?.message || 'Error creating teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently remove this teacher/admin account? This action cannot be undone.')) {
      return;
    }
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/teachers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Account removed successfully!');
      loadTeachers();
    } catch (err) {
      console.error('Error deleting teacher:', err);
      setMessage(err.response?.data?.message || 'Error removing teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      
      {/* Create Teacher Account Form */}
      <div className="md:col-span-1">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm sticky top-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Add New Teacher / Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Full Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Email Address</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Login Password</label>
                <Input 
                  type="password" 
                  placeholder="Min 6 characters" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Department</label>
                <Input placeholder="e.g. CSE" value={dept} onChange={(e) => setDept(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Designation</label>
                <Input placeholder="e.g. Assistant Professor" value={desig} onChange={(e) => setDesig(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-10 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  required
                >
                  <option value="teacher_admin">Teacher Admin (Cannot add other admins)</option>
                  <option value="super_admin">Super Admin (Full Access)</option>
                </select>
              </div>
              {message && <p className="text-sm text-green-600 font-semibold">{message}</p>}
              <Button type="submit" className="w-full bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800" disabled={loading}>
                {loading ? 'Adding...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Teachers List Table */}
      <div className="md:col-span-2">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Active Teacher/Admin Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="p-4 text-zinc-900 dark:text-zinc-300">Name</th>
                    <th className="p-4 text-zinc-900 dark:text-zinc-300">Email</th>
                    <th className="p-4 text-zinc-900 dark:text-zinc-300">Dept / Role</th>
                    <th className="p-4 text-right text-zinc-900 dark:text-zinc-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                  {teachers.map(teacher => (
                    <tr key={teacher.id}>
                      <td className="p-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{teacher.name}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{teacher.designation}</div>
                      </td>
                      <td className="p-4 text-zinc-600 dark:text-zinc-300">{teacher.email}</td>
                      <td className="p-4">
                        <div className="flex gap-1.5 flex-wrap">
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                            {teacher.department || 'General'}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 capitalize">
                            {teacher.role?.replace('_', ' ') || 'teacher admin'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => handleDelete(teacher.id)}
                          disabled={user?.id === teacher.id} // Cannot delete oneself
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {teachers.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-zinc-500">No teacher accounts configured.</td>
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
