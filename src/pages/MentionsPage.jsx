"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getAdminReports } from '../services/api';
import PostCard from '../components/PostCard';
import { useLanguage } from '../store/LanguageContext';

// Inner component that uses useSearchParams — must be inside Suspense
function MentionsList({ mentions, loading }) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const highlightedId = searchParams.get('id');

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (mentions.length > 0) {
    return (
      <>
        {mentions.map((report) => (
          <PostCard
            key={report.id}
            isHighlighted={String(report.id) === highlightedId}
            report={{
              id: report.id,
              publicId: report.public_id,
              content: report.description,
              timestamp: new Date(report.created_at).toLocaleDateString(),
              location: report.city || "Rwanda",
              userRole: t('reportedIssue'),
              status: report.status
            }}
          />
        ))}
      </>
    );
  }

  return (
    <div className="text-center py-20 bg-surface rounded-2xl border dark:border-gray-800 border-dashed">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
      </div>
      <h3 className="text-lg font-bold ">{t('noMentionsYet')}</h3>
      <p className="text-gray-500 max-w-xs mx-auto mt-2">{t('noMentionsDesc')}</p>
    </div>
  );
}

export default function MentionsPage() {
  const { t } = useLanguage();
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMentions() {
      try {
        const reports = await getAdminReports();
        setMentions(reports.filter(r => r.is_mentioned));
      } catch (err) {
        console.error("Failed to fetch mentions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMentions();
  }, []);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-outfit font-bold ">{t('mentions')}</h1>
          <p className="text-gray-500 mt-1">{t('mentionsDesc')}</p>
        </div>
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => (
            <img key={i} src={`https://ui-avatars.com/api/?name=Auth+${i}&background=random`} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" alt="auth" />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <Suspense fallback={
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        }>
          <MentionsList mentions={mentions} loading={loading} />
        </Suspense>
      </div>
    </div>
  );
}
