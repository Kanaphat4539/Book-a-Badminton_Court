'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import MainLayout from '@/components/MainLayout';

export default function ManageUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

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
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
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

  if (!mounted) return null;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6 w-full px-4 md:px-margin-screen mt-4 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display-sm text-[28px] font-extrabold text-gray-900 dark:text-orange-50 drop-shadow-sm transition-colors duration-300">Manage Users</h1>
          <button
            className="bg-white/80 dark:bg-[#2a1300]/60 text-gray-900 dark:text-orange-50 border border-gray-200 dark:border-[#ff6b00]/20 hover:bg-gray-100 dark:hover:bg-[#3a1b00] px-4 py-2 rounded-xl font-button text-[14px] font-bold transition-all shadow-sm flex items-center gap-2"
            onClick={() => router.push('/dashboard')}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Dashboard
          </button>
        </div>

        <section className="bg-white/70 dark:bg-[#2a1300]/60 backdrop-blur-xl border border-white dark:border-[#ff6b00]/20 shadow-sm rounded-3xl p-6 md:p-8 transition-colors duration-300">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <span className="material-symbols-outlined animate-spin text-[32px] text-primary">autorenew</span>
            </div>
          ) : users.length === 0 ? (
            <p className="text-gray-500 dark:text-orange-200/70 text-center font-medium my-8">No regular users found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(u => (
                <div key={u.id} className="bg-white/80 dark:bg-[#1a0a00]/70 border border-gray-100 dark:border-[#ff6b00]/30 p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-headline-md text-[18px] font-bold text-gray-900 dark:text-orange-50">{u.name}</p>
                      <p className="text-gray-500 dark:text-orange-300/60 font-semibold text-[14px]">@{u.username}</p>
                    </div>
                    <span className="bg-gray-100 dark:bg-[#3a1b00] text-gray-600 dark:text-orange-200/80 px-2.5 py-1 rounded-full text-[12px] font-bold">
                      {u.role}
                    </span>
                  </div>
                  <button
                    className="mt-2 flex items-center justify-center gap-1.5 w-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 py-2 rounded-xl font-bold transition-colors text-[14px]"
                    onClick={() => handleDeleteUser(u.id, u.username)}
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Delete User
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
