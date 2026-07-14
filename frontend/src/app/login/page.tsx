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
    <div className="min-h-screen flex flex-col items-center justify-center p-container-padding bg-background text-on-surface font-sans">
      <main className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Logo Section */}
        <div className="mb-xl flex flex-col items-center">
          <div className="w-32 h-32 mb-sm rounded-full overflow-hidden bg-surface-container flex items-center justify-center shadow-[0px_8px_24px_rgba(0,0,0,0.5)] border border-[#2A2A2A]">
            <img 
              alt="Apex Badminton Logo" 
              className="w-full h-full object-cover" 
              src="/logo.jpg" 
              onError={(e) => {
                // Fallback if logo.jpg doesn't exist yet
                (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/aida-public/AB6AXuA9ufthUuxh5dWIL4bluPC_-EgGRKNDVZo_9zS-_3AX985RaArbVg6VZMOcfSjMTJt6s7yiLK0t07ZHyOwYmpcVpbt0I1G8nM3aNkXMsv_pm8SWQq-inB4F3ICF5Gg3nI-5k6_gdZiccWTAalrDuP2h-yBwN83Yxqs8PdB8nCH49-gR6e_g5NaDZfS2DavqyNfskg6Id8enrw3M608HilHt2Tm0RKYSy0FC9alKOa0Crgdlx0YpTsUlrQ";
              }}
            />
          </div>
          <h1 className="font-display-lg text-[32px] font-bold text-primary tracking-tight text-center uppercase">APEX BADMINTON</h1>
          <p className="font-body-md text-[14px] text-on-surface-variant text-center mt-xs">Premium Court Booking</p>
        </div>

        {/* Login Card */}
        <div className="w-full bg-[#1E1E1E] rounded-xl p-lg shadow-[0px_8px_24px_rgba(0,0,0,0.5)] border border-[#2A2A2A] p-6">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Username Input */}
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="username">Username / Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" style={{fontVariationSettings: "'FILL' 0"}}>person</span>
                <input 
                  className="input-field w-full h-12 rounded-lg pl-10 pr-3 font-body-md text-[14px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
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
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="password">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" style={{fontVariationSettings: "'FILL' 0"}}>lock</span>
                <input 
                  className="input-field w-full h-12 rounded-lg pl-10 pr-3 font-body-md text-[14px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required 
                  type="password"
                />
              </div>
              <div className="flex justify-end mt-1">
                <a className="font-label-md text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors" href="#">Forgot Password?</a>
              </div>
            </div>

            {/* Login Button */}
            <button 
              className="btn-primary w-full h-12 rounded-lg font-button text-[16px] font-semibold flex items-center justify-center mt-2 disabled:opacity-50" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
              {!loading && <span className="material-symbols-outlined ml-2 text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>arrow_forward</span>}
            </button>
          </form>

          {/* Quick Login for Demo */}
          <div className="mt-4 flex justify-center gap-4 text-xs">
            <button 
              onClick={() => { setUsername('admin'); setPassword('password'); }}
              className="text-on-surface-variant hover:text-primary transition-colors"
            >
              [Fill Admin]
            </button>
            <button 
              onClick={() => { setUsername('user'); setPassword('password'); }}
              className="text-on-surface-variant hover:text-primary transition-colors"
            >
              [Fill User]
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 pt-4 border-t border-[#2A2A2A] text-center">
            <p className="font-body-md text-[14px] text-on-surface-variant">
              Don't have an account? 
              <a className="font-button text-[16px] font-semibold text-primary hover:text-primary/80 transition-colors ml-2" href="/register">Sign Up</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
