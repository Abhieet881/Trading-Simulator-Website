'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, BarChart3, ArrowRight, ArrowLeft,
  ChevronLeft, ChevronRight, Award, Calendar, 
  Filter, Tag, Briefcase, Percent, DollarSign,
  Trophy, History, Loader2
} from 'lucide-react';
import UserDropdown from '../dashboard/UserDropdown';

export default function HistoryClientPage({ userName, trades = [] }) {
  const [assetFilter, setAssetFilter] = useState('All');
  const [sideFilter, setSideFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [filtering, setFiltering] = useState(false);

  // Trigger brief simulation of loading state when filters update
  useEffect(() => {
    setFiltering(true);
    const timer = setTimeout(() => setFiltering(false), 300);
    setCurrentPage(1); // Reset page on filter
    return () => clearTimeout(timer);
  }, [assetFilter, sideFilter, timeFilter]);

  // Duration Formatter Helper
  const getDurationString = (opened, closed) => {
    if (!opened || !closed) return '—';
    try {
      const diffMs = new Date(closed) - new Date(opened);
      if (diffMs < 0) return '0s';
      
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffDay > 0) {
        return `${diffDay}d ${diffHour % 24}h`;
      }
      if (diffHour > 0) {
        return `${diffHour}h ${diffMin % 60}m`;
      }
      if (diffMin > 0) {
        return `${diffMin}m ${diffSec % 60}s`;
      }
      return `${diffSec}s`;
    } catch (e) {
      return '—';
    }
  };

  // Deterministic Date Formatter to prevent hydration mismatch
  const formatDateDeterministic = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch (e) {
      return '—';
    }
  };

  // 1. Calculate stats based on ALL trades
  const totalTradesCount = trades.length;
  const winningTrades = trades.filter(t => t.pnl > 0);
  const winRate = totalTradesCount > 0 ? (winningTrades.length / totalTradesCount) * 100 : 0.00;
  const totalPnLSum = trades.reduce((sum, t) => sum + t.pnl, 0);
  const bestTrade = trades.length > 0 ? Math.max(...trades.map(t => t.pnl)) : 0.00;

  // 2. Apply filters
  const filteredTrades = trades.filter(t => {
    // Asset Filter
    if (assetFilter !== 'All') {
      if (t.symbol !== assetFilter) return false;
    }

    // Side Filter
    if (sideFilter !== 'All') {
      if (t.side?.toLowerCase() !== sideFilter.toLowerCase()) return false;
    }

    // Time Filter (based on closed_at)
    if (timeFilter !== 'All') {
      const closeDate = new Date(t.closed_at);
      const now = new Date();
      const diffMs = Math.abs(now - closeDate);
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (timeFilter === '7days' && diffDays > 7) return false;
      if (timeFilter === '30days' && diffDays > 30) return false;
    }

    return true;
  });

  // 3. Paginate
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  const paginatedTrades = filteredTrades.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between font-sans text-gray-800">
      {/* Top Navbar */}
      <header className="border-b border-[#E5E7EB] bg-white sticky top-0 z-50 shadow-sm select-none">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <TrendingUp className="text-white w-4.5 h-4.5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[#111111]">PaperPulse</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-semibold text-[#6B7280] hover:text-[#111111] transition-colors">
              Dashboard
            </Link>
            <Link href="/trade" className="text-sm font-semibold text-[#6B7280] hover:text-[#111111] transition-colors">
              Trade
            </Link>
            <Link href="/history" className="text-sm font-semibold text-[#2563EB] transition-colors">
              History
            </Link>
            <Link href="/leaderboard" className="text-sm font-semibold text-[#6B7280] hover:text-[#111111] transition-colors">
              Leaderboard
            </Link>
          </nav>

          {/* User Profile dropdown */}
          <div className="flex items-center gap-4">
            <UserDropdown userName={userName} />
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-grow w-full">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight">
            Trade History
          </h1>
          <p className="text-sm text-[#6B7280] mt-1.5 font-medium">
            Review all your past trades
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 select-none">
          {/* Total Trades */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Trades</span>
              <div className="p-1.5 bg-[#F3F4F6] rounded-lg text-gray-500">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-extrabold text-[#111111]">{totalTradesCount}</p>
            <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">
              Completed executions
            </span>
          </div>

          {/* Win Rate */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Win Rate</span>
              <div className="p-1.5 bg-blue-50 rounded-lg text-[#2563EB]">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-extrabold text-[#111111]">{winRate.toFixed(1)}%</p>
            <span className="text-[10px] text-[#2563EB] font-bold mt-0.5 block">
              Profitable positions
            </span>
          </div>

          {/* Total P&L */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total P&L</span>
              <div className={`p-1.5 rounded-lg ${totalPnLSum >= 0 ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'bg-[#DC2626]/10 text-[#DC2626]'}`}>
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className={`text-xl font-extrabold ${totalPnLSum >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
              {totalPnLSum >= 0 ? '+' : ''}${totalPnLSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">
              Net balance changes
            </span>
          </div>

          {/* Best Trade */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Best Trade</span>
              <div className="p-1.5 bg-amber-50 rounded-lg text-amber-500">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-extrabold text-[#16A34A]">
              +${bestTrade.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">
              Highest single gain
            </span>
          </div>
        </div>

        {/* Filter Row */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] mb-6 select-none flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filters</span>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {/* Filter Asset */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Asset</span>
              <select
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
                className="bg-[#FAFAFA] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 cursor-pointer focus:outline-none"
              >
                <option value="All">All Assets</option>
                <option value="BTC">BTC (Bitcoin)</option>
                <option value="ETH">ETH (Ethereum)</option>
                <option value="EUR/USD">EUR/USD (Euro)</option>
                <option value="GBP/USD">GBP/USD (Pound)</option>
                <option value="XAU/USD">XAU/USD (Gold)</option>
                <option value="AAPL">AAPL (Apple)</option>
              </select>
            </div>

            {/* Filter Side */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Side</span>
              <select
                value={sideFilter}
                onChange={(e) => setSideFilter(e.target.value)}
                className="bg-[#FAFAFA] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 cursor-pointer focus:outline-none"
              >
                <option value="All">All Sides</option>
                <option value="Buy">Buy (Long)</option>
                <option value="Sell">Sell (Short)</option>
              </select>
            </div>

            {/* Filter Time */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Time</span>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-[#FAFAFA] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 cursor-pointer focus:outline-none"
              >
                <option value="All">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* History Table Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          {filtering ? (
            /* Loading Shimmer State */
            <div className="py-20 text-center flex flex-col items-center justify-center select-none animate-pulse">
              <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin mb-3" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Applying filters...</span>
            </div>
          ) : paginatedTrades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-[#F9FAFB]/50 text-gray-400 font-bold uppercase text-[9px] tracking-wider select-none">
                    <th className="py-3.5 px-4">Symbol</th>
                    <th className="py-3.5 px-4">Side</th>
                    <th className="py-3.5 px-4">Volume</th>
                    <th className="py-3.5 px-4">Entry Price</th>
                    <th className="py-3.5 px-4">Exit Price</th>
                    <th className="py-3.5 px-4 text-right">P&L (USD)</th>
                    <th className="py-3.5 px-4">Opened</th>
                    <th className="py-3.5 px-4">Closed</th>
                    <th className="py-3.5 px-4 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {paginatedTrades.map((pos) => {
                    const isUp = pos.pnl >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-gray-50/50">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{pos.symbol}/USDT</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            pos.side?.toLowerCase() === 'buy' ? 'bg-[#089981]/10 text-[#089981]' : 'bg-[#f23645]/10 text-[#f23645]'
                          }`}>
                            {pos.side?.toLowerCase() === 'buy' ? 'Buy' : 'Sell'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium">{pos.size?.toFixed(2)}</td>
                        <td className="py-3.5 px-4 font-mono font-medium">
                          {['EUR/USD', 'GBP/USD'].includes(pos.symbol) ? pos.entry.toFixed(4) : `$${pos.entry.toLocaleString()}`}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium">
                          {['EUR/USD', 'GBP/USD'].includes(pos.symbol) ? pos.exit.toFixed(4) : `$${pos.exit.toLocaleString()}`}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-mono font-bold tabular-nums ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                          {isUp ? '+' : ''}{pos.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                        </td>
                        <td className="py-3.5 px-4 text-gray-400 font-semibold">{formatDateDeterministic(pos.opened_at)}</td>
                        <td className="py-3.5 px-4 text-gray-400 font-semibold">{formatDateDeterministic(pos.closed_at)}</td>
                        <td className="py-3.5 px-4 text-right text-gray-500 font-bold">{getDurationString(pos.opened_at, pos.closed_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="border-t border-gray-100 px-4 py-3.5 flex items-center justify-between select-none">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    Page {currentPage} of {totalPages} &bull; {filteredTrades.length} records
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-all"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-all"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center select-none animate-fade-in">
              <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400 shadow-sm">
                <History className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="font-extrabold text-sm text-gray-700 tracking-tight">No trade history yet</h3>
              <p className="text-xs text-gray-400 mt-1.5 max-w-xs leading-relaxed font-semibold">
                Your completed trades will show up here once you close a position.
              </p>
              <div className="mt-6">
                <Link 
                  href="/trade" 
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all cursor-pointer"
                >
                  Go to Trading Terminal <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
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
    </div>
  );
}
