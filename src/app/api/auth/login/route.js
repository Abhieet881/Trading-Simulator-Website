import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required.' }, { status: 400 });
    }

    const supabase = await createClient();
    const emailLower = email.toLowerCase().trim();

    // 1. Authenticate user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: emailLower,
      password: password
    });

    if (authError) {
      if (authError.message === 'Email not confirmed') {
        return NextResponse.json({ success: false, error: 'Email not confirmed', email: emailLower }, { status: 400 });
      }
      const message = authError.message === 'Invalid login credentials' 
        ? 'Invalid email or password.' 
        : authError.message;
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    }

    const authUser = authData.user;
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Failed to retrieve user session.' }, { status: 401 });
    }

    // 2. Resolve user status from public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name, status')
      .eq('id', authUser.id)
      .single();

    if (userError || !userData) {
      console.warn('Failed to resolve profile for authenticated user. Recreating profile...', userError);
      // Fallback: If profile row is missing, recreate it
      await supabase.from('users').insert({
        id: authUser.id,
        name: authUser.user_metadata?.name || 'User',
        email: emailLower,
        plan_type: 'free',
        status: 'active'
      });
      // Re-create wallet as well if missing
      const { data: walletCheck } = await supabase.from('wallets').select('id').eq('user_id', authUser.id).single();
      if (!walletCheck) {
        await supabase.from('wallets').insert({
          user_id: authUser.id,
          virtual_balance: 0.00,
          currency: 'USD',
          initial_balance: 0.00,
          balance_configured: false
        });
      }
    }

    // Resolve status (check both Supabase and local DB fallback)
    let status = userData?.status || 'active';
    const fs = require('fs');
    const path = require('path');
    const localDbPath = path.join(process.cwd(), 'local_db.json');
    if (fs.existsSync(localDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        if (db.user_statuses && db.user_statuses[authUser.id]) {
          status = db.user_statuses[authUser.id];
        } else if (db.users) {
          const localUser = db.users.find(u => u.id === authUser.id);
          if (localUser && localUser.status) {
            status = localUser.status;
          }
        }
      } catch (err) {
        console.error('Failed to read local DB user status in login:', err);
      }
    }

    if (status === 'suspended') {
      await supabase.auth.signOut();
      return NextResponse.json({ success: false, error: 'Your account has been suspended. Contact support.' }, { status: 401 });
    } else if (status !== 'active') {
      await supabase.auth.signOut();
      return NextResponse.json({ success: false, error: 'Your account is inactive.' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      redirect: '/dashboard',
      user: { id: authUser.id, name: userData?.name || authUser.user_metadata?.name || 'User', email: emailLower }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}
