import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  // Determine where to redirect next
  const next = searchParams.get('next') ?? (type === 'recovery' ? '/reset-password' : '/dashboard');

  // Handle explicit errors passed by Supabase (e.g. link expired)
  if (errorParam) {
    const msg = errorDescription || 'Could not verify link. It may be expired or already used.';
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('exchangeCodeForSession error:', error);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }
  }

  // Fallback if no code and no error parameters
  return NextResponse.redirect(`${origin}/login?error=Invalid%20or%20expired%20authentication%20link.`);
}
