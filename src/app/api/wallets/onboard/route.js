import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
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
    const { amount } = body;
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount < 100 || numAmount > 1000000) {
      return NextResponse.json({ error: 'Invalid amount. Minimum is $100 and maximum is $1,000,000.' }, { status: 400 });
    }

    // 3. Update wallet in Supabase
    let updateError = null;
    try {
      const { error } = await supabase
        .from('wallets')
        .update({
          virtual_balance: numAmount,
          initial_balance: numAmount,
          balance_configured: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
    } catch (e) {
      updateError = e;
    }

    // Fallback: update local_db.json
    if (updateError) {
      const localDbPath = path.join(process.cwd(), 'local_db.json');
      if (fs.existsSync(localDbPath)) {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        
        if (!db.wallets) db.wallets = {};
        db.wallets[user.id] = numAmount;

        if (!db.wallets_configured) db.wallets_configured = {};
        db.wallets_configured[user.id] = true;

        if (!db.initial_balances) db.initial_balances = {};
        db.initial_balances[user.id] = numAmount;

        fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
      }
    }

    return NextResponse.json({ success: true, balance: numAmount });
  } catch (error) {
    console.error('Onboarding balance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
