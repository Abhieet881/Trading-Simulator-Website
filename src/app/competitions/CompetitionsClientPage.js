'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, ArrowLeft, Trophy, Calendar, Users, Target, DollarSign, 
  ChevronRight, Award, Clock, CheckCircle2, AlertCircle, Play, Sparkles
} from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function CompetitionsClientPage({ userId, userEmail, initialDisplayName }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);

  // States
  const [competitions, setCompetitions] = useState([]);
  const [myActiveCompetitions, setMyActiveCompetitions] = useState([]);
  const [userWalletBalance, setUserWalletBalance] = useState(0.00);
  const [balanceConfigured, setBalanceConfigured] = useState(false);
  const [activeTab, setActiveTab] = useState('participating');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helpers for redesign
  const getCountdownText = (comp) => {
    const now = new Date();
    const start = new Date(comp.start_date);
    const end = new Date(comp.end_date);
    
    if (start > now) {
      const diffMs = start - now;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (diffHrs < 24) {
        return `Starts in: ${diffHrs}h ${diffMins}m`;
      } else {
        const diffDays = Math.floor(diffHrs / 24);
        return `Starts in: ${diffDays}d ${diffHrs % 24}h`;
      }
    } else if (end > now) {
      const diffMs = end - now;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (diffHrs < 24) {
        return `Ends in: ${diffHrs}h ${diffMins}m`;
      } else {
        const diffDays = Math.floor(diffHrs / 24);
        return `Ends in: ${diffDays}d ${diffHrs % 24}h`;
      }
    } else {
      return 'Ended';
    }
  };

  const getPrizePool = (comp) => {
    if (comp.prize_pool !== undefined && parseFloat(comp.prize_pool) > 0) {
      return `$${parseFloat(comp.prize_pool).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    const entryFee = parseFloat(comp.entry_fee || 0);
    const targetProfit = parseFloat(comp.target_profit_percent || 0);
    const count = parseInt(comp.participantCount || 0);
    
    if (entryFee > 0) {
      const calculated = entryFee * Math.max(10, count) * 2;
      return `$${calculated.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    } else {
      const calculated = 1000 + (targetProfit * 100);
      return `$${calculated.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
  };

  const getCompStatus = (comp) => {
    const now = new Date();
    const start = new Date(comp.start_date);
    const end = new Date(comp.end_date);
    if (start > now) return 'upcoming';
    if (end > now) return 'active';
    return 'ended';
  };

  const getFilteredCompetitions = () => {
    const now = new Date();
    return competitions.filter(c => {
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      
      switch (activeTab) {
        case 'participating':
          return c.joined;
        case 'in-progress':
          return (c.status === 'active' || (start <= now && end >= now)) && end >= now;
        case 'upcoming':
          return (c.status === 'upcoming' || start > now) && end >= now;
        case 'ended':
          return c.status === 'ended' || end < now;
        default:
          return true;
      }
    });
  };

  const getFilteredCount = (tab) => {
    const now = new Date();
    return competitions.filter(c => {
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      switch (tab) {
        case 'participating':
          return c.joined;
        case 'in-progress':
          return (c.status === 'active' || (start <= now && end >= now)) && end >= now;
        case 'upcoming':
          return (c.status === 'upcoming' || start > now) && end >= now;
        case 'ended':
          return c.status === 'ended' || end < now;
        default:
          return false;
      }
    }).length;
  };

  // Detail View State
  const [selectedCompId, setSelectedCompId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Redesign states
  const [rightTab, setRightTab] = useState('overview');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [compToJoin, setCompToJoin] = useState(null);
  const [liveCountdown, setLiveCountdown] = useState('');

  // Ticking countdown effect
  useEffect(() => {
    if (!detailData || !detailData.competition) return;

    const updateTimer = () => {
      const now = new Date();
      const start = new Date(detailData.competition.start_date);
      const end = new Date(detailData.competition.end_date);

      if (start > now) {
        const diffMs = start - now;
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
        setLiveCountdown(`Starts In: ${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`);
      } else if (end > now) {
        const diffMs = end - now;
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
        setLiveCountdown(`Ends In: ${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`);
      } else {
        setLiveCountdown('Competition Ended');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [detailData]);

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
        setUserWalletBalance(data.userWalletBalance || 0.00);
        setBalanceConfigured(data.balanceConfigured || false);
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

  // Trigger join confirmation modal
  const triggerJoinFlow = (comp) => {
    if (!balanceConfigured) {
      alert("Please set your starting balance on the Dashboard before joining a competition");
      router.push('/dashboard');
      return;
    }
    setCompToJoin(comp);
    setAgreeTerms(false);
    setShowJoinModal(true);
  };

  const confirmAndJoin = async () => {
    if (!agreeTerms || !compToJoin) return;
    setShowJoinModal(false);
    await handleJoinCompetition(compToJoin);
  };

  // Handle joining a competition
  const handleJoinCompetition = async (comp) => {
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
        // Refresh list data
        await fetchData();
        // Refetch details to immediately sync layout state
        const detailRes = await fetch(`/api/competitions?id=${comp.id}`);
        const detailJson = await detailRes.json();
        if (detailRes.ok) {
          setDetailData(detailJson);
        }
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
      <Navbar userName={displayName} />

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
          <div className="animate-fade-in select-none">
            {/* Back to List Button */}
            <button 
              onClick={() => {
                setSelectedCompId(null);
                setDetailData(null);
                setError('');
              }}
              className="mb-6 inline-flex items-center gap-1.5 font-bold text-sm text-[#2563EB] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Competitions
            </button>

            {/* TWO COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* LEFT COLUMN (larger, ~60% width / 2 cols span) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Competition banner card with media support */}
                {(() => {
                  const comp = detailData.competition;
                  const hasVideo = !!comp.banner_video_url;
                  const hasImage = !!comp.banner_image_url;
                  const isYoutube = hasVideo && (comp.banner_video_url.includes('youtube.com') || comp.banner_video_url.includes('youtu.be'));
                  const isVimeo = hasVideo && comp.banner_video_url.includes('vimeo.com');
                  const useMediaBackground = hasVideo || hasImage;

                  return (
                    <div className={`border border-[#E5E7EB] rounded-2xl p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden min-h-[220px] flex flex-col justify-between ${
                      useMediaBackground ? 'text-white bg-black' : 'bg-gradient-to-br from-[#EFF6FF] via-white to-white'
                    }`}>
                      {/* Media background */}
                      {hasVideo && (
                        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                          {isYoutube ? (
                            <iframe
                              src={`${comp.banner_video_url}${comp.banner_video_url.includes('?') ? '&' : '?'}autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0`}
                              className="w-full h-full object-cover scale-150"
                              allow="autoplay; encrypted-media"
                              frameBorder="0"
                            />
                          ) : isVimeo ? (
                            <iframe
                              src={`${comp.banner_video_url}${comp.banner_video_url.includes('?') ? '&' : '?'}background=1&autoplay=1&loop=1&byline=0&title=0`}
                              className="w-full h-full object-cover scale-150"
                              allow="autoplay; encrypted-media"
                              frameBorder="0"
                            />
                          ) : (
                            <video
                              src={comp.banner_video_url}
                              autoPlay
                              muted
                              loop
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      )}

                      {/* Image background */}
                      {!hasVideo && hasImage && (
                        <img
                          src={comp.banner_image_url}
                          alt={comp.title}
                          className="absolute inset-0 w-full h-full object-cover z-0"
                        />
                      )}

                      {/* Fallback decorative blur element (only when light) */}
                      {!useMediaBackground && (
                        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-[#2563EB]/5 rounded-full blur-2xl pointer-events-none z-0" />
                      )}

                      {/* Dark overlay for media background */}
                      {useMediaBackground && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25 z-10" />
                      )}

                      <div className="relative z-10 flex-grow flex flex-col justify-between">
                        <div>
                          <span className={`text-[10px] font-extrabold tracking-widest uppercase block mb-2 ${
                            useMediaBackground ? 'text-blue-300' : 'text-[#2563EB]'
                          }`}>
                            Trading Tournament
                          </span>
                          <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight mb-2 ${
                            useMediaBackground ? 'text-white' : 'text-gray-900'
                          }`}>
                            {comp.title}
                          </h2>
                        </div>
                        
                        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t ${
                          useMediaBackground ? 'border-white/10' : 'border-gray-100'
                        }`}>
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                              useMediaBackground ? 'text-slate-400' : 'text-gray-400'
                            }`}>
                              Estimated Prize Pool
                            </span>
                            <span className={`text-2xl md:text-3xl font-black tracking-tight ${
                              useMediaBackground ? 'text-white' : 'text-[#2563EB]'
                            }`}>
                              {getPrizePool(comp)}
                            </span>
                          </div>
                          
                          <div className="flex-shrink-0">
                            {(() => {
                              const status = getCompStatus(comp);
                              
                              if (detailData.joined) {
                                if (status === 'upcoming') {
                                  return (
                                    <button
                                      disabled
                                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-200 border border-gray-300 text-gray-400 font-bold text-xs rounded-xl cursor-not-allowed select-none"
                                      title="This competition hasn't started yet"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-gray-400 text-gray-400" /> Starts Soon
                                    </button>
                                  );
                                } else if (status === 'active') {
                                  return (
                                    <Link
                                      href="/trade"
                                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-white text-white font-semibold" /> Trade in Tournament
                                    </Link>
                                  );
                                } else {
                                  return (
                                    <button
                                      disabled
                                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-100 border border-gray-200 text-gray-400 font-bold text-xs rounded-xl cursor-not-allowed select-none"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-gray-400 text-gray-400" /> Competition Ended
                                    </button>
                                  );
                                }
                              } else {
                                if (status === 'ended') {
                                  return (
                                    <button
                                      disabled
                                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-100 border border-gray-200 text-gray-400 font-bold text-xs rounded-xl cursor-not-allowed select-none"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-gray-400" /> Competition Ended
                                    </button>
                                  );
                                } else if (status === 'upcoming') {
                                  return (
                                    <button
                                      onClick={() => triggerJoinFlow(comp)}
                                      disabled={actionLoading || (comp.entry_fee > 0 && userWalletBalance < comp.entry_fee)}
                                      className={`inline-flex items-center gap-2 px-6 py-3.5 font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-semibold ${
                                        useMediaBackground 
                                          ? 'bg-[#2563EB] hover:bg-[#3B82F6] text-white' 
                                          : 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white'
                                      }`}
                                    >
                                      <Sparkles className="w-3.5 h-3.5" /> Register for Competition
                                    </button>
                                  );
                                } else {
                                  return (
                                    <button
                                      onClick={() => triggerJoinFlow(comp)}
                                      disabled={actionLoading || (comp.entry_fee > 0 && userWalletBalance < comp.entry_fee)}
                                      className={`inline-flex items-center gap-2 px-6 py-3.5 font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-semibold ${
                                        useMediaBackground 
                                          ? 'bg-[#2563EB] hover:bg-[#3B82F6] text-white' 
                                          : 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white'
                                      }`}
                                    >
                                      <Sparkles className="w-3.5 h-3.5" /> Start Competing
                                    </button>
                                  );
                                }
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* User's active standing summary (only when joined) */}
                {detailData.joined && detailData.userProgress && (
                  <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-4">Your Tournament Status</h3>
                    <div className="grid grid-cols-3 gap-4 mb-5 text-center">
                      <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Starting Funds</span>
                        <span className="text-sm font-bold font-mono text-gray-900 mt-1 block">
                          ${parseFloat(detailData.userProgress.starting_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Current Equity</span>
                        <span className="text-sm font-bold font-mono text-gray-900 mt-1 block">
                          ${parseFloat(detailData.userProgress.current_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Leaderboard Rank</span>
                        <span className="text-sm font-extrabold text-[#2563EB] mt-1 block">
                          #{detailData.userRank || '—'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold text-[#6B7280] mb-2">
                        <span className="flex items-center gap-1">
                          Target Progress 
                          <span className={`font-mono font-bold ${detailData.userProgress.pnl_percent >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                            ({detailData.userProgress.pnl_percent >= 0 ? '+' : ''}{detailData.userProgress.pnl_percent.toFixed(2)}%)
                          </span>
                        </span>
                        <span>Goal: +{detailData.competition.target_profit_percent}% Profit</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <div 
                          className="h-full bg-gradient-to-r from-[#2563EB] to-[#10B981] rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, Math.max(0, (detailData.userProgress.pnl_percent / detailData.competition.target_profit_percent) * 100))}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Competition Leaderboard table */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <h3 className="text-base font-bold text-[#111111] mb-5 flex items-center gap-2">
                    <Trophy className="w-4.5 h-4.5 text-amber-500" /> Competition Standings
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-0">
                      <thead>
                        <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <th className="pb-3 px-4">Rank</th>
                          <th className="pb-3 px-4">Participant</th>
                          <th className="pb-3 px-4 text-right">P&L (%)</th>
                          <th className="pb-3 px-4 text-right">Simulated Equity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3F4F6] text-xs">
                        {detailData.top5.map((p) => {
                          const isCurrentUser = p.user_id === userId;
                          return (
                            <tr 
                              key={p.id} 
                              className={`hover:bg-[#FAFAFA] transition-colors ${
                                isCurrentUser ? 'bg-[#2563EB]/5 font-semibold text-[#2563EB]' : 'text-gray-600'
                              }`}
                            >
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded-full font-bold text-[10px] ${
                                  p.rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                  p.rank === 2 ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                                  p.rank === 3 ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                  'text-gray-400'
                                }`}>
                                  #{p.rank}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-gray-800">{p.name}</span> {isCurrentUser && <span className="text-[10px] font-extrabold text-[#2563EB] ml-1 bg-[#2563EB]/10 px-1.5 py-0.5 rounded-md">(YOU)</span>}
                              </td>
                              <td className={`py-3 px-4 text-right font-mono font-bold ${
                                p.pnl_percent >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                              }`}>
                                {p.pnl_percent >= 0 ? '+' : ''}{p.pnl_percent.toFixed(2)}%
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-gray-500">
                                ${parseFloat(p.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Show current user row at bottom if not in top 5 */}
                        {detailData.userProgress && detailData.userRank > 5 && (
                          <>
                            <tr className="bg-white">
                              <td colSpan="4" className="py-1 text-center text-xs text-gray-400 font-bold uppercase tracking-wider bg-gray-50/50 select-none">
                                •••
                              </td>
                            </tr>
                            <tr className="bg-[#2563EB]/5 font-semibold text-[#2563EB]">
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center justify-center w-5.5 h-5.5 rounded-full font-bold text-[10px] bg-[#2563EB] text-white">
                                  #{detailData.userRank}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-[#2563EB]">{detailData.userProgress.name || 'You'}</span> <span className="text-[10px] font-extrabold bg-[#2563EB]/20 px-1.5 py-0.5 rounded-md ml-1">(YOU)</span>
                              </td>
                              <td className={`py-3 px-4 text-right font-mono font-bold ${
                                detailData.userProgress.pnl_percent >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                              }`}>
                                {detailData.userProgress.pnl_percent >= 0 ? '+' : ''}{detailData.userProgress.pnl_percent.toFixed(2)}%
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-[#2563EB] font-semibold">
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

              {/* RIGHT COLUMN (~40% width / 1 col span) */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Meta details card */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-5">
                  
                  {/* Status Badge */}
                  <div>
                    {(() => {
                      const status = getCompStatus(detailData.competition);
                      let badgeClass = "bg-gray-100 text-gray-600 border-gray-200";
                      let badgeLabel = "ENDED";
                      
                      if (status === 'upcoming') {
                        badgeClass = "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]";
                        badgeLabel = "UPCOMING";
                      } else if (status === 'active') {
                        badgeClass = "bg-[#E8F5E9] text-[#16A34A] border-[#C8E6C9]";
                        badgeLabel = "IN PROGRESS";
                      }
                      
                      return (
                        <span className={`px-3 py-1 border rounded-full text-[10px] font-extrabold tracking-wider uppercase ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Dates & Countdown */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-xs text-gray-500 font-semibold">
                      {(() => {
                        const formatDateTime = (dateStr) => {
                          const d = new Date(dateStr);
                          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          const day = d.getDate();
                          const month = months[d.getMonth()];
                          const hrs = d.getHours().toString().padStart(2, '0');
                          const mins = d.getMinutes().toString().padStart(2, '0');
                          return `${day} ${month} ${hrs}:${mins}`;
                        };
                        return `${formatDateTime(detailData.competition.start_date)} — ${formatDateTime(detailData.competition.end_date)}`;
                      })()}
                    </div>
                    
                    <div className="flex items-center gap-1.5 font-bold text-sm text-[#2563EB]">
                      <Clock className="w-4 h-4 text-[#2563EB] animate-pulse" />
                      <span>{liveCountdown}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#6B7280] leading-relaxed pt-1">
                    {detailData.competition.description || 'Test your simulated trading strategies in real market conditions with zero risk. Perfect your entries, manage your size, and aim for the top ranks.'}
                  </p>

                  {/* PARTICIPANTS CARD */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-900 mb-2">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" /> Participants
                      </span>
                      {(() => {
                        const total = detailData.totalParticipants;
                        const cap = detailData.competition.max_participants || 1000;
                        return <span className="font-mono text-gray-500">{total}/{cap}</span>;
                      })()}
                    </div>
                    
                    {(() => {
                      const total = detailData.totalParticipants;
                      const cap = detailData.competition.max_participants || 1000;
                      const percent = (total / cap) * 100;
                      return (
                        <div className="space-y-1.5">
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                            <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="text-[10px] font-semibold text-gray-400 block">
                            {cap - total} spots remaining
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Overview | Prizes Tabs */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="flex border-b border-[#E5E7EB] pb-3 mb-5 gap-4">
                    {['overview', 'prizes'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setRightTab(tab)}
                        className={`text-xs font-bold transition-colors cursor-pointer select-none pb-1 ${
                          rightTab === tab 
                            ? 'text-[#2563EB] border-b-2 border-[#2563EB] pb-3.5 -mb-3.5' 
                            : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        {tab === 'overview' ? 'Overview' : 'Prizes'}
                      </button>
                    ))}
                  </div>

                  {rightTab === 'overview' ? (
                    <div className="space-y-6">
                      {/* Account Details */}
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Account Details</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3 text-center">
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Type</span>
                            <span className="text-xs font-bold text-gray-800 mt-1 block">Standard</span>
                          </div>
                          <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3 text-center">
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Initial Equity</span>
                            <span className="text-xs font-bold text-gray-800 mt-1 block font-mono">
                              ${(() => {
                                const initialEquityValue = (detailData.joined && detailData.userProgress) 
                                  ? parseFloat(detailData.userProgress.starting_balance)
                                  : parseFloat(detailData.competition.initial_equity || 10000);
                                return initialEquityValue.toLocaleString('en-US', { minimumFractionDigits: 2 });
                              })()}
                            </span>
                          </div>
                          <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3 text-center">
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Duration</span>
                            <span className="text-xs font-bold text-gray-800 mt-1 block">
                              {(() => {
                                const diff = new Date(detailData.competition.end_date) - new Date(detailData.competition.start_date);
                                const days = Math.round(diff / (1000 * 60 * 60 * 24));
                                return `${days} Days`;
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Competition Rules */}
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Competition Rules</span>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-gray-700 bg-[#FAFAFA]">
                            <span className="flex items-center gap-2 text-gray-500">
                              <DollarSign className="w-4 h-4 text-gray-400" /> Entry Fee
                            </span>
                            <span className="font-bold text-gray-900">
                              {detailData.competition.entry_fee === 0 ? 'FREE' : `$${parseFloat(detailData.competition.entry_fee).toFixed(0)} virtual`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-gray-700 bg-[#FAFAFA]">
                            <span className="flex items-center gap-2 text-gray-500">
                              <Target className="w-4 h-4 text-gray-400" /> Target Profit
                            </span>
                            <span className="font-bold text-[#2563EB]">
                              +{detailData.competition.target_profit_percent}% Profit
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-gray-700 bg-[#FAFAFA]">
                            <span className="flex items-center gap-2 text-gray-500">
                              <AlertCircle className="w-4 h-4 text-gray-400" /> Re-entry
                            </span>
                            <span className="font-bold text-gray-900">Not Allowed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="text-center p-4 bg-[#2563EB]/5 border border-[#2563EB]/10 rounded-xl">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Estimated Tournament Pool</span>
                        <span className="text-2xl font-black text-[#2563EB] mt-1 block">
                          {getPrizePool(detailData.competition)}
                        </span>
                        <span className="text-[9px] text-[#2563EB] font-bold mt-1 block uppercase tracking-wider">
                          Virtual Recognition Points
                        </span>
                      </div>

                      <p className="text-[10px] text-gray-400 text-center font-medium leading-relaxed">
                        Points are distributed among top traders at the end of the competition. Recognition badges will be displayed on player profiles. No real cash payouts apply.
                      </p>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Rewards Breakdown</span>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-3 text-center">
                            <span className="text-[8px] font-bold text-amber-700 block uppercase">1st Place</span>
                            <span className="text-xs font-extrabold text-amber-900 mt-1 block">50% Points</span>
                          </div>
                          <div className="border border-gray-200 bg-gray-50/50 rounded-xl p-3 text-center">
                            <span className="text-[8px] font-bold text-gray-500 block uppercase">2nd Place</span>
                            <span className="text-xs font-extrabold text-gray-700 mt-1 block">30% Points</span>
                          </div>
                          <div className="border border-orange-200 bg-orange-50/50 rounded-xl p-3 text-center">
                            <span className="text-[8px] font-bold text-orange-600 block uppercase">3rd Place</span>
                            <span className="text-xs font-extrabold text-orange-800 mt-1 block">20% Points</span>
                          </div>
                        </div>

                        <div className="border border-gray-100 rounded-xl p-3.5 bg-[#FAFAFA] text-xs font-semibold text-gray-600 mt-3">
                          <div className="flex justify-between items-center text-gray-500 font-bold uppercase text-[9px] pb-2 border-b border-gray-200/60 mb-2">
                            <span>Ranks #4 - #10</span>
                            <span>Runner-up Badges</span>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-normal font-medium">
                            Traders ranking between 4th and 10th place receive specialized runner-up achievement badges and honorable mentions on the leaderboard list.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
            {/* Redesigned Hero Section */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 md:p-12 mb-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-center gap-6 select-none">
              <div className="max-w-2xl text-center md:text-left">
                <span className="text-[10px] md:text-xs font-bold tracking-widest text-[#2563EB] uppercase block mb-2">
                  DAILY BATTLES. REAL MARKETS. BIG REWARDS
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#111111] tracking-tight mb-3">
                  Enter the Competitions Arena
                </h1>
                <p className="text-sm md:text-base text-[#6B7280] font-medium leading-relaxed">
                  Battle traders worldwide to secure your place at the top of the leaderboard and win rewards.
                </p>
              </div>
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-[#2563EB]/5 border border-[#2563EB]/10 flex items-center justify-center text-[#2563EB] shadow-sm flex-shrink-0">
                <Trophy className="w-8 h-8 md:w-12 md:h-12" />
              </div>
            </div>

            {/* TAB FILTERS */}
            <div className="flex border-b border-[#E5E7EB] mb-8 overflow-x-auto whitespace-nowrap scrollbar-none select-none">
              {['participating', 'in-progress', 'upcoming', 'ended'].map((tab) => {
                const label = tab === 'participating' ? 'Participating' : 
                              tab === 'in-progress' ? 'In Progress' : 
                              tab === 'upcoming' ? 'Upcoming' : 'Ended';
                const count = getFilteredCount(tab);
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setError('');
                    }}
                    className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 mr-8 ${
                      isActive 
                        ? 'text-[#2563EB] border-[#2563EB] font-bold' 
                        : 'text-gray-400 border-transparent hover:text-[#111111] hover:border-gray-200'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-[#2563EB]/10 text-[#2563EB]' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* CARDS GRID */}
            {(() => {
              const filteredList = getFilteredCompetitions();
              if (filteredList.length === 0) {
                // Render custom empty state based on activeTab
                let icon = <Trophy className="w-8 h-8" />;
                let title = "No competitions joined yet";
                let desc = "Register for active or upcoming trading tournaments to prove your skills and climb the leaderboards.";
                let actionText = "Browse Active Tournaments";
                let action = () => setActiveTab('in-progress');

                if (activeTab === 'in-progress') {
                  icon = <Play className="w-8 h-8" />;
                  title = "No active competitions";
                  desc = "There are no in-progress trading tournaments right now. Check out the upcoming tab to register for future battles!";
                  actionText = "View Upcoming Tournaments";
                  action = () => setActiveTab('upcoming');
                } else if (activeTab === 'upcoming') {
                  icon = <Calendar className="w-8 h-8" />;
                  title = "No upcoming competitions";
                  desc = "We are currently preparing new trading tournaments. Stay tuned or check back later to register!";
                  actionText = "Explore Active Tournaments";
                  action = () => setActiveTab('in-progress');
                } else if (activeTab === 'ended') {
                  icon = <CheckCircle2 className="w-8 h-8" />;
                  title = "No ended competitions";
                  desc = "Any completed tournaments will show up here, along with their final leaderboard rankings and statistics.";
                  actionText = "Browse Active Tournaments";
                  action = () => setActiveTab('in-progress');
                }

                return (
                  <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 md:p-16 text-center max-w-xl mx-auto shadow-[0_1px_3px_rgba(0,0,0,0.06)] my-8 select-none">
                    <div className="w-16 h-16 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-6 text-[#2563EB]">
                      {icon}
                    </div>
                    <h2 className="text-xl font-bold text-[#111111] tracking-tight">{title}</h2>
                    <p className="text-sm text-[#6B7280] mt-2 max-w-sm mx-auto leading-relaxed">{desc}</p>
                    <div className="mt-8">
                      <button 
                        onClick={action}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all cursor-pointer"
                      >
                        {actionText}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 select-none">
                  {filteredList.map((comp) => {
                    const countdownText = getCountdownText(comp);
                    const prizePool = getPrizePool(comp);
                    const hasVideo = !!comp.banner_video_url;
                    const hasImage = !!comp.banner_image_url;
                    const isYoutube = hasVideo && (comp.banner_video_url.includes('youtube.com') || comp.banner_video_url.includes('youtu.be'));
                    const isVimeo = hasVideo && comp.banner_video_url.includes('vimeo.com');

                    return (
                      <div 
                        key={comp.id}
                        onClick={() => setSelectedCompId(comp.id)}
                        className="bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.08)] hover:-translate-y-0.5 hover:border-[#2563EB]/40 transition-all duration-300 group cursor-pointer flex flex-col justify-between overflow-hidden min-h-[300px]"
                      >
                        {/* Header Area */}
                        <div className="relative h-28 w-full overflow-hidden bg-gray-100 flex items-end p-4 select-none">
                          {/* Banner video loop */}
                          {hasVideo && (
                            <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                              {isYoutube ? (
                                <iframe
                                  src={`${comp.banner_video_url}${comp.banner_video_url.includes('?') ? '&' : '?'}autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0`}
                                  className="w-full h-full object-cover scale-150"
                                  allow="autoplay; encrypted-media"
                                  frameBorder="0"
                                />
                              ) : isVimeo ? (
                                <iframe
                                  src={`${comp.banner_video_url}${comp.banner_video_url.includes('?') ? '&' : '?'}background=1&autoplay=1&loop=1&byline=0&title=0`}
                                  className="w-full h-full object-cover scale-150"
                                  allow="autoplay; encrypted-media"
                                  frameBorder="0"
                                />
                              ) : (
                                <video
                                  src={comp.banner_video_url}
                                  autoPlay
                                  muted
                                  loop
                                  playsInline
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          )}

                          {/* Banner static image */}
                          {!hasVideo && hasImage && (
                            <img
                              src={comp.banner_image_url}
                              alt={comp.title}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 z-0"
                            />
                          )}

                          {/* Gradient fallback */}
                          {!hasVideo && !hasImage && (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] z-0" />
                          )}

                          {/* Dark overlay for readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-10" />

                          {/* Overlaid Title & Fee */}
                          <div className="relative z-20 w-full flex justify-between items-end gap-3">
                            <h3 className="font-extrabold text-white text-sm tracking-tight line-clamp-1">
                              {comp.title}
                            </h3>
                            {comp.entry_fee === 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#E8F5E9] text-[#16A34A] border border-[#C8E6C9]/20 uppercase tracking-wider flex-shrink-0">
                                Free
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-white/20 backdrop-blur-md text-white border border-white/20 uppercase tracking-wider flex-shrink-0">
                                ${parseFloat(comp.entry_fee).toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 flex-grow flex flex-col justify-between">
                          <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
                            {comp.description || 'Test your simulated trading strategies in real market conditions with zero risk.'}
                          </p>

                          <div className="pt-3 border-t border-[#F3F4F6] mt-auto">
                            <div className="flex justify-between items-baseline mb-3">
                              <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Prize Pool</span>
                                <span className="text-lg font-black text-[#2563EB]">{prizePool}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Target Profit</span>
                                <span className="text-xs font-bold text-gray-800">+{comp.target_profit_percent}%</span>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center text-[11px] text-[#6B7280]">
                              <div className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-gray-400" />
                                <span className="font-semibold">{comp.participantCount} joined</span>
                              </div>
                              
                              <div className="flex items-center gap-1 font-semibold text-gray-500">
                                <Clock className="w-3.5 h-3.5 text-gray-400 animate-pulse" />
                                <span>{countdownText}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-[#9CA3AF]">
          &copy; {new Date().getFullYear()} PaperPulse. Virtual trading educational simulator.
        </div>
      </footer>

      {/* Join Confirmation Modal */}
      {showJoinModal && compToJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 max-w-md w-full mx-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-11 h-11 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                <Trophy className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Join {compToJoin.title}</h3>
                <span className="text-xs text-gray-400 font-semibold mt-0.5 block">
                  {compToJoin.entry_fee === 0 ? 'Free Entry' : `Entry Fee: $${parseFloat(compToJoin.entry_fee).toFixed(0)} (virtual funds)`}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-xs text-[#6B7280] leading-relaxed">
                You are about to join this competition. Please confirm that you have read and agree to the <Link href="/terms" className="text-[#2563EB] font-bold hover:underline">Terms and Conditions</Link> for virtual trading tournaments.
              </p>
              
              <label className="flex items-start gap-3 p-3.5 border border-[#E5E7EB] rounded-xl bg-[#FAFAFA] hover:bg-gray-50/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 text-[#2563EB] border-gray-300 rounded focus:ring-[#2563EB] mt-0.5"
                />
                <span className="text-[11px] font-semibold text-gray-700 leading-tight">
                  I confirm that I have read, understood, and agreed to the Terms and Conditions
                </span>
              </label>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndJoin}
                disabled={!agreeTerms || actionLoading}
                className="flex-1 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-semibold"
              >
                {actionLoading ? 'Joining...' : 'Join Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
