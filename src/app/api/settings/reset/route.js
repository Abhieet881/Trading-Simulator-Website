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
    // 1. Reset Supabase virtual_balance to 10000.00
    const { error: walletError } = await supabase
      .from('wallets')
      .update({ virtual_balance: 10000.00, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    // 2. Delete all open trades (or all trades) for the user
    const { error: tradesError } = await supabase
      .from('trades')
      .delete()
      .eq('user_id', user.id);

    // Check if table missing error occurs and fall back to local file database
    if (
      (walletError && (walletError.message?.includes('schema cache') || walletError.message?.includes('does not exist'))) ||
      (tradesError && (tradesError.message?.includes('schema cache') || tradesError.message?.includes('does not exist')))
    ) {
      if (fs.existsSync(localDbPath)) {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        
        // Reset wallet balance
        db.wallets[user.id] = 10000.00;
        
        // Remove user trades
        db.trades = db.trades.filter(t => t.user_id !== user.id);
        
        fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
      }
    } else {
      if (walletError) throw walletError;
      if (tradesError) throw tradesError;
    }

    return NextResponse.json({
      message: 'Virtual balance reset successfully',
      newBalance: 10000.00
    });
  } catch (error) {
    console.error('Failed to reset account:', error);
    return NextResponse.json({ error: error.message || 'Reset failed' }, { status: 500 });
  }
}
