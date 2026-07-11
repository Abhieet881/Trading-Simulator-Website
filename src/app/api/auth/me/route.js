import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Retrieve profile details from public.users table
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('name, email, plan_type, status')
      .eq('id', user.id)
      .single();

    if (dbError || !dbUser) {
      console.warn('Failed to retrieve user profile from public.users table:', dbError);
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.user_metadata?.name || 'User',
          email: user.email,
          plan_type: 'free',
          status: 'active'
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        name: dbUser.name, 
        email: dbUser.email, 
        plan_type: dbUser.plan_type, 
        status: dbUser.status 
      } 
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json({ success: false, error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}
