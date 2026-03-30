"use client";
import React, { useState, useEffect } from 'react';
import { getTrends } from '../services/api';
import { useLanguage } from '../store/LanguageContext';

export default function RightSidebar({ onTagFilter, reports = [] }) {
  const { t } = useLanguage();
  const [trends, setTrends] = useState([]);
  const [activeTag, setActiveTag] = useState(null);

  useEffect(() => {
    if (reports && reports.length > 0) {
      // Calculate trends from reports
      const tagCounts = {};
      reports.forEach(report => {
        const text = report.description || "";
        const tagsInPost = text.match(/#\w+/g) || [];
        const uniqueTagsInPost = [...new Set(tagsInPost)]; // count each tag once per report
        uniqueTagsInPost.forEach(tag => {
          const t = tag.toLowerCase().replace('#', '');
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      });

      const sortedTrends = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTrends(sortedTrends);
    } else {
      // Fallback to API trends if no reports are passed (or empty)
      getTrends()
        .then(data => setTrends(data))
        .catch(() => setTrends([]));
    }
  }, [reports]);

  const handleTagClick = (tag) => {
    const newTag = activeTag === tag ? null : tag;
    setActiveTag(newTag);
    if (onTagFilter) onTagFilter(newTag);
  };

  return (
    <div className="w-80 hidden xl:flex flex-col gap-6 sticky top-24 self-start">
      {/* Trending Section */}
      <div className="bg-surface rounded-2xl p-6 shadow-card border border-border transition-all">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg font-outfit text-text">{t('trending')}</h3>
          {activeTag && (
            <button
              onClick={() => { setActiveTag(null); if (onTagFilter) onTagFilter(null); }}
              className="text-xs text-error hover:underline font-semibold"
            >
              {t('clearFilter')}
            </button>
          )}
        </div>

        <div className="space-y-5">
          {trends.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">{t('noTrendingTopics')}</p>
          ) : (
            trends.map((item) => {
              const tag = `#${item.tag}`;
              const isActive = activeTag === tag;
              return (
                <div
                  key={item.tag}
                  onClick={() => handleTagClick(tag)}
                  className={`group cursor-pointer rounded-xl px-3 py-2 transition-all ${isActive
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-surface-2 border border-transparent'
                    }`}
                >
                  <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-primary' : 'text-muted group-hover:text-primary'}`}>
                    {t('trendingInReports')}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <h4 className={`font-bold transition-colors ${isActive ? 'text-primary' : 'text-text group-hover:text-primary'}`}>
                      {tag}
                    </h4>
                    <p className="text-xs text-muted">{item.count} {t('reportsCount')}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {activeTag && (
          <p className="mt-4 text-xs text-center text-primary font-semibold animate-pulse">
            {t('showingReportsFor')} {activeTag}
          </p>
        )}
      </div>

      {/* Footer links */}
      <div className="px-4 flex flex-wrap gap-x-4 gap-y-1">
        {[
          { label: t('termsOfService'), key: 'terms' },
          { label: t('privacyPolicy'), key: 'privacy' },
          { label: t('accessibility'), key: 'a11y' }
        ].map(link => (
          <button key={link.key} className="text-[10px] text-muted hover:text-text hover:underline transition-colors">
            {link.label}
          </button>
        ))}
        <p className="text-[10px] text-muted mt-2 w-full">© 2024 CivicFIX Rwanda</p>
      </div>
    </div>
  );
}
