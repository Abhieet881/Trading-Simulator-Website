'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Menu, X, ChevronDown, RotateCcw, Plus, Wallet, ShieldAlert, Pencil } from 'lucide-react';
import UserDropdown from '@/app/dashboard/UserDropdown';

export default function Navbar({ userName }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAccountPreset, setNewAccountPreset] = useState(10000);
  const [customAmount, setCustomAmount] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Renaming states
  const [renamingWalletId, setRenamingWalletId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameError, setRenameError] = useState('');

  // Balance setting states
  const [isBalanceSettingsOpen, setIsBalanceSettingsOpen] = useState(false);
  const [selectedAdjustPreset, setSelectedAdjustPreset] = useState(10000);
  const [customAdjustAmount, setCustomAdjustAmount] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  const handleAdjustBalanceSubmit = async (e) => {
    e.preventDefault();
    setAdjustError('');

    let amount = selectedAdjustPreset;
    if (customAdjustAmount) {
      const parsed = parseFloat(customAdjustAmount);
      if (isNaN(parsed) || parsed < 100 || parsed > 1000000) {
        setAdjustError('Please enter an amount between $100 and $1,000,000.');
        return;
      }
      amount = parsed;
    }

    setAdjusting(true);
    try {
      const res = await fetch('/api/wallets/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, name: accountData?.accountName || '' }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsBalanceSettingsOpen(false);
        window.location.reload();
      } else {
        setAdjustError(data.error || 'Failed to update balance.');
      }
    } catch (err) {
      console.error(err);
      setAdjustError('A network error occurred. Please try again.');
    } finally {
      setAdjusting(false);
    }
  };

  const accountDropdownRef = useRef(null);

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

  useEffect(() => {
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

  const handleSwitchAccount = async (walletId) => {
    try {
      const res = await fetch('/api/user/account/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to switch account.');
      }
    } catch (err) {
      console.error('Error switching account:', err);
      alert('Failed to switch account.');
    }
  };

  const handleRenameClick = (e, walletId, currentName) => {
    e.stopPropagation();
    setIsAccountDropdownOpen(false);
    setRenamingWalletId(walletId);
    setRenameValue(currentName || '');
    setRenameError('');
    setIsRenameModalOpen(true);
  };

  const submitRenameAccount = async (e) => {
    e.preventDefault();
    setRenameError('');

    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenameError('Account name cannot be empty.');
      return;
    }
    if (trimmed.length > 30) {
      setRenameError('Account name cannot exceed 30 characters.');
      return;
    }

    if (!renamingWalletId) return;

    try {
      const res = await fetch('/api/user/account/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId: renamingWalletId, name: trimmed })
      });
      if (res.ok) {
        setIsRenameModalOpen(false);
        window.location.reload();
      } else {
        const data = await res.json();
        setRenameError(data.error || 'Failed to rename account.');
      }
    } catch (err) {
      console.error('Error renaming account:', err);
      setRenameError('Failed to rename account.');
    }
  };

  const handleResetBalance = async () => {
    const confirmed = window.confirm(
      "This will reset your balance and clear all open positions for this demo account. History will be kept. Continue?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/settings/reset', { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reset balance.');
      }
    } catch (err) {
      console.error('Error resetting balance:', err);
      alert('Failed to reset balance.');
    }
  };

  const handleCreateAccountSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    let amount = newAccountPreset;
    if (customAmount) {
      const parsed = parseFloat(customAmount);
      if (isNaN(parsed) || parsed < 100 || parsed > 1000000) {
        setCreateError('Please enter an amount between $100 and $1,000,000.');
        return;
      }
      amount = parsed;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/user/account/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, name: newAccountName })
      });
      const data = await res.json();

      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewAccountName('');
        window.location.reload();
      } else {
        setCreateError(data.error || 'Failed to create new demo account.');
      }
    } catch (err) {
      console.error(err);
      setCreateError('A network error occurred. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const links = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Trade', href: '/trade' },
    { label: 'History', href: '/history' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Competitions', href: '/competitions' },
  ];

  return (
    <>
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
            {/* Wallet Balance Display */}
            {accountData && (
              <button
                onClick={() => {
                  const currentBal = accountData.balance || 10000;
                  if ([1000, 5000, 10000, 25000, 50000, 100000].includes(currentBal)) {
                    setSelectedAdjustPreset(currentBal);
                    setCustomAdjustAmount('');
                  } else {
                    setSelectedAdjustPreset(0);
                    setCustomAdjustAmount(String(currentBal));
                  }
                  setAdjustError('');
                  setIsBalanceSettingsOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB]/10 hover:bg-[#2563EB]/15 text-[#2563EB] rounded-lg text-sm font-bold transition-all cursor-pointer border border-[#2563EB]/10 select-none"
                title="Adjust Balance"
              >
                <Wallet className="w-4 h-4 text-[#2563EB]" />
                <span>
                  ${accountData.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </button>
            )}

            {/* Account Details Dropdown */}
            {accountData && (
              <div className="relative hidden sm:block" ref={accountDropdownRef}>
                <button 
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-lg text-sm text-[#4B5563] hover:text-[#111111] font-semibold transition-all cursor-pointer select-none border border-transparent hover:border-gray-200"
                >
                  <span>
                    {accountData.accountName ? `${accountData.accountName} — ` : ''}Demo #{accountData.accountNumber}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAccountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E7EB] rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] p-4 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 select-none">
                    
                    {/* Account Switcher Header */}
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Practice Accounts</span>
                      <span className="text-[10px] font-semibold text-gray-500">{accountData.accounts?.length} / {accountData.maxLimit}</span>
                    </div>

                    {/* Accounts List */}
                    <div className="space-y-1 mb-3 max-h-48 overflow-y-auto pr-1">
                      {accountData.accounts?.map((acc) => (
                        <div
                          key={acc.id}
                          onClick={() => !acc.isActive && handleSwitchAccount(acc.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                            acc.isActive
                              ? 'bg-[#2563EB]/5 border-[#2563EB]/25 text-[#2563EB]'
                              : 'hover:bg-gray-50 border-transparent text-gray-700 cursor-pointer'
                          }`}
                        >
                          <div className="flex flex-col select-none">
                            <span className="text-xs font-bold font-mono">
                              {acc.accountName ? `${acc.accountName} — ` : ''}Demo #{acc.accountNumber}
                            </span>
                            <span className={`text-[10px] font-semibold font-mono ${acc.isActive ? 'text-[#2563EB]/80' : 'text-gray-500'}`}>
                              ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleRenameClick(e, acc.id, acc.accountName)}
                              className="p-1.5 hover:bg-gray-200/60 rounded text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Rename Account"
                            >
                              <Pencil className="w-3.5 h-3.5 pointer-events-none" />
                            </button>
                            {acc.isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Buttons Section */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      {/* "+ New Demo Account" option */}
                      {!accountData.limitReached ? (
                        <button
                          onClick={() => {
                            setIsAccountDropdownOpen(false);
                            setIsCreateModalOpen(true);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-bold text-[#2563EB] transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          New Demo Account
                        </button>
                      ) : (
                        <div className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200/50 rounded-lg p-2 text-center">
                          Account limit reached ({accountData.maxLimit}/{accountData.maxLimit})
                        </div>
                      )}

                      {/* "Reset Balance" option */}
                      <button
                        onClick={handleResetBalance}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 rounded-lg text-xs font-bold text-[#DC2626] transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset Balance
                      </button>
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

      {/* Modal for creating a new demo account */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 max-w-md w-full shadow-2xl select-none animate-in scale-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#2563EB]" />
                New Practice Account
              </h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateAccountSubmit} className="space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  {createError}
                </div>
              )}

              {/* Account Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Account Name (Optional)</label>
                <input
                  type="text"
                  maxLength="50"
                  placeholder="e.g. Scalping Practice, Gold Strategy"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                />
              </div>

              {/* Preset Balances */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Starting Capital</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { value: 1000, label: '$1,000' },
                    { value: 5000, label: '$5,000' },
                    { value: 10000, label: '$10,000' },
                    { value: 25000, label: '$25,000' },
                    { value: 50000, label: '$50,000' },
                    { value: 100000, label: '$100,000' }
                  ].map((preset) => {
                    const isSelected = newAccountPreset === preset.value && !customAmount;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => {
                          setNewAccountPreset(preset.value);
                          setCustomAmount('');
                          setCreateError('');
                        }}
                        className={`py-2 px-3 border rounded-xl font-mono font-bold text-xs transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB] shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Starting Capital */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Or Custom Amount (USD)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-mono font-bold text-xs">$</span>
                  <input
                    type="number"
                    min="100"
                    max="1000000"
                    placeholder="Min $100 - Max $1,000,000"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setNewAccountPreset(0);
                      setCreateError('');
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl pl-7 pr-3.5 py-2.5 text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer text-center"
                >
                  {creating ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for renaming an account */}
      {isRenameModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 max-w-sm w-full shadow-2xl select-none animate-in scale-in duration-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Rename Account</h3>
            <form onSubmit={submitRenameAccount} className="space-y-4">
              {renameError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 animate-bounce" />
                  {renameError}
                </div>
              )}
              <input
                type="text"
                maxLength="30"
                placeholder="e.g. Gold Strategy Test"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(false)}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* BALANCE SETTINGS MODAL */}
      {isBalanceSettingsOpen && accountData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[300] p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 select-none">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Adjust Account Balance</h3>
            <p className="text-xs text-gray-400 font-semibold mb-4">
              Set a new virtual capital for {accountData.accountName || `Demo #${accountData.accountNumber}`}.
            </p>
            <form onSubmit={handleAdjustBalanceSubmit} className="space-y-4">
              {adjustError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 animate-bounce" />
                  {adjustError}
                </div>
              )}
              {/* Presets Grid */}
              <div className="grid grid-cols-3 gap-2">
                {[1000, 5000, 10000, 25000, 50000, 100000].map((presetVal) => {
                  const isSelected = selectedAdjustPreset === presetVal && !customAdjustAmount;
                  return (
                    <button
                      key={presetVal}
                      type="button"
                      onClick={() => {
                        setSelectedAdjustPreset(presetVal);
                        setCustomAdjustAmount('');
                      }}
                      className={`py-2 px-1 border rounded-lg font-mono font-bold text-xs transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      ${presetVal.toLocaleString()}
                    </button>
                  );
                })}
              </div>
              {/* Custom Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custom Amount</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-mono font-bold text-xs">$</span>
                  <input
                    type="number"
                    min="100"
                    max="1000000"
                    placeholder="Min $100 - Max $1M"
                    value={customAdjustAmount}
                    onChange={(e) => {
                      setCustomAdjustAmount(e.target.value);
                      setSelectedAdjustPreset(0);
                    }}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-6 pr-3 py-2 text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                  />
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsBalanceSettingsOpen(false)}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {adjusting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
