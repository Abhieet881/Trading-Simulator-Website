import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { name, email, password, confirmPassword, agreeToTerms } = await req.json();

    // Server-side validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Full Name is required.' }, { status: 400 });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Passwords do not match.' }, { status: 400 });
    }

    if (!agreeToTerms) {
      return NextResponse.json({ success: false, error: 'You must agree to the Terms of Service and Privacy Policy.' }, { status: 400 });
    }

    const supabase = await createClient();
    const emailLower = email.toLowerCase().trim();

    // 1. Sign up the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailLower,
      password: password,
      options: {
        data: {
          name: name.trim(),
        }
      }
    });

    if (authError) {
      return NextResponse.json({ success: false, error: authError.message }, { status: 400 });
    }

    const authUser = authData.user;
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Failed to create auth user account.' }, { status: 400 });
    }

    // 2. Insert user profile into public.users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        name: name.trim(),
        email: emailLower,
        plan_type: 'free',
        status: 'active'
      });

    if (userError) {
      console.error('Failed to create user profile in public.users:', userError);
      return NextResponse.json({ success: false, error: userError.message }, { status: 400 });
    }

    // 3. Insert virtual wallet for the user into public.wallets
    const { error: walletError } = await supabase
      .from('wallets')
      .insert({
        user_id: authUser.id,
        virtual_balance: 10000.00,
        currency: 'USD'
      });

    if (walletError) {
      console.error('Failed to create virtual wallet in public.wallets:', walletError);
      return NextResponse.json({ success: false, error: walletError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      redirect: '/dashboard',
      user: { id: authUser.id, name: name.trim(), email: emailLower }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ success: false, error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}
