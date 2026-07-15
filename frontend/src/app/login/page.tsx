'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Login successful!');
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-50 via-white to-orange-100 text-on-surface font-sans relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>

      <main className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Logo Section */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-28 h-28 mb-4 rounded-full overflow-hidden bg-white flex items-center justify-center shadow-xl border-4 border-white">
            <img 
              alt="KMITL Badminton Logo" 
              className="w-full h-full object-cover" 
              src="/kmitl-logo.png" 
            />
          </div>
          <h1 className="font-display-lg text-[32px] font-extrabold text-gray-900 tracking-tight text-center uppercase drop-shadow-sm">KMITL <span className="text-primary">BADMINTON</span></h1>
          <p className="font-body-md text-[15px] text-gray-600 text-center mt-1 font-medium tracking-wide uppercase">Premium Court Booking</p>
        </div>

        {/* Login Card */}
        <div className="w-full bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/60 p-8 transition-all hover:shadow-[0_8px_40px_rgba(255,107,0,0.08)]">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Username Input */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-[13px] font-bold text-gray-700 uppercase tracking-wider" htmlFor="username">Username / Email</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors text-[20px]" style={{fontVariationSettings: "'FILL' 0"}}>person</span>
                <input 
                  className="w-full h-14 rounded-xl pl-12 pr-4 font-body-md text-[15px] text-gray-900 bg-white/80 border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" 
                  id="username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="athlete@example.com or admin" 
                  required 
                  type="text"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-[13px] font-bold text-gray-700 uppercase tracking-wider" htmlFor="password">Password</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors text-[20px]" style={{fontVariationSettings: "'FILL' 0"}}>lock</span>
                <input 
                  className="w-full h-14 rounded-xl pl-12 pr-4 font-body-md text-[15px] text-gray-900 bg-white/80 border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required 
                  type="password"
                />
              </div>
              <div className="flex justify-end mt-1">
                <a className="font-label-md text-[13px] font-semibold text-primary hover:text-primary/80 transition-colors" href="#">Forgot Password?</a>
              </div>
            </div>

            {/* Login Button */}
            <button 
              className="w-full h-14 rounded-xl font-button text-[16px] font-bold text-white bg-primary hover:bg-[#E55B13] active:scale-[0.98] transition-all flex items-center justify-center mt-4 disabled:opacity-50 shadow-[0_4px_14px_rgba(255,107,0,0.4)] hover:shadow-[0_6px_20px_rgba(255,107,0,0.6)]" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
              {!loading && <span className="material-symbols-outlined ml-2 text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>arrow_forward</span>}
            </button>
          </form>

          {/* Quick Login for Demo */}
          <div className="mt-5 flex justify-center gap-6 text-sm">
            <button 
              onClick={() => { setUsername('admin'); setPassword('password'); }}
              className="text-gray-500 font-medium hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              Admin
            </button>
            <button 
              onClick={() => { setUsername('user'); setPassword('password'); }}
              className="text-gray-500 font-medium hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">person</span>
              User
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-8 pt-6 border-t border-gray-200/60 text-center">
            <p className="font-body-md text-[15px] text-gray-600">
              Don't have an account? 
              <a className="font-button text-[16px] font-bold text-primary hover:text-primary/80 transition-colors ml-2" href="/register">Sign Up</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
