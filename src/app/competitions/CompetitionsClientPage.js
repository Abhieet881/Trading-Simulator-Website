'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, ArrowLeft, Trophy, Calendar, Users, Target, DollarSign, 
  ChevronRight, Award, Clock, CheckCircle2, AlertCircle, Play, Sparkles
} from 'lucide-react';
import UserDropdown from '../dashboard/UserDropdown';

export default function CompetitionsClientPage({ userId, userEmail, initialDisplayName }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);

  // States
  const [competitions, setCompetitions] = useState([]);
  const [myActiveCompetitions, setMyActiveCompetitions] = useState([]);
  const [userWalletBalance, setUserWalletBalance] = useState(10000.00);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Detail View State
  const [selectedCompId, setSelectedCompId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch initial competitions data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/competitions');
      const data = await res.json();

      if (res.ok) {
        setCompetitions(data.competitions || []);
        setMyActiveCompetitions(data.myActiveCompetitions || []);
        setUserWalletBalance(data.userWalletBalance || 10000.00);
      } else {
        setError(data.error || 'Failed to load competitions.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch detail view data when selectedCompId changes
  useEffect(() => {
    if (!selectedCompId) {
      setDetailData(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        setDetailLoading(true);
        const res = await fetch(`/api/competitions?id=${selectedCompId}`);
        const data = await res.json();
        if (res.ok) {
          setDetailData(data);
        } else {
          alert(data.error || 'Failed to load competition details.');
          setSelectedCompId(null);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to connect to the server.');
        setSelectedCompId(null);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetail();
  }, [selectedCompId]);

  // Handle joining a competition
  const handleJoinCompetition = async (comp) => {
    if (comp.entry_fee > 0) {
      const confirmJoin = window.confirm(
        `This competition requires a $${comp.entry_fee.toFixed(2)} entry fee (virtual funds). Your balance will be reduced by this amount. Continue?`
      );
      if (!confirmJoin) return;
    }

    try {
      setActionLoading(true);
      const res = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId: comp.id }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert(`Successfully joined "${comp.title}"! Good luck!`);
        // Refresh data
        await fetchData();
        // Open progress detail view directly
        setSelectedCompId(comp.id);
      } else {
        alert(data.error || 'Failed to join competition.');
      }
    } catch (err) {
      console.error(err);
      alert('A network error occurred. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Date Formatting helper
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Days remaining helper
  const getDaysRemaining = (endDateStr) => {
    const end = new Date(endDateStr);
    const now = new Date();
    const diff = end - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days left` : 'Ends today';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between">
        <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
                <TrendingUp className="text-white w-4.5 h-4.5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-[#111111]">PaperPulse</span>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-10 flex-grow w-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-[#2563EB]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm font-semibold text-[#6B7280]">Loading competitions...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <TrendingUp className="text-white w-4.5 h-4.5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[#111111]">PaperPulse</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-sm font-semibold text-[#6B7280] hover:text-[#111111] transition-colors">
              Dashboard
            </Link>
            <Link href="/trade" className="text-sm font-semibold text-[#6B7280] hover:text-[#111111] transition-colors">
              Trade
            </Link>
            <Link href="/history" className="text-sm font-semibold text-[#6B7280] hover:text-[#111111] transition-colors">
              History
            </Link>
            <Link href="/leaderboard" className="text-sm font-semibold text-[#6B7280] hover:text-[#111111] transition-colors">
              Leaderboard
            </Link>
            <Link href="/competitions" className="text-sm font-semibold text-[#2563EB] transition-colors">
              Competitions
            </Link>
          </nav>

          {/* User Dropdown */}
          <div className="flex items-center gap-4">
            <UserDropdown userName={displayName} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-grow w-full">
        {error && (
          <div className="mb-6 flex items-start gap-2.5 text-sm font-semibold text-[#DC2626] bg-[#DC2626]/10 px-4 py-3 rounded-lg border border-[#DC2626]/20">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#DC2626]" />
            <span>{error}</span>
          </div>
        )}

        {/* ----------------- DETAIL PROGRESS VIEW ----------------- */}
        {selectedCompId && detailData ? (
          <div>
            {/* Back to List Button */}
            <button 
              onClick={() => setSelectedCompId(null)}
              className="mb-6 inline-flex items-center gap-1.5 font-semibold text-sm text-[#2563EB] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Competitions
            </button>

            {/* Title & Info */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-[#111111]">{detailData.competition.title}</h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#16A34A] border border-[#C8E6C9]">
                      Active Participant
                    </span>
                  </div>
                  <p className="text-sm text-[#6B7280] mt-1">{detailData.competition.description}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#6B7280] font-semibold bg-[#FAFAFA] border border-[#E5E7EB] px-4 py-2 rounded-lg">
                  <Clock className="w-4 h-4 text-[#2563EB]" />
                  {getDaysRemaining(detailData.competition.end_date)}
                </div>
              </div>

              {/* Progress Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Starting Balance */}
                <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-5">
                  <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Starting Balance</span>
                  <p className="text-xl font-bold font-mono text-[#111111] mt-1">
                    ${parseFloat(detailData.userProgress?.starting_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Current Balance */}
                <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-5">
                  <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Current Balance</span>
                  <p className="text-xl font-bold font-mono text-[#111111] mt-1">
                    ${parseFloat(detailData.userProgress?.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-xs font-semibold font-mono flex items-center gap-0.5 mt-0.5 ${
                    (detailData.userProgress?.pnl_percent || 0) >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                  }`}>
                    {(detailData.userProgress?.pnl_percent || 0) >= 0 ? '+' : ''}
                    {(detailData.userProgress?.pnl_percent || 0).toFixed(2)}% P&L
                  </span>
                </div>

                {/* Target Profit */}
                <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-5">
                  <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Target Profit</span>
                  <p className="text-xl font-bold font-mono text-[#2563EB] mt-1">
                    +{detailData.competition.target_profit_percent}% P&L
                  </p>
                  <span className="text-xs text-[#6B7280] font-semibold mt-0.5 block">
                    Target Balance: ${(parseFloat(detailData.userProgress?.starting_balance || 0) * (1 + detailData.competition.target_profit_percent / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between items-center text-sm font-semibold mb-2">
                  <span className="text-[#6B7280]">Profit Target Progress</span>
                  <span className="text-[#111111]">
                    {Math.max(0, detailData.userProgress?.pnl_percent || 0).toFixed(2)}% / {detailData.competition.target_profit_percent}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                  <div 
                    className="h-full bg-gradient-to-r from-[#2563EB] to-[#10B981] rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${Math.min(100, Math.max(0, ((detailData.userProgress?.pnl_percent || 0) / detailData.competition.target_profit_percent) * 100))}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 font-medium">
                  {(detailData.userProgress?.pnl_percent || 0) >= detailData.competition.target_profit_percent ? 
                    '🎉 Profit target reached! Keep trading to maximize your rank.' : 
                    `Earn another ${Math.max(0, detailData.competition.target_profit_percent - (detailData.userProgress?.pnl_percent || 0)).toFixed(2)}% profit to reach the target.`}
                </p>
              </div>
            </div>

            {/* Competition Leaderboard */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <h2 className="text-xl font-bold text-[#111111] mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Competition Leaderboard
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                      <th className="py-4 px-4">Rank</th>
                      <th className="py-4 px-4">Participant</th>
                      <th className="py-4 px-4 text-right">P&L (%)</th>
                      <th className="py-4 px-4 text-right">Simulated Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6] text-sm">
                    {detailData.top5.map((p) => {
                      const isCurrentUser = p.user_id === userId;
                      return (
                        <tr 
                          key={p.id} 
                          className={`hover:bg-[#FAFAFA] transition-colors ${
                            isCurrentUser ? 'bg-[#2563EB]/5 font-semibold text-[#2563EB]' : 'text-[#4B5563]'
                          }`}
                        >
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                              p.rank === 1 ? 'bg-amber-100 text-amber-800' :
                              p.rank === 2 ? 'bg-gray-100 text-gray-800' :
                              p.rank === 3 ? 'bg-orange-100 text-orange-800' :
                              'text-[#6B7280]'
                            }`}>
                              #{p.rank}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {p.name} {isCurrentUser && <span className="text-xs font-bold text-[#2563EB] ml-1">(You)</span>}
                          </td>
                          <td className={`py-4 px-4 text-right font-mono font-semibold ${
                            p.pnl_percent >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                          }`}>
                            {p.pnl_percent >= 0 ? '+' : ''}{p.pnl_percent.toFixed(2)}%
                          </td>
                          <td className="py-4 px-4 text-right font-mono text-[#6B7280]">
                            ${parseFloat(p.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Show current user row at the bottom if NOT in top 5 */}
                    {detailData.userProgress && detailData.userRank > 5 && (
                      <>
                        <tr className="bg-white">
                          <td colSpan="4" className="py-2 text-center text-xs text-gray-400 font-semibold uppercase tracking-wider bg-[#FAFAFA]">
                            •••
                          </td>
                        </tr>
                        <tr className="bg-[#2563EB]/5 font-semibold text-[#2563EB]">
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs bg-[#2563EB] text-white">
                              #{detailData.userRank}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {detailData.userProgress.name || 'You'} <span className="text-xs font-bold text-[#2563EB] ml-1">(You)</span>
                          </td>
                          <td className={`py-4 px-4 text-right font-mono font-semibold ${
                            detailData.userProgress.pnl_percent >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                          }`}>
                            {detailData.userProgress.pnl_percent >= 0 ? '+' : ''}{detailData.userProgress.pnl_percent.toFixed(2)}%
                          </td>
                          <td className="py-4 px-4 text-right font-mono text-[#2563EB]">
                            ${parseFloat(detailData.userProgress.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : selectedCompId && detailLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#E5E7EB] rounded-2xl">
            <svg className="animate-spin h-8 w-8 text-[#2563EB] mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm font-semibold text-[#6B7280]">Loading standings...</p>
          </div>
        ) : (
          /* ----------------- COMPETITIONS LIST VIEW ----------------- */
          <div>
            {/* Page Header */}
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight">Trading Competitions</h1>
              <p className="text-sm text-[#6B7280] mt-1.5 font-medium">
                Test your skills in simulated trading tournaments, hit profit targets, and climb the ranks.
              </p>
            </div>

            {/* MY ACTIVE COMPETITIONS */}
            {myActiveCompetitions.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-bold text-[#111111] mb-5 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#2563EB]" /> My Active Competitions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myActiveCompetitions.map((comp) => {
                    const progressVal = Math.min(
                      100, 
                      Math.max(0, ((comp.userProgress?.pnl_percent || 0) / comp.target_profit_percent) * 100)
                    );
                    return (
                      <div 
                        key={comp.id} 
                        className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.06)] transition-all"
                      >
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <div>
                            <h3 className="font-bold text-[#111111] text-base">{comp.title}</h3>
                            <span className="text-xs text-[#6B7280] font-medium block mt-0.5">
                              Ends: {formatDate(comp.end_date)}
                            </span>
                          </div>
                          <button 
                            onClick={() => setSelectedCompId(comp.id)}
                            className="px-3.5 py-1.5 bg-[#2563EB]/10 hover:bg-[#2563EB]/25 text-[#2563EB] font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            View Progress
                          </button>
                        </div>

                        {/* PNL Standing info */}
                        <div className="flex justify-between items-center text-xs font-semibold text-[#6B7280] mb-2.5">
                          <span>
                            P&L: <strong className={comp.userProgress?.pnl_percent >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                              {comp.userProgress?.pnl_percent >= 0 ? '+' : ''}{(comp.userProgress?.pnl_percent || 0).toFixed(2)}%
                            </strong>
                          </span>
                          <span>Target: +{comp.target_profit_percent}%</span>
                        </div>

                        {/* Mini progress bar */}
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                          <div 
                            className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
                            style={{ width: `${progressVal}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AVAILABLE COMPETITIONS */}
            <div>
              <h2 className="text-lg font-bold text-[#111111] mb-5 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Active & Upcoming Tournaments
              </h2>

              {competitions.length === 0 ? (
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-[#111111] text-base mb-1">No competitions available right now</h3>
                  <p className="text-sm text-[#6B7280]">Check back soon to register for new trading tournaments!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {competitions.map((comp) => {
                    const isJoined = comp.joined;
                    const isUpcoming = new Date(comp.start_date) > new Date();

                    return (
                      <div 
                        key={comp.id} 
                        className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.08)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                      >
                        <div>
                          {/* Status Badge */}
                          <div className="flex justify-between items-center mb-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                              isUpcoming ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {isUpcoming ? 'Upcoming' : 'Active'}
                            </span>
                            <span className="text-xs text-[#6B7280] font-bold flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> {comp.participantCount} joined
                            </span>
                          </div>

                          <h3 className="font-bold text-[#111111] text-base mb-1">{comp.title}</h3>
                          <p className="text-xs text-[#6B7280] leading-relaxed mb-4 min-h-[36px] line-clamp-2">
                            {comp.description || 'No description provided.'}
                          </p>

                          {/* Info Rows */}
                          <div className="flex flex-col gap-2 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3.5 mb-5 text-xs text-[#4B5563]">
                            <div className="flex justify-between">
                              <span className="font-semibold flex items-center gap-1"><Target className="w-3.5 h-3.5 text-[#2563EB]" /> Target:</span>
                              <span className="font-bold font-mono text-[#111111]">+{comp.target_profit_percent}% Profit</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-[#10B981]" /> Entry Fee:</span>
                              <span className="font-bold text-[#111111]">
                                {comp.entry_fee === 0 ? 'Free' : `$${comp.entry_fee.toFixed(2)}`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-400" /> Timeline:</span>
                              <span className="font-medium text-right text-[#6B7280]">
                                {formatDate(comp.start_date)} - {formatDate(comp.end_date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div>
                          {isJoined ? (
                            <button
                              onClick={() => setSelectedCompId(comp.id)}
                              className="w-full py-2.5 bg-gray-100 hover:bg-[#2563EB]/10 text-[#2563EB] font-bold text-xs rounded-lg transition-colors border border-transparent hover:border-[#2563EB]/20 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              View Progress <ChevronRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="w-full">
                              <button
                                onClick={() => handleJoinCompetition(comp)}
                                disabled={actionLoading || (comp.entry_fee > 0 && userWalletBalance < comp.entry_fee)}
                                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors flex items-center justify-center disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border disabled:border-gray-200 cursor-pointer"
                              >
                                {comp.entry_fee > 0 && userWalletBalance < comp.entry_fee 
                                  ? 'Insufficient Balance' 
                                  : 'Join Competition'}
                              </button>
                              {comp.entry_fee > 0 && userWalletBalance < comp.entry_fee && (
                                <span className="text-[10px] text-[#DC2626] text-center block mt-1.5 font-bold">
                                  Insufficient balance to join this competition.
                                </span>
                              )}
                            </div>
                          )}
                          {comp.entry_fee > 0 && !isJoined && !(userWalletBalance < comp.entry_fee) && (
                            <span className="text-[10px] text-gray-400 text-center block mt-1.5 font-medium">
                              *Entry fee of ${comp.entry_fee.toFixed(2)} will be deducted from your virtual balance
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-[#9CA3AF]">
          &copy; {new Date().getFullYear()} PaperPulse. Virtual trading educational simulator.
        </div>
      </footer>
    </div>
  );
}
