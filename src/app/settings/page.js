import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase';
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

  // 3. Fetch user wallet balance (with local JSON fallback)
  let balance = 10000.00;
  try {
    const { data: dbWallet, error: dbWalletError } = await supabase
      .from('wallets')
      .select('virtual_balance')
      .eq('user_id', user.id)
      .single();

    if (dbWalletError) {
      if (dbWalletError.message?.includes('schema cache') || dbWalletError.message?.includes('does not exist')) {
        const fs = require('fs');
        const path = require('path');
        const localDbPath = path.join(process.cwd(), 'local_db.json');
        if (fs.existsSync(localDbPath)) {
          const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
          balance = db.wallets[user.id] !== undefined ? db.wallets[user.id] : 10000.00;
        }
      } else {
        throw dbWalletError;
      }
    } else if (dbWallet) {
      balance = parseFloat(dbWallet.virtual_balance);
    }
  } catch (err) {
    console.error('Failed to fetch wallet in settings server load:', err);
  }

  return (
    <SettingsClientPage 
      userId={user.id}
      initialName={displayName}
      initialEmail={displayEmail}
      initialCreatedAt={createdAt}
      initialPlanType={planType}
      initialBalance={balance}
    />
  );
}
