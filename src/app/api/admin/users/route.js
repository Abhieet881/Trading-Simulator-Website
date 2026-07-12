import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function PUT(request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate caller
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check if caller is admin
    const { data: callerUser, error: callerError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    let isAdmin = false;
    if (callerUser) {
      isAdmin = callerUser.is_admin;
    } else {
      // Fallback: If public.users table or column is_admin is not fully ready in local development
      // we check if the caller's email is the founder's email to facilitate initial bootstrap
      isAdmin = user.email === 'patilabhijeet409@gmail.com' || user.email === 'abhieet881@gmail.com';
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Parse request body
    const body = await request.json();
    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json({ error: 'Missing userId or status' }, { status: 400 });
    }

    // 4. Update status in Supabase
    let updateError = null;
    try {
      const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', userId);
      updateError = error;
    } catch (e) {
      updateError = e;
    }

    // If Supabase failed or schema lacks status updates, write to local_db.json
    if (updateError || !callerUser) {
      const localDbPath = path.join(process.cwd(), 'local_db.json');
      if (fs.existsSync(localDbPath)) {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        if (!db.user_statuses) {
          db.user_statuses = {};
        }
        db.user_statuses[userId] = status;
        fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin user status update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
