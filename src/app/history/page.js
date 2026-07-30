import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getActiveWallet } from '@/lib/activeWallet';
import HistoryClientPage from './HistoryClientPage';

export const metadata = {
  title: 'Trade History | PaperPulse',
  description: 'Review and analyze all your past virtual trades and execution statistics.',
};

export default async function HistoryPage() {
  const supabase = await createClient();

  // 1. Authenticate user from session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 2. Fetch user profile name
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
    console.error('Failed to fetch user profile in history page loader:', err);
  }

  const displayName = dbUser?.name || user.user_metadata?.name || 'Trader';

  // 3. Resolve active wallet
  const { activeWallet, useLocalFallback } = await getActiveWallet(user.id);

  // 4. Fetch all closed trades for this wallet (with fallback support)
  let closedTrades = [];
  if (useLocalFallback) {
    const fs = require('fs');
    const path = require('path');
    const localDbPath = path.join(process.cwd(), 'local_db.json');
    if (fs.existsSync(localDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        closedTrades = db.trades.filter(t => 
          t.user_id === user.id && 
          t.status === 'closed' &&
          (t.wallet_id === activeWallet.id || (!t.wallet_id && activeWallet.id === user.id))
        );
        closedTrades.sort((a, b) => new Date(b.closed_at) - new Date(a.closed_at));
      } catch (e) {}
    }
  } else {
    try {
      let query = supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'closed');
      
      if (activeWallet.id === user.id) {
        query = query.or(`wallet_id.eq.${activeWallet.id},wallet_id.is.null`);
      } else {
        query = query.eq('wallet_id', activeWallet.id);
      }

      let { data: dbTrades, error: dbTradesError } = await query.order('closed_at', { ascending: false });

      // Fallback if wallet_id column doesn't exist in trades table yet
      if (dbTradesError && (dbTradesError.message?.includes('column') || dbTradesError.message?.includes('wallet_id'))) {
        const fallbackRes = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'closed')
          .order('closed_at', { ascending: false });
        dbTrades = fallbackRes.data;
        dbTradesError = fallbackRes.error;
      }

      if (dbTradesError) {
        throw dbTradesError;
      } else if (dbTrades) {
        closedTrades = dbTrades;
      }
    } catch (err) {
      console.error('Failed to fetch trades in history page load:', err);
    }
  }

  // Map to unified format (fixing truthy "0.00" string bug)
  const formattedTrades = closedTrades.map(t => {
    const parsedSize = parseFloat(t.quantity) || parseFloat(t.size) || 0;
    return {
      id: t.id,
      symbol: t.symbol,
      side: t.side,
      entry: parseFloat(t.entry_price),
      exit: t.exit_price ? parseFloat(t.exit_price) : 0,
      size: parsedSize,
      usd_amount: parseFloat(t.usd_amount || 0),
      pnl: parseFloat(t.pnl || 0),
      opened_at: t.opened_at || t.created_at,
      closed_at: t.closed_at
    };
  });

  return (
    <HistoryClientPage 
      userName={displayName}
      trades={formattedTrades}
    />
  );
}
