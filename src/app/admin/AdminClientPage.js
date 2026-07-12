'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, Users, Activity, Wallet, LogOut, 
  ArrowLeft, Search, ChevronLeft, ChevronRight, ShieldAlert,
  UserCheck, UserX, Plus, Trash2, Calendar, Target, Award, Edit, X
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AdminClientPage({ 
  totalUsers: initialTotalUsers,
  activeToday,
  totalTrades,
  totalVolume,
  initialUsers,
  initialCompetitions,
  signupsChartData
}) {
  const [users, setUsers] = useState(initialUsers);
  const [competitions, setCompetitions] = useState(initialCompetitions || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingUser, setLoadingUser] = useState(null);
  
  // Mounted state to handle SSR with Recharts cleanly
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal State for Competitions Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    entry_fee: '0',
    start_date: '',
    end_date: '',
    target_profit_percent: '10'
  });

  // Sync states if props update from Server component
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    setCompetitions(initialCompetitions || []);
  }, [initialCompetitions]);

  // Reset page to 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Active premium/paid subscriptions check
  const activeSubscriptionsCount = useMemo(() => {
    return users.filter(u => u.plan_type && u.plan_type.toLowerCase() !== 'free').length;
  }, [users]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const nameMatch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const emailMatch = (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || emailMatch;
    });
  }, [users, searchQuery]);

  // Pagination bounds
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (res.ok) {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to change this user status to ${newStatus.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    setLoadingUser(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      if (res.ok) {
        setUsers(prev => prev.map(u => {
          if (u.id === userId) {
            return { ...u, status: newStatus };
          }
          return u;
        }));
      } else {
        const errData = await res.json();
        alert(`Failed to update user status: ${errData.error}`);
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('Error updating user status.');
    } finally {
      setLoadingUser(null);
    }
  };

  // Open modal for Creating Competition
  const openCreateModal = () => {
    setEditingComp(null);
    setFormData({
      title: '',
      description: '',
      entry_fee: '0',
      start_date: '',
      end_date: '',
      target_profit_percent: '10'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Editing Competition
  const openEditModal = (comp) => {
    setEditingComp(comp);
    
    // Format timestamp back to local input string (YYYY-MM-DDThh:mm)
    const fmtDate = (dStr) => {
      if (!dStr) return '';
      const d = new Date(dStr);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setFormData({
      title: comp.title || '',
      description: comp.description || '',
      entry_fee: String(comp.entry_fee || 0),
      start_date: fmtDate(comp.start_date),
      end_date: fmtDate(comp.end_date),
      target_profit_percent: String(comp.target_profit_percent || 10)
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle Competition Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    const startTimestamp = new Date(formData.start_date).toISOString();
    const endTimestamp = new Date(formData.end_date).toISOString();

    const payload = {
      title: formData.title,
      description: formData.description,
      entry_fee: parseFloat(formData.entry_fee || 0),
      start_date: startTimestamp,
      end_date: endTimestamp,
      target_profit_percent: parseFloat(formData.target_profit_percent)
    };

    try {
      if (editingComp) {
        // Edit PUT request
        const res = await fetch('/api/admin/competitions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingComp.id, ...payload })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setCompetitions(prev => prev.map(c => c.id === editingComp.id ? data.competition : c));
          setIsModalOpen(false);
        } else {
          setFormError(data.error || 'Failed to update competition');
        }
      } else {
        // Create POST request
        const res = await fetch('/api/admin/competitions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setCompetitions(prev => [data.competition, ...prev]);
          setIsModalOpen(false);
        } else {
          setFormError(data.error || 'Failed to create competition');
        }
      }
    } catch (err) {
      console.error('Failed to submit competition:', err);
      setFormError('An unexpected network error occurred.');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Competition Handler
  const deleteCompetition = async (id) => {
    if (!window.confirm('Are you sure you want to delete this competition? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/admin/competitions?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCompetitions(prev => prev.filter(c => c.id !== id));
      } else {
        const data = await res.json();
        alert(`Failed to delete: ${data.error}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete competition.');
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-[#E2E8F0] flex flex-col justify-between font-sans">
      {/* Admin Dark Navbar */}
      <header className="border-b border-[#1F2937] bg-[#0E1322] sticky top-0 z-50 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
                <TrendingUp className="text-white w-4.5 h-4.5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">PaperPulse</span>
            </Link>
            <span className="px-2 py-0.5 bg-[#DC2626]/20 border border-[#DC2626]/40 text-[#EF4444] rounded text-[10px] font-bold uppercase tracking-wider select-none">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-5">
            <Link 
              href="/dashboard" 
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1 bg-[#1F2937]/40 px-3 py-1.5 rounded-lg border border-[#374151]/40"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to App
            </Link>
            <div className="h-4 w-[1px] bg-[#1F2937]" />
            <button 
              onClick={handleLogout}
              className="text-xs font-semibold text-slate-400 hover:text-[#EF4444] transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-grow w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1F2937] pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Founder Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              General oversight, system metrics, premium subscribers, and trading competitions.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#EF4444] bg-[#DC2626]/10 border border-[#DC2626]/30 px-3 py-1.5 rounded-lg">
            <ShieldAlert className="w-4 h-4" />
            <span>Developer/Founder Mode Active</span>
          </div>
        </div>

        {/* TOP STATS ROW (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Users */}
          <div className="bg-[#0E1322] border border-[#1F2937] rounded-xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</span>
              <div className="p-2 bg-[#2563EB]/20 text-[#3B82F6] rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white font-mono">{users.length}</p>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">
              Registered users
            </span>
          </div>

          {/* Active Today */}
          <div className="bg-[#0E1322] border border-[#1F2937] rounded-xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Today</span>
              <div className="p-2 bg-[#10B981]/20 text-[#34D399] rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white font-mono">{activeToday}</p>
            <span className="text-[10px] text-[#10B981] font-medium mt-1 block">
              Distinct traded accounts today
            </span>
          </div>

          {/* Total Trades Placed */}
          <div className="bg-[#0E1322] border border-[#1F2937] rounded-xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Trades</span>
              <div className="p-2 bg-[#8B5CF6]/20 text-[#A78BFA] rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white font-mono">{totalTrades}</p>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">
              Lifetime executions
            </span>
          </div>

          {/* Total Trading Volume */}
          <div className="bg-[#0E1322] border border-[#1F2937] rounded-xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trading Volume</span>
              <div className="p-2 bg-[#F59E0B]/20 text-[#FBBF24] rounded-lg">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white font-mono">
              ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">
              Total USD size placed
            </span>
          </div>
        </div>

        {/* Users Oversight Card */}
        <div className="bg-[#0E1322] border border-[#1F2937] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-[#1F2937] pb-5">
            <h2 className="text-lg font-bold text-white tracking-tight">Registered Users</h2>
            
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#172033] border border-[#27354F] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1F2937] text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Signup Date</th>
                  <th className="py-3 px-4 text-right">Total Trades</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/50 text-slate-200">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500 text-sm font-medium">
                      No matching user records found.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => {
                    const isSuspended = u.status === 'suspended';
                    return (
                      <tr key={u.id} className="hover:bg-[#172033]/30">
                        <td className="py-3.5 px-4 font-semibold text-white">{u.name}</td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono select-all">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.plan_type === 'premium' ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {u.plan_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isSuspended ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                          {u.trade_count}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => toggleStatus(u.id, u.status)}
                            disabled={loadingUser === u.id}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer ${
                              isSuspended
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#F87171] border border-[#EF4444]/30'
                            }`}
                          >
                            {loadingUser === u.id ? (
                              <span>Updating...</span>
                            ) : isSuspended ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                Activate
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                Suspend
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#1F2937] text-xs select-none">
              <span className="text-slate-500">
                Showing page <strong className="text-slate-300 font-mono">{currentPage}</strong> of <strong className="text-slate-300 font-mono">{totalPages}</strong> (Filtered: <span className="font-mono">{filteredUsers.length}</span> users)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-[#172033] hover:bg-[#202C45] disabled:opacity-30 disabled:hover:bg-[#172033] border border-[#27354F] text-slate-300 rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-[#172033] hover:bg-[#202C45] disabled:opacity-30 disabled:hover:bg-[#172033] border border-[#27354F] text-slate-300 rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 1. REVENUE SECTION */}
        <div className="bg-[#0E1322] border border-[#1F2937] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] p-6 space-y-6">
          <div className="border-b border-[#1F2937] pb-4">
            <h2 className="text-lg font-bold text-white tracking-tight">Revenue & Signups Analytics</h2>
            <p className="text-xs text-slate-400 mt-1">Ready for subscriptions tracking and signup analytics.</p>
          </div>

          {/* Revenue Substats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-[#172033]/50 border border-[#27354F]/40 rounded-xl p-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
              <span className="text-xl font-bold text-white font-mono mt-1 block">$0.00</span>
              <span className="text-[9px] text-slate-500 mt-1 block">Live transactions</span>
            </div>

            <div className="bg-[#172033]/50 border border-[#27354F]/40 rounded-xl p-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Active Subscriptions</span>
              <span className="text-xl font-bold text-white font-mono mt-1 block">{activeSubscriptionsCount}</span>
              <span className="text-[9px] text-slate-500 mt-1 block">Paid subscriber accounts</span>
            </div>

            <div className="bg-[#172033]/50 border border-[#27354F]/40 rounded-xl p-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">MRR (Monthly Recurring)</span>
              <span className="text-xl font-bold text-white font-mono mt-1 block">$0.00</span>
              <span className="text-[9px] text-slate-500 mt-1 block">Normalized billing volume</span>
            </div>
          </div>

          {/* Signups Chart */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">User Signups Over Time</h3>
            
            {mounted ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={signupsChartData} margin={{ left: -25, right: 10, top: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0E1322', borderColor: '#1F2937', color: '#FFF', fontSize: '11px' }}
                    itemStyle={{ color: '#3B82F6' }}
                  />
                  <Area type="monotone" dataKey="count" name="New Registrations" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorSignups)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-slate-500 text-xs">
                Loading analytics feed...
              </div>
            )}
          </div>

          {/* Coming Soon Banner */}
          <div className="bg-blue-600/10 border border-[#2563EB]/30 rounded-xl p-4 flex items-center gap-3">
            <span className="text-xl">💳</span>
            <div>
              <h4 className="text-xs font-bold text-white">Stripe Checkout Integration Coming Soon</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Stripe payment webhooks and revenue logging will automatically activate once premium trading plans launch.
              </p>
            </div>
          </div>
        </div>

        {/* 2. COMPETITIONS SECTION */}
        <div className="bg-[#0E1322] border border-[#1F2937] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1F2937] pb-5">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Competitions Management</h2>
              <p className="text-xs text-slate-400 mt-1">Host trading contests, assign targets, and track milestones.</p>
            </div>
            
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer select-none"
            >
              <Plus className="w-4 h-4" />
              Create Competition
            </button>
          </div>

          {/* Competitions Table / Empty State */}
          {competitions.length === 0 ? (
            <div className="border border-dashed border-[#27354F]/50 rounded-xl py-12 px-6 text-center max-w-md mx-auto">
              <div className="w-12 h-12 bg-[#2563EB]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#3B82F6]">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No Competitions Created Yet</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Provide incentives and targets by launching trading contests for your user base.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB]/10 hover:bg-[#2563EB]/25 text-[#3B82F6] font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create your first competition
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1F2937] text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4">End Date</th>
                    <th className="py-3 px-4 text-center">Entry Fee</th>
                    <th className="py-3 px-4 text-center">Target Profit</th>
                    <th className="py-3 px-4 text-center">Participants</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]/50 text-slate-200">
                  {competitions.map((c) => {
                    const entry = parseFloat(c.entry_fee || 0);
                    const isUpcoming = c.status === 'upcoming';
                    const isActive = c.status === 'active';
                    const isEnded = c.status === 'ended';

                    return (
                      <tr key={c.id} className="hover:bg-[#172033]/30">
                        <td className="py-3.5 px-4">
                          <strong className="text-white block">{c.title}</strong>
                          {c.description && <span className="text-[10px] text-slate-500 block truncate max-w-xs">{c.description}</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isUpcoming ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {new Date(c.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {new Date(c.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-white">
                          {entry === 0 ? 'Free' : `$${entry.toFixed(2)}`}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-white font-semibold">
                          +{c.target_profit_percent}%
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                          0
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => openEditModal(c)}
                              className="p-1.5 bg-[#1F2937]/50 hover:bg-[#374151]/50 text-slate-400 hover:text-white rounded border border-[#374151]/30 cursor-pointer transition-colors"
                              title="Edit Competition"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteCompetition(c.id)}
                              className="p-1.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] rounded border border-[#EF4444]/20 cursor-pointer transition-colors"
                              title="Delete Competition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* CREATE/EDIT MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#0E1322] border border-[#27354F] rounded-xl w-full max-w-lg shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#1F2937] flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                <Award className="w-5 h-5 text-[#2563EB]" />
                {editingComp ? 'Edit Competition Settings' : 'Create New Competition'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-sm">
              {formError && (
                <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg text-[#F87171] text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Title Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Competition Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. BTC Bull Run Challenge"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-[#172033] border border-[#27354F] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                />
              </div>

              {/* Description Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Description (Optional)</label>
                <textarea 
                  rows="3"
                  placeholder="Contest guidelines, parameters, rewards, or specific assets allowed..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[#172033] border border-[#27354F] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                />
              </div>

              {/* Entry Fee & Profit Target Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Entry Fee (USD)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono">$</span>
                    <input 
                      type="number" 
                      min="0"
                      step="any"
                      placeholder="0"
                      value={formData.entry_fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, entry_fee: e.target.value }))}
                      className="w-full bg-[#172033] border border-[#27354F] rounded-lg pl-7 pr-3 py-2 text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Target Profit (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="1"
                      required
                      placeholder="10"
                      value={formData.target_profit_percent}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_profit_percent: e.target.value }))}
                      className="w-full bg-[#172033] border border-[#27354F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors font-mono"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500 font-mono">%</span>
                  </div>
                </div>
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                    Start Date
                  </label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full bg-[#172033] border border-[#27354F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                    End Date
                  </label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full bg-[#172033] border border-[#27354F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#1F2937] mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-transparent hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-lg transition-colors cursor-pointer select-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer select-none"
                >
                  {formLoading ? 'Submitting...' : editingComp ? 'Save Changes' : 'Create Competition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-slate-600 py-6 border-t border-[#1F2937] bg-[#0E1322] mt-8">
        &copy; {new Date().getFullYear()} PaperPulse Admin Portal. All rights reserved.
      </footer>
    </div>
  );
}
