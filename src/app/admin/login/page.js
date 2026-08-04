'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  // Error states
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Initial Check: Redirect to admin if they already have the admin_verified cookie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAlreadyVerified = document.cookie
        .split('; ')
        .find(row => row.startsWith('admin_verified='))
        ?.split('=')[1] === 'true';

      if (isAlreadyVerified) {
        router.push('/admin');
        return;
      }
      setCheckingSession(false);
    }

    // Check query params for errors
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      const msg = params.get('message');
      if (err) {
        setApiError(err);
      }
      if (msg) {
        setSuccessMessage(msg);
      }
    }
  }, [router]);

  // Client-side validation
  const validate = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email Address is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      // Step A: Standard login
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const loginData = await loginRes.json();
      
      if (!loginRes.ok || !loginData.success) {
        setApiError(loginData.error || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      // Step B: Verify if the user has admin privileges
      const adminCheckRes = await fetch('/api/auth/admin-check');
      if (adminCheckRes.ok) {
        const adminCheckData = await adminCheckRes.json();
        if (adminCheckData.authenticated && adminCheckData.isAdmin) {
          // Set the cookie to remember admin verification
          document.cookie = "admin_verified=true; path=/; max-age=86400; SameSite=Lax";
          
          // Success! Redirect to /admin
          router.push('/admin');
          router.refresh();
        } else {
          // Access denied: user logged in but is NOT an admin
          setApiError('Access denied: Your account does not have administrator privileges.');
          
          document.cookie = "admin_verified=; path=/; max-age=0; SameSite=Lax";
          
          // Log out this session immediately so we don't leave them logged in as a normal user on admin subpages
          await fetch('/api/auth/logout', { method: 'POST' });
          setLoading(false);
        }
      } else {
        setApiError('Failed to verify admin status. Please try again.');
        document.cookie = "admin_verified=; path=/; max-age=0; SameSite=Lax";
        await fetch('/api/auth/logout', { method: 'POST' });
        setLoading(false);
      }
    } catch (err) {
      setApiError('A network error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-[#E2E8F0] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center animate-pulse">
            <TrendingUp className="text-blue-400 w-6 h-6 animate-bounce" />
          </div>
          <p className="text-sm font-medium text-gray-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-[#E2E8F0] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Background radial glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Top Logo */}
      <div className="flex justify-center mb-6 z-10">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
            <TrendingUp className="text-white w-5 h-5" />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="font-bold text-lg tracking-tight text-white">PaperPulse</span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mt-0.5">Admin Portal</span>
          </div>
        </Link>
      </div>

      {/* Main card with glassmorphism */}
      <div className="sm:mx-auto sm:w-full sm:max-w-[420px] bg-[#111827]/60 backdrop-blur-xl rounded-2xl border border-gray-800 shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 z-10">
        <div className="mb-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
            <ShieldCheck className="text-blue-400 w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Admin Authentication</h2>
          <p className="text-sm text-gray-400 mt-1">Sign in with authorized administrator credentials</p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-5 flex items-start gap-2.5 text-sm font-medium text-emerald-400 bg-emerald-950/20 px-4 py-3 rounded-lg border border-emerald-500/20 animate-fade-in">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {apiError && (
          <div className="mb-5 flex items-start gap-2.5 text-sm font-medium text-red-400 bg-red-950/20 px-4 py-3 rounded-lg border border-red-500/20 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-500" />
              <input
                type="email"
                placeholder="admin@paperpulse.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                }}
                className={`w-full pl-11 pr-4 py-3 bg-[#0D1321] border ${
                  errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-gray-800 focus:border-blue-500'
                } rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all text-sm`}
              />
            </div>
            {errors.email && <span className="text-xs text-red-400 font-medium">{errors.email}</span>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: null }));
                }}
                className={`w-full pl-11 pr-10 py-3 bg-[#0D1321] border ${
                  errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-gray-800 focus:border-blue-500'
                } rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all text-sm`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            {errors.password && <span className="text-xs text-red-400 font-medium">{errors.password}</span>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all text-base mt-2 flex items-center justify-center disabled:opacity-50 gap-2 cursor-pointer border border-blue-500/20"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Authenticating...
              </>
            ) : (
              'Access Admin Portal'
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 text-center border-t border-gray-800/80 pt-5">
          <Link href="/dashboard" className="text-xs font-medium text-gray-500 hover:text-blue-400 transition-colors">
            Return to User Dashboard
          </Link>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-gray-600 mt-8 z-10">
        &copy; {new Date().getFullYear()} PaperPulse. Admin Access Only.
      </div>
    </div>
  );
}
