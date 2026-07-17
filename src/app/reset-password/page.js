'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();

  // Form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Error states
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Client-side validation
  const validate = () => {
    const newErrors = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm Password is required';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/login?message=Your password has been reset successfully. Please log in with your new password.');
        router.refresh();
      } else {
        setApiError(data.error || 'Failed to reset password. Session may have expired. Try requesting a new link.');
      }
    } catch (err) {
      setApiError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Logo */}
      <div className="flex justify-center mb-6">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <TrendingUp className="text-white w-4.5 h-4.5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-[#111111]">PaperPulse</span>
        </Link>
      </div>

      {/* Main card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-[420px] bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[#111111]">Choose new password</h2>
          <p className="text-sm text-[#6B7280] mt-1">Please enter your new password below</p>
        </div>

        {/* API Level Error Banner */}
        {apiError && (
          <div className="mb-5 flex items-start gap-2.5 text-sm font-semibold text-[#DC2626] bg-[#DC2626]/10 px-4 py-3 rounded-lg border border-[#DC2626]/20 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#DC2626]" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-[#6B7280]" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: null }));
                }}
                className={`w-full pl-11 pr-10 py-3 bg-white border ${
                  errors.password ? 'border-[#DC2626]' : 'border-[#E5E7EB]'
                } rounded-lg focus:border-[#2563EB] focus:outline-none transition-all text-sm`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-[#6B7280] hover:text-[#111111]"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            {errors.password && <span className="text-xs text-[#DC2626] font-medium">{errors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-[#6B7280]" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: null }));
                }}
                className={`w-full pl-11 pr-10 py-3 bg-white border ${
                  errors.confirmPassword ? 'border-[#DC2626]' : 'border-[#E5E7EB]'
                } rounded-lg focus:border-[#2563EB] focus:outline-none transition-all text-sm`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3.5 text-[#6B7280] hover:text-[#111111]"
              >
                {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            {errors.confirmPassword && <span className="text-xs text-[#DC2626] font-medium">{errors.confirmPassword}</span>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all text-base mt-2 flex items-center justify-center disabled:opacity-50 gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-[#9CA3AF] mt-8">
        &copy; {new Date().getFullYear()} PaperPulse. All rights reserved.
      </div>
    </div>
  );
}
