import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
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
    // 1. Determine user's initial configured balance
    let initialBalance = 10000.00;
    let fallbackToLocal = false;

    try {
      const { data: dbWallet, error: fetchError } = await supabase
        .from('wallets')
        .select('balance_configured, initial_balance')
        .eq('user_id', user.id)
        .single();
      
      if (fetchError) {
        if (fetchError.message?.includes('schema cache') || fetchError.message?.includes('does not exist') || fetchError.message?.includes('column')) {
          fallbackToLocal = true;
        } else {
          throw fetchError;
        }
      } else if (dbWallet && dbWallet.initial_balance) {
        const parsed = parseFloat(dbWallet.initial_balance);
        if (parsed > 0) {
          initialBalance = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to resolve initial balance from Supabase, will check local DB:', e.message);
      fallbackToLocal = true;
    }

    if (fallbackToLocal && fs.existsSync(localDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        if (db.initial_balances && db.initial_balances[user.id]) {
          const parsed = parseFloat(db.initial_balances[user.id]);
          if (parsed > 0) {
            initialBalance = parsed;
          }
        }
      } catch (err) {
        console.error('Failed to read local initial balance:', err);
      }
    }

    // 2. Reset virtual_balance to initialBalance in Supabase
    let walletError = null;
    let tradesError = null;

    if (!fallbackToLocal) {
      try {
        const { error } = await supabase
          .from('wallets')
          .update({ virtual_balance: initialBalance, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        walletError = error;
      } catch (e) {
        walletError = e;
      }

      try {
        const { error } = await supabase
          .from('trades')
          .delete()
          .eq('user_id', user.id);
        tradesError = error;
      } catch (e) {
        tradesError = e;
      }
    }

    // 3. Fallback: update local_db.json
    if (
      fallbackToLocal ||
      (walletError && (walletError.message?.includes('schema cache') || walletError.message?.includes('does not exist'))) ||
      (tradesError && (tradesError.message?.includes('schema cache') || tradesError.message?.includes('does not exist')))
    ) {
      if (fs.existsSync(localDbPath)) {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        
        // Reset wallet balance
        if (!db.wallets) db.wallets = {};
        db.wallets[user.id] = initialBalance;
        
        // Clean up user trades
        if (db.trades) {
          db.trades = db.trades.filter(t => t.user_id !== user.id);
        }
        
        fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
      }
    } else {
      if (walletError) throw walletError;
      if (tradesError) throw tradesError;
    }

    return NextResponse.json({
      message: 'Virtual balance reset successfully',
      newBalance: initialBalance
    });
  } catch (error) {
    console.error('Failed to reset account:', error);
    return NextResponse.json({ error: error.message || 'Reset failed' }, { status: 500 });
  }
}
