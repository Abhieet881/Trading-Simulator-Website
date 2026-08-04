import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export const revalidate = 0;

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ isAdmin: false, authenticated: false });
    }

    const ADMIN_EMAILS = [
      'patilabhijeet409@gmail.com',
      'abhieet881@gmail.com',
      'abhijeetpatil881@gmail.com',
      'abhijeet881@gmail.com',
      'gzabhijeet@gmail.com'
    ];

    let isAdmin = false;
    try {
      const { data: dbUser, error: dbUserError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (dbUserError) {
        console.warn('[Admin Check] DB is_admin lookup failed:', dbUserError.message);
      }

      const emailMatch = ADMIN_EMAILS.some(
        (e) => e.toLowerCase() === (user.email || '').toLowerCase()
      );

      isAdmin = dbUser?.is_admin === true || emailMatch;
    } catch (err) {
      console.error('[Admin Check] Unexpected error during admin check:', err);
      isAdmin = ADMIN_EMAILS.some(
        (e) => e.toLowerCase() === (user.email || '').toLowerCase()
      );
    }

    return NextResponse.json({ 
      isAdmin, 
      authenticated: true, 
      email: user.email 
    });
  } catch (error) {
    console.error('[Admin Check] Error:', error);
    return NextResponse.json({ 
      isAdmin: false, 
      authenticated: false, 
      error: 'An unexpected server error occurred.' 
    }, { status: 500 });
  }
}
