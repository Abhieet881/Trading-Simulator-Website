'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

export default function UserDropdown({ userName }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-lg text-sm text-[#4B5563] hover:text-[#111111] font-semibold transition-all cursor-pointer select-none border border-transparent hover:border-gray-200"
      >
        <User className="w-4 h-4 text-[#6B7280]" />
        <span>{userName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E7EB] rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] py-1.5 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#4B5563] hover:text-[#111111] hover:bg-[#F3F4F6] font-medium transition-all"
          >
            <Settings className="w-4 h-4 text-[#6B7280]" />
            Settings
          </Link>

          <hr className="border-[#E5E7EB] my-1.5" />

          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 font-medium transition-all cursor-pointer text-left disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 text-red-500 shrink-0" />
            {loading ? 'Logging out...' : 'Log Out'}
          </button>
        </div>
      )}
    </div>
  );
}
