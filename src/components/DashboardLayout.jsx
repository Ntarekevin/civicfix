"use client";
import React from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-bg transition-colors duration-200">
      {/* Left Sidebar */}
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation */}
        <TopNav />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto flex gap-6">
            {/* Left Column (Feed) */}
            <div className="flex-1 space-y-6">
              {children}
            </div>

            {/* Right Sidebar (Optional - can be passed as children or handled here) */}
          </div>
        </main>
      </div>
    </div>
  );
}
