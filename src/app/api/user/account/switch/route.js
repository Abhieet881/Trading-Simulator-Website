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

    // 2. Parse walletId
    const body = await request.json();
    const { walletId } = body;
    if (!walletId) {
      return NextResponse.json({ error: 'walletId is required' }, { status: 400 });
    }

    // 3. Verify wallet ownership
    let ownWallet = false;
    let useLocalFallback = false;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('id')
        .eq('id', walletId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
          useLocalFallback = true;
        } else {
          throw error;
        }
      } else if (data) {
        ownWallet = true;
      }
    } catch (e) {
      useLocalFallback = true;
    }

    if (useLocalFallback) {
      const localDbPath = path.join(process.cwd(), 'local_db.json');
      if (fs.existsSync(localDbPath)) {
        try {
          const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
          const wallet = db.wallets_multi?.find(w => w.id === walletId && w.user_id === user.id);
          if (wallet) {
            ownWallet = true;
          }
        } catch (err) {
          console.error(err);
        }
      }
    }

    if (!ownWallet) {
      return NextResponse.json({ error: 'Wallet not found or access denied' }, { status: 404 });
    }

    // 4. Set cookie
    const cookieStore = await cookies();
    cookieStore.set('pp_active_wallet_id', walletId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true, activeWalletId: walletId });
  } catch (error) {
    console.error('Error switching active account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
