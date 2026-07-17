import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

async function verifyAdmin(supabase) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: dbUser } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  let isAdmin = dbUser?.is_admin || false;
  if (!dbUser && (user.email === 'patilabhijeet409@gmail.com' || user.email === 'abhieet881@gmail.com')) {
    isAdmin = true;
  }

  if (!isAdmin) {
    return { error: 'Forbidden', status: 403 };
  }

  return { user };
}

export async function GET(request) {
  try {
    const supabase = await createClient();
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let competitions = [];
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      competitions = data || [];
    } catch (e) {
      console.warn('Failed to fetch competitions from Supabase, loading from local_db.json fallback:', e.message);
      // Fallback to local_db.json
      const localDbPath = path.join(process.cwd(), 'local_db.json');
      if (fs.existsSync(localDbPath)) {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        competitions = db.competitions || [];
      }
    }

    return NextResponse.json({ competitions });
  } catch (error) {
    console.error('Failed to get competitions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const adminCheck = await verifyAdmin(supabase);
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const body = await request.json();
    const { title, description, entry_fee, start_date, end_date, target_profit_percent } = body;

    if (!title || !start_date || !end_date || target_profit_percent === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newComp = {
      title,
      description: description || '',
      entry_fee: parseFloat(entry_fee || 0),
      start_date,
      end_date,
      target_profit_percent: parseFloat(target_profit_percent),
      status: 'upcoming'
    };

    let insertedData = null;
    let insertError = null;

    try {
      const { data, error } = await supabase
        .from('competitions')
        .insert(newComp)
        .select()
        .single();
      insertError = error;
      insertedData = data;
    } catch (e) {
      insertError = e;
    }

    // Fallback to local_db.json
    if (insertError) {
      const localDbPath = path.join(process.cwd(), 'local_db.json');
      if (fs.existsSync(localDbPath)) {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        if (!db.competitions) {
          db.competitions = [];
        }
        const mockComp = {
          id: Math.random().toString(36).substring(2, 9),
          ...newComp,
          created_at: new Date().toISOString()
        };
        db.competitions.push(mockComp);
        fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
        insertedData = mockComp;
      }
    }

    return NextResponse.json({ success: true, competition: insertedData });
  } catch (error) {
    console.error('Failed to create competition:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabase = await createClient();
    const adminCheck = await verifyAdmin(supabase);
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const body = await request.json();
    const { id, title, description, entry_fee, start_date, end_date, target_profit_percent, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing competition id' }, { status: 400 });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (entry_fee !== undefined) updates.entry_fee = parseFloat(entry_fee);
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;
    if (target_profit_percent !== undefined) updates.target_profit_percent = parseFloat(target_profit_percent);
    if (status !== undefined) updates.status = status;

    let updatedData = null;
    let updateError = null;

    try {
      const { data, error } = await supabase
        .from('competitions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      updateError = error;
      updatedData = data;
    } catch (e) {
      updateError = e;
    }

    // Fallback update in local_db.json
    if (updateError) {
      const localDbPath = path.join(process.cwd(), 'local_db.json');
      if (fs.existsSync(localDbPath)) {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        if (db.competitions) {
          db.competitions = db.competitions.map(c => {
            if (c.id === id) {
              return { ...c, ...updates };
            }
            return c;
          });
          fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
          updatedData = db.competitions.find(c => c.id === id);
        }
      }
    }

    return NextResponse.json({ success: true, competition: updatedData });
  } catch (error) {
    console.error('Failed to update competition:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const adminCheck = await verifyAdmin(supabase);
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing competition id' }, { status: 400 });
    }

    let deleteError = null;
    try {
      const { error } = await supabase
        .from('competitions')
        .delete()
        .eq('id', id);
      deleteError = error;
    } catch (e) {
      deleteError = e;
    }

    // Fallback delete from local_db.json
    if (deleteError) {
      const localDbPath = path.join(process.cwd(), 'local_db.json');
      if (fs.existsSync(localDbPath)) {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        if (db.competitions) {
          db.competitions = db.competitions.filter(c => c.id !== id);
          if (db.competition_participants) {
            db.competition_participants = db.competition_participants.filter(p => p.competition_id !== id);
          }
          fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete competition:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
