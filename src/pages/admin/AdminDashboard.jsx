"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getAdminReports, updateReportStatus, assignReport, getUsers, commentReport } from '../../services/api';
import { useSocket } from '../../store/SocketContext';
import { useAuth } from '../../store/AuthContext';
import MediaModal from '../../components/MediaModal';
import { useLanguage } from '../../store/LanguageContext';

const CATEGORY_COLORS = {
  corruption: 'text-orange-500',
  security: 'text-red-500',
  racism: 'text-purple-500',
  service: 'text-blue-500',
};

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const { socket } = useSocket() || {};
  const [loading, setLoading] = useState(true);
  const [expandingRow, setExpandingRow] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();

  const fetchData = async () => {
    if (!user?.firebase_uid) return;
    try {
      // Fetch core data first
      const [repData, usrData] = await Promise.all([
        getAdminReports(user.firebase_uid),
        getUsers()
      ]);
      setReports(repData || []);
      setUsers(usrData || []);

    } catch (err) {
      console.error('Failed to fetch admin data.', err);
      if (err.message && err.message.includes('401')) {
        router.push('/login');
      } else if (err.message && err.message.includes('403')) {
        setError('access_denied');
      } else {
        setError('failed');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.on('new-report', () => fetchData());
      socket.on('report-updated', () => fetchData());
    }
    return () => {
      if (socket) {
        socket.off('new-report');
        socket.off('report-updated');
      }
    };
  }, [socket]);


  const handleStatusChange = async (id, status) => {
    try {
      await updateReportStatus(id, status, 'Updated from dashboard');
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (err) {
      alert(t('failedUpdateStatus'));
    }
  };

  const handleAssign = async (id, assignTo) => {
    try {
      await assignReport(id, assignTo);
      fetchData();
    } catch (err) {
      alert(t('failedAssignReport'));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (error === 'access_denied') return (
    <div className="bg-surface rounded-3xl p-12 text-center border border-border shadow-sm max-w-lg mx-auto mt-20">
      <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v1m0-1h1m-1 0H11m1-4V7a4 4 0 118 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </div>
      <h2 className="text-xl font-outfit font-bold text-text mb-2">{t('accessDenied')}</h2>
      <p className="text-muted mb-8 leading-relaxed text-sm">{t('accessDeniedMsg')}</p>
      <button
        onClick={() => router.push('/dashboard')}
        className="px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all"
      >
        {t('backToDashboard')}
      </button>
    </div>
  );

  const isSuperAdmin = user?.role === 'admin';

  return (
    <div className="space-y-8 pb-20 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-outfit font-bold text-text">
            {isSuperAdmin ? t('superAdminPortal') : `${user?.fullName || user?.username || 'Authority'} ${t('portal')}`}
          </h1>
          <p className="text-muted mt-1">
            {isSuperAdmin ? (
              t('viewingAllReports')
            ) : (
              <>
                {t('showingReportsFor')} <span className="font-bold text-primary">#{user?.username}</span>.
              </>
            )}
          </p>
        </div>
        <div className="flex gap-4 items-center">

          <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 flex items-center gap-3">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-primary uppercase">{t('realtimeSync')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-surface rounded-2xl shadow-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-2/50 border-b border-border">
                    <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest">{t('reportReference')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest text-right">{t('previewManage')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reports.map(r => (
                    <React.Fragment key={r.id}>
                      <tr
                        className="hover:bg-surface-2/30 transition-all cursor-pointer group"
                        onClick={() => setExpandingRow(expandingRow === r.id ? null : r.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-text uppercase tracking-tighter">ID {r.public_id || r.id}</p>
                              <p className="text-[9px] text-muted font-medium uppercase">{new Date(r.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 text-[9px] font-bold text-muted uppercase">
                            {t('clickToManage')}
                            <svg className={`w-3 h-3 transition-transform ${expandingRow === r.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </td>
                      </tr>
                      {expandingRow === r.id && (
                        <tr className="bg-gray-50/50 dark:bg-gray-800/10 border-l-4 border-primary">
                          <td colSpan="2" className="px-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{t('description')}</p>
                                  <p className="text-xs text-text leading-relaxed font-medium">
                                    {r.description || t('noDescription')}
                                  </p>
                                </div>

                                {/* Media Section for Admin */}
                                {r.media && r.media.length > 0 && (
                                  <div className="pt-4 space-y-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('reportEvidence')}</p>
                                    <div className="flex flex-wrap gap-2">
                                      {r.media.map((m, idx) => {
                                        const url = m.file_url || m.url;
                                        const isVid = url && url.match(/\.(mp4|webm|ogg|mov)$|^data:video/i);
                                        return (
                                          <div
                                            key={idx}
                                            onClick={() => setSelectedMedia(m)}
                                            className="relative w-20 h-20 rounded-xl overflow-hidden border dark:border-gray-700 cursor-pointer hover:ring-2 hover:ring-primary transition-all group/adminmedia"
                                          >
                                            {isVid ? (
                                              <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-gray-400 group-hover/adminmedia:text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M8 5v14l11-7z" />
                                                </svg>
                                              </div>
                                            ) : (
                                              <img src={m.file_url || m.url} className="w-full h-full object-cover" alt="evidence" />
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-4 border-l dark:border-gray-800 pl-8">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('updateStatus')}</label>
                                    <select
                                      value={r.status}
                                      onChange={(e) => handleStatusChange(r.id, e.target.value)}
                                      className="w-full bg-surface-2 dark:bg-surface-2 border border-border dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-black dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                    >
                                      <option value="open">{t('statusOpen')}</option>
                                      <option value="in-progress">{t('statusInProgress')}</option>
                                      <option value="resolved">{t('statusResolved')}</option>
                                      <option value="rejected">{t('statusRejected')}</option>
                                    </select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('assignOfficial')}</label>
                                    <select
                                      value={r.assigned_to || ''}
                                      onChange={(e) => handleAssign(r.id, e.target.value)}
                                      className="w-full bg-surface-2 dark:bg-surface-2 border border-border dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-text dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                    >
                                      <option value="">{t('unassigned')}</option>
                                      {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.username}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest">{t('officialReply')}</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder={t('typeResponse')}
                                      className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text"
                                      id={`reply-${r.id}`}
                                    />
                                    <button
                                      onClick={async () => {
                                        const input = document.getElementById(`reply-${r.id}`);
                                        const content = input.value;
                                        if (!content) return;
                                        try {
                                          const author = user?.username || 'Official';
                                          await commentReport(r.id, content, author);
                                          input.value = '';
                                          alert(t('replySent'));
                                        } catch (err) {
                                          alert(t('failedSendReply'));
                                        }
                                      }}
                                      className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold hover:bg-primary-dark transition-all"
                                    >
                                      {t('sendBtn')}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">

          <div className="bg-primary rounded-3xl p-8 text-white shadow-xl shadow-primary/20 space-y-4">
            <h3 className="text-lg font-outfit font-bold">{t('systemSummary')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase opacity-70">{t('totalToday')}</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase opacity-70">{t('statusResolved')}</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === 'resolved').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MediaModal media={selectedMedia} onClose={() => setSelectedMedia(null)} />
    </div>
  );
}
