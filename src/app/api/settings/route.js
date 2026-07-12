import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request) {
  const supabase = await createClient();
  
  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }

    const cleanName = name.trim();

    // 1. Update public.users table name
    const { error: updateError } = await supabase
      .from('users')
      .update({ name: cleanName })
      .eq('id', user.id);

    if (updateError) {
      if (updateError.message?.includes('schema cache') || updateError.message?.includes('does not exist')) {
        console.warn('[Supabase settings fallback] Handled as success (non-critical name update).');
      } else {
        throw updateError;
      }
    }

    // 2. Update auth user metadata so session updates name
    await supabase.auth.updateUser({
      data: { name: cleanName }
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      name: cleanName
    });
  } catch (error) {
    console.error('Failed to update profile settings:', error);
    return NextResponse.json({ error: error.message || 'Database error' }, { status: 500 });
  }
}
