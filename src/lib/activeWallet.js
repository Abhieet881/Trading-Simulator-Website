import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function getActiveWallet(userId) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeWalletId = cookieStore.get('pp_active_wallet_id')?.value;

  let wallets = [];
  let useLocalFallback = false;

  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Detect if Supabase PostgREST schema cache is missing the new columns
    if (data && data.length > 0) {
      const sample = data[0];
      if (!('balance_configured' in sample) || !('account_name' in sample)) {
        throw new Error('Supabase schema cache is missing balance_configured or account_name columns');
      }
    }
    
    wallets = data || [];
  } catch (err) {
    console.warn('getActiveWallet: Supabase query failed or schema cache is outdated. Forcing local DB fallback:', err.message || err);
    useLocalFallback = true;
  }

  const localDbPath = path.join(process.cwd(), 'local_db.json');

  if (useLocalFallback || wallets.length === 0) {
    if (fs.existsSync(localDbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        
        // Migrate old single wallet structure to wallets_multi if needed
        if (db.wallets && db.wallets[userId] !== undefined) {
          if (!db.wallets_multi) db.wallets_multi = [];
          const exists = db.wallets_multi.some(w => w.id === userId && w.user_id === userId);
          if (!exists) {
            const hash = userId.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
            const defaultAccNum = String(Math.abs(hash % 900000) + 100000);
            
            db.wallets_multi.push({
              id: userId, // use userId as default wallet ID locally
              user_id: userId,
              account_number: defaultAccNum,
              account_name: 'Primary Demo',
              virtual_balance: db.wallets[userId],
              initial_balance: db.initial_balances?.[userId] || 10000.00,
              balance_configured: db.wallets_configured?.[userId] !== undefined ? db.wallets_configured[userId] : true,
              updated_at: new Date().toISOString()
            });
            fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
          }
        }

        if (useLocalFallback) {
          wallets = db.wallets_multi?.filter(w => w.user_id === userId) || [];
        }
      } catch (e) {
        console.error('Error reading local db in active wallet resolution:', e);
      }
    }
  }

  // If still no wallets found (neither in Supabase nor in migrated local DB), create a default onboarding wallet
  if (wallets.length === 0) {
    const hash = userId.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const defaultAccNum = String(Math.abs(hash % 900000) + 100000);
    
    const newWallet = {
      id: userId, // default wallet ID matches userId
      user_id: userId,
      account_number: defaultAccNum,
      account_name: 'Primary Demo',
      virtual_balance: 10000.00,
      initial_balance: 10000.00,
      balance_configured: true,
      updated_at: new Date().toISOString()
    };

    if (!useLocalFallback) {
      try {
        const { data, error } = await supabase
          .from('wallets')
          .insert(newWallet)
          .select()
          .single();
        
        if (error) {
          if (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.message?.includes('column')) {
            useLocalFallback = true;
          } else {
            throw error;
          }
        } else if (data) {
          wallets = [data];
        }
      } catch (e) {
        console.warn('Failed to insert default wallet in Supabase, using local fallback:', e.message);
        useLocalFallback = true;
      }
    }

    if (useLocalFallback) {
      try {
        const db = fs.existsSync(localDbPath) ? JSON.parse(fs.readFileSync(localDbPath, 'utf8')) : { trades: [], wallets: {} };
        if (!db.wallets_multi) db.wallets_multi = [];
        const exists = db.wallets_multi.some(w => w.user_id === userId && w.id === userId);
        if (!exists) {
          db.wallets_multi.push(newWallet);
          fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
        }
        wallets = [newWallet];
      } catch (e) {
        console.error('Failed to create default local wallet:', e);
      }
    }
  }

  // Ensure all wallets have an account_number and account_name fallback
  wallets = wallets.map(w => {
    const hash = (w.id || userId).split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const defaultAccNum = String(Math.abs(hash % 900000) + 100000);
    return {
      ...w,
      account_number: w.account_number || defaultAccNum,
      account_name: w.account_name || null
    };
  });

  // Sort wallets so the primary one (id === userId) is always first
  wallets.sort((a, b) => {
    if (a.id === userId) return -1;
    if (b.id === userId) return 1;
    return 0;
  });

  // Find active wallet based on cookie
  let activeWallet = wallets.find(w => w.id === activeWalletId);
  if (!activeWallet) {
    // If not found by ID, maybe check if cookie stored the account_number by accident
    activeWallet = wallets.find(w => w.account_number === activeWalletId);
  }
  if (!activeWallet) {
    // Default to the first wallet
    activeWallet = wallets[0];
  }

  return {
    activeWallet,
    wallets,
    useLocalFallback
  };
}
