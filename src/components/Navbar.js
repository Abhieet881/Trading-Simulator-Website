'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Menu, X } from 'lucide-react';
import UserDropdown from '@/app/dashboard/UserDropdown';

export default function Navbar({ userName }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Trade', href: '/trade' },
    { label: 'History', href: '/history' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Competitions', href: '/competitions' },
  ];

  return (
    <header className="border-b border-[#E5E7EB] bg-white sticky top-0 z-50 shadow-sm select-none">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <TrendingUp className="text-white w-4.5 h-4.5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-[#111111]">PaperPulse</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors ${
                  isActive ? 'text-[#2563EB]' : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile / Hamburger */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <UserDropdown userName={userName} />
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Nav Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5E7EB] bg-white px-6 py-4 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col gap-3">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'text-[#6B7280] hover:text-[#111111] hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          
          <hr className="border-[#E5E7EB]" />
          
          {/* User profile dropdown inside mobile view */}
          <div className="py-2">
            <UserDropdown userName={userName} />
          </div>
        </div>
      )}
    </header>
  );
}
