import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAccountNumber } from '@/lib/account';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Generate deterministic account number
    const accountNumber = getAccountNumber(user.id);

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
          const localDbPath = path.join(process.cwd(), 'local_db.json');
          if (fs.existsSync(localDbPath)) {
            const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
            balance = db.wallets[user.id] !== undefined ? db.wallets[user.id] : 10000.00;
          }
        } else {
          throw dbWalletError;
        }
      } else if (dbWallet) {
        balance = parseFloat(dbWallet.virtual_balance || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch wallet from Supabase, attempting local db fallback:', err.message);
      const localDbPath = path.join(process.cwd(), 'local_db.json');
      if (fs.existsSync(localDbPath)) {
        try {
          const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
          balance = db.wallets[user.id] !== undefined ? db.wallets[user.id] : 10000.00;
        } catch (e) {
          console.error('Local DB fallback error:', e);
        }
      }
    }

    return NextResponse.json({
      accountNumber,
      balance
    });

  } catch (error) {
    console.error('Error fetching user account details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
