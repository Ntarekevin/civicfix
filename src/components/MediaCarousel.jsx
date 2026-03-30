"use client";
import React, { useState } from 'react';
import { useLanguage } from '../store/LanguageContext';

export default function MediaCarousel({ media }) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const goToSlide = (e, index) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div className="relative group/carousel w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 shadow-inner mb-6">
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {media.map((item, i) => {
          const url = item.file_url || item.url;
          const isVideo = url && url.match(/\.(mp4|webm|ogg|mov)$|^data:video/i);
          return (
            <div key={i} className="min-w-full h-full relative">
              {isVideo ? (
                <video
                  src={item.file_url || item.url}
                  controls
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <img
                  src={item.file_url || item.url}
                  alt={`${t('proof')} ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {media.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-black/50 transition-all opacity-0 group-hover/carousel:opacity-100 -translate-x-2 group-hover/carousel:translate-x-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-black/50 transition-all opacity-0 group-hover/carousel:opacity-100 translate-x-2 group-hover/carousel:translate-x-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Indicators */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {media.map((_, i) => (
            <button
              key={i}
              onClick={(e) => goToSlide(e, i)}
              className={`w-2 h-2 rounded-full transition-all ${currentIndex === i
                  ? 'bg-white w-4'
                  : 'bg-white/40 hover:bg-white/60'
                }`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter Overlay */}
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/10 opacity-0 group-hover/carousel:opacity-100 transition-opacity">
        {currentIndex + 1} / {media.length}
      </div>
    </div>
  );
}
