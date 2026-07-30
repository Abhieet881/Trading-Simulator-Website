import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getActiveWallet } from '@/lib/activeWallet';
import fs from 'fs';
import path from 'path';

const localDbPath = path.join(process.cwd(), 'local_db.json');

export async function POST(request) {
  const supabase = await createClient();
  
  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Resolve active wallet
    const { activeWallet, useLocalFallback: forceLocal } = await getActiveWallet(user.id);
    const initialBalance = parseFloat(activeWallet.initial_balance || 10000.00);

    let walletError = null;
    let tradesError = null;
    let fallbackToLocal = forceLocal;

    // 2. Reset virtual_balance to initialBalance and clear open positions in Supabase
    if (!fallbackToLocal) {
      try {
        const { error } = await supabase
          .from('wallets')
          .update({ virtual_balance: initialBalance, updated_at: new Date().toISOString() })
          .eq('id', activeWallet.id);
        walletError = error;
      } catch (e) {
        walletError = e;
      }

      try {
        let query = supabase
          .from('trades')
          .delete()
          .eq('user_id', user.id)
          .eq('status', 'open');
        
        if (activeWallet.id === user.id) {
          query = query.or(`wallet_id.eq.${activeWallet.id},wallet_id.is.null`);
        } else {
          query = query.eq('wallet_id', activeWallet.id);
        }

        let { error } = await query;
        
        // Fallback if wallet_id column doesn't exist in trades table yet
        if (error && (error.message?.includes('column') || error.message?.includes('wallet_id'))) {
          const fallbackDelete = await supabase
            .from('trades')
            .delete()
            .eq('user_id', user.id)
            .eq('status', 'open');
          error = fallbackDelete.error;
        }

        tradesError = error;
      } catch (e) {
        tradesError = e;
      }
    }

    // 3. Fallback: update local_db.json
    if (
      fallbackToLocal ||
      (walletError && (walletError.message?.includes('schema cache') || walletError.message?.includes('does not exist') || walletError.code === 'PGRST204')) ||
      (tradesError && (tradesError.message?.includes('schema cache') || tradesError.message?.includes('does not exist') || tradesError.code === 'PGRST204'))
    ) {
      if (fs.existsSync(localDbPath)) {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        
        // Find and reset wallet balance
        if (!db.wallets_multi) db.wallets_multi = [];
        let wallet = db.wallets_multi.find(w => w.id === activeWallet.id && w.user_id === user.id);
        if (wallet) {
          wallet.virtual_balance = initialBalance;
          wallet.updated_at = new Date().toISOString();
        } else {
          // create if missing
          wallet = {
            id: activeWallet.id,
            user_id: user.id,
            account_number: activeWallet.account_number,
            virtual_balance: initialBalance,
            initial_balance: initialBalance,
            balance_configured: true,
            updated_at: new Date().toISOString()
          };
          db.wallets_multi.push(wallet);
        }

        // Maintain legacy field for safety if it matches default wallet
        if (activeWallet.id === user.id) {
          if (!db.wallets) db.wallets = {};
          db.wallets[user.id] = initialBalance;
        }
        
        // Clean up only OPEN positions for this wallet
        if (db.trades) {
          db.trades = db.trades.filter(t => 
            !(t.user_id === user.id && t.status === 'open' && (t.wallet_id === activeWallet.id || (!t.wallet_id && activeWallet.id === user.id)))
          );
        }
        
        fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
      }
    } else {
      if (walletError) throw walletError;
      if (tradesError) throw tradesError;
    }

    return NextResponse.json({
      message: 'Demo account balance reset and open positions cleared successfully',
      newBalance: initialBalance
    });
  } catch (error) {
    console.error('Failed to reset active demo account:', error);
    return NextResponse.json({ error: error.message || 'Reset failed' }, { status: 500 });
  }
}
