import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  TrendingUp, User, Wallet, Award, BarChart3, 
  ArrowRight 
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
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

  // 3. Resolve wallet balance from public.wallets table
  let balance = 0.00;
  let balanceConfigured = false;
  let initialBalance = 0.00;
  try {
    const { data: dbWallet, error: dbWalletError } = await supabase
      .from('wallets')
      .select('virtual_balance, balance_configured, initial_balance')
      .eq('user_id', user.id)
      .single();

    if (dbWalletError) {
      if (dbWalletError.message?.includes('schema cache') || dbWalletError.message?.includes('does not exist') || dbWalletError.message?.includes('column')) {
        const fs = require('fs');
        const path = require('path');
        const localDbPath = path.join(process.cwd(), 'local_db.json');
        if (fs.existsSync(localDbPath)) {
          const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
          balance = db.wallets[user.id] !== undefined ? db.wallets[user.id] : 0.00;
          balanceConfigured = db.wallets_configured?.[user.id] !== undefined ? db.wallets_configured[user.id] : false;
          initialBalance = db.initial_balances?.[user.id] !== undefined ? db.initial_balances[user.id] : 0.00;
        }
      } else {
        throw dbWalletError;
      }
    } else if (dbWallet) {
      balance = parseFloat(dbWallet.virtual_balance || 0);
      balanceConfigured = dbWallet.balance_configured || false;
      initialBalance = parseFloat(dbWallet.initial_balance || 0);
    }
  } catch (err) {
    console.error('Failed to fetch wallet for dashboard, using fallback:', err);
    const fs = require('fs');
    const path = require('path');
    const localDbPath = path.join(process.cwd(), 'local_db.json');
    if (fs.existsSync(localDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        balance = db.wallets[user.id] !== undefined ? db.wallets[user.id] : 0.00;
        balanceConfigured = db.wallets_configured?.[user.id] !== undefined ? db.wallets_configured[user.id] : false;
        initialBalance = db.initial_balances?.[user.id] !== undefined ? db.initial_balances[user.id] : 0.00;
      } catch (e) {
        console.error(e);
      }
    }
  }

  // 4. Fetch trades from public.trades table
  let openPositionsCount = 0;
  let totalClosedPnL = 0.00;
  let hasTrades = false;
  let recentTrades = [];

  try {
    const { data: dbTrades, error: dbTradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbTradesError) {
      if (dbTradesError.message?.includes('schema cache') || dbTradesError.message?.includes('does not exist')) {
        const fs = require('fs');
        const path = require('path');
        const localDbPath = path.join(process.cwd(), 'local_db.json');
        if (fs.existsSync(localDbPath)) {
          const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
          const localTrades = db.trades.filter(t => t.user_id === user.id);
          
          if (localTrades.length > 0) {
            hasTrades = true;
            openPositionsCount = localTrades.filter(t => t.status === 'open').length;
            totalClosedPnL = localTrades.filter(t => t.status === 'closed').reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
            
            // Sort recent trades
            const sortedLocalTrades = [...localTrades].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            recentTrades = sortedLocalTrades.slice(0, 5);
          }
        }
      } else {
        throw dbTradesError;
      }
    } else if (dbTrades && dbTrades.length > 0) {
      hasTrades = true;
      openPositionsCount = dbTrades.filter(t => t.status === 'open').length;
      totalClosedPnL = dbTrades.filter(t => t.status === 'closed').reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
      recentTrades = dbTrades.slice(0, 5); // Take last 5 trades
    }
  } catch (err) {
    console.error('Failed to fetch trades for dashboard:', err);
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
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#111111] font-mono">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-[#16A34A] font-semibold flex items-center gap-1 mt-1">
              Ready to trade
            </span>
          </div>

          {/* Total P&L */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.08)] hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Total P&L</span>
              <div className={`p-2 rounded-lg ${pnlIsPositive ? 'bg-[#16A34A]/10 text-[#16A34A]' : pnlIsNegative ? 'bg-[#DC2626]/10 text-[#DC2626]' : 'bg-gray-100 text-gray-400'}`}>
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className={`text-2xl font-bold font-mono ${pnlIsPositive ? 'text-[#16A34A]' : pnlIsNegative ? 'text-[#DC2626]' : 'text-gray-400'}`}>
              {pnlIsPositive ? '+' : ''}${totalClosedPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className={`text-xs font-semibold font-mono flex items-center gap-1 mt-1 ${pnlIsPositive ? 'text-[#16A34A]' : pnlIsNegative ? 'text-[#DC2626]' : 'text-gray-400'}`}>
              {formatPercent(pnlPercent)}
            </span>
          </div>

          {/* Open Positions */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.08)] hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Open Positions</span>
              <div className={`p-2 rounded-lg ${openPositionsCount > 0 ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'bg-gray-100 text-gray-400'}`}>
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#111111] font-mono">{openPositionsCount}</p>
            <span className="text-xs text-gray-400 font-semibold flex items-center gap-1 mt-1">
              {openPositionsCount > 0 ? `${openPositionsCount} active trades` : 'No active trades'}
            </span>
          </div>

          {/* Plan Type */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.08)] hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Plan Type</span>
              <div className="p-2 bg-[#2563EB]/10 rounded-lg text-[#2563EB]">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#111111] capitalize">
              {planType} User
            </p>
            <span className="text-xs text-[#2563EB] font-semibold flex items-center gap-1 mt-1">
              Active
            </span>
          </div>
        </div>

        {/* Conditional Body: Onboarding Balance Selector, Empty State, or Activity List */}
        {!balanceConfigured ? (
          <OnboardingBalanceSelector />
        ) : !hasTrades ? (
          /* Empty State Section */
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 md:p-16 text-center max-w-2xl mx-auto shadow-[0_1px_3px_rgba(0,0,0,0.06)] mb-12">
            <div className="w-16 h-16 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-6 text-[#2563EB]">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-[#111111] tracking-tight">
              Start Your First Trade
            </h2>
            <p className="text-base text-[#6B7280] mt-3 max-w-md mx-auto leading-relaxed">
              You have ${balance.toLocaleString('en-US')} in virtual funds ready to trade. Explore crypto, forex, and stocks with zero risk.
            </p>
            <div className="mt-8">
              <Link 
                href="/trade" 
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all cursor-pointer group"
              >
                <span>Go to Trading</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
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
                        <td className="py-3 px-3 font-mono tabular-nums text-right">{parseFloat(t.size).toFixed(2)}</td>
                        <td className="py-3 px-3 font-mono tabular-nums text-right">
                          ${parseFloat(t.entry_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            isClosed ? 'bg-gray-100 text-gray-500' : 'bg-[#2563EB]/10 text-[#2563EB]'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold tabular-nums ${
                          !isClosed ? 'text-gray-400' : isUp ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}>
                          {isClosed ? (isUp ? '+' : '') + tradePnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* View Full History link */}
            <div className="mt-4 pt-4 border-t border-[#E5E7EB] flex justify-center select-none">
              <Link 
                href="/history" 
                className="text-xs font-bold text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-1 group"
              >
                <span>View Full Trading History</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        )}


        {/* Market Quick Preview */}
        <div className="border-t border-[#E5E7EB] pt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#111111] tracking-tight">Market Quick Preview</h3>
            <Link href="/trade" className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1">
              View all assets <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {await (async () => {
              // Server-side parallel fetch to display actual real-world prices
              let btcVal = { price: 67240.50, change: 2.45, isUp: true };
              let eurVal = { price: 1.0845, change: 0.12, isUp: true };
              let gbpVal = { price: 1.2825, change: 0.18, isUp: true };
              let xauVal = { price: 2380.50, change: 0.79, isUp: true };

              try {
                const [btcRes, forexRes] = await Promise.allSettled([
                  fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT', { next: { revalidate: 15 } }).then(r => r.json()),
                  fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 60 } }).then(r => r.json())
                ]);

                if (btcRes.status === 'fulfilled' && btcRes.value && !btcRes.value.code) {
                  const val = btcRes.value;
                  const price = parseFloat(val.lastPrice) || 67240.50;
                  const change = parseFloat(val.priceChangePercent) || 2.45;
                  btcVal = { price, change, isUp: change >= 0 };
                }

                if (forexRes.status === 'fulfilled' && forexRes.value && forexRes.value.rates) {
                  const rates = forexRes.value.rates;
                  
                  // EUR/USD
                  const eurRate = rates.EUR;
                  if (eurRate) {
                    const price = 1 / eurRate;
                    eurVal = { price: parseFloat(price.toFixed(4)), change: 0.12, isUp: true };
                  }

                  // GBP/USD
                  const gbpRate = rates.GBP;
                  if (gbpRate) {
                    const price = 1 / gbpRate;
                    gbpVal = { price: parseFloat(price.toFixed(4)), change: 0.18, isUp: true };
                  }

                  // XAU/USD
                  const xauRate = rates.XAU;
                  if (xauRate) {
                    const price = 1 / xauRate;
                    xauVal = { price: parseFloat(price.toFixed(2)), change: 0.79, isUp: true };
                  }
                }
              } catch (e) {
                console.error("Dashboard server-side price fetch failed:", e);
              }

              const marketList = [
                { symbol: 'BTC', name: 'Bitcoin', price: btcVal.price, change: btcVal.change, isUp: btcVal.isUp, type: 'Crypto' },
                { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: eurVal.price, change: eurVal.change, isUp: eurVal.isUp, type: 'Forex' },
                { symbol: 'GBP/USD', name: 'British Pound / US Dollar', price: gbpVal.price, change: gbpVal.change, isUp: gbpVal.isUp, type: 'Forex' },
                { symbol: 'XAU/USD', name: 'Gold / US Dollar', price: xauVal.price, change: xauVal.change, isUp: xauVal.isUp, type: 'Commodities' }
              ];

              return marketList.map((asset) => (
                <Link 
                  key={asset.symbol} 
                  href={`/trade`}
                  className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.08)] hover:-translate-y-0.5 hover:border-[#2563EB]/40 transition-all group cursor-pointer flex flex-col justify-between h-full"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-[#111111]">{asset.symbol}</span>
                      <p className="text-[10px] text-[#6B7280]">{asset.name}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {asset.type}
                    </span>
                  </div>
                  
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-base font-bold text-[#111111] font-mono">
                      {asset.symbol.includes('/') 
                        ? asset.price.toFixed(4) 
                        : `$${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      }
                    </span>
                    <span className={`text-xs font-bold font-mono flex items-center gap-0.5 ${asset.isUp ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                      {asset.isUp ? '▲' : '▼'} {asset.isUp ? '+' : ''}{asset.change.toFixed(2)}%
                    </span>
                  </div>
                </Link>
              ));
            })()}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[#9CA3AF] py-6 border-t border-[#E5E7EB] bg-white">
        &copy; {new Date().getFullYear()} PaperPulse. All rights reserved.
      </footer>
    </div>
  );
}
