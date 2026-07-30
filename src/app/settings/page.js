import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getActiveWallet } from '@/lib/activeWallet';
import SettingsClientPage from './SettingsClientPage';

export const metadata = {
  title: 'Settings | PaperPulse',
  description: 'Manage your PaperPulse account settings and preferences.',
};

export default async function SettingsPage() {
  const supabase = await createClient();

  // 1. Authenticate user from session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 2. Fetch user details from public.users
  let dbUser = null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!error && data) {
      dbUser = data;
    }
  } catch (err) {
    console.error('Failed to fetch users table in settings page server load:', err);
  }

  // Resolve values with auth fallbacks
  const displayName = dbUser?.name || user.user_metadata?.name || 'Trader';
  const displayEmail = dbUser?.email || user.email;
  const createdAt = dbUser?.created_at || user.created_at || new Date().toISOString();
  const planType = dbUser?.plan_type || 'free';

  // 3. Fetch active wallet details
  const { activeWallet, wallets } = await getActiveWallet(user.id);
  const balance = parseFloat(activeWallet.virtual_balance || 0);
  const initialConfiguredBalance = parseFloat(activeWallet.initial_balance || 10000.00);
  const accountNumber = activeWallet.account_number;

  return (
    <SettingsClientPage 
      userId={user.id}
      initialName={displayName}
      initialEmail={displayEmail}
      initialCreatedAt={createdAt}
      initialPlanType={planType}
      initialBalance={balance}
      initialConfiguredBalance={initialConfiguredBalance}
      accountNumber={accountNumber}
      accountName={activeWallet.account_name}
      initialWallets={wallets}
    />
  );
}
