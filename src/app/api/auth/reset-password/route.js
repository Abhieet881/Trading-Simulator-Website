import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { password, confirmPassword } = await req.json();

    if (!password || password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Passwords do not match.' }, { status: 400 });
    }

    const supabase = await createClient();

    // Update the password of the currently authenticated user
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      console.error('Update password error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Sign out the user so they must log in with their new password
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password API error:', error);
    return NextResponse.json({ success: false, error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}
