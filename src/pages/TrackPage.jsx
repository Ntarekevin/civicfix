"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackReport } from '../services/api';
import PostCard from '../components/PostCard';
import { useLanguage } from '../store/LanguageContext';

export default function TrackPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const STATUS_INFO = {
    'open': { icon: '🟣', label: t('statusOpen'), color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', desc: t('statusOpenDesc') },
    'in-progress': { icon: '🟡', label: t('statusInprogress'), color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', desc: t('statusInProgressDesc') },
    'resolved': { icon: '🟢', label: t('statusResolved'), color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', desc: t('statusResolvedDesc') },
    'rejected': { icon: '🔴', label: t('statusRejected'), color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', desc: t('statusRejectedDesc') },
  };

  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!token.trim()) { setError(t('enterTokenError')); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await trackReport(token.trim());
      setResult(data);
    } catch (err) {
      setError(err.message?.includes('404')
        ? t('noReportFoundError')
        : t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  const info = result ? STATUS_INFO[result.status] || { icon: '❓', label: result.status, color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200', desc: '' } : null;

  return (
    <div className="max-w-xl mx-auto py-12 px-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        {
          result &&
          <button
            onClick={() => {
              if (result) {
                setResult(null);
                setError('');
                setToken('');
              } else {
                router.push('/');
              }
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-400"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        }
        <div>
          <h1 className="text-3xl font-outfit font-bold text-gray-900 dark:text-white">{t('viewReport')}</h1>
          <p className="text-sm text-gray-500">{t('viewReportDesc')}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-surface rounded-3xl p-8 shadow-sm border dark:border-border space-y-8 transition-all">
          {!result && (
            <form onSubmit={handleTrack} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">{t('enterReportId')}</label>
                <div className="relative group">
                  <input
                    type="text"
                    className="w-full bg-surface-2 border dark:border-border rounded-2xl p-4 pl-12 font-outfit font-bold dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="CP-123456"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                  />
                  <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 text-sm animate-shake">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-4 rounded-2xl font-bold font-outfit shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : t('viewDiscussion')}
              </button>
            </form>
          )}

          {result && info && (
            <div className="space-y-8 animate-in slide-in-from-top duration-500">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => { setResult(null); setError(''); setToken(''); }}
                  className="text-xs font-bold text-primary px-3 py-1 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  {t('newSearch')}
                </button>
                <div className="bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter">
                  {t('verifiedID')}: {result.public_id}
                </div>
              </div>

              <div className="text-center space-y-4">
                <div className="text-5xl mb-4">{info.icon}</div>
                <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border ${info.bg} ${info.color} ${info.border}`}>
                  {info.label.toUpperCase()}
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
                  {info.desc}
                </p>
              </div>

              {/* Full Discussion Thread */}
              <div className="pt-4 border-t dark:border-border">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 ml-1">{t('discussionThread')}</p>
                <PostCard
                  report={{
                    id: result.id,
                    publicId: result.public_id,
                    content: result.description,
                    timestamp: new Date(result.created_at).toLocaleDateString(),
                    location: result.locations?.city || result.locations?.address || t('locationHidden'),
                    userRole: t('reportedIssue'),
                    commentsCount: result.report_comments?.length || 0,
                    media: result.media?.map(m => ({ url: m.file_url, type: m.file_type })) || []
                  }}
                  isHighlighted={true}
                />
              </div>

              <div className="pt-4 text-center">
                <p className="text-[10px] text-gray-400 leading-relaxed italic">
                  {t('trackInfoFootnote')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-start gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
        <svg className="w-6 h-6 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-primary/80 font-medium leading-relaxed">
          {t('trackInfo')}
        </p>
      </div>
    </div>
  );
}
