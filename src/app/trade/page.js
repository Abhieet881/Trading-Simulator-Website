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
  let balance = 0.00;
  let balanceConfigured = false;
  try {
    const { data: dbWallet, error: dbWalletError } = await supabase
      .from('wallets')
      .select('virtual_balance, balance_configured')
      .eq('user_id', user.id)
      .single();

    if (dbWalletError) {
      if (dbWalletError.message?.includes('schema cache') || dbWalletError.message?.includes('does not exist') || dbWalletError.message?.includes('column')) {
        const fs = require('fs');
        const path = require('path');
        const localDbPath = path.join(process.cwd(), 'local_db.json');
        if (fs.existsSync(localDbPath)) {
          const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
          balance = db.wallets[user.id] !== undefined ? db.wallets[user.id] : 0.00;
          balanceConfigured = db.wallets_configured?.[user.id] !== undefined ? db.wallets_configured[user.id] : false;
        }
      } else {
        throw dbWalletError;
      }
    } else if (dbWallet) {
      balance = parseFloat(dbWallet.virtual_balance || 0);
      balanceConfigured = dbWallet.balance_configured || false;
    }
  } catch (err) {
    console.error('Failed to fetch wallet from Supabase, using default:', err);
    const fs = require('fs');
    const path = require('path');
    const localDbPath = path.join(process.cwd(), 'local_db.json');
    if (fs.existsSync(localDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        balance = db.wallets[user.id] !== undefined ? db.wallets[user.id] : 0.00;
        balanceConfigured = db.wallets_configured?.[user.id] !== undefined ? db.wallets_configured[user.id] : false;
      } catch (e) {}
    }
  }

  // Redirect to dashboard if starting balance is not set
  if (!balanceConfigured) {
    redirect('/dashboard');
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
            usd_amount: parseFloat(pos.usd_amount || 0),
            swap: 0.00,
            time: new Date(pos.opened_at).toLocaleString(),
            take_profit: pos.take_profit ? parseFloat(pos.take_profit) : null,
            stop_loss: pos.stop_loss ? parseFloat(pos.stop_loss) : null
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
        size: parseFloat(pos.size || pos.quantity),
        usd_amount: parseFloat(pos.usd_amount || 0),
        swap: 0.00,
        time: new Date(pos.created_at).toLocaleString(),
        take_profit: pos.take_profit ? parseFloat(pos.take_profit) : null,
        stop_loss: pos.stop_loss ? parseFloat(pos.stop_loss) : null
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

