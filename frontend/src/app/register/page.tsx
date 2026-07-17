'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';

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
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-on-surface dark:text-orange-50 font-sans relative overflow-hidden transition-colors duration-300 bg-cover bg-center"
      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1661020812032-90582fe13ca6?w=1920&auto=format&fit=crop&q=80')` }}
    >
      {/* Subtle overlay for text readability */}
      <div className="absolute inset-0 bg-white/40 dark:bg-black/60 backdrop-blur-[2px] transition-colors duration-300 z-0"></div>

      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/30 dark:bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-80 transition-colors duration-300 z-0"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-yellow-300/40 dark:bg-yellow-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-80 transition-colors duration-300 z-0"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-primary/20 dark:bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-80 transition-colors duration-300 z-0"></div>

      {/* Floating Theme Toggle */}
      <div className="absolute top-6 right-6 z-[100] bg-white/80 dark:bg-[#2a1300]/80 backdrop-blur-md rounded-full shadow-md border border-gray-200 dark:border-[#ff6b00]/20 transition-colors duration-300">
        <ThemeToggle className="w-12 h-12 flex items-center justify-center rounded-full text-gray-800 dark:text-orange-50 hover:bg-gray-100 dark:hover:bg-[#3a1b00] transition-colors" iconClassName="text-[28px]" />
      </div>

      <main className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Logo Section */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-28 h-28 mb-4 rounded-full overflow-hidden bg-white flex items-center justify-center shadow-xl border-4 border-white">
            <img
              alt="KMITL Badminton Logo"
              className="w-full h-full object-cover scale-[1.3] origin-center"
              src="https://dynamic.design.com/preview/logodraft/e902d866-a857-4c09-8dae-7acb2556679c/image/extra-large.en-us.png"
            />
          </div>
          <h1 className="font-display-lg text-[32px] font-extrabold text-gray-900 dark:text-orange-50 tracking-tight text-center uppercase drop-shadow-sm transition-colors duration-300">KMITL <span className="text-primary">BADMINTON</span></h1>
          <p className="font-body-md text-[15px] text-gray-600 dark:text-orange-200/70 text-center mt-1 font-medium tracking-wide uppercase transition-colors duration-300">Create your account</p>
        </div>

        {/* Register Card */}
        <div className="w-full bg-white/40 dark:bg-[#2a1300]/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/50 dark:border-[#ff6b00]/20 p-8 transition-all hover:shadow-[0_8px_40px_rgba(255,107,0,0.15)]">
          <form onSubmit={handleRegister} className="flex flex-col gap-5">

            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-[13px] font-bold text-gray-700 dark:text-orange-200 uppercase tracking-wider transition-colors duration-300" htmlFor="name">Full Name</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-orange-300/50 group-focus-within:text-primary transition-colors text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>badge</span>
                <input
                  className="w-full h-14 rounded-xl pl-12 pr-4 font-body-md text-[15px] text-gray-900 dark:text-orange-50 bg-white/60 dark:bg-[#140900]/80 border border-white/60 dark:border-[#ff6b00]/30 placeholder:text-gray-500 dark:placeholder:text-orange-300/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
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
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-[13px] font-bold text-gray-700 dark:text-orange-200 uppercase tracking-wider transition-colors duration-300" htmlFor="username">Username / Email</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-orange-300/50 group-focus-within:text-primary transition-colors text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>person</span>
                <input
                  className="w-full h-14 rounded-xl pl-12 pr-4 font-body-md text-[15px] text-gray-900 dark:text-orange-50 bg-white/60 dark:bg-[#140900]/80 border border-white/60 dark:border-[#ff6b00]/30 placeholder:text-gray-500 dark:placeholder:text-orange-300/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
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
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-[13px] font-bold text-gray-700 dark:text-orange-200 uppercase tracking-wider transition-colors duration-300" htmlFor="password">Password</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-orange-300/50 group-focus-within:text-primary transition-colors text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>lock</span>
                <input
                  className="w-full h-14 rounded-xl pl-12 pr-4 font-body-md text-[15px] text-gray-900 dark:text-orange-50 bg-white/80 dark:bg-[#140900]/80 border border-gray-200 dark:border-[#ff6b00]/30 placeholder:text-gray-400 dark:placeholder:text-orange-300/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
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
              className="w-full h-14 rounded-xl font-button text-[16px] font-bold text-white bg-primary hover:bg-[#E55B13] active:scale-[0.98] transition-all flex items-center justify-center mt-4 disabled:opacity-50 shadow-[0_4px_14px_rgba(255,107,0,0.4)] hover:shadow-[0_6px_20px_rgba(255,107,0,0.6)]"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
              {!loading && <span className="material-symbols-outlined ml-2 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-[#ff6b00]/20 text-center transition-colors duration-300">
            <p className="font-body-md text-[15px] text-gray-600 dark:text-orange-200/70 transition-colors duration-300">
              Already have an account?
              <a className="font-button text-[16px] font-bold text-primary hover:text-primary/80 transition-colors ml-2" href="/login">Login</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
