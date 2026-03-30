"use client";
import React, { useState, useEffect } from 'react';
import { getPublicReports } from '../services/api';

export default function ExplorePage() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const reports = await getPublicReports({ limit: 100 });
        const tagCounts = {};
        reports.forEach(report => {
          const text = report.description || "";
          const tagsInPost = text.match(/#\w+/g) || [];
          const uniqueTagsInPost = [...new Set(tagsInPost)];
          uniqueTagsInPost.forEach(tag => {
            const t = tag.toLowerCase().replace('#', '');
            tagCounts[t] = (tagCounts[t] || 0) + 1;
          });
        });

        const sortedTrends = Object.entries(tagCounts)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setTrends(sortedTrends);
      } catch (err) {
        console.error("Failed to fetch trends:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-outfit font-bold text-text">Explore Trends</h1>
        <p className="text-muted mt-2">Discover the most discussed civic issues and follow categories that matter to you.</p>
      </div>

      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input 
          type="text" 
          placeholder="Search authorities or categories..." 
          className="w-full pl-12 pr-4 py-4 bg-surface border border-border rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text placeholder-muted"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="md:col-span-2 text-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : trends.length > 0 ? (
          trends.map(item => (
            <div key={item.tag} className="bg-surface rounded-2xl p-6 shadow-card border border-border flex items-center justify-between hover:shadow-lg transition-all group">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest group-hover:text-primary transition-colors">Trending Topic</span>
                <h4 className="text-lg font-bold text-text group-hover:text-primary transition-colors">#{item.tag.toUpperCase()}</h4>
                <p className="text-xs text-muted">{item.count} reports this week</p>
              </div>
              <button className="px-6 py-2 bg-surface-2 hover:bg-primary hover:text-white text-text text-sm font-bold rounded-full border border-border hover:border-primary transition-all active:scale-95 shadow-sm">
                Follow
              </button>
            </div>
          ))
        ) : (
          <div className="md:col-span-2 text-center py-20 bg-surface rounded-2xl border border-border border-dashed text-muted">
            No trends found today.
          </div>
        )}
      </div>
    </div>
  );
}
