'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { username, password, name });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Registration successful!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-on-surface font-sans">
      <main className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Logo Section */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-32 h-32 mb-2 rounded-full overflow-hidden bg-surface-container flex items-center justify-center shadow-[0px_8px_24px_rgba(0,0,0,0.5)] border border-[#2A2A2A]">
            <img 
              alt="KMITL Badminton Logo" 
              className="w-full h-full object-cover" 
              src="/kmitl-logo.png" 
            />
          </div>
          <h1 className="font-display-lg text-[32px] font-bold text-primary tracking-tight text-center uppercase">KMITL BADMINTON</h1>
          <p className="font-body-md text-[14px] text-on-surface-variant text-center mt-1">Create your account</p>
        </div>

        {/* Register Card */}
        <div className="w-full bg-[#1E1E1E] rounded-xl shadow-[0px_8px_24px_rgba(0,0,0,0.5)] border border-[#2A2A2A] p-6">
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            
            {/* Name Input */}
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="name">Full Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" style={{fontVariationSettings: "'FILL' 0"}}>badge</span>
                <input 
                  className="input-field w-full h-12 rounded-lg pl-10 pr-3 font-body-md text-[14px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                  id="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe" 
                  required 
                  type="text"
                />
              </div>
            </div>

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
                  placeholder="athlete@example.com" 
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
            </div>

            {/* Register Button */}
            <button 
              className="btn-primary w-full h-12 rounded-lg font-button text-[16px] font-semibold flex items-center justify-center mt-4 disabled:opacity-50" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
              {!loading && <span className="material-symbols-outlined ml-2 text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>person_add</span>}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-4 border-t border-[#2A2A2A] text-center">
            <p className="font-body-md text-[14px] text-on-surface-variant">
              Already have an account? 
              <a className="font-button text-[16px] font-semibold text-primary hover:text-primary/80 transition-colors ml-2" href="/login">Login</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
