import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import LeaderboardClientPage from './LeaderboardClientPage';

export const metadata = {
  title: 'Leaderboard | PaperPulse',
  description: 'View the highest performing paper traders on the PaperPulse platform.',
};

export default async function LeaderboardPage() {
  const supabase = await createClient();

  // 1. Authenticate user from session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 2. Fetch logged-in user profile name
  let dbUser = null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();
    if (!error && data) {
      dbUser = data;
    }
  } catch (err) {
    console.error('Failed to fetch user profile in leaderboard page load:', err);
  }

  const displayName = dbUser?.name || user.user_metadata?.name || 'Trader';

  // 3. Fetch all closed trades from public_closed_trades view
  let closedTrades = [];
  let isUsingFallback = false;

  try {
    const { data: dbTrades, error: dbTradesError } = await supabase
      .from('public_closed_trades')
      .select('*');

    if (dbTradesError) {
      if (dbTradesError.message?.includes('schema cache') || dbTradesError.message?.includes('does not exist')) {
        isUsingFallback = true;
      } else {
        throw dbTradesError;
      }
    } else if (dbTrades) {
      closedTrades = dbTrades;
    }
  } catch (err) {
    console.error('Failed to fetch public closed trades from view, activating fallback:', err);
    isUsingFallback = true;
  }

  // 4. Handle Fallback (if view is not present)
  if (isUsingFallback) {
    const fs = require('fs');
    const path = require('path');
    const localDbPath = path.join(process.cwd(), 'local_db.json');

    let localTrades = [];
    if (fs.existsSync(localDbPath)) {
      const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
      localTrades = (db.trades || []).filter(t => t.status === 'closed');
    }

    const mappedLocalTrades = localTrades.map(t => ({
      id: t.id,
      user_id: t.user_id,
      user_name: t.user_id === user.id ? displayName : 'Trader',
      pnl: parseFloat(t.pnl || 0),
      closed_at: t.closed_at
    }));

    // Inject rich mock records for competitors to display layout correctly
    const mockUsers = [
      { id: 'mock-trader-1', name: 'Sophia Sterling' },
      { id: 'mock-trader-2', name: 'Alexander Bull' },
      { id: 'mock-trader-3', name: 'Liam Leverage' },
      { id: 'mock-trader-4', name: 'Emma Equity' },
      { id: 'mock-trader-5', name: 'Ethan Option' }
    ];

    const mockTrades = [];
    const now = new Date();
    
    mockUsers.forEach((mu, idx) => {
      // 3 to 6 closed trades per user
      const count = 3 + (idx % 3);
      for (let i = 0; i < count; i++) {
        const closedAt = new Date();
        closedAt.setDate(now.getDate() - (i * 3 + idx * 2));
        
        let basePnL = 2200 - idx * 500;
        let randomPnL = Math.random() * 300 - 100;
        let pnl = basePnL + randomPnL;

        mockTrades.push({
          id: `mock-t-${mu.id}-${i}`,
          user_id: mu.id,
          user_name: mu.name,
          pnl: parseFloat(pnl.toFixed(2)),
          closed_at: closedAt.toISOString()
        });
      }
    });

    closedTrades = [...mappedLocalTrades, ...mockTrades];
  }

  // Uniform mapping
  const formattedTrades = closedTrades.map(t => ({
    id: t.id,
    user_id: t.user_id,
    user_name: t.user_name || 'Anonymous Trader',
    pnl: parseFloat(t.pnl || 0),
    closed_at: t.closed_at
  }));

  return (
    <LeaderboardClientPage 
      currentUserId={user.id}
      userName={displayName}
      trades={formattedTrades}
      isFallbackActive={isUsingFallback}
    />
  );
}
