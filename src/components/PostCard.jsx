"use client";
import React, { useState, useEffect } from 'react';
import { getReportComments, commentReport, updateReport } from '../services/api';
import MediaModal from './MediaModal';
import MediaCarousel from './MediaCarousel';
import { useLanguage } from '../store/LanguageContext';
import { useAuth } from '../store/AuthContext';

const PostCard = ({ report, isHighlighted = false }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    id,
    publicId = "#24A102107",
    userRole = t('verifiedResident'),
    timestamp = "2 hours ago",
    location = "Rwanda",
    content = t('noReportsFoundDefault'),
    media = [],
    tags = [],
    commentsCount: initialCommentsCount = 0,
  } = report || {};

  const [showComments, setShowComments] = useState(isHighlighted);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [updating, setUpdating] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Check ownership (only for admins/officials now, or if we had a secure session)
  const isOwner = false;

  const cardRef = React.useRef(null);

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      setTimeout(() => {
        cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [isHighlighted]);

  useEffect(() => {
    if (showComments && id) {
      fetchComments();
    }
  }, [showComments, id]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const data = await getReportComments(id);
      setComments(data);
      setCommentsCount(data.length);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim() || updating) return;
    setUpdating(true);
    try {
      await updateReport(myReportInfo.token, { description: editContent });
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update report: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem('civifix_user') || '{}');
      const authorName = user.username || 'Anonymous Citizen';

      const savedComment = await commentReport(id, newComment, authorName);
      setComments(prev => [...prev, savedComment]);
      setCommentsCount(prev => prev + 1);
      setNewComment('');
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`shadow-card rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md group ${isHighlighted ? 'border-primary ring-2 ring-primary/20 animate-pulse-subtle' : 'dark:border-border'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={`https://ui-avatars.com/api/?name=${publicId.replace('#', '')}&background=random`}
            alt="Avatar"
            className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-700 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-border hover:border-primary/30 transition-all group/id relative">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 font-outfit">ID: {publicId}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(publicId.replace('#', ''));
                    const btn = document.getElementById(`copy-btn-${id}`);
                    if (btn) btn.innerText = t('copied');
                    setTimeout(() => { if (btn) btn.innerText = t('copy'); }, 2000);
                  }}
                  className="text-[10px] font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 border-l dark:border-gray-700 pl-1.5 ml-0.5"
                  title={t('copyTrackId')}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  <span id={`copy-btn-${id}`}>{t('copy')}</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {timestamp} {location ? `• ${location}` : ''}
            </p>
          </div>
        </div>

        {isOwner && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
            title={t('editReport')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-primary/20 rounded-2xl p-4 text-[15px] dark:text-white outline-none focus:border-primary/50 transition-all resize-none min-h-[100px]"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={updating}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setIsEditing(false); setEditContent(content); }}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                disabled={updating}
              >
                CANCEL
              </button>
              <button
                onClick={handleUpdate}
                className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 disabled:opacity-50 transition-all flex items-center gap-2"
                disabled={updating || !editContent.trim()}
              >
                {updating && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {updating ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </div>
          </div>
        ) : (
          <p className=" leading-relaxed text-[15px]">
            {isEditing ? editContent : (editContent !== content ? editContent : content)}
          </p>
        )}
      </div>
      {/* Media Carousel */}
      <MediaCarousel media={media} />

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map(tag => (
            <span key={tag} className="text-xs text-primary font-semibold bg-primary/5 px-2 py-1 rounded-full">{tag}</span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-start gap-6 pt-4 border-t dark:border-border">
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-2 transition-colors text-sm font-semibold group/btn ${showComments ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
        >
          <div className={`p-1.5 rounded-lg transition-colors ${showComments ? 'bg-primary/10' : 'group-hover/btn:bg-primary/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          {commentsCount} {t('posts')}
        </button>
        <button
          onClick={() => setShowComments(true)}
          className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors text-sm font-semibold group/btn"
        >
          <div className="p-1.5 rounded-lg group-hover/btn:bg-primary/5 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </div>
          {t('writeReply')}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-6 pt-6 border-t dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-4 mb-6">
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${['admin', 'official', 'authority'].includes(comment.author_role) ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                    {comment.author_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className={`flex-1 rounded-2xl p-3 ${['admin', 'official', 'authority'].includes(comment.author_role) ? 'bg-primary/10 border border-primary/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{comment.author_name}</span>
                        {['admin', 'official', 'authority'].includes(comment.author_role) && (
                          <span className="px-1.5 py-0.5 bg-primary text-white text-[8px] font-bold rounded uppercase tracking-tighter">
                            {t('fieldOfficial')}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm ">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-gray-500 py-4 italic">{t('noComments')}</p>
            )}
          </div>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="flex gap-3">
            <input
              type="text"
              placeholder={t('writeReply')}
              className="flex-1 bg-surface-2 border-none rounded-full px-5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="p-2.5 bg-primary text-white rounded-full hover:bg-primary-dark disabled:opacity-50 transition-all active:scale-90"
            >
              {submitting ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9-2-9-18-9 18 9 2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;
