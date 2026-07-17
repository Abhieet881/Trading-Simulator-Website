'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowLeft, Shield, AlertTriangle } from 'lucide-react';

export default function PrivacyPage() {
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
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#111111]">Privacy Policy</h1>
              <p className="text-sm text-[#6B7280] mt-0.5">Last updated: July 15, 2026</p>
            </div>
          </div>

          {/* CRITICAL SIMULATION DISCLAIMER BANNER */}
          <div className="mb-8 flex items-start gap-3.5 text-sm text-[#B45309] bg-[#FFFBEB] p-5 rounded-xl border border-[#FDE68A] leading-relaxed">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 text-[#D97706] mt-0.5" />
            <div>
              <strong className="font-bold text-[#92400E] block mb-1">Simulated Educational Service Disclaimer</strong>
              PaperPulse is an <strong>educational paper trading simulator</strong>. Because no real money, real brokerages, bank accounts, or real assets are connected, we never request or store sensitive financial details (such as credit cards, bank accounts, SSN/national IDs, or real portfolio accounts).
            </div>
          </div>

          {/* Document Content */}
          <div className="flex flex-col gap-6 text-[#4B5563] text-sm sm:text-base leading-relaxed">
            
            {/* Section 1 */}
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-[#111111]">
                1. Information We Collect
              </h2>
              <p>
                We only collect basic information necessary to provide you with the simulated trading platform:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-1 text-sm">
                <li><strong>Account Information:</strong> Name, Email Address, and encrypted password credentials processed securely via Supabase Auth.</li>
                <li><strong>Simulated Trading Activity:</strong> Transaction histories, open/closed positions, wallet cash adjustments, virtual balances, and leaderboard submissions.</li>
                <li><strong>Technical Data:</strong> Standard access logs, cookies for persistent sessions, and basic browser information.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-[#111111]">
                2. How We Use Your Information
              </h2>
              <p>
                The collected data is exclusively used to operate the PaperPulse simulator. Specifically, we use it to:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-1 text-sm">
                <li>Create and manage your user account.</li>
                <li>Maintain your virtual wallet balance and calculate trading profits/losses.</li>
                <li>Display user rankings on the global leaderboards (your name and simulated profits).</li>
                <li>Process password resets and email verification flows.</li>
              </ul>
              <p className="mt-2 text-sm font-semibold text-[#111111]">
                We do not sell, rent, trade, or distribute your email or personal information to third-party advertising companies or data brokers.
              </p>
            </section>

            {/* Section 3 */}
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-[#111111]">
                3. Data Storage & Security
              </h2>
              <p>
                Our databases and backend services are securely managed using <strong>Supabase</strong> (built on AWS infrastructure) and our web hosting providers. We employ industry-standard SSL/TLS encryption for all data in transit. While we implement security measures, please note that no method of transmission or electronic storage is 100% secure.
              </p>
            </section>

            {/* Section 4 */}
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-[#111111]">
                4. User Rights & Data Deletion
              </h2>
              <p>
                You retain complete control over your personal data. At any time, you can edit your profile details or request complete account deletion. Deleting your account will remove your user profile, virtual wallets, trading history, and leaderboard records from our active databases. Account deletion can be requested directly from the **Settings** page within the user dashboard.
              </p>
            </section>

            {/* Section 5 */}
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-[#111111]">
                5. Third-Party Links
              </h2>
              <p>
                The Service may link to external websites or market resources. We are not responsible for the privacy practices, content, or terms of third-party platforms.
              </p>
            </section>

            {/* Section 6 */}
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-[#111111]">
                6. Contact Information
              </h2>
              <p>
                If you have questions regarding this Privacy Policy, your account data, or wish to submit a feedback report, you can reach out via the support email associated with our hosting domain.
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
