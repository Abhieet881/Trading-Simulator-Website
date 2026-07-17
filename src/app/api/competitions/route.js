import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

// Helper to load local database as fallback
function getLocalDb() {
  const localDbPath = path.join(process.cwd(), 'local_db.json');
  if (fs.existsSync(localDbPath)) {
    return JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
  }
  return { trades: [], wallets: {}, competitions: [], competition_participants: [] };
}

// Helper to save local database
function saveLocalDb(db) {
  const localDbPath = path.join(process.cwd(), 'local_db.json');
  fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2), 'utf8');
}

export async function GET(req) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const competitionId = searchParams.get('id');

    // 1. Fetch data from Supabase or Fallback to local_db.json
    let dbCompetitions = [];
    let dbParticipants = [];
    let dbWallets = [];
    let dbUsers = [];
    let isSupabase = true;

    try {
      // Fetch competitions
      const { data: comps, error: compsErr } = await supabase
        .from('competitions')
        .select('*');
      if (compsErr) throw compsErr;
      dbCompetitions = comps || [];

      // Fetch participants
      const { data: parts, error: partsErr } = await supabase
        .from('competition_participants')
        .select('*');
      if (partsErr) throw partsErr;
      dbParticipants = parts || [];

      // Fetch wallets to get latest balances
      const { data: wallets, error: walletsErr } = await supabase
        .from('wallets')
        .select('user_id, virtual_balance');
      if (walletsErr) throw walletsErr;
      dbWallets = wallets || [];

      // Fetch users for names
      const { data: users, error: usersErr } = await supabase
        .from('users')
        .select('id, name');
      if (usersErr) throw usersErr;
      dbUsers = users || [];

    } catch (e) {
      console.warn('Supabase fetch failed in user competitions, loading fallback:', e.message);
      isSupabase = false;
      const db = getLocalDb();
      dbCompetitions = db.competitions || [];
      dbParticipants = db.competition_participants || [];
      
      // Map local wallets
      dbWallets = Object.entries(db.wallets || {}).map(([uid, bal]) => ({
        user_id: uid,
        virtual_balance: bal
      }));

      // Mock users list based on active wallet keys
      dbUsers = dbWallets.map((w, index) => ({
        id: w.user_id,
        name: w.user_id === user.id ? (user.user_metadata?.name || 'You') : `Trader ${index + 1}`
      }));
    }

    // Map wallets and users for fast lookups
    const walletsMap = {};
    dbWallets.forEach(w => {
      walletsMap[w.user_id] = parseFloat(w.virtual_balance);
    });

    const usersMap = {};
    dbUsers.forEach(u => {
      usersMap[u.id] = u.name || 'Anonymous';
    });

    // Sync user's own current_balance in the database if they are participating
    const userWalletBalance = walletsMap[user.id] ?? 10000.00;
    
    // Find all participations of the current user
    const userParticipations = dbParticipants.filter(p => p.user_id === user.id);
    
    // If Supabase, we can update the database. If local, we can update in memory and write back.
    if (userParticipations.length > 0) {
      if (isSupabase) {
        for (const p of userParticipations) {
          if (parseFloat(p.current_balance) !== userWalletBalance) {
            await supabase
              .from('competition_participants')
              .update({ current_balance: userWalletBalance })
              .eq('id', p.id);
            p.current_balance = userWalletBalance; // update in local array for immediate display
          }
        }
      } else {
        let db = getLocalDb();
        let changed = false;
        if (!db.competition_participants) db.competition_participants = [];
        db.competition_participants.forEach(p => {
          if (p.user_id === user.id && p.current_balance !== userWalletBalance) {
            p.current_balance = userWalletBalance;
            changed = true;
          }
        });
        if (changed) {
          saveLocalDb(db);
          dbParticipants = db.competition_participants;
        }
      }
    }

    // Helper to calculate P&L% for a participant
    const calcPnL = (starting, current) => {
      const start = parseFloat(starting);
      const curr = parseFloat(current);
      if (!start || start === 0) return 0;
      return ((curr - start) / start) * 100;
    };

    // If requesting detail view for a specific competition
    if (competitionId) {
      const competition = dbCompetitions.find(c => c.id === competitionId);
      if (!competition) {
        return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
      }

      // Get participants for this competition
      const compParticipants = dbParticipants
        .filter(p => p.competition_id === competitionId)
        .map(p => {
          // Use latest wallet balance for current balance
          const latestBalance = walletsMap[p.user_id] ?? parseFloat(p.current_balance);
          const pnlPercent = calcPnL(p.starting_balance, latestBalance);
          return {
            ...p,
            current_balance: latestBalance,
            name: usersMap[p.user_id] || 'Anonymous',
            pnl_percent: pnlPercent
          };
        });

      // Sort participants by P&L% descending to calculate rank
      compParticipants.sort((a, b) => b.pnl_percent - a.pnl_percent);

      // Assign ranks in memory
      const rankedParticipants = compParticipants.map((p, idx) => ({
        ...p,
        rank: idx + 1
      }));

      // Find the current user's participation and ranking
      const userPart = rankedParticipants.find(p => p.user_id === user.id);

      // Extract top 5
      const top5 = rankedParticipants.slice(0, 5);

      // Return details
      return NextResponse.json({
        competition,
        joined: !!userPart,
        userProgress: userPart || null,
        top5,
        participants: rankedParticipants,
        totalParticipants: rankedParticipants.length,
        userRank: userPart ? userPart.rank : null
      });
    }

    // Default: Return list of active and upcoming competitions
    const now = new Date();
    const activeOrUpcomingComps = dbCompetitions.filter(c => {
      const endDate = new Date(c.end_date);
      // Show competitions that haven't ended yet
      return endDate >= now;
    });

    // Map participant counts and user join status
    const formattedCompetitions = activeOrUpcomingComps.map(c => {
      const participants = dbParticipants.filter(p => p.competition_id === c.id);
      const userPart = participants.find(p => p.user_id === user.id);
      
      let userProgress = null;
      if (userPart) {
        const latestBalance = walletsMap[user.id] ?? parseFloat(userPart.current_balance);
        const pnlPercent = calcPnL(userPart.starting_balance, latestBalance);
        userProgress = {
          ...userPart,
          current_balance: latestBalance,
          pnl_percent: pnlPercent
        };
      }

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        entry_fee: parseFloat(c.entry_fee),
        start_date: c.start_date,
        end_date: c.end_date,
        target_profit_percent: parseFloat(c.target_profit_percent),
        status: c.status,
        participantCount: participants.length,
        joined: !!userPart,
        userProgress
      };
    });

    // Filter user's active joined competitions for "My Active Competitions" section
    const myJoinedCompetitions = formattedCompetitions.filter(c => c.joined);

    return NextResponse.json({
      competitions: formattedCompetitions,
      myActiveCompetitions: myJoinedCompetitions,
      userWalletBalance
    });

  } catch (error) {
    console.error('Failed to query competitions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { competitionId } = await req.json();
    if (!competitionId) {
      return NextResponse.json({ error: 'Competition ID is required' }, { status: 400 });
    }

    // 1. Get competition details to find entry fee
    let entryFee = 0;
    let isSupabase = true;

    try {
      const { data: comp, error: compErr } = await supabase
        .from('competitions')
        .select('entry_fee')
        .eq('id', competitionId)
        .single();
      if (compErr) throw compErr;
      entryFee = comp ? parseFloat(comp.entry_fee) : 0;
    } catch (e) {
      console.warn('Failed to query competition from Supabase, check fallback:', e.message);
      isSupabase = false;
      const db = getLocalDb();
      const comp = (db.competitions || []).find(c => c.id === competitionId);
      if (!comp) {
        return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
      }
      entryFee = comp.entry_fee ? parseFloat(comp.entry_fee) : 0;
    }

    // 2. Get user's wallet virtual_balance
    let userWalletBalance = 10000.00;
    if (isSupabase) {
      try {
        const { data: wallet, error: walletErr } = await supabase
          .from('wallets')
          .select('virtual_balance')
          .eq('user_id', user.id)
          .single();
        if (walletErr) throw walletErr;
        if (wallet) {
          userWalletBalance = parseFloat(wallet.virtual_balance);
        }
      } catch (e) {
        isSupabase = false;
      }
    }

    if (!isSupabase) {
      const db = getLocalDb();
      userWalletBalance = db.wallets[user.id] !== undefined ? db.wallets[user.id] : 10000.00;
    }

    // Check if user has sufficient balance for the entry fee
    if (userWalletBalance < entryFee) {
      return NextResponse.json({ error: 'Insufficient balance to join this competition.' }, { status: 400 });
    }

    const balanceAfterFee = userWalletBalance - entryFee;

    // 3. Register participant and update wallet balance
    const newParticipant = {
      competition_id: competitionId,
      user_id: user.id,
      starting_balance: balanceAfterFee,
      current_balance: balanceAfterFee,
      status: 'active'
    };

    if (isSupabase) {
      // Deduct fee from wallet
      const { error: walletUpdateErr } = await supabase
        .from('wallets')
        .update({ virtual_balance: balanceAfterFee, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      
      if (walletUpdateErr) {
        console.error('Failed to deduct fee from wallet in Supabase:', walletUpdateErr);
        return NextResponse.json({ error: 'Failed to deduct entry fee from wallet' }, { status: 500 });
      }

      const { error: insertErr } = await supabase
        .from('competition_participants')
        .insert(newParticipant);
      
      if (insertErr) {
        // Rollback wallet balance if participant insert fails
        await supabase
          .from('wallets')
          .update({ virtual_balance: userWalletBalance, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (insertErr.code === '23505') {
          return NextResponse.json({ error: 'You have already joined this competition.' }, { status: 400 });
        }
        console.error('Failed to insert participant in Supabase:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 400 });
      }
    } else {
      const db = getLocalDb();
      if (!db.competition_participants) {
        db.competition_participants = [];
      }
      const alreadyJoined = db.competition_participants.some(
        p => p.competition_id === competitionId && p.user_id === user.id
      );
      if (alreadyJoined) {
        return NextResponse.json({ error: 'You have already joined this competition.' }, { status: 400 });
      }

      // Deduct fee from local wallet
      db.wallets[user.id] = balanceAfterFee;

      newParticipant.id = Math.random().toString(36).substring(2, 15);
      newParticipant.joined_at = new Date().toISOString();
      db.competition_participants.push(newParticipant);
      saveLocalDb(db);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to join competition:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
