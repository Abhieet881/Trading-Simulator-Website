import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import CompetitionsClientPage from './CompetitionsClientPage';

export const metadata = {
  title: 'Trading Competitions | PaperPulse',
  description: 'Join risk-free trading tournaments, compete with other traders, and test your strategies.',
};

export default async function CompetitionsPage() {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // 2. Fetch user profile name
  let displayName = 'Trader';
  try {
    const { data: dbUser } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();
    if (dbUser) {
      displayName = dbUser.name;
    } else {
      displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'Trader';
    }
  } catch (err) {
    displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'Trader';
  }

  return (
    <CompetitionsClientPage 
      userId={user.id}
      userEmail={user.email}
      initialDisplayName={displayName}
    />
  );
}
