'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Menu, X, ChevronDown } from 'lucide-react';
import UserDropdown from '@/app/dashboard/UserDropdown';

export default function Navbar({ userName }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef(null);

  useEffect(() => {
    async function fetchAccountDetails() {
      try {
        const res = await fetch('/api/user/account');
        if (res.ok) {
          const data = await res.json();
          setAccountData(data);
        }
      } catch (err) {
        console.error('Failed to fetch account info in navbar:', err);
      }
    }
    fetchAccountDetails();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setIsAccountDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        <div className="flex items-center gap-3">
          {/* Account Details Dropdown */}
          {accountData && (
            <div className="relative hidden sm:block" ref={accountDropdownRef}>
              <button 
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-lg text-sm text-[#4B5563] hover:text-[#111111] font-semibold transition-all cursor-pointer select-none border border-transparent hover:border-gray-200"
              >
                <span>Demo #{accountData.accountNumber}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAccountDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] p-4 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 select-none">
                  <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Trading Account</span>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-[9px] font-bold text-green-600 uppercase tracking-wider">Active</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-semibold">Account Type</span>
                      <span className="text-gray-900 font-bold">Demo Account</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-semibold">Account ID</span>
                      <span className="text-gray-900 font-mono font-semibold">#{accountData.accountNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-semibold">Current Balance</span>
                      <span className="text-gray-900 font-bold font-mono text-[#10B981]">
                        ${accountData.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
