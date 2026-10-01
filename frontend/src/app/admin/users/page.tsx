'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { isSessionExpiredError } from '@/lib/api';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';
import MainLayout from '@/components/MainLayout';
import { useLocale } from '@/components/locale-provider';
import { localizeBackendError } from '@/lib/backend-error-messages.cjs';

export default function ManageUsers() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [users, setUsers] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchStuId, setSearchStuId] = useState('');

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
      toast.error(t('failedLoadUsers'));
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
      toast.success(t('createAdminSuccess'));
      setShowAddAdmin(false);
      setAdminUsername('');
      setAdminName('');
      setAdminPassword('');
      fetchUsers();
    } catch (err: any) {
      toast.error(localizeBackendError(err.response?.data?.message, locale));
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    if (!confirm(locale === 'th' ? `ยืนยันลบผู้ใช้ @${username}? การดำเนินการนี้ย้อนกลับไม่ได้` : `Are you sure you want to delete user @${username}? This action cannot be undone.`)) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success(t('deleteUserSuccess'));
      fetchUsers();
    } catch (err: any) {
      toast.error(localizeBackendError(err.response?.data?.message, locale));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!mounted) return null;

  return (
    <MainLayout width="wide">
      <div className="max-w-6xl mx-auto space-y-6 w-full px-4 md:px-margin-screen mt-4 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-low p-6 rounded-3xl shadow-sm transition-colors duration-300">
          <div>
            <h1 className="font-headline-lg text-[28px] font-bold text-on-surface transition-colors duration-300">{t('manageUsers')}</h1>
            <p className="font-body-md text-[15px] text-on-surface-variant font-medium transition-colors duration-300">{t('manageUsersSub')}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              placeholder={t('searchStudentId') + '…'}
              aria-label={t('searchStudentId')}
              value={searchStuId}
              onChange={(e) => setSearchStuId(e.target.value)}
              className="h-10 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-xs font-mono focus:outline-none focus:border-primary text-on-surface w-36 sm:w-48"
            />
            <button
              className="bg-primary hover:opacity-90 text-on-primary px-5 py-2.5 rounded-xl font-button text-[15px] font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
              onClick={() => setShowAddAdmin(true)}
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              {t('addAdmin')}
            </button>
            <button
              className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-5 py-2.5 rounded-xl font-button text-[15px] font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
              onClick={() => router.push('/dashboard')}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              {t('back')}
            </button>
          </div>
        </div>

        <section className="bg-surface-container-lowest border border-outline-variant/20 shadow-sm rounded-3xl p-6 md:p-8 transition-colors duration-300 overflow-hidden">
          <div className="mb-4 text-xs text-on-surface-variant font-mono">{t('searchStudentId')}: {searchStuId || '—'}</div>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <span className="material-symbols-outlined animate-spin text-[32px] text-primary">autorenew</span>
            </div>
          ) : users.length === 0 ? (
            <p className="text-on-surface-variant text-center font-medium my-8">{t('emptyUsers')}</p>
          ) : (
            <div className="overflow-x-auto w-full rounded-2xl">
              <table className="w-full min-w-[760px] text-sm border-collapse bg-white dark:bg-slate-900/60 rounded-2xl overflow-hidden shadow-inner table-auto">
                <thead>
                  <tr className="border-b border-outline-variant/40 text-left text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    <th className="py-3 px-3">{t('fullName')}</th>
                    <th className="py-3 px-3">{t('username')}</th>
                    <th className="py-3 px-3">{t('studentId')}</th>
                    <th className="py-3 px-3">{t('role')}</th>
                    <th className="py-3 px-3">{t('quota')}</th>
                    <th className="py-3 px-3 text-right">{t('actions')}</th>
                  </tr>
                </thead>
              <tbody>
                {users.filter(u => {
                  if (!searchStuId.trim()) return true;
                  const sid = (u.stu_id || '').toString();
                  return sid.includes(searchStuId.trim());
                }).map(u => (
                  <tr key={u.id || u.stu_id} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-3 font-semibold text-on-surface">{u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || '-'}</td>
                    <td className="py-3 px-3 text-on-surface-variant">@{u.username}</td>
                    <td className="py-3 px-3 text-on-surface-variant font-mono">{u.stu_id || '-'}</td>
                    <td className="py-3 px-3"><span className="bg-surface-container-high text-on-surface px-2 py-0.5 rounded-full text-[11px] font-bold">{u.role || 'STUDENT'}</span></td>
                    <td className="py-3 px-3"><span className="font-mono font-bold text-orange-600 dark:text-orange-400">{u.quota ?? 1}</span></td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-sm"
                          onClick={async () => {
                            if (!confirm(t('confirmResetQuota').replace('{username}', u.username))) return;
                            try {
                              await api.post(`/users/${u.id || u.stu_id}/reset-quota`);
                              toast.success(t('resetQuotaSuccess'));
                              fetchUsers();
                            } catch (err: any) {
                              toast.error(localizeBackendError(err.response?.data?.message, locale));
                            }
                          }}
                        >
                          <span className="material-symbols-outlined text-[14px]">replay</span>
                          {t('resetQuota')}
                        </button>
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm"
                          onClick={async () => {
                            if (!confirm(t('confirmBan').replace('{username}', u.username))) return;
                            try {
                              await api.post(`/users/${u.id || u.stu_id}/ban`);
                              toast.success(t('banSuccess'));
                              fetchUsers();
                            } catch (err: any) {
                              toast.error(localizeBackendError(err.response?.data?.message, locale));
                            }
                          }}
                        >
                          <span className="material-symbols-outlined text-[14px]">block</span>
                          {t('ban24')}
                        </button>
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-error-container text-on-error-container hover:bg-error hover:text-on-error text-xs font-bold transition-colors"
                          onClick={() => handleDeleteUser(u.id || u.stu_id, u.username)}
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                          {t('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </section>
      </div>

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-scrim/60 backdrop-blur-sm" onClick={() => setShowAddAdmin(false)}></div>
          <div className="relative bg-surface p-8 rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 border border-surface-container-high">
            <h2 className="text-2xl font-bold text-on-surface mb-6">{t('addNewAdmin')}</h2>
            <form onSubmit={handleAddAdmin} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">{t('username')}</label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="mt-1 w-full h-12 rounded-xl px-4 font-body-md text-[15px] bg-surface-container-lowest text-on-surface border border-outline-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">{t('fullName')}</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="mt-1 w-full h-12 rounded-xl px-4 font-body-md text-[15px] bg-surface-container-lowest text-on-surface border border-outline-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">{t('password')}</label>
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
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl font-bold bg-primary text-on-primary hover:opacity-90 transition-colors"
                >
                  {t('createAdminAction')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}