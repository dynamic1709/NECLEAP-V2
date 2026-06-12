import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import axios from 'axios';
import { API_URL, useAuth } from '../../context/AuthContext';

export default function ManageBranches() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const [branches, setBranches] = useState([]);
  const [branchName, setBranchName] = useState('');
  const [editingBranch, setEditingBranch] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadBranches = async () => {
    try {
      const res = await axios.get(`${API_URL}/branches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(res.data);
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  };

  useEffect(() => {
    if (token) {
      loadBranches();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!branchName.trim()) return;

    setLoading(true);
    setMessage('');

    try {
      if (editingBranch) {
        await axios.put(`${API_URL}/branches/${editingBranch.id}`, { name: branchName }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Branch updated successfully!');
        setEditingBranch(null);
      } else {
        await axios.post(`${API_URL}/branches`, { name: branchName }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Branch added successfully!');
      }
      setBranchName('');
      loadBranches();
    } catch (err) {
      console.error('Error saving branch:', err);
      setMessage(err.response?.data?.message || 'Error saving branch');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (branch) => {
    setEditingBranch(branch);
    setBranchName(branch.name);
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingBranch(null);
    setBranchName('');
    setMessage('');
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch? This will permanently delete all associated subjects and PDF files from storage.')) {
      return;
    }
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/branches/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Branch and cascading contents deleted successfully!');
      loadBranches();
    } catch (err) {
      console.error('Error deleting branch:', err);
      setMessage(err.response?.data?.message || 'Error deleting branch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      
      {/* Add / Edit Branch Form */}
      <div className="md:col-span-1">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm sticky top-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              {editingBranch ? 'Edit Branch' : 'Add Branch'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Branch Name</label>
                <Input 
                  placeholder="e.g. CSE or ECE" 
                  value={branchName} 
                  onChange={(e) => setBranchName(e.target.value)} 
                  required 
                />
              </div>

              {message && <p className="text-sm text-green-600 font-semibold">{message}</p>}
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800" disabled={loading}>
                  {loading ? 'Saving...' : editingBranch ? 'Update' : 'Add'}
                </Button>
                {editingBranch && (
                  <Button type="button" variant="secondary" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Branches List */}
      <div className="md:col-span-2">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Configured Academic Branches</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="p-4 text-zinc-900 dark:text-zinc-300">Branch Name</th>
                    <th className="p-4 text-right text-zinc-900 dark:text-zinc-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                  {branches.map(branch => (
                    <tr key={branch.id}>
                      <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 uppercase">
                          {branch.name}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Button variant="secondary" size="sm" onClick={() => startEdit(branch)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteBranch(branch.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                  {branches.length === 0 && (
                    <tr>
                      <td colSpan="2" className="p-8 text-center text-zinc-500">No branches configured.</td>
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
