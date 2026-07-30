import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getActiveWallet } from '@/lib/activeWallet';
import TradeClientPage from './TradeClientPage';

export const metadata = {
  title: 'Trade Terminal | PaperPulse',
  description: 'Execute mock buy and sell orders on crypto, stocks, and forex with zero financial risk.',
};

export default async function TradePage() {
  const supabase = await createClient();

  // 1. Authenticate user from session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 2. Fetch user profile name
  const { data: dbUser } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single();

  const displayName = dbUser?.name || user.user_metadata?.name || 'Trader';

  // 3. Resolve active wallet details
  const { activeWallet, useLocalFallback } = await getActiveWallet(user.id);
  const balance = parseFloat(activeWallet.virtual_balance || 0);
  const balanceConfigured = activeWallet.balance_configured || false;
  const accountNumber = activeWallet.account_number;

  // Redirect to dashboard if starting balance is not set
  if (!balanceConfigured) {
    redirect('/dashboard');
  }

  // 4. Fetch user's active positions for this wallet (with fallback support)
  let positions = [];
  if (useLocalFallback) {
    const fs = require('fs');
    const path = require('path');
    const localDbPath = path.join(process.cwd(), 'local_db.json');
    if (fs.existsSync(localDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        const localPositions = db.trades.filter(t => 
          t.user_id === user.id && 
          t.status === 'open' && 
          (t.wallet_id === activeWallet.id || (!t.wallet_id && activeWallet.id === user.id))
        );
        positions = localPositions.map(pos => {
          const parsedSize = parseFloat(pos.quantity) || parseFloat(pos.size) || 0;
          return {
            id: pos.id,
            symbol: pos.symbol,
            side: pos.side,
            entry: parseFloat(pos.entry_price),
            size: parsedSize,
            usd_amount: parseFloat(pos.usd_amount || 0),
            swap: 0.00,
            time: new Date(pos.opened_at).toLocaleString(),
            take_profit: pos.take_profit ? parseFloat(pos.take_profit) : null,
            stop_loss: pos.stop_loss ? parseFloat(pos.stop_loss) : null
          };
        });
      } catch (e) {
        console.error('Error fetching local positions:', e);
      }
    }
  } else {
    try {
      let query = supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open');
      
      if (activeWallet.id === user.id) {
        query = query.or(`wallet_id.eq.${activeWallet.id},wallet_id.is.null`);
      } else {
        query = query.eq('wallet_id', activeWallet.id);
      }

      let { data: dbPositions, error: dbPosError } = await query;

      // Fallback if wallet_id column doesn't exist in trades table yet
      if (dbPosError && (dbPosError.message?.includes('column') || dbPosError.message?.includes('wallet_id'))) {
        const fallbackRes = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'open');
        dbPositions = fallbackRes.data;
        dbPosError = fallbackRes.error;
      }

      if (dbPosError) {
        throw dbPosError;
      } else if (dbPositions) {
        positions = dbPositions.map(pos => {
          const parsedSize = parseFloat(pos.quantity) || parseFloat(pos.size) || 0;
          return {
            id: pos.id,
            symbol: pos.symbol,
            side: pos.side,
            entry: parseFloat(pos.entry_price),
            size: parsedSize,
            usd_amount: parseFloat(pos.usd_amount || 0),
            swap: 0.00,
            time: new Date(pos.created_at).toLocaleString(),
            take_profit: pos.take_profit ? parseFloat(pos.take_profit) : null,
            stop_loss: pos.stop_loss ? parseFloat(pos.stop_loss) : null
          };
        });
      }
    } catch (err) {
      console.error('Failed to fetch trades from Supabase:', err);
    }
  }

  return (
    <TradeClientPage 
      userName={displayName}
      initialBalance={balance}
      initialPositions={positions}
      accountNumber={accountNumber}
    />
  );
}
