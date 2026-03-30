"use client";
import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 transition-colors duration-200">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Side: Welcome & Description */}
        <div className="space-y-8 animate-fade-in">
          <div className="space-y-6">
            <h1 className="text-6xl md:text-7xl font-outfit font-extrabold text-text leading-tight tracking-tight">
              Welcome to <br />
              <span className="text-primary italic">Civic</span>FIX
            </h1>
            <p className="text-xl text-muted leading-relaxed max-w-md font-inter">
              Your platform for transparent civic reporting. Connect with your community and help resolve issues faster than ever.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            <Link 
              href="/dashboard"
              className="px-8 py-5 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] hover:shadow-2xl transition-all active:scale-[0.98] flex-1 text-center font-outfit"
            >
              Continue as Citizen
            </Link>
            <Link 
              href="/login"
              className="px-8 py-5 bg-surface text-text font-bold rounded-2xl border border-border hover:bg-surface-2 transition-all active:scale-[0.98] flex-1 text-center font-outfit shadow-sm"
            >
              Continue as Admin
            </Link>
          </div>

          <div className="pt-10 grid grid-cols-3 gap-6">
            {[
              { label: 'Verified', color: 'bg-success' },
              { label: 'Secure', color: 'bg-primary' },
              { label: 'Fast', color: 'bg-warning' }
            ].map((tag) => (
              <div key={tag.label} className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${tag.color} shadow-sm`}></div>
                <span className="text-xs font-bold text-muted uppercase tracking-widest">{tag.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Visual */}
        <div className="relative group hidden lg:block">
          <div className="absolute -inset-6 bg-primary/20 rounded-[48px] blur-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-1000"></div>
          <div className="relative bg-surface rounded-[48px] p-10 shadow-card border border-border overflow-hidden transform transition-all duration-700 hover:rotate-3 hover:scale-[1.03] group hover:shadow-2xl">
            <div className="w-full h-84 bg-surface-2 rounded-3xl overflow-hidden mb-8 shadow-inner relative">
               <img 
                 src="/logo.jpeg" 
                 alt="Community Collaboration" 
                 className="w-full h-full object-cover  transition-all duration-1000 scale-105 group-hover:scale-100"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent"></div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Platform Status</p>
              <p className="text-2xl font-outfit font-bold text-text">Active and Online</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
