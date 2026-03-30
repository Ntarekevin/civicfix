"use client";
import React, { useEffect } from 'react';
import { useLanguage } from '../store/LanguageContext';

const MediaModal = ({ media, onClose }) => {
  const { t } = useLanguage();
  if (!media) return null;

  const url = media.file_url || media.url;
  const isVideo = url && url.match(/\.(mp4|webm|ogg|mov)$|^data:video/i) || media.type?.startsWith('video');

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-10 animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110]"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Media Container */}
      <div
        className="relative max-w-5xl w-full max-h-full flex items-center justify-center animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={media.file_url || media.url}
            controls
            autoPlay
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/10"
          />
        ) : (
          <img
            src={media.file_url || media.url}
            alt="Full size proof"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
          />
        )}

        {/* Caption */}
        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <p className="text-white/60 text-sm font-medium">{t('clickOutsideToClose')}</p>
        </div>
      </div>
    </div>
  );
};

export default MediaModal;
