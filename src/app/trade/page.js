import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase';
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

  // 3. Fetch user wallet balance
  let balance = 10000.00;
  try {
    const { data: dbWallet, error: dbWalletError } = await supabase
      .from('wallets')
      .select('virtual_balance')
      .eq('user_id', user.id)
      .single();

    if (dbWalletError) {
      if (dbWalletError.message?.includes('schema cache') || dbWalletError.message?.includes('does not exist')) {
        const fs = require('fs');
        const path = require('path');
        const localDbPath = path.join(process.cwd(), 'local_db.json');
        if (fs.existsSync(localDbPath)) {
          const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
          balance = db.wallets[user.id] !== undefined ? db.wallets[user.id] : 10000.00;
        }
      } else {
        throw dbWalletError;
      }
    } else if (dbWallet) {
      balance = parseFloat(dbWallet.virtual_balance);
    }
  } catch (err) {
    console.error('Failed to fetch wallet from Supabase, using default:', err);
  }

  // 4. Fetch user's active positions from Supabase
  let positions = [];
  try {
    const { data: dbPositions, error: dbPosError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'open');

    if (dbPosError) {
      if (dbPosError.message?.includes('schema cache') || dbPosError.message?.includes('does not exist')) {
        const fs = require('fs');
        const path = require('path');
        const localDbPath = path.join(process.cwd(), 'local_db.json');
        if (fs.existsSync(localDbPath)) {
          const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
          const localPositions = db.trades.filter(t => t.user_id === user.id && t.status === 'open');
          positions = localPositions.map(pos => ({
            id: pos.id,
            symbol: pos.symbol,
            side: pos.side,
            entry: parseFloat(pos.entry_price),
            size: parseFloat(pos.quantity),
            swap: 0.00,
            time: new Date(pos.opened_at).toLocaleString()
          }));
        }
      } else {
        throw dbPosError;
      }
    } else if (dbPositions) {
      positions = dbPositions.map(pos => ({
        id: pos.id,
        symbol: pos.symbol,
        side: pos.side,
        entry: parseFloat(pos.entry_price),
        size: parseFloat(pos.size),
        swap: 0.00,
        time: new Date(pos.created_at).toLocaleString()
      }));
    }
  } catch (err) {
    console.error('Failed to fetch trades from Supabase:', err);
  }

  // 5. Generate a deterministic 6-digit account number from user UUID
  let hash = 0;
  for (let i = 0; i < user.id.length; i++) {
    hash = user.id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const accountNumber = Math.abs(hash % 900000) + 100000;

  return (
    <TradeClientPage 
      userName={displayName}
      initialBalance={balance}
      initialPositions={positions}
      accountNumber={accountNumber}
    />
  );
}

