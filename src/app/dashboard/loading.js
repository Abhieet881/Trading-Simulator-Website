import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between">
      {/* Header skeleton */}
      <header className="border-b border-[#E5E7EB] bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <TrendingUp className="text-gray-300 w-4.5 h-4.5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-300">PaperPulse</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-24 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
            <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Main Content skeleton */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-grow w-full">
        {/* Welcome Header skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded-md w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded-md w-32"></div>
        </div>

        {/* Stats Row skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="h-4 bg-gray-200 rounded-md w-24"></div>
                <div className="w-8 h-8 rounded-lg bg-gray-100"></div>
              </div>
              <div className="h-7 bg-gray-200 rounded-md w-28 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded-md w-16"></div>
            </div>
          ))}
        </div>

        {/* Main Content empty state skeleton */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 md:p-16 text-center max-w-2xl mx-auto shadow-[0_1px_3px_rgba(0,0,0,0.06)] mb-10 animate-pulse">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-6"></div>
          <div className="h-6 bg-gray-200 rounded-md w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded-md w-72 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded-md w-56 mx-auto mb-8"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-36 mx-auto"></div>
        </div>

        {/* Asset cards skeleton */}
        <div className="border-t border-[#E5E7EB] pt-8 animate-pulse">
          <div className="h-6 bg-gray-200 rounded-md w-44 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div className="h-4 bg-gray-200 rounded-md w-16 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded-md w-20 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded-md w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer skeleton */}
      <footer className="text-center text-xs text-gray-300 py-6 border-t border-[#E5E7EB]">
        &copy; {new Date().getFullYear()} PaperPulse. All rights reserved.
      </footer>
    </div>
  );
}
