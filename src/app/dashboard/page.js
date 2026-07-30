import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  TrendingUp, User, Wallet, Award, BarChart3, 
  ArrowRight 
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { getActiveWallet } from '@/lib/activeWallet';
import Navbar from '@/components/Navbar';
import OnboardingBalanceSelector from './OnboardingBalanceSelector';

export default async function DashboardPage() {
  const supabase = await createClient();

  const formatPercent = (val) => {
    if (val === 0) return '0.00%';
    if (Math.abs(val) < 0.01) {
      return `${val > 0 ? '+' : ''}${val.toFixed(4)}%`;
    }
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
  };

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

  // 3. Resolve active wallet details
  const { activeWallet, useLocalFallback } = await getActiveWallet(user.id);
  const balance = parseFloat(activeWallet.virtual_balance || 0);
  const balanceConfigured = activeWallet.balance_configured || false;
  const initialBalance = parseFloat(activeWallet.initial_balance || 0);

  // 4. Fetch trades (with fallback support) scoped by active wallet
  let openPositionsCount = 0;
  let totalClosedPnL = 0.00;
  let hasTrades = false;
  let recentTrades = [];

  if (useLocalFallback) {
    const fs = require('fs');
    const path = require('path');
    const localDbPath = path.join(process.cwd(), 'local_db.json');
    if (fs.existsSync(localDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        const localTrades = db.trades.filter(t => 
          t.user_id === user.id && 
          (t.wallet_id === activeWallet.id || (!t.wallet_id && activeWallet.id === user.id))
        );
        
        if (localTrades.length > 0) {
          hasTrades = true;
          openPositionsCount = localTrades.filter(t => t.status === 'open').length;
          totalClosedPnL = localTrades.filter(t => t.status === 'closed').reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
          
          // Sort recent trades
          const sortedLocalTrades = [...localTrades].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          recentTrades = sortedLocalTrades.slice(0, 5);
        }
      } catch (e) {
        console.error(e);
      }
    }
  } else {
    try {
      let query = supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id);
      
      if (activeWallet.id === user.id) {
        query = query.or(`wallet_id.eq.${activeWallet.id},wallet_id.is.null`);
      } else {
        query = query.eq('wallet_id', activeWallet.id);
      }

      let { data: dbTrades, error: dbTradesError } = await query.order('created_at', { ascending: false });

      // Fallback if wallet_id column doesn't exist in trades table yet
      if (dbTradesError && (dbTradesError.message?.includes('column') || dbTradesError.message?.includes('wallet_id'))) {
        const fallbackRes = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        dbTrades = fallbackRes.data;
        dbTradesError = fallbackRes.error;
      }

      if (dbTradesError) {
        throw dbTradesError;
      } else if (dbTrades && dbTrades.length > 0) {
        hasTrades = true;
        openPositionsCount = dbTrades.filter(t => t.status === 'open').length;
        totalClosedPnL = dbTrades.filter(t => t.status === 'closed').reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        recentTrades = dbTrades.slice(0, 5); // Take last 5 trades
      }
    } catch (err) {
      console.error('Failed to fetch trades for dashboard:', err);
    }
  }

  const pnlPercent = balance > 0 ? (totalClosedPnL / balance) * 100 : 0.00;
  const pnlIsPositive = totalClosedPnL > 0;
  const pnlIsNegative = totalClosedPnL < 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between">
      <Navbar userName={displayName} />

      {/* Main Dashboard Content */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-grow w-full">
        {/* Welcome Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight">
                Welcome back, {displayName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#16A34A] border border-[#C8E6C9] select-none">
                🔥 5-day streak
              </span>
            </div>
            <p className="text-sm text-[#6B7280] mt-1.5 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Virtual Balance */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.08)] hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Virtual Balance</span>
              <div className="p-2 bg-[#2563EB]/10 rounded-lg text-[#2563EB]">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#111111] tracking-tight font-mono">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] font-semibold text-[#6B7280] mt-1">
              Currency: USD
            </p>
          </div>

          {/* Active Positions */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.08)] hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Active Trades</span>
              <div className="p-2 bg-[#10B981]/10 rounded-lg text-[#10B981]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#111111] tracking-tight">
              {openPositionsCount}
            </h3>
            <p className="text-[10px] font-semibold text-green-600 mt-1 flex items-center gap-0.5">
              <span>●</span> Market active
            </p>
          </div>

          {/* Closed PnL */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.08)] hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Total PnL (Closed)</span>
              <div className={`p-2 rounded-lg ${pnlIsNegative ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <h3 className={`text-2xl font-bold tracking-tight font-mono ${
              pnlIsPositive ? 'text-green-600' : pnlIsNegative ? 'text-red-600' : 'text-gray-500'
            }`}>
              {pnlIsPositive ? '+' : ''}${totalClosedPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
            <p className={`text-[10px] font-bold mt-1 ${
              pnlIsPositive ? 'text-green-600' : pnlIsNegative ? 'text-red-600' : 'text-gray-500'
            }`}>
              {formatPercent(pnlPercent)} of balance
            </p>
          </div>

          {/* Account Plan Status */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.08)] hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Practice Plan</span>
              <div className="p-2 bg-[#F59E0B]/10 rounded-lg text-[#F59E0B]">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-[#111111] tracking-tight uppercase">
              {planType}
            </h3>
            <p className="text-[10px] font-semibold text-[#6B7280] mt-1">
              {planType === 'free' ? 'Upgrade for higher limits' : 'Unrestricted practice limits'}
            </p>
          </div>
        </div>

        {!hasTrades ? (
          /* Empty State if no trades exist yet */
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center max-w-xl mx-auto shadow-[0_2px_8px_rgba(0,0,0,0.02)] mb-8 select-none animate-fade-in">
            <div className="w-16 h-16 bg-[#2563EB]/5 rounded-full flex items-center justify-center text-[#2563EB] mx-auto mb-5 shadow-sm border border-[#2563EB]/10">
              <TrendingUp className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Trades Recorded Yet</h2>
            <p className="text-sm font-semibold text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
              Open the Trade Terminal to start practicing trading. Execute orders on live simulated crypto, stock, or forex rates.
            </p>
            <Link
              href="/trade"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-sm rounded-xl shadow-[0_2px_4px_rgba(37,99,235,0.1)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all group"
            >
              Start Trading Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        ) : (
          /* Recent Activity Section */
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] mb-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#111111] tracking-tight">Recent Activity</h2>
              <Link href="/trade" className="text-xs font-semibold text-[#2563EB] hover:underline">
                New Trade
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans min-w-[650px] md:min-w-0">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3 text-right">Size (Lots)</th>
                    <th className="py-2.5 px-3 text-right">Entry Price</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">P&L (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700">
                  {recentTrades.map((t) => {
                    const isClosed = t.status === 'closed';
                    const tradePnL = parseFloat(t.pnl || 0);
                    const isUp = tradePnL >= 0;
                    
                    return (
                      <tr key={t.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-3 font-semibold text-gray-500 font-mono">
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-gray-900">{t.symbol}/USDT</td>
                        <td className="py-3 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            t.side?.toLowerCase() === 'buy' ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'bg-[#DC2626]/10 text-[#DC2626]'
                          }`}>
                            {t.side?.charAt(0).toUpperCase() + t.side?.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums text-right">
                          {(parseFloat(t.quantity) || parseFloat(t.size) || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums text-right">
                          ${parseFloat(t.entry_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            isClosed ? 'bg-gray-100 text-gray-600 border border-gray-200' : 'bg-green-50 text-green-600 border border-green-200'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className={`py-3 px-3 font-mono tabular-nums text-right font-bold ${
                          !isClosed ? 'text-gray-500' : isUp ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {!isClosed ? '--' : `${isUp ? '+' : ''}${tradePnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* If balance is not configured, show onboarding modal overlay */}
        {!balanceConfigured && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[45] flex items-center justify-center p-4">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-2 max-w-xl w-full shadow-2xl animate-in scale-in duration-200">
              <OnboardingBalanceSelector />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/60 bg-white py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-gray-500">
          <p>© {new Date().getFullYear()} PaperPulse. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
