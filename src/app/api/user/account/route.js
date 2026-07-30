import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getActiveWallet } from '@/lib/activeWallet';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Resolve plan type
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
      // ignore
    }

    const maxLimit = planType === 'premium' ? 5 : 2;

    // 3. Resolve active wallet and list of wallets
    const { activeWallet, wallets } = await getActiveWallet(user.id);

    const formattedAccounts = wallets.map(w => ({
      id: w.id,
      accountNumber: w.account_number,
      accountName: w.account_name || null,
      balance: parseFloat(w.virtual_balance || 0),
      initialBalance: parseFloat(w.initial_balance || 0),
      isConfigured: w.balance_configured,
      isActive: w.id === activeWallet.id
    }));

    return NextResponse.json({
      accountNumber: activeWallet.account_number,
      accountName: activeWallet.account_name || null,
      balance: parseFloat(activeWallet.virtual_balance || 0),
      activeAccount: {
        id: activeWallet.id,
        accountNumber: activeWallet.account_number,
        accountName: activeWallet.account_name || null,
        balance: parseFloat(activeWallet.virtual_balance || 0),
        initialBalance: parseFloat(activeWallet.initial_balance || 0),
        isConfigured: activeWallet.balance_configured
      },
      accounts: formattedAccounts,
      limitReached: wallets.length >= maxLimit,
      maxLimit
    });

  } catch (error) {
    console.error('Error fetching user account details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
