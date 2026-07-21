'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Send, Key } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

// Initialize the client-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  // Flow steps: 'email', 'otp', 'password'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  // Error states
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Handle countdown for resend timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Client-side validations
  const validateEmail = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email Address is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCode = () => {
    const newErrors = {};
    if (!code.trim()) {
      newErrors.code = 'Verification code is required';
    } else if (code.trim().length !== 6) {
      newErrors.code = 'Code must be exactly 6 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
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

  // Submit email (Step 1)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    if (!validateEmail()) return;
    
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setStep('otp');
        setResendCooldown(30); // 30 seconds cooldown
        setResendSuccess(false);
      } else {
        setApiError(data.error || 'Failed to send reset code. Please try again.');
      }
    } catch (err) {
      setApiError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend code (inside Step 2)
  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    
    setApiError('');
    setResendSuccess(false);
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setResendSuccess(true);
        setResendCooldown(30);
      } else {
        setApiError(data.error || 'Failed to resend code. Please try again.');
      }
    } catch (err) {
      setApiError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP code (Step 2)
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setResendSuccess(false);

    if (!validateCode()) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: 'recovery',
      });

      if (error) {
        console.error('OTP Verification Error:', error);
        setApiError('Invalid or expired code, please try again.');
      } else {
        setStep('password');
      }
    } catch (err) {
      console.error('Unexpected OTP Verification Error:', err);
      setApiError('An error occurred during verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update password (Step 3)
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validatePassword()) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setApiError(error.message);
      } else {
        // Sign out user client-side so they must log in with their new password
        await supabase.auth.signOut();
        router.push('/login?message=Your password has been reset successfully. Please log in with your new password.');
        router.refresh();
      }
    } catch (err) {
      console.error('Reset password error:', err);
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
        
        {/* Step 1: Request Password Reset */}
        {step === 'email' && (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-[#111111]">Reset password</h2>
              <p className="text-sm text-[#6B7280] mt-1">We'll send you a 6-digit code to reset your password</p>
            </div>

            {/* API Level Error Banner */}
            {apiError && (
              <div className="mb-5 flex items-start gap-2.5 text-sm font-semibold text-[#DC2626] bg-[#DC2626]/10 px-4 py-3 rounded-lg border border-[#DC2626]/20 animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#DC2626]" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-[#6B7280]" />
                  <input
                    type="email"
                    placeholder="e.g. johndoe@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                    }}
                    className={`w-full pl-11 pr-4 py-3 bg-white border ${
                      errors.email ? 'border-[#DC2626]' : 'border-[#E5E7EB]'
                    } rounded-lg focus:border-[#2563EB] focus:outline-none transition-all text-sm`}
                  />
                </div>
                {errors.email && <span className="text-xs text-[#DC2626] font-medium">{errors.email}</span>}
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
                    Sending Code...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>

            {/* Back to Login Link */}
            <div className="mt-6 text-center border-t border-[#E5E7EB] pt-5">
              <Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-sm text-[#2563EB] hover:underline">
                <ArrowLeft className="w-4 h-4" /> Back to Log In
              </Link>
            </div>
          </>
        )}

        {/* Step 2: Code Verification */}
        {step === 'otp' && (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-[#111111]">Verify Code</h2>
              <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">
                Enter the 6-digit code sent to <span className="font-semibold text-[#111111]">{email}</span>
              </p>
            </div>

            {/* API Level Error Banner */}
            {apiError && (
              <div className="mb-5 flex items-start gap-2.5 text-sm font-semibold text-[#DC2626] bg-[#DC2626]/10 px-4 py-3 rounded-lg border border-[#DC2626]/20 animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#DC2626]" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Resend Success Banner */}
            {resendSuccess && (
              <div className="mb-5 flex items-start gap-2.5 text-sm font-semibold text-[#16A34A] bg-[#16A34A]/10 px-4 py-3 rounded-lg border border-[#16A34A]/20 animate-fade-in">
                <Send className="w-5 h-5 flex-shrink-0 text-[#16A34A]" />
                <span>Verification code resent successfully.</span>
              </div>
            )}

            <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
              {/* OTP Code */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Verification Code</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-[#6B7280]" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, ''));
                      if (errors.code) setErrors(prev => ({ ...prev, code: null }));
                    }}
                    className={`w-full pl-11 pr-4 py-3 bg-white border ${
                      errors.code ? 'border-[#DC2626]' : 'border-[#E5E7EB]'
                    } rounded-lg focus:border-[#2563EB] focus:outline-none transition-all text-sm tracking-[0.2em] font-mono text-center text-lg`}
                  />
                </div>
                {errors.code && <span className="text-xs text-[#DC2626] font-medium">{errors.code}</span>}
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
                    Verifying Code...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>

              {/* Cooldown timer & Resend button */}
              <div className="text-center text-sm mt-2">
                {resendCooldown > 0 ? (
                  <span className="text-[#6B7280]">Resend code in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-[#2563EB] hover:underline font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </form>

            {/* Back button to email step */}
            <div className="mt-6 text-center border-t border-[#E5E7EB] pt-5">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="inline-flex items-center gap-1.5 font-semibold text-sm text-[#2563EB] hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Use different email
              </button>
            </div>
          </>
        )}

        {/* Step 3: Choose New Password */}
        {step === 'password' && (
          <>
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

            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
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
          </>
        )}

      </div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-[#9CA3AF] mt-8">
        &copy; {new Date().getFullYear()} PaperPulse. All rights reserved.
      </div>
    </div>
  );
}
