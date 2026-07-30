import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getActiveWallet } from '@/lib/activeWallet';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { amount, name } = body;
    const numAmount = parseFloat(amount);
    const trimmedName = name ? name.trim().substring(0, 30) : '';

    if (isNaN(numAmount) || numAmount < 100 || numAmount > 1000000) {
      return NextResponse.json({ error: 'Invalid amount. Minimum is $100 and maximum is $1,000,000.' }, { status: 400 });
    }

    if (trimmedName.length > 30) {
      return NextResponse.json({ error: 'Account name cannot exceed 30 characters.' }, { status: 400 });
    }

    // Resolve active wallet first
    const { activeWallet, useLocalFallback: forceLocal } = await getActiveWallet(user.id);

    // 3. Update active wallet in Supabase
    let updateError = null;
    let fallbackToLocal = forceLocal;

    if (!fallbackToLocal) {
      try {
        const { data, error: updateErr } = await supabase
          .from('wallets')
          .update({
            virtual_balance: numAmount,
            initial_balance: numAmount,
            balance_configured: true,
            account_name: trimmedName || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeWallet.id)
          .select();
        
        if (updateErr) {
          if (updateErr.message?.includes('schema cache') || updateErr.message?.includes('does not exist') || updateErr.code === 'PGRST204') {
            fallbackToLocal = true;
          } else {
            throw updateErr;
          }
        } else if (!data || data.length === 0) {
          fallbackToLocal = true;
        }
      } catch (e) {
        updateError = e;
      }
    }

    if (!fallbackToLocal && updateError) {
      console.error('Supabase onboarding update failed:', updateError);
      return NextResponse.json({ error: `Supabase database error: ${updateError.message || updateError}` }, { status: 500 });
    }

    // Fallback: update local_db.json
    if (fallbackToLocal) {
      const localDbPath = path.join(process.cwd(), 'local_db.json');
      if (fs.existsSync(localDbPath)) {
        try {
          const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
          
          if (!db.wallets_multi) db.wallets_multi = [];
          let wallet = db.wallets_multi.find(w => w.id === activeWallet.id && w.user_id === user.id);
          if (wallet) {
            wallet.virtual_balance = numAmount;
            wallet.initial_balance = numAmount;
            wallet.balance_configured = true;
            wallet.account_name = trimmedName || null;
            wallet.updated_at = new Date().toISOString();
          } else {
            wallet = {
              id: activeWallet.id,
              user_id: user.id,
              account_number: activeWallet.account_number,
              account_name: trimmedName || null,
              virtual_balance: numAmount,
              initial_balance: numAmount,
              balance_configured: true,
              updated_at: new Date().toISOString()
            };
            db.wallets_multi.push(wallet);
          }

          // Keep legacy wallets dictionary updated for default account
          if (activeWallet.id === user.id) {
            if (!db.wallets) db.wallets = {};
            db.wallets[user.id] = numAmount;
            
            if (!db.wallets_configured) db.wallets_configured = {};
            db.wallets_configured[user.id] = true;

            if (!db.initial_balances) db.initial_balances = {};
            db.initial_balances[user.id] = numAmount;
          }

          fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
        } catch (e) {
          console.error('Failed to write to local fallback database:', e);
          return NextResponse.json({ error: 'Failed to save starting balance locally.' }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: 'Database files are unreachable.' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, balance: numAmount });
  } catch (error) {
    console.error('Onboarding balance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
