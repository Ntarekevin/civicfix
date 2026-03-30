"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getPublicReports } from '../services/api';
import PostCreation from '../components/PostCreation';
import PostCard from '../components/PostCard';
import RightSidebar from '../components/RightSidebar';
import { useLanguage } from '../store/LanguageContext';

export default function DashboardPage() {
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState(null);

  const fetchData = useCallback(async (tag = null) => {
    setLoading(true);
    try {
      const params = { limit: 20 };
      if (tag) {
        params.category = tag.replace(/^#/, '');
      }
      const data = await getPublicReports(params);
      setReports(data.reports || []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTag);
  }, [activeTag, fetchData]);

  const handleTagFilter = (tag) => {
    setActiveTag(tag);
  };

  const pathname = usePathname();
  const highlightedId = new URLSearchParams(useSearchParams().toString()).get('id');

  return (
    <div className="flex gap-8">
      {/* Main Feed Column */}
      <div className="flex-1 space-y-6 max-w-2xl mx-auto lg:mx-0">
        <PostCreation onPostSuccess={() => fetchData(activeTag)} />

        {/* Active tag banner */}
        {activeTag && (
          <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl">
            <span className="text-sm text-primary font-semibold">
              {t('showingReportsFor')} <strong>{activeTag}</strong>
            </span>
            <button
              onClick={() => setActiveTag(null)}
              className="text-xs text-gray-500 hover:text-red-500 font-medium transition-colors"
            >
              {t('clearFilters')} ✕
            </button>
          </div>
        )}

        <div className="space-y-6">
          <h2 className="text-xl font-outfit font-bold px-2">
            {t('recentReports')}
          </h2>

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-surface rounded-2xl p-6 shadow-sm border dark:border-border animate-pulse">
                  <div className="flex gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4"></div>
                </div>
              ))}
            </div>
          ) : reports.length > 0 ? (
            reports.map((report) => (
              <PostCard
                key={report.id}
                isHighlighted={String(report.id) === highlightedId}
                report={{
                  id: report.id,
                  publicId: report.public_id,
                  content: report.description,
                  timestamp: new Date(report.created_at).toLocaleDateString(),
                  location: report.city || "Rwanda",
                  userRole: t('verifiedResident'),
                  tags: [],
                  commentsCount: report.comments?.length || 0,
                  media: report.media || [], // Pass full media array
                }}
              />
            ))
          ) : (
            <div className="text-center py-20 bg-surface rounded-2xl border dark:border-gray-800">
              <p className="text-gray-500">
                {activeTag ? `${t('noReportsFound')} ${activeTag}` : t('noReportsFoundDefault')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <RightSidebar onTagFilter={handleTagFilter} reports={reports} />
    </div>
  );
}
