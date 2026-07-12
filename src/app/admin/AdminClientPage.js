'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, Users, Activity, Wallet, LogOut, 
  ArrowLeft, Search, ChevronLeft, ChevronRight, ShieldAlert,
  UserCheck, UserX
} from 'lucide-react';

export default function AdminClientPage({ 
  totalUsers: initialTotalUsers,
  activeToday,
  totalTrades,
  totalVolume,
  initialUsers 
}) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingUser, setLoadingUser] = useState(null);

  // Sync users if initialUsers changes from server components
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // Reset page to 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter users by name or email
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

  return (
    <div className="min-h-screen bg-[#090D16] text-[#E2E8F0] flex flex-col justify-between font-sans">
      {/* Admin Dark Navbar */}
      <header className="border-b border-[#1F2937] bg-[#0E1322] sticky top-0 z-50 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo with Admin Tag */}
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

          {/* Navigation controls */}
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
      <main className="max-w-6xl mx-auto px-6 py-10 flex-grow w-full">
        {/* Top Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1F2937] pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Founder Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              General oversight, system metrics, and user account configurations.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#EF4444] bg-[#DC2626]/10 border border-[#DC2626]/30 px-3 py-1.5 rounded-lg">
            <ShieldAlert className="w-4 h-4" />
            <span>Developer/Founder Mode Active</span>
          </div>
        </div>

        {/* TOP STATS ROW (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
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
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-600 py-6 border-t border-[#1F2937] bg-[#0E1322]">
        &copy; {new Date().getFullYear()} PaperPulse Admin Portal. All rights reserved.
      </footer>
    </div>
  );
}
