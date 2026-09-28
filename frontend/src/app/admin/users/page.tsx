'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { isSessionExpiredError } from '@/lib/api';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';
import MainLayout from '@/components/MainLayout';

export default function ManageUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userStr);
    if (parsedUser.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      if (isSessionExpiredError(err)) return;
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users/admin', {
        username: adminUsername,
        name: adminName,
        password: adminPassword,
      });
      toast.success('Admin created successfully');
      setShowAddAdmin(false);
      setAdminUsername('');
      setAdminName('');
      setAdminPassword('');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user @${username}? This action cannot be undone.`)) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!mounted) return null;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6 w-full px-4 md:px-margin-screen mt-4 relative z-10">
        <div className="flex justify-between items-center bg-surface-container-low p-6 rounded-3xl shadow-sm transition-colors duration-300">
          <div>
            <h1 className="font-headline-lg text-[28px] font-bold text-on-surface transition-colors duration-300">Manage Users</h1>
            <p className="font-body-md text-[15px] text-on-surface-variant font-medium transition-colors duration-300">View and manage all registered users</p>
          </div>
          <div className="flex gap-2">
            <button
              className="bg-primary hover:opacity-90 text-on-primary px-5 py-2.5 rounded-xl font-button text-[15px] font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
              onClick={() => setShowAddAdmin(true)}
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add Admin
            </button>
            <button
              className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-5 py-2.5 rounded-xl font-button text-[15px] font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
              onClick={() => router.push('/dashboard')}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back
            </button>
          </div>
        </div>

        <section className="bg-surface-container-lowest border border-outline-variant/20 shadow-sm rounded-3xl p-6 md:p-8 transition-colors duration-300">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <span className="material-symbols-outlined animate-spin text-[32px] text-primary">autorenew</span>
            </div>
          ) : users.length === 0 ? (
            <p className="text-on-surface-variant text-center font-medium my-8">No regular users found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(u => (
                <div key={u.id || u.stu_id} className="bg-surface-container-low border border-surface-container-high p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-headline-md text-[18px] font-bold text-on-surface">{u.name || `${u.first_name} ${u.last_name}`}</p>
                      <p className="text-on-surface-variant font-semibold text-[14px]">@{u.username}</p>
                    </div>
                    <span className="bg-surface-container-high text-on-surface px-2.5 py-1 rounded-full text-[12px] font-bold">
                      {u.role || 'STUDENT'}
                    </span>
                  </div>
                  <button
                    className="mt-2 flex items-center justify-center gap-1.5 w-full bg-error-container text-on-error-container hover:bg-error hover:text-on-error py-2 rounded-xl font-bold transition-colors text-[14px]"
                    onClick={() => handleDeleteUser(u.id || u.stu_id, u.username)}
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-scrim/60 backdrop-blur-sm" onClick={() => setShowAddAdmin(false)}></div>
          <div className="relative bg-surface p-8 rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 border border-surface-container-high">
            <h2 className="text-2xl font-bold text-on-surface mb-6">Add New Admin</h2>
            <form onSubmit={handleAddAdmin} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="mt-1 w-full h-12 rounded-xl px-4 font-body-md text-[15px] bg-surface-container-lowest text-on-surface border border-outline-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="mt-1 w-full h-12 rounded-xl px-4 font-body-md text-[15px] bg-surface-container-lowest text-on-surface border border-outline-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="mt-1 w-full h-12 rounded-xl px-4 font-body-md text-[15px] bg-surface-container-lowest text-on-surface border border-outline-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAdmin(false)}
                  className="flex-1 h-12 rounded-xl font-bold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl font-bold bg-primary text-on-primary hover:opacity-90 transition-colors"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}