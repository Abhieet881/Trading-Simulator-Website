import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import AdminClientPage from './AdminClientPage';

export const revalidate = 0; // Disable server caching for administrative accuracy

export default async function AdminPage() {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // 2. Resolve admin privileges
  let isAdmin = false;
  try {
    const { data: dbUser, error: dbUserError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (dbUser) {
      isAdmin = dbUser.is_admin;
    } else {
      // Fallback check for initial setup or development environment
      isAdmin = user.email === 'patilabhijeet409@gmail.com' || user.email === 'abhieet881@gmail.com';
    }
  } catch (err) {
    console.error('Admin privilege check failed, checking fallback:', err);
    isAdmin = user.email === 'patilabhijeet409@gmail.com' || user.email === 'abhieet881@gmail.com';
  }

  if (!isAdmin) {
    redirect('/dashboard');
  }

  // 3. Fetch admin metrics, user lists, and competitions
  let totalUsers = 0;
  let activeToday = 0;
  let totalTrades = 0;
  let totalVolume = 0.00;
  let usersList = [];
  let competitionsList = [];

  try {
    // A. Fetch users
    const { data: dbUsers, error: usersErr } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    // A2. Fetch wallets
    const { data: dbWallets, error: walletsErr } = await supabase
      .from('wallets')
      .select('user_id, virtual_balance');

    // B. Fetch trades (all users)
    const { data: dbTrades, error: tradesErr } = await supabase
      .from('trades')
      .select('*');

    // C. Fetch competitions
    const { data: dbComps, error: compsErr } = await supabase
      .from('competitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersErr) throw usersErr;
    if (tradesErr) throw tradesErr;
    if (compsErr) throw compsErr;

    const walletBalanceMap = {};
    if (dbWallets) {
      dbWallets.forEach(w => {
        walletBalanceMap[w.user_id] = parseFloat(w.virtual_balance);
      });
    }

    if (dbUsers) {
      totalUsers = dbUsers.length;
      usersList = dbUsers.map(u => {
        const userTrades = dbTrades ? dbTrades.filter(t => t.user_id === u.id) : [];
        return {
          ...u,
          trade_count: userTrades.length,
          virtual_balance: walletBalanceMap[u.id] !== undefined ? walletBalanceMap[u.id] : 10000.00
        };
      });
    }

    if (dbTrades) {
      totalTrades = dbTrades.length;
      totalVolume = dbTrades.reduce((sum, t) => sum + parseFloat(t.usd_amount || 0), 0);

      const todayStr = new Date().toDateString();
      const activeUsers = new Set(
        dbTrades
          .filter(t => {
            const openDate = new Date(t.created_at).toDateString();
            const closeDate = t.closed_at ? new Date(t.closed_at).toDateString() : null;
            return openDate === todayStr || closeDate === todayStr;
          })
          .map(t => t.user_id)
      );
      activeToday = activeUsers.size;
    }

    if (dbComps) {
      competitionsList = dbComps;
    }
  } catch (err) {
    console.warn('Supabase admin data query failed, falling back to local database:', err.message);
    
    // Fallback to local_db.json
    const fs = require('fs');
    const path = require('path');
    const localDbPath = path.join(process.cwd(), 'local_db.json');
    
    if (fs.existsSync(localDbPath)) {
      const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
      
      // Initialize persistent mock users list if not exists
      if (!db.users) {
        db.users = Object.keys(db.wallets || {}).map((uid, index) => ({
          id: uid,
          name: uid === user.id ? (user.user_metadata?.name || 'Abhijeet Patil') : `Sim User ${index + 1}`,
          email: uid === user.id ? user.email : `user${index + 1}@example.com`,
          plan_type: uid === user.id ? 'premium' : 'free',
          status: db.user_statuses?.[uid] || 'active',
          is_admin: uid === user.id ? true : false,
          created_at: new Date(Date.now() - index * 86400000 * 2.5).toISOString()
        }));
        fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
      }

      const mockUsers = db.users.map(u => {
        const userTrades = db.trades ? db.trades.filter(t => t.user_id === u.id) : [];
        const savedStatus = db.user_statuses?.[u.id] || u.status || 'active';
        return {
          ...u,
          status: savedStatus,
          trade_count: userTrades.length,
          virtual_balance: db.wallets[u.id] !== undefined ? db.wallets[u.id] : 10000.00
        };
      });

      usersList = mockUsers;
      totalUsers = mockUsers.length;

      if (db.trades) {
        totalTrades = db.trades.length;
        totalVolume = db.trades.reduce((sum, t) => sum + parseFloat(t.usd_amount || 0), 0);

        const todayStr = new Date().toDateString();
        const activeUsers = new Set(
          db.trades
            .filter(t => {
              const openDate = new Date(t.created_at).toDateString();
              const closeDate = t.closed_at ? new Date(t.closed_at).toDateString() : null;
              return openDate === todayStr || closeDate === todayStr;
            })
            .map(t => t.user_id)
        );
        activeToday = activeUsers.size;
      }

      competitionsList = db.competitions || [];
    }
  }

  // Format users for UI
  const initialUsers = usersList.map(u => ({
    id: u.id,
    name: u.name || 'User',
    email: u.email || '—',
    plan_type: u.plan_type || 'free',
    status: u.status || 'active',
    created_at: u.created_at || new Date().toISOString(),
    trade_count: u.trade_count || 0
  }));

  // Aggregate signups data (daily signups counts)
  const signupsByDate = {};
  initialUsers.forEach(u => {
    const dateStr = new Date(u.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    signupsByDate[dateStr] = (signupsByDate[dateStr] || 0) + 1;
  });

  // Convert to chart data format (take the latest 10 dates for readability, or all)
  const signupsChartData = Object.entries(signupsByDate)
    .map(([date, count]) => ({ date, count }))
    .reverse(); // Match signup chronological order (usersList was sorted by newest first, so reverse it)

  return (
    <AdminClientPage 
      totalUsers={totalUsers}
      activeToday={activeToday}
      totalTrades={totalTrades}
      totalVolume={totalVolume}
      initialUsers={initialUsers}
      initialCompetitions={competitionsList}
      signupsChartData={signupsChartData}
    />
  );
}
