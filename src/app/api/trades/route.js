import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getActiveWallet } from '@/lib/activeWallet';
import fs from 'fs';
import path from 'path';

const localDbPath = path.join(process.cwd(), 'local_db.json');

// Helper to read local JSON database
function readLocalDb() {
  try {
    if (!fs.existsSync(localDbPath)) {
      const initial = { trades: [], wallets: {} };
      fs.writeFileSync(localDbPath, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(localDbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local db file:', error);
    return { trades: [], wallets: {} };
  }
}

// Helper to write local JSON database
function writeLocalDb(db) {
  try {
    fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error writing local db file:', error);
  }
}

// Local helper to place trade order
function handleLocalPost(userId, activeWalletId, { symbol, side, quantity, entry_price, usd_amount, take_profit, stop_loss }) {
  const db = readLocalDb();
  
  if (!db.wallets_multi) db.wallets_multi = [];
  let wallet = db.wallets_multi.find(w => w.id === activeWalletId && w.user_id === userId);
  
  if (!wallet) {
    // fallback to legacy wallet if matches
    const legacyBal = db.wallets && db.wallets[userId] !== undefined ? db.wallets[userId] : 10000.00;
    wallet = {
      id: userId,
      user_id: userId,
      account_number: '910502',
      virtual_balance: legacyBal,
      initial_balance: db.initial_balances?.[userId] || 10000.00,
      balance_configured: true,
      updated_at: new Date().toISOString()
    };
    db.wallets_multi.push(wallet);
  }

  const balance = parseFloat(wallet.virtual_balance) || 0;
  const numUsdAmount = parseFloat(usd_amount) || 0;

  if (balance < numUsdAmount) {
    return NextResponse.json({ error: 'Required margin/amount exceeds available balance' }, { status: 400 });
  }

  const newBalance = parseFloat((balance - numUsdAmount).toFixed(2));
  wallet.virtual_balance = newBalance;
  if (wallet.id === userId && db.wallets) {
    db.wallets[userId] = newBalance; // Keep legacy updated
  }

  const newTrade = {
    id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    user_id: userId,
    wallet_id: activeWalletId,
    symbol,
    side: side.toLowerCase(),
    status: 'open',
    entry_price: parseFloat(entry_price),
    exit_price: null,
    quantity: parseFloat(quantity),
    size: parseFloat(quantity),
    usd_amount: numUsdAmount,
    pnl: 0.00,
    opened_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    closed_at: null,
    take_profit: take_profit ? parseFloat(take_profit) : null,
    stop_loss: stop_loss ? parseFloat(stop_loss) : null
  };

  db.trades.push(newTrade);
  writeLocalDb(db);

  return NextResponse.json({
    message: 'Order placed successfully (local fallback)',
    trade: newTrade,
    newBalance
  });
}

// Local helper to close trade position
function handleLocalPut(userId, { tradeId, exitPrice }) {
  const db = readLocalDb();
  const tradeIndex = db.trades.findIndex(t => t.id === tradeId && t.user_id === userId);

  if (tradeIndex === -1) {
    return NextResponse.json({ error: 'Position not found' }, { status: 404 });
  }

  const trade = db.trades[tradeIndex];
  if (trade.status === 'closed') {
    return NextResponse.json({ error: 'Position is already closed' }, { status: 400 });
  }

  const numExitPrice = parseFloat(exitPrice);
  const quantity = parseFloat(trade.quantity || trade.size || 0);
  const entryPrice = parseFloat(trade.entry_price);
  const usdAmount = parseFloat(trade.usd_amount);

  const getMultiplier = (symbol) => {
    if (['EUR/USD', 'GBP/USD'].includes(symbol)) return 100000;
    if (symbol === 'XAU/USD') return 100;
    if (symbol === 'AAPL') return 100;
    return 1;
  };
  const multiplier = getMultiplier(trade.symbol);
  
  let pnl = 0;
  if (trade.side.toLowerCase() === 'buy') {
    pnl = (numExitPrice - entryPrice) * multiplier * quantity;
  } else {
    pnl = (entryPrice - numExitPrice) * multiplier * quantity;
  }

  pnl = parseFloat(pnl.toFixed(2));
  const returnedAmount = usdAmount + pnl;

  const targetWalletId = trade.wallet_id || userId;
  if (!db.wallets_multi) db.wallets_multi = [];
  let wallet = db.wallets_multi.find(w => w.id === targetWalletId && w.user_id === userId);
  
  if (!wallet) {
    const legacyBal = db.wallets && db.wallets[userId] !== undefined ? db.wallets[userId] : 10000.00;
    wallet = {
      id: userId,
      user_id: userId,
      account_number: '910502',
      virtual_balance: legacyBal,
      initial_balance: db.initial_balances?.[userId] || 10000.00,
      balance_configured: true,
      updated_at: new Date().toISOString()
    };
    db.wallets_multi.push(wallet);
  }

  const balance = parseFloat(wallet.virtual_balance);
  const newBalance = parseFloat((balance + returnedAmount).toFixed(2));

  wallet.virtual_balance = newBalance;
  if (wallet.id === userId && db.wallets) {
    db.wallets[userId] = newBalance;
  }

  trade.status = 'closed';
  trade.exit_price = numExitPrice;
  trade.pnl = pnl;
  trade.closed_at = new Date().toISOString();

  writeLocalDb(db);

  return NextResponse.json({
    message: 'Position closed successfully (local fallback)',
    tradeId,
    pnl,
    newBalance
  });
}

// GET: Fetch trades for the logged-in user and active account
export async function GET(request) {
  const supabase = await createClient();
  
  // 1. Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'open'; // 'open', 'closed', or 'all'

  try {
    const { activeWallet, useLocalFallback } = await getActiveWallet(user.id);

    if (useLocalFallback) {
      throw new Error('Forcing local database fallback.');
    }

    let query = supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id);
    
    // Filter by wallet_id
    if (activeWallet.id === user.id) {
      // For default primary wallet, fetch both explicitly marked trades and unassigned trades
      query = query.or(`wallet_id.eq.${activeWallet.id},wallet_id.is.null`);
    } else {
      query = query.eq('wallet_id', activeWallet.id);
    }

    let { data: trades, error } = await query;

    // Fallback if wallet_id column doesn't exist in trades table yet
    if (error && (error.message?.includes('column') || error.message?.includes('wallet_id'))) {
      const fallbackRes = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id);
      trades = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      throw error;
    }

    // Filter by status if not 'all'
    let filtered = trades;
    if (status !== 'all') {
      filtered = trades.filter(t => t.status === status);
    }
    
    // Sort
    if (status === 'closed') {
      filtered.sort((a, b) => new Date(b.closed_at) - new Date(a.closed_at));
    } else {
      filtered.sort((a, b) => new Date(b.opened_at || b.created_at) - new Date(a.opened_at || a.created_at));
    }

    // Map to the format expected by the frontend (fixing truthy "0.00" string bug)
    const formattedTrades = filtered.map(t => {
      const parsedSize = parseFloat(t.quantity) || parseFloat(t.size) || 0;
      return {
        id: t.id,
        symbol: t.symbol,
        side: t.side,
        entry: parseFloat(t.entry_price),
        exit: t.exit_price ? parseFloat(t.exit_price) : null,
        size: parsedSize,
        quantity: parsedSize,
        usd_amount: parseFloat(t.usd_amount || 0),
        pnl: t.pnl ? parseFloat(t.pnl) : 0,
        time: new Date(t.opened_at || t.created_at).toLocaleString(),
        closed_time: t.closed_at ? new Date(t.closed_at).toLocaleString() : null,
        status: t.status,
        take_profit: t.take_profit ? parseFloat(t.take_profit) : null,
        stop_loss: t.stop_loss ? parseFloat(t.stop_loss) : null
      };
    });

    return NextResponse.json(formattedTrades);
  } catch (error) {
    console.warn('[Supabase cache fallback] Fetching trades locally:', error.message);
    
    const db = readLocalDb();
    const { activeWallet } = await getActiveWallet(user.id);

    const userTrades = db.trades.filter(t => 
      t.user_id === user.id && 
      (t.wallet_id === activeWallet.id || (!t.wallet_id && activeWallet.id === user.id))
    );
    
    let filtered = userTrades;
    if (status !== 'all') {
      filtered = userTrades.filter(t => t.status === status);
    }
    
    if (status === 'closed') {
      filtered.sort((a, b) => new Date(b.closed_at) - new Date(a.closed_at));
    } else {
      filtered.sort((a, b) => new Date(b.opened_at) - new Date(a.opened_at));
    }

    const formattedTrades = filtered.map(t => {
      const parsedSize = parseFloat(t.quantity) || parseFloat(t.size) || 0;
      return {
        id: t.id,
        symbol: t.symbol,
        side: t.side,
        entry: parseFloat(t.entry_price),
        exit: t.exit_price ? parseFloat(t.exit_price) : null,
        size: parsedSize,
        quantity: parsedSize,
        usd_amount: parseFloat(t.usd_amount),
        pnl: t.pnl ? parseFloat(t.pnl) : 0,
        time: new Date(t.opened_at).toLocaleString(),
        closed_time: t.closed_at ? new Date(t.closed_at).toLocaleString() : null,
        status: t.status,
        take_profit: t.take_profit ? parseFloat(t.take_profit) : null,
        stop_loss: t.stop_loss ? parseFloat(t.stop_loss) : null
      };
    });

    return NextResponse.json(formattedTrades);
  }
}

// POST: Place/Execute a new trade order
export async function POST(request) {
  const supabase = await createClient();
  
  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let bodyData;
  try {
    bodyData = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { symbol, side, quantity, entry_price, usd_amount, take_profit, stop_loss } = bodyData;

  // Basic validation
  if (!symbol || !side || !quantity || !entry_price || !usd_amount) {
    return NextResponse.json({ error: 'Missing required trade details' }, { status: 400 });
  }

  const numQuantity = parseFloat(quantity);
  const numEntryPrice = parseFloat(entry_price);
  const numUsdAmount = parseFloat(usd_amount);

  if (numQuantity <= 0 || numEntryPrice <= 0 || numUsdAmount <= 0) {
    return NextResponse.json({ error: 'Invalid quantity, price, or amount' }, { status: 400 });
  }

  try {
    const { activeWallet, useLocalFallback: forceLocal } = await getActiveWallet(user.id);

    if (forceLocal) {
      return handleLocalPost(user.id, activeWallet.id, { symbol, side, quantity, entry_price, usd_amount, take_profit, stop_loss });
    }

    const balance = parseFloat(activeWallet.virtual_balance) || 0;
    if (balance < numUsdAmount) {
      return NextResponse.json({ error: 'Required margin/amount exceeds available balance' }, { status: 400 });
    }

    // 3. Deduct committed usd_amount from active wallet virtual_balance
    const newBalance = balance - numUsdAmount;
    const { error: updateWalletError } = await supabase
      .from('wallets')
      .update({ virtual_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', activeWallet.id);

    if (updateWalletError) {
      throw new Error(`Failed to update wallet: ${updateWalletError.message}`);
    }

    // 4. Insert trade row
    let insertData = {
      user_id: user.id,
      wallet_id: activeWallet.id,
      symbol,
      side: side.toLowerCase(), // Store lowercase
      status: 'open',
      entry_price: numEntryPrice,
      quantity: numQuantity,
      size: numQuantity, // compatibility
      usd_amount: numUsdAmount,
      pnl: 0.00,
      take_profit: take_profit ? parseFloat(take_profit) : null,
      stop_loss: stop_loss ? parseFloat(stop_loss) : null
    };

    let { data: trade, error: insertError } = await supabase
      .from('trades')
      .insert(insertData)
      .select()
      .single();

    // Fallback if wallet_id column doesn't exist in trades table yet
    if (insertError && (insertError.message?.includes('column') || insertError.message?.includes('wallet_id'))) {
      const fallbackInsertData = { ...insertData };
      delete fallbackInsertData.wallet_id;
      
      const fallbackInsert = await supabase
        .from('trades')
        .insert(fallbackInsertData)
        .select()
        .single();
      trade = fallbackInsert.data;
      insertError = fallbackInsert.error;
    }

    if (insertError) {
      // Rollback wallet balance update if trade insert fails
      await supabase
         .from('wallets')
         .update({ virtual_balance: balance, updated_at: new Date().toISOString() })
         .eq('id', activeWallet.id);
      
      if (insertError.message?.includes('schema cache') || insertError.message?.includes('does not exist') || insertError.code === 'PGRST204') {
        return handleLocalPost(user.id, activeWallet.id, { symbol, side, quantity, entry_price, usd_amount, take_profit, stop_loss });
      }
      throw insertError;
    }

    return NextResponse.json({
      message: 'Order placed successfully',
      trade,
      newBalance
    });
  } catch (error) {
    console.warn('[Supabase cache fallback] Executing trade locally:', error.message);
    const { activeWallet } = await getActiveWallet(user.id);
    return handleLocalPost(user.id, activeWallet.id, { symbol, side, quantity, entry_price, usd_amount, take_profit, stop_loss });
  }
}

// PUT: Close an active trade position
export async function PUT(request) {
  const supabase = await createClient();
  
  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let bodyData;
  try {
    bodyData = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { tradeId, exitPrice } = bodyData;

  if (!tradeId || !exitPrice) {
    return NextResponse.json({ error: 'Missing trade ID or exit price' }, { status: 400 });
  }

  const numExitPrice = parseFloat(exitPrice);
  if (numExitPrice <= 0) {
    return NextResponse.json({ error: 'Invalid exit price' }, { status: 400 });
  }

  try {
    // 2. Fetch trade details
    const { data: trade, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.message?.includes('schema cache') || fetchError.message?.includes('does not exist')) {
        return handleLocalPut(user.id, { tradeId, exitPrice });
      }
      throw fetchError;
    }

    if (trade.status === 'closed') {
      return NextResponse.json({ error: 'Position is already closed' }, { status: 400 });
    }

    // 3. Calculate final P&L
    const quantity = parseFloat(trade.quantity || trade.size || 0);
    const entryPrice = parseFloat(trade.entry_price);
    const usdAmount = parseFloat(trade.usd_amount || 0);
    
    // Leverage multiplier
    const getMultiplier = (symbol) => {
      if (['EUR/USD', 'GBP/USD'].includes(symbol)) return 100000;
      if (symbol === 'XAU/USD') return 100;
      if (symbol === 'AAPL') return 100;
      return 1;
    };
    const multiplier = getMultiplier(trade.symbol);
    
    let pnl = 0;
    if (trade.side.toLowerCase() === 'buy') {
      pnl = (numExitPrice - entryPrice) * multiplier * quantity;
    } else {
      pnl = (entryPrice - numExitPrice) * multiplier * quantity;
    }

    pnl = parseFloat(pnl.toFixed(2));
    const returnedAmount = usdAmount + pnl;

    // 4. Resolve correct target wallet
    const targetWalletId = trade.wallet_id || user.id;

    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', targetWalletId)
      .single();

    if (walletError || !wallet) {
      throw new Error('User wallet not found in Supabase. Forcing local database fallback.');
    }

    const balance = parseFloat(wallet.virtual_balance);
    const newBalance = parseFloat((balance + returnedAmount).toFixed(2));

    // 5. Update wallet balance
    const { error: updateWalletError } = await supabase
      .from('wallets')
      .update({ virtual_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', targetWalletId);

    if (updateWalletError) {
      throw new Error(`Failed to credit wallet balance: ${updateWalletError.message}`);
    }

    // 6. Update trade record status to closed
    const { error: updateTradeError } = await supabase
      .from('trades')
      .update({
        status: 'closed',
        exit_price: numExitPrice,
        pnl,
        closed_at: new Date().toISOString()
      })
      .eq('id', tradeId);

    if (updateTradeError) {
      // Rollback
      await supabase
        .from('wallets')
        .update({ virtual_balance: balance, updated_at: new Date().toISOString() })
        .eq('id', targetWalletId);

      throw updateTradeError;
    }

    return NextResponse.json({
      message: 'Position closed successfully',
      tradeId,
      pnl,
      newBalance
    });
  } catch (error) {
    console.warn('[Supabase cache fallback] Closing position locally:', error.message);
    return handleLocalPut(user.id, { tradeId, exitPrice });
  }
}
