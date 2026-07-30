import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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
    const { amount, name } = body;
    const numAmount = parseFloat(amount);
    const trimmedName = name ? name.trim().substring(0, 50) : '';

    if (isNaN(numAmount) || numAmount < 100 || numAmount > 1000000) {
      return NextResponse.json({ error: 'Invalid amount. Minimum is $100 and maximum is $1,000,000.' }, { status: 400 });
    }

    // 3. Resolve user plan type
    let planType = 'free';
    try {
      const { data: dbUser } = await supabase
        .from('users')
        .select('plan_type')
        .eq('id', user.id)
        .single();
      if (dbUser && dbUser.plan_type) {
        planType = dbUser.plan_type.toLowerCase();
      }
    } catch (e) {
      // ignore, default to free
    }

    // Define account limits based on plan
    const maxAccounts = planType === 'premium' ? 5 : 2;

    // 4. Fetch existing wallets
    let existingWallets = [];
    let useLocalFallback = false;
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
          useLocalFallback = true;
        } else {
          throw error;
        }
      } else {
        existingWallets = data || [];
      }
    } catch (e) {
      useLocalFallback = true;
    }

    const localDbPath = path.join(process.cwd(), 'local_db.json');
    if (useLocalFallback && fs.existsSync(localDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        existingWallets = db.wallets_multi?.filter(w => w.user_id === user.id) || [];
      } catch (err) {
        console.error(err);
      }
    }

    // Check account limit
    if (existingWallets.length >= maxAccounts) {
      const planMsg = planType === 'premium' 
        ? 'Maximum limit of 5 demo accounts reached for Premium plan.' 
        : 'Maximum limit of 2 demo accounts reached for Free plan. Upgrade to Premium for more accounts!';
      return NextResponse.json({ error: planMsg }, { status: 400 });
    }

    // 5. Generate a unique 6-digit account number
    let newAccountNumber = '';
    let collision = true;
    let attempts = 0;
    while (collision && attempts < 20) {
      attempts++;
      const randNum = String(Math.floor(100000 + Math.random() * 900000));
      
      // Check collision
      let isColliding = false;
      if (!useLocalFallback) {
        const { data } = await supabase
          .from('wallets')
          .select('id')
          .eq('account_number', randNum)
          .maybeSingle();
        if (data) isColliding = true;
      } else if (fs.existsSync(localDbPath)) {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        const exists = db.wallets_multi?.some(w => w.account_number === randNum);
        if (exists) isColliding = true;
      }

      if (!isColliding) {
        newAccountNumber = randNum;
        collision = false;
      }
    }

    if (!newAccountNumber) {
      newAccountNumber = String(Math.floor(100000 + Math.random() * 900000));
    }

    // 6. Create new account
    const newWalletId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newWallet = {
      id: useLocalFallback ? newWalletId : undefined, // Supabase generates gen_random_uuid() by default
      user_id: user.id,
      account_number: newAccountNumber,
      account_name: trimmedName || null,
      virtual_balance: numAmount,
      currency: 'USD',
      initial_balance: numAmount,
      balance_configured: true,
      updated_at: new Date().toISOString()
    };

    let createdWallet = null;
    if (!useLocalFallback) {
      try {
        const { data, error } = await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            account_number: newAccountNumber,
            account_name: trimmedName || null,
            virtual_balance: numAmount,
            currency: 'USD',
            initial_balance: numAmount,
            balance_configured: true,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          if (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.code === 'PGRST204') {
            useLocalFallback = true;
          } else {
            throw error;
          }
        } else {
          createdWallet = data;
        }
      } catch (err) {
        console.error('Failed to insert wallet in Supabase:', err.message || err);
        if (err.code === 'PGRST204' || err.message?.includes('schema cache') || err.message?.includes('does not exist')) {
          useLocalFallback = true;
        }
        if (!useLocalFallback) {
          return NextResponse.json({ error: `Supabase database error: ${err.message || err}` }, { status: 500 });
        }
      }
    }

    if (useLocalFallback) {
      if (fs.existsSync(localDbPath)) {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        if (!db.wallets_multi) db.wallets_multi = [];
        
        const localWallet = {
          ...newWallet,
          id: newWalletId // Make sure ID is set for local fallback
        };
        db.wallets_multi.push(localWallet);
        fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
        createdWallet = localWallet;
      }
    }

    if (!createdWallet) {
      return NextResponse.json({ error: 'Failed to create demo account' }, { status: 500 });
    }

    // 7. Set cookie to make it the active wallet
    const cookieStore = await cookies();
    cookieStore.set('pp_active_wallet_id', createdWallet.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true, wallet: createdWallet });
  } catch (error) {
    console.error('Error creating demo account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
