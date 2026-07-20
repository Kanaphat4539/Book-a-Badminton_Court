'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';

export default function ManageUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!mounted) return null;

  return (
    <div className="bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-[#2a1300] dark:via-[#140900] dark:to-[#2a1300] text-on-surface dark:text-orange-50 antialiased min-h-screen flex flex-col pt-24 pb-24 selection:bg-primary selection:text-white font-sans relative overflow-hidden transition-colors duration-300">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[0%] left-[-10%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 transition-colors duration-300"></div>
        <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-yellow-200/50 dark:bg-yellow-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 transition-colors duration-300"></div>
      </div>

      {/* TopAppBar */}
      <div className="fixed top-0 w-full z-50 shadow-sm">
        <header className="bg-[#F26522] dark:bg-[#C24500] flex justify-between items-center px-container-padding h-16 text-white shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push('/dashboard')}>

            <span className="font-display-sm text-[22px] md:text-[24px] font-bold tracking-tight text-white">KMITL BADMINTON</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="lg:hidden w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/10 transition-all active:scale-95 text-white" onClick={() => setIsSidebarOpen(true)}>
              <span className="material-symbols-outlined text-[28px]">menu</span>
            </button>
          </div>
        </header>
        <div className="bg-[#545454] dark:bg-[#1a0a00] h-8 flex items-center px-container-padding text-white font-body-md text-[12px] md:text-[14px] transition-colors duration-300">
          สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6 w-full px-container-padding mt-4 relative z-10">
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

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative w-[280px] bg-white dark:bg-[#140900] h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <span className="font-display-sm text-[20px] font-bold dark:text-orange-50 text-gray-900">Admin Menu</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white">
                <span className="material-symbols-outlined text-[28px]">close</span>
              </button>
            </div>
            <nav className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <button onClick={() => { setIsSidebarOpen(false); router.push('/dashboard'); }} className="text-left font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-primary transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">Home</button>
                <button onClick={() => { setIsSidebarOpen(false); router.push('/admin/users'); }} className="text-left font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-primary transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">Manage Users <span className="w-2 h-2 rounded-full bg-green-500 inline-block ml-1"></span></button>
                <button onClick={() => { setIsSidebarOpen(false); router.push('/scan'); }} className="text-left font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-primary transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">Scan QR</button>
                <button onClick={() => { setIsSidebarOpen(false); router.push('/news'); }} className="text-left font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-primary transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">News</button>
              </div>
              
              <div>
                <h3 className="font-bold text-[18px] text-gray-900 dark:text-orange-50 mb-3">Settings</h3>
                <div className="flex flex-col gap-3 pl-4 border-l-2 border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between text-[15px] text-gray-600 dark:text-gray-400 hover:text-primary">
                    <span>Dark Mode</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6">
                 <button onClick={handleLogout} className="w-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors">
                   <span className="material-symbols-outlined">logout</span>
                   Logout
                 </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
