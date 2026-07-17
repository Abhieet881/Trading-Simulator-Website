import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

// PUT: Edit user profile details, plan, balance, or active status
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
      // Fallback: Check developer emails
      isAdmin = user.email === 'patilabhijeet409@gmail.com' || user.email === 'abhieet881@gmail.com';
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Parse request body
    const body = await request.json();
    const { userId, status, name, plan_type, virtual_balance } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 4. Perform updates in Supabase
    let updateError = null;
    try {
      const userUpdates = {};
      if (status !== undefined) userUpdates.status = status;
      if (name !== undefined) userUpdates.name = name;
      if (plan_type !== undefined) userUpdates.plan_type = plan_type;

      if (Object.keys(userUpdates).length > 0) {
        const { error } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', userId);
        if (error) throw error;
      }

      if (virtual_balance !== undefined) {
        const { error } = await supabase
          .from('wallets')
          .update({ virtual_balance: parseFloat(virtual_balance), updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        if (error) throw error;
      }
    } catch (e) {
      updateError = e;
    }

    // Fallback: Update local_db.json
    if (updateError || !callerUser) {
      const localDbPath = path.join(process.cwd(), 'local_db.json');
      if (fs.existsSync(localDbPath)) {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        
        if (status !== undefined) {
          if (!db.user_statuses) db.user_statuses = {};
          db.user_statuses[userId] = status;
        }

        if (virtual_balance !== undefined) {
          if (!db.wallets) db.wallets = {};
          db.wallets[userId] = parseFloat(virtual_balance);
        }

        if (db.users) {
          db.users = db.users.map(u => {
            if (u.id === userId) {
              const updated = { ...u };
              if (name !== undefined) updated.name = name;
              if (plan_type !== undefined) updated.plan_type = plan_type;
              if (status !== undefined) updated.status = status;
              return updated;
            }
            return u;
          });
        }
        fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin user status update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Permanently delete a user account and cascade to all trade, wallet, and participation records
export async function DELETE(request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate caller
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check if caller is admin
    const { data: callerUser } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    let isAdmin = callerUser?.is_admin;
    if (!callerUser) {
      isAdmin = user.email === 'patilabhijeet409@gmail.com' || user.email === 'abhieet881@gmail.com';
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Resolve user to delete
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // 4. Perform deletes in Supabase
    let deleteError = null;
    try {
      // Deleting public.users cascades to trades, wallets, and competition_participants tables
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;

      // Clean up Supabase Auth account if Admin Service Role key is configured
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey) {
        const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
        const adminClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          serviceKey,
          { auth: { persistSession: false } }
        );
        await adminClient.auth.admin.deleteUser(userId);
      }
    } catch (e) {
      deleteError = e;
    }

    // Fallback: Delete from local_db.json
    if (deleteError || !callerUser) {
      const localDbPath = path.join(process.cwd(), 'local_db.json');
      if (fs.existsSync(localDbPath)) {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));

        if (db.users) {
          db.users = db.users.filter(u => u.id !== userId);
        }

        if (db.wallets && db.wallets[userId] !== undefined) {
          delete db.wallets[userId];
        }

        if (db.user_statuses && db.user_statuses[userId] !== undefined) {
          delete db.user_statuses[userId];
        }

        if (db.trades) {
          db.trades = db.trades.filter(t => t.user_id !== userId);
        }

        if (db.competition_participants) {
          db.competition_participants = db.competition_participants.filter(p => p.user_id !== userId);
        }

        fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin user delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
