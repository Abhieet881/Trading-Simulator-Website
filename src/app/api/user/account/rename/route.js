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
    const { walletId, name } = body;
    
    if (!walletId) {
      return NextResponse.json({ error: 'walletId is required' }, { status: 400 });
    }

    const trimmedName = name ? name.trim().substring(0, 50) : '';

    // 3. Update wallet in Supabase
    let ownWallet = false;
    let useLocalFallback = false;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .update({ account_name: trimmedName || null, updated_at: new Date().toISOString() })
        .eq('id', walletId)
        .eq('user_id', user.id)
        .select('id')
        .maybeSingle();
      
      if (error) {
        if (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.message?.includes('column')) {
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

    // Fallback: update local_db.json
    if (useLocalFallback || !ownWallet) {
      const localDbPath = path.join(process.cwd(), 'local_db.json');
      if (fs.existsSync(localDbPath)) {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        if (!db.wallets_multi) db.wallets_multi = [];
        const wallet = db.wallets_multi.find(w => w.id === walletId && w.user_id === user.id);
        if (wallet) {
          wallet.account_name = trimmedName || null;
          wallet.updated_at = new Date().toISOString();
          ownWallet = true;
          fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
        }
      }
    }

    if (!ownWallet) {
      return NextResponse.json({ error: 'Wallet not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, name: trimmedName });
  } catch (error) {
    console.error('Error renaming account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
