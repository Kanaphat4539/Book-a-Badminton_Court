'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';

export default function RegisterPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { 
        studentId, 
        email, 
        name, 
        phone, 
        major, 
        year, 
        username, 
        password 
      });
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
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[100]">
        <ThemeToggle className="flex items-center justify-center transition-colors hover:opacity-80" />
      </div>



      <main className="w-full max-w-2xl relative z-10 flex flex-col items-center">
        {/* Logo Section */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-28 h-28 mb-4 rounded-full overflow-hidden bg-white flex items-center justify-center shadow-xl border-4 border-white">
            <img
              alt="KMITL Badminton Logo"
              className="w-full h-full object-cover scale-[1.3] origin-center"
              src="https://dynamic.design.com/preview/logodraft/19a68c63-7360-49b5-81f0-76059ea64263/image/extra-large.en-us.png"
            />
          </div>
          <h1 className="font-display-lg text-[32px] font-extrabold text-gray-900 dark:text-orange-50 tracking-tight text-center uppercase drop-shadow-sm transition-colors duration-300">KMITL <span className="text-primary">BADMINTON</span></h1>
          <p className="font-body-md text-[15px] text-gray-600 dark:text-orange-200/70 text-center mt-1 font-medium tracking-wide uppercase transition-colors duration-300">Create your account</p>
        </div>

        {/* Register Card */}
        <div className="w-full bg-white/40 dark:bg-[#2a1300]/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/50 dark:border-[#ff6b00]/20 p-8 transition-all hover:shadow-[0_8px_40px_rgba(255,107,0,0.15)]">
          <form onSubmit={handleRegister} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Student ID */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-[13px] font-bold text-gray-700 dark:text-orange-200 uppercase tracking-wider transition-colors duration-300" htmlFor="studentId">รหัสนักศึกษา / Student ID</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-orange-300/50 group-focus-within:text-primary transition-colors text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>badge</span>
                  <input
                    className="w-full h-14 rounded-xl pl-12 pr-4 font-body-md text-[15px] text-gray-900 dark:text-orange-50 bg-white/60 dark:bg-[#140900]/80 border border-white/60 dark:border-[#ff6b00]/30 placeholder:text-gray-500 dark:placeholder:text-orange-300/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    id="studentId"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="6401xxxx"
                    required
                    type="text"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-[13px] font-bold text-gray-700 dark:text-orange-200 uppercase tracking-wider transition-colors duration-300" htmlFor="email">Email</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-orange-300/50 group-focus-within:text-primary transition-colors text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>mail</span>
                  <input
                    className="w-full h-14 rounded-xl pl-12 pr-4 font-body-md text-[15px] text-gray-900 dark:text-orange-50 bg-white/60 dark:bg-[#140900]/80 border border-white/60 dark:border-[#ff6b00]/30 placeholder:text-gray-500 dark:placeholder:text-orange-300/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="athlete@example.com"
                    required
                    type="email"
                  />
                </div>
              </div>

              {/* Name Input */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="font-label-md text-[13px] font-bold text-gray-700 dark:text-orange-200 uppercase tracking-wider transition-colors duration-300" htmlFor="name">ชื่อ-สกุล / Full Name</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-orange-300/50 group-focus-within:text-primary transition-colors text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>person</span>
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

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-[13px] font-bold text-gray-700 dark:text-orange-200 uppercase tracking-wider transition-colors duration-300" htmlFor="phone">เบอร์ติดต่อ / Phone Number</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-orange-300/50 group-focus-within:text-primary transition-colors text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>call</span>
                  <input
                    className="w-full h-14 rounded-xl pl-12 pr-4 font-body-md text-[15px] text-gray-900 dark:text-orange-50 bg-white/60 dark:bg-[#140900]/80 border border-white/60 dark:border-[#ff6b00]/30 placeholder:text-gray-500 dark:placeholder:text-orange-300/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    required
                    type="text"
                  />
                </div>
              </div>

              {/* Major */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-[13px] font-bold text-gray-700 dark:text-orange-200 uppercase tracking-wider transition-colors duration-300" htmlFor="major">สาขา / Major</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-orange-300/50 group-focus-within:text-primary transition-colors text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>school</span>
                  <input
                    className="w-full h-14 rounded-xl pl-12 pr-4 font-body-md text-[15px] text-gray-900 dark:text-orange-50 bg-white/60 dark:bg-[#140900]/80 border border-white/60 dark:border-[#ff6b00]/30 placeholder:text-gray-500 dark:placeholder:text-orange-300/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    id="major"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="Computer Science"
                    required
                    type="text"
                  />
                </div>
              </div>
              
              {/* Year */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-[13px] font-bold text-gray-700 dark:text-orange-200 uppercase tracking-wider transition-colors duration-300" htmlFor="year">ชั้นปี / Year</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-orange-300/50 group-focus-within:text-primary transition-colors text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>calendar_today</span>
                  <select
                    className="w-full h-14 rounded-xl pl-12 pr-4 font-body-md text-[15px] text-gray-900 dark:text-orange-50 bg-white/60 dark:bg-[#140900]/80 border border-white/60 dark:border-[#ff6b00]/30 placeholder:text-gray-500 dark:placeholder:text-orange-300/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm appearance-none"
                    id="year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                  >
                    <option value="" disabled className="text-gray-500 dark:text-gray-400">Select Year</option>
                    <option value="1" className="text-gray-900 dark:text-white bg-white dark:bg-[#140900]">1</option>
                    <option value="2" className="text-gray-900 dark:text-white bg-white dark:bg-[#140900]">2</option>
                    <option value="3" className="text-gray-900 dark:text-white bg-white dark:bg-[#140900]">3</option>
                    <option value="4" className="text-gray-900 dark:text-white bg-white dark:bg-[#140900]">4</option>
                    <option value="5+" className="text-gray-900 dark:text-white bg-white dark:bg-[#140900]">5+</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-orange-300/50 pointer-events-none">arrow_drop_down</span>
                </div>
              </div>

            </div>

            {/* Account Credentials Section - Highlighted */}
            <div className="mt-2 pt-6 border-t border-gray-200/50 dark:border-[#ff6b00]/20 flex flex-col gap-5">
              <h3 className="font-label-lg text-[14px] font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>key</span>
                Account Credentials
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Username Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-[13px] font-bold text-gray-800 dark:text-orange-100 uppercase tracking-wider transition-colors duration-300" htmlFor="username">Username</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 group-focus-within:text-primary transition-colors text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
                    <input
                      className="w-full h-14 rounded-xl pl-12 pr-4 font-body-md text-[15px] text-gray-900 dark:text-orange-50 bg-white/70 dark:bg-[#140900]/80 border-2 border-primary/40 dark:border-primary/50 hover:border-primary/60 placeholder:text-gray-500 dark:placeholder:text-orange-300/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-sm"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="athlete123"
                      required
                      type="text"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-[13px] font-bold text-gray-800 dark:text-orange-100 uppercase tracking-wider transition-colors duration-300" htmlFor="password">Password</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 group-focus-within:text-primary transition-colors text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                    <input
                      className="w-full h-14 rounded-xl pl-12 pr-4 font-body-md text-[15px] text-gray-900 dark:text-orange-50 bg-white/70 dark:bg-[#140900]/80 border-2 border-primary/40 dark:border-primary/50 hover:border-primary/60 placeholder:text-gray-400 dark:placeholder:text-orange-300/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-sm"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      type="password"
                    />
                  </div>
                </div>
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
