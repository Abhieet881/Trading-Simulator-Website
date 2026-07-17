'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowLeft, FileText, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      {/* Container */}
      <div className="max-w-3xl mx-auto w-full">
        {/* Back Link */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 font-semibold text-sm text-[#2563EB] hover:underline transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-8 sm:p-10">
          
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6 border-b border-[#F3F4F6] pb-6">
            <div className="w-12 h-12 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#111111]">Terms of Service</h1>
              <p className="text-sm text-[#6B7280] mt-0.5">Last updated: July 15, 2026</p>
            </div>
          </div>

          {/* CRITICAL SIMULATION DISCLAIMER BANNER */}
          <div className="mb-8 flex items-start gap-3.5 text-sm text-[#B45309] bg-[#FFFBEB] p-5 rounded-xl border border-[#FDE68A] leading-relaxed">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 text-[#D97706] mt-0.5" />
            <div>
              <strong className="font-bold text-[#92400E] block mb-1">Simulated Trading Disclaimer (No Real Funds Involved)</strong>
              PaperPulse is strictly a <strong>paper trading simulator and educational platform</strong>. All transactions, assets, balances, and orders processed on this platform are 100% virtual. There is <strong>no real money, real cryptocurrency, or real financial assets</strong> used, held, or traded on this website. This platform does not connect to any financial markets or brokerages for real transactions.
            </div>
          </div>

          {/* Document Content */}
          <div className="flex flex-col gap-6 text-[#4B5563] text-sm sm:text-base leading-relaxed">
            
            {/* Section 1 */}
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                1. Acceptance of Terms
              </h2>
              <p>
                By creating an account, accessing, or using the PaperPulse simulator (the "Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.
              </p>
            </section>

            {/* Section 2 */}
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                2. Nature of the Service
              </h2>
              <p>
                The Service is a simulated trading environment designed solely for educational, demonstration, and entertainment purposes. You are provided with a default virtual wallet balance of $10,000 USD (virtual currency) upon registration. This virtual balance holds no real-world monetary value, cannot be redeemed for cash, real-world assets, or transfers, and is strictly used to measure simulated trading performance.
              </p>
            </section>

            {/* Section 3 */}
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                3. No Financial Advice
              </h2>
              <p>
                Nothing on PaperPulse constitutes financial, investment, legal, or tax advice. Any historical or simulated trading performance shown does not guarantee or indicate future real-world results. Users should consult a qualified financial professional before making any real-world investment decisions. Any decisions made based on information or practice on this platform are at the user's sole risk.
              </p>
            </section>

            {/* Section 4 */}
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                4. User Account Responsibilities
              </h2>
              <p>
                When you register, you are responsible for maintaining the confidentiality of your credentials and account session. You agree to provide accurate information and to update it as necessary. You are fully responsible for all trading activities and configurations conducted under your account. We reserve the right to suspend or delete accounts that abuse the platform resources or violate security protocols.
              </p>
            </section>

            {/* Section 5 */}
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                5. System Availability and Accuracy
              </h2>
              <p>
                While we strive to provide accurate mock market feeds, we do not guarantee the completeness, accuracy, timeliness, or availability of any data or simulator calculations. The platform is provided on an "as-is" and "as-available" basis. We reserve the right to reset simulated database trade histories, wallet balances, or leaderboard scores at any time for educational updates, system maintenance, or structural testing.
              </p>
            </section>

            {/* Section 6 */}
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                6. Changes to Terms
              </h2>
              <p>
                We reserve the right to modify these Terms of Service at any time. Any changes will be posted directly to this page. Continued use of the platform after changes are posted constitutes your acceptance of the updated terms.
              </p>
            </section>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[#9CA3AF] mt-12">
        &copy; {new Date().getFullYear()} PaperPulse. Educational simulator only.
      </div>
    </div>
  );
}
