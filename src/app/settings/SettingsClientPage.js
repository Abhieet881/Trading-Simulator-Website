'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, User, Wallet, Award, Settings, 
  Lock, AlertTriangle, ShieldAlert, CheckCircle2, 
  HelpCircle, Eye, EyeOff, Info, ArrowRight, Loader2
} from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function SettingsClientPage({
  userId,
  initialName,
  initialEmail,
  initialCreatedAt,
  initialPlanType,
  initialBalance,
  initialConfiguredBalance = 10000.00
}) {
  const [name, setName] = useState(initialName);
  const [balance, setBalance] = useState(initialBalance);
  
  // Settings preferences
  const [defaultOrderType, setDefaultOrderType] = useState('Market');
  const [showTpsl, setShowTpsl] = useState(false);

  // States for actions
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [resettingBalance, setResettingBalance] = useState(false);
  
  // Modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
    }, 4500);
  };

  // Format creation date deterministically to prevent hydration mismatch
  const getFormattedDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch (e) {
      return 'July 2026';
    }
  };

  // 1. Save Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty.', 'info');
      return;
    }
    setUpdatingProfile(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Profile updated', 'success');
      } else {
        showToast(data.error || 'Failed to update profile.', 'info');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating profile settings.', 'info');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // 2. Reset Virtual Balance
  const handleResetBalance = async () => {
    setResettingBalance(true);
    setShowResetModal(false);
    try {
      const res = await fetch('/api/settings/reset', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.newBalance);
        showToast(`Virtual balance reset to $${data.newBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'success');
      } else {
        showToast(data.error || 'Failed to reset balance.', 'info');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to reset account balance.', 'info');
    } finally {
      setResettingBalance(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between font-sans text-gray-800">
      {/* Toast Alert */}
      {toast.visible && (
        <div className="fixed top-20 right-6 z-[200] animate-fade-in">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.05)] bg-white text-gray-800">
            {toast.type === 'info' ? (
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#089981] shrink-0" />
            )}
            <span className="text-xs font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      <Navbar userName={name} />

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-6 py-10 flex-grow w-full">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-[#6B7280] mt-1.5 font-medium">
            Manage your account and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* 1. PROFILE SECTION CARD */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#2563EB]" /> Profile Settings
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] font-medium"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Email Address
                </label>
                <div className="relative group">
                  <input 
                    type="email" 
                    value={initialEmail}
                    readOnly
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50/50 font-medium cursor-not-allowed pr-10"
                    title="Email cannot be changed"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center cursor-not-allowed" title="Email cannot be changed">
                    <Lock className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-semibold mt-1 flex items-center gap-1 select-none">
                  Email is bound to your authentication and cannot be changed.
                </p>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-gray-100">
                <span className="text-xs text-gray-500 font-semibold">
                  Member since {getFormattedDate(initialCreatedAt)}
                </span>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {updatingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 2. ACCOUNT & PLAN SECTION CARD */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#2563EB]" /> Account & Plan
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Current Plan</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#2563EB] border border-blue-100 select-none">
                  {initialPlanType === 'free' ? 'Free User' : 'Premium'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Account Balance</span>
                <span className="text-sm font-mono font-bold text-gray-900">
                  ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </span>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => showToast('Premium plans coming soon', 'info')}
                  className="bg-white border border-[#2563EB] hover:bg-[#2563EB] text-[#2563EB] hover:text-white font-semibold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer shadow-sm select-none"
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>
          </div>

          {/* 3. TRADING PREFERENCES CARD */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#2563EB]" /> Trading Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Default Order Type
                </label>
                <select
                  value={defaultOrderType}
                  onChange={(e) => setDefaultOrderType(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white font-medium cursor-pointer"
                >
                  <option value="Market">Market (Execute instantly at current rate)</option>
                  <option value="Limit">Limit / Pending (Set a trigger threshold)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5 pr-4">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide select-none cursor-pointer" htmlFor="tpsl-toggle">
                    Show TP/SL by default in trade panel
                  </label>
                  <p className="text-[10px] text-gray-400 font-semibold select-none">
                    Automatically expand Take Profit and Stop Loss toggles when opening a new order panel.
                  </p>
                </div>
                <input 
                  type="checkbox"
                  id="tpsl-toggle"
                  checked={showTpsl}
                  onChange={(e) => setShowTpsl(e.target.checked)}
                  className="w-4 h-4 accent-[#2563EB] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 4. DANGER ZONE SECTION CARD */}
          <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-[0_2px_8px_rgba(220,38,38,0.04)] select-none">
            <h2 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" /> Danger Zone
            </h2>
            <p className="text-xs text-gray-400 font-semibold mb-4">
              Actions below are irreversible. Please perform them with caution.
            </p>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-3 border-b border-gray-50">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">Reset Virtual Balance</span>
                  <p className="text-[10px] text-gray-400 font-semibold">
                    Set your account back to ${initialConfiguredBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} and close all open positions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  disabled={resettingBalance}
                  className="bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer"
                >
                  {resettingBalance ? 'Resetting...' : 'Reset Balance'}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">Delete Account</span>
                  <p className="text-[10px] text-gray-400 font-semibold">
                    Permanently delete all your virtual trades, profile, and settings from PaperPulse.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-6 select-none">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-semibold">
          <span>&copy; 2026 PaperPulse Trading Terminal. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/dashboard" className="hover:text-gray-600">Terminal</Link>
            <span>&bull;</span>
            <Link href="/dashboard" className="hover:text-gray-600">Privacy Policy</Link>
          </div>
        </div>
      </footer>

      {/* RESET BALANCE MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[300] p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 select-none">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Reset Account?</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">
              This will reset your balance to ${initialConfiguredBalance.toLocaleString('en-US')} and close all open positions. This cannot be undone. Are you sure?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetBalance}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[300] p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 select-none">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Account?</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">
              Contact support to delete your account. To prevent accidental data loss, standard accounts cannot be deleted directly during this development stage.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-black text-white hover:bg-gray-800 rounded-lg text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
