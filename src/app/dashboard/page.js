import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, User, Mail, Wallet, Award, CheckCircle, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import LogoutButton from './LogoutButton';

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Resolve authenticated user from Supabase Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 2. Resolve user details from public.users table
  const { data: dbUser } = await supabase
    .from('users')
    .select('name, email, plan_type')
    .eq('id', user.id)
    .single();

  // Fallback to auth metadata if profile is not fully replicated yet
  const displayName = dbUser?.name || user.user_metadata?.name || 'User';
  const displayEmail = dbUser?.email || user.email;
  const planType = dbUser?.plan_type || 'free';

  // 3. Resolve wallet balance from public.wallets table
  const { data: dbWallet } = await supabase
    .from('wallets')
    .select('virtual_balance')
    .eq('user_id', user.id)
    .single();

  const balance = dbWallet ? parseFloat(dbWallet.virtual_balance) : 10000.00;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between">
      {/* Dashboard Header */}
      <header className="border-b border-[#E5E7EB] bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <TrendingUp className="text-white w-4.5 h-4.5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[#111111]">PaperPulse</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F3F4F6] rounded-lg text-sm text-[#4B5563] font-medium">
              <User className="w-4 h-4 text-[#6B7280]" />
              <span>{displayName}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-grow w-full flex flex-col justify-center">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-8 md:p-12 text-center max-w-2xl mx-auto">
          {/* Success Badge */}
          <div className="w-16 h-16 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-6 text-[#2563EB]">
            <CheckCircle className="w-8 h-8" />
          </div>

          <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight">
            Welcome, {displayName}!
          </h1>
          <p className="text-base text-[#6B7280] mt-3">
            Your PaperPulse account has been successfully created. We are setting up your trading environment.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-md mx-auto">
            {/* Wallet Balance Card */}
            <div className="border border-[#E5E7EB] rounded-xl p-4 bg-[#F9FAFB] flex items-start gap-3">
              <div className="p-2 bg-[#2563EB]/10 rounded-lg text-[#2563EB]">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Virtual Balance</span>
                <p className="text-xl font-bold text-[#111111] mt-0.5">
                  ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Account Details Card */}
            <div className="border border-[#E5E7EB] rounded-xl p-4 bg-[#F9FAFB] flex items-start gap-3">
              <div className="p-2 bg-[#059669]/10 rounded-lg text-[#059669]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Plan Type</span>
                <p className="text-xl font-bold text-[#111111] mt-0.5 capitalize">
                  {planType} User
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[#E5E7EB] pt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FFFBEB] border border-[#FEF3C7] rounded-lg text-sm text-[#D97706] font-medium mx-auto">
              <ShieldAlert className="w-4.5 h-4.5" />
              <span>Real-time Dashboard UI is currently in development.</span>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-3">
              Registered email: <span className="font-semibold">{displayEmail}</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[#9CA3AF] py-6 border-t border-[#E5E7EB]">
        &copy; {new Date().getFullYear()} PaperPulse. All rights reserved.
      </footer>
    </div>
  );
}
