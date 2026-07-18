'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, TrendingDown, User, AlertCircle, Info, CheckCircle2, Search,
  Settings, HelpCircle, ChevronDown, Maximize2, Plus, Minus, Lock, Unlock,
  Eye, EyeOff, Trash2, RefreshCw, Sliders, X
} from 'lucide-react';
import UserDropdown from '../dashboard/UserDropdown';

// Asset definitions with their configuration
const ASSETS = {
  'BTC': {
    symbol: 'BTC',
    pair: 'BTC/USDT',
    name: 'Bitcoin',
    price: 67240.50,
    high24h: 68100.00,
    low24h: 65890.00,
    volume24h: '18.4K BTC ($1.2B)',
    change24h: '+2.45%',
    type: 'Crypto',
    unit: 'BTC',
    iconColor: 'text-[#F0B90B] bg-[#F0B90B]/10',
    svgIcon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.25 15.5h-2.5v-1.5H12c1.38 0 2.5-1.12 2.5-2.5 0-1.04-.63-1.92-1.53-2.31.72-.42 1.21-1.2 1.21-2.1 0-1.38-1.12-2.5-2.5-2.5h-.43V3.5h2.5v1.5h1v1.5h-1v5h1v1.5h-1v4.5h1v1.5zm-3.5-3v-2.5h2c.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25h-2zm0-4.5V8h1.75c.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25h-1.75z"/>
      </svg>
    )
  },
  'ETH': {
    symbol: 'ETH',
    pair: 'ETH/USDT',
    name: 'Ethereum',
    price: 3482.15,
    high24h: 3560.40,
    low24h: 3410.20,
    volume24h: '142K ETH ($495M)',
    change24h: '-1.20%',
    type: 'Crypto',
    unit: 'ETH',
    iconColor: 'text-[#627EEA] bg-[#627EEA]/10',
    svgIcon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L3.5 16.02L12 22L20.5 16.02L12 2ZM12 4.67L18.11 14.8L12 18.25L5.89 14.8L12 4.67Z" />
      </svg>
    )
  },
  'EUR/USD': {
    symbol: 'EUR/USD',
    pair: 'EUR/USD',
    name: 'Euro / US Dollar',
    price: 1.0845,
    high24h: 1.0890,
    low24h: 1.0812,
    volume24h: '85K Lots ($8.5B)',
    change24h: '+0.12%',
    type: 'Forex',
    unit: 'EUR',
    iconColor: 'text-[#003399] bg-[#003399]/10',
    svgIcon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    )
  },
  'GBP/USD': {
    symbol: 'GBP/USD',
    pair: 'GBP/USD',
    name: 'British Pound / US Dollar',
    price: 1.2825,
    high24h: 1.2910,
    low24h: 1.2780,
    volume24h: '62K Lots ($6.2B)',
    change24h: '+0.18%',
    type: 'Forex',
    unit: 'GBP',
    iconColor: 'text-[#C8102E] bg-[#C8102E]/10',
    svgIcon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6V18M8 12H16" />
      </svg>
    )
  },
  'XAU/USD': {
    symbol: 'XAU/USD',
    pair: 'XAU/USD',
    name: 'Gold / US Dollar',
    price: 2380.50,
    high24h: 2405.00,
    low24h: 2368.00,
    volume24h: '38K Lots ($3.8B)',
    change24h: '+0.79%',
    type: 'Commodities',
    unit: 'XAU',
    iconColor: 'text-[#D4AF37] bg-[#D4AF37]/10',
    svgIcon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 22h20L12 2zm0 4.25L18.4 18H5.6L12 6.25z" />
      </svg>
    )
  },
  'AAPL': {
    symbol: 'AAPL',
    pair: 'AAPL/USD',
    name: 'Apple Inc.',
    price: 189.84,
    high24h: 191.20,
    low24h: 188.10,
    volume24h: '42.5M Shares ($8.1B)',
    change24h: '+1.85%',
    type: 'Stocks',
    unit: 'AAPL',
    iconColor: 'text-[#A3AAAE] bg-[#A3AAAE]/10',
    svgIcon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.05-1 .04-2.22.67-2.94 1.52-.64.74-1.2 1.88-1.05 2.98 1.12.09 2.27-.57 3-1.45z"/>
      </svg>
    )
  }
};

// Generates dynamic candlesticks based on base price
function generateMockCandles(basePrice, timeframe = '1H', count = 45) {
  const data = [];
  let current = basePrice * 0.985;
  const nowSec = Math.floor(Date.now() / 1000);
  
  let interval = 3600;
  if (timeframe === '1m') interval = 60;
  if (timeframe === '15m') interval = 900;
  if (timeframe === '4H') interval = 14400;
  if (timeframe === '1D') interval = 86400;

  let startTime = nowSec - (count * interval);

  for (let i = 0; i < count; i++) {
    const trend = (Math.random() - 0.46) * 0.009;
    const open = current;
    const close = current * (1 + trend);
    const high = Math.max(open, close) * (1 + Math.random() * 0.0035);
    const low = Math.min(open, close) * (1 - Math.random() * 0.0035);

    data.push({
      time: startTime + (i * interval),
      open: parseFloat(open.toFixed(basePrice < 5 ? 4 : 2)),
      high: parseFloat(high.toFixed(basePrice < 5 ? 4 : 2)),
      low: parseFloat(low.toFixed(basePrice < 5 ? 4 : 2)),
      close: parseFloat(close.toFixed(basePrice < 5 ? 4 : 2))
    });
    current = close;
  }
  return data;
}

export default function TradeClientPage({ userName, initialBalance, initialPositions, accountNumber }) {
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [timeframe, setTimeframe] = useState('1H');
  const [chartType, setChartType] = useState('candles'); // 'candles' or 'line'
  const [orderType, setOrderType] = useState('buy'); // 'buy' or 'sell'
  const [orderSubtype, setOrderSubtype] = useState('Market'); // 'Limit', 'Market', 'Stop-Limit'
  
  // Input fields volume & prices
  const [vol, setVol] = useState('0.100');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [totalUSDT, setTotalUSDT] = useState('');
  
  // Leverage state
  const [leverage, setLeverage] = useState(10);

  // Checkbox TP/SL configuration
  const [tpslChecked, setTpslChecked] = useState(false);
  const [tpPrice, setTpPrice] = useState('');
  const [slPrice, setSlPrice] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [tableTab, setTableTab] = useState('positions');
  const [watchlistTab, setWatchlistTab] = useState('All');

  // Search dialog visibility
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Drawing toolbar states
  const [activeDrawingTool, setActiveDrawingTool] = useState('cursor'); // cursor, trend, fib, brush, text
  const [drawingsLocked, setDrawingsLocked] = useState(false);
  const [drawingsHidden, setDrawingsHidden] = useState(false);
  const [magnetMode, setMagnetMode] = useState(false);

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volSeriesRef = useRef(null);
  const lastBarRef = useRef(null);
  const priceLinesRef = useRef([]);

  const asset = ASSETS[selectedAsset];
  const [balance, setBalance] = useState(initialBalance);

  // Real-time price states
  const [prices, setPrices] = useState({
    BTC: ASSETS.BTC.price,
    ETH: ASSETS.ETH.price,
    'EUR/USD': ASSETS['EUR/USD'].price,
    'GBP/USD': ASSETS['GBP/USD'].price,
    'XAU/USD': ASSETS['XAU/USD'].price,
    AAPL: ASSETS.AAPL.price
  });

  const [directions, setDirections] = useState({
    BTC: 'up',
    ETH: 'up',
    'EUR/USD': 'up',
    'GBP/USD': 'up',
    'XAU/USD': 'up',
    AAPL: 'up'
  });

  const livePrice = prices[selectedAsset];
  const priceDirection = directions[selectedAsset];

  // Flashing indicator for real-time tick changes
  const [prevPrice, setPrevPrice] = useState(livePrice);
  const [priceFlash, setPriceFlash] = useState(null); // 'up' | 'down' | null

  // Live prices, percents and 24h stats
  const [changePercents, setChangePercents] = useState({
    BTC: parseFloat(ASSETS.BTC.change24h),
    ETH: parseFloat(ASSETS.ETH.change24h),
    'EUR/USD': parseFloat(ASSETS['EUR/USD'].change24h),
    'GBP/USD': parseFloat(ASSETS['GBP/USD'].change24h),
    'XAU/USD': parseFloat(ASSETS['XAU/USD'].change24h),
    AAPL: parseFloat(ASSETS.AAPL.change24h)
  });

  const [stats, setStats] = useState({
    BTC: { high24h: ASSETS.BTC.high24h, low24h: ASSETS.BTC.low24h, volume24h: ASSETS.BTC.volume24h },
    ETH: { high24h: ASSETS.ETH.high24h, low24h: ASSETS.ETH.low24h, volume24h: ASSETS.ETH.volume24h },
    'EUR/USD': { high24h: ASSETS['EUR/USD'].high24h, low24h: ASSETS['EUR/USD'].low24h, volume24h: ASSETS['EUR/USD'].volume24h },
    'GBP/USD': { high24h: ASSETS['GBP/USD'].high24h, low24h: ASSETS['GBP/USD'].low24h, volume24h: ASSETS['GBP/USD'].volume24h },
    'XAU/USD': { high24h: ASSETS['XAU/USD'].high24h, low24h: ASSETS['XAU/USD'].low24h, volume24h: ASSETS['XAU/USD'].volume24h },
    AAPL: { high24h: ASSETS.AAPL.high24h, low24h: ASSETS.AAPL.low24h, volume24h: ASSETS.AAPL.volume24h }
  });

  // Dynamic positions calculations from Supabase
  const [positions, setPositions] = useState(initialPositions || []);

  // Calculate dynamic P&Ls based on live prices
  const getPositionPnL = (pos) => {
    const currentPrice = prices[pos.symbol] || pos.entry;
    if (pos.side === 'Buy') {
      if (['EUR/USD', 'GBP/USD'].includes(pos.symbol)) {
        return (currentPrice - pos.entry) * 100000 * pos.size;
      }
      if (pos.symbol === 'XAU/USD') {
        return (currentPrice - pos.entry) * 100 * pos.size;
      }
      return (currentPrice - pos.entry) * pos.size;
    } else {
      if (['EUR/USD', 'GBP/USD'].includes(pos.symbol)) {
        return (pos.entry - currentPrice) * 100000 * pos.size;
      }
      if (pos.symbol === 'XAU/USD') {
        return (pos.entry - currentPrice) * 100 * pos.size;
      }
      return (pos.entry - currentPrice) * pos.size;
    }
  };

  const totalFloatingPnL = positions.reduce((sum, pos) => sum + getPositionPnL(pos), 0);
  const activeMargin = positions.reduce((sum, pos) => sum + (pos.usd_amount || 0), 0);
  const activeEquity = balance + activeMargin + totalFloatingPnL;
  const freeMargin = activeEquity - activeMargin;

  // Track selected price ticking flash effect
  useEffect(() => {
    if (livePrice > prevPrice) {
      setPriceFlash('up');
    } else if (livePrice < prevPrice) {
      setPriceFlash('down');
    }
    setPrevPrice(livePrice);

    const timer = setTimeout(() => setPriceFlash(null), 300);
    return () => clearTimeout(timer);
  }, [livePrice]);

  // Sync Price defaults and calculate initial Total USDT
  useEffect(() => {
    const defaultPriceStr = livePrice.toString();
    setLimitPrice(defaultPriceStr);
    setStopPrice((livePrice * 1.01).toFixed(['EUR/USD', 'GBP/USD'].includes(selectedAsset) ? 4 : 2));
    
    const initialVol = parseFloat(vol) || 0;
    const lotMultiplier = ['EUR/USD', 'GBP/USD'].includes(selectedAsset) ? 100000 : selectedAsset === 'XAU/USD' ? 100 : 1;
    setTotalUSDT((initialVol * livePrice * lotMultiplier).toFixed(2));
  }, [selectedAsset]);

  // Re-calculate Total USDT when price ticks if in Market mode
  useEffect(() => {
    if (orderSubtype === 'Market') {
      const currentVol = parseFloat(vol) || 0;
      const lotMultiplier = ['EUR/USD', 'GBP/USD'].includes(selectedAsset) ? 100000 : selectedAsset === 'XAU/USD' ? 100 : 1;
      setTotalUSDT((currentVol * livePrice * lotMultiplier).toFixed(2));
    }
  }, [livePrice, orderSubtype]);

  // Helper to read 24h change percentage from state
  const getChangePercent = (symbol) => {
    return changePercents[symbol] || 0;
  };

  const selectedChangePct = getChangePercent(selectedAsset);
  const selectedIsUp = selectedChangePct >= 0;

  // Poll real-time prices from the backend API every 3 seconds
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/prices');
        const data = await res.json();
        
        setPrices(prev => {
          const next = {};
          const newDirs = { ...directions };
          Object.keys(data).forEach(sym => {
            next[sym] = data[sym].price;
            newDirs[sym] = data[sym].price >= (prev[sym] || data[sym].price) ? 'up' : 'down';
          });
          setDirections(newDirs);
          return next;
        });

        setChangePercents({
          BTC: data.BTC.change,
          ETH: data.ETH.change,
          'EUR/USD': data['EUR/USD'].change,
          'GBP/USD': data['GBP/USD'].change,
          'XAU/USD': data['XAU/USD'].change,
          AAPL: data.AAPL.change
        });

        setStats({
          BTC: { high24h: data.BTC.high, low24h: data.BTC.low, volume24h: data.BTC.volume },
          ETH: { high24h: data.ETH.high, low24h: data.ETH.low, volume24h: data.ETH.volume },
          'EUR/USD': { high24h: data['EUR/USD'].high, low24h: data['EUR/USD'].low, volume24h: data['EUR/USD'].volume },
          'GBP/USD': { high24h: data['GBP/USD'].high, low24h: data['GBP/USD'].low, volume24h: data['GBP/USD'].volume },
          'XAU/USD': { high24h: data['XAU/USD'].high, low24h: data['XAU/USD'].low, volume24h: data['XAU/USD'].volume },
          AAPL: { high24h: data.AAPL.high, low24h: data.AAPL.low, volume24h: data.AAPL.volume }
        });
      } catch (err) {
        console.error('Failed to fetch live prices:', err);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 3000);
    return () => clearInterval(interval);
  }, [directions]);

  // Steppers for volume & prices
  const adjustVol = (increment) => {
    const step = 0.01;
    const current = parseFloat(vol) || 0;
    const next = increment ? current + step : Math.max(step, current - step);
    setVol(next.toFixed(3));
    syncTotalFromVol(next, limitPrice);
  };

  const adjustPrice = (type, increment) => {
    const step = ['EUR/USD', 'GBP/USD'].includes(selectedAsset) ? 0.0001 : selectedAsset === 'XAU/USD' ? 0.10 : selectedAsset === 'BTC' ? 10 : selectedAsset === 'ETH' ? 0.50 : 0.50;
    const val = type === 'limit' ? limitPrice : stopPrice;
    const current = parseFloat(val) || livePrice;
    const next = increment ? current + step : Math.max(0.0001, current - step);
    const formatted = next.toFixed(['EUR/USD', 'GBP/USD'].includes(selectedAsset) ? 4 : 2);
    if (type === 'limit') {
      setLimitPrice(formatted);
      syncTotalFromVol(parseFloat(vol), next);
    } else {
      setStopPrice(formatted);
    }
  };

  const adjustTp = (increment) => {
    const step = ['EUR/USD', 'GBP/USD'].includes(selectedAsset) ? 0.0001 : selectedAsset === 'XAU/USD' ? 0.10 : selectedAsset === 'BTC' ? 10 : selectedAsset === 'ETH' ? 0.50 : 0.50;
    const current = parseFloat(tpPrice) || livePrice;
    const next = increment ? current + step : Math.max(0, current - step);
    setTpPrice(next.toFixed(['EUR/USD', 'GBP/USD'].includes(selectedAsset) ? 4 : 2));
  };

  const adjustSl = (increment) => {
    const step = ['EUR/USD', 'GBP/USD'].includes(selectedAsset) ? 0.0001 : selectedAsset === 'XAU/USD' ? 0.10 : selectedAsset === 'BTC' ? 10 : selectedAsset === 'ETH' ? 0.50 : 0.50;
    const current = parseFloat(slPrice) || livePrice;
    const next = increment ? current + step : Math.max(0, current - step);
    setSlPrice(next.toFixed(['EUR/USD', 'GBP/USD'].includes(selectedAsset) ? 4 : 2));
  };


  // Sync Total USDT from Vol quantity
  const syncTotalFromVol = (quantity, rate) => {
    const lotMultiplier = ['EUR/USD', 'GBP/USD'].includes(selectedAsset) ? 100000 : selectedAsset === 'XAU/USD' ? 100 : 1;
    const priceVal = orderSubtype === 'Market' ? livePrice : (parseFloat(rate) || livePrice);
    const total = quantity * priceVal * lotMultiplier;
    setTotalUSDT(total.toFixed(2));
    validateLimit(total);
  };

  // Sync Vol quantity from Total USDT
  const syncVolFromTotal = (totalAmount, rate) => {
    const lotMultiplier = ['EUR/USD', 'GBP/USD'].includes(selectedAsset) ? 100000 : selectedAsset === 'XAU/USD' ? 100 : 1;
    const priceVal = orderSubtype === 'Market' ? livePrice : (parseFloat(rate) || livePrice);
    const quantity = totalAmount / (priceVal * lotMultiplier);
    setVol(quantity.toFixed(3));
    validateLimit(totalAmount);
  };

  const validateLimit = (totalUSD) => {
    const marginRequired = totalUSD / leverage;
    if (marginRequired > balance) {
      setErrorMsg(`Required margin exceeds available balance.`);
    } else {
      setErrorMsg('');
    }
  };

  // Handle manual input updates
  const handleVolInput = (val) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setVol(clean);
    syncTotalFromVol(parseFloat(clean) || 0, limitPrice);
  };

  const handleTotalInput = (val) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setTotalUSDT(clean);
    syncVolFromTotal(parseFloat(clean) || 0, limitPrice);
  };

  const handlePriceInput = (val) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setLimitPrice(clean);
    syncTotalFromVol(parseFloat(vol) || 0, clean);
  };

  // Slider changes
  const handleSliderChange = (percent) => {
    const totalUSD = balance * (percent / 100);
    setTotalUSDT(totalUSD.toFixed(2));
    syncVolFromTotal(totalUSD, limitPrice);
  };

  // Convert volume lots to USD Order Value
  const getOrderValueUSD = () => {
    const lotMultiplier = ['EUR/USD', 'GBP/USD'].includes(selectedAsset) ? 100000 : selectedAsset === 'XAU/USD' ? 100 : 1;
    const numVol = parseFloat(vol) || 0;
    return numVol * livePrice * lotMultiplier;
  };

  // Show status notification toast
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
    }, 4000);
  };

  // Closed trades history state
  const [historyTrades, setHistoryTrades] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch active open trades from database
  const refreshOpenTrades = async () => {
    try {
      const res = await fetch('/api/trades?status=open');
      if (res.ok) {
        const data = await res.json();
        setPositions(data);
      }
    } catch (err) {
      console.error('Failed to refresh open trades:', err);
    }
  };

  // Fetch closed order history from database
  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/trades?status=closed');
      if (res.ok) {
        const data = await res.json();
        setHistoryTrades(data);
      }
    } catch (err) {
      console.error('Failed to fetch closed history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Trigger history fetch when switching to Order History tab
  useEffect(() => {
    if (tableTab === 'history') {
      fetchHistory();
    }
  }, [tableTab]);

  const handlePlaceOrder = async () => {
    const lotMultiplier = ['EUR/USD', 'GBP/USD'].includes(selectedAsset) ? 100000 : selectedAsset === 'XAU/USD' ? 100 : 1;
    const entryPrice = orderSubtype === 'Market' ? livePrice : parseFloat(limitPrice);
    const fullOrderValue = (parseFloat(vol) || 0) * entryPrice * lotMultiplier;
    const marginRequired = fullOrderValue / leverage;

    if (parseFloat(vol) <= 0 || isNaN(parseFloat(vol))) {
      setErrorMsg('Please enter a valid volume.');
      return;
    }
    if (marginRequired > balance) {
      setErrorMsg('Required margin exceeds available balance.');
      return;
    }

    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedAsset,
          side: orderType, // 'buy' or 'sell'
          quantity: parseFloat(vol),
          entry_price: entryPrice,
          usd_amount: marginRequired,
          take_profit: tpPrice ? parseFloat(tpPrice) : null,
          stop_loss: slPrice ? parseFloat(slPrice) : null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Failed to place order.');
        showToast(data.error || 'Failed to place order.', 'info');
        return;
      }

      showToast('Order placed successfully', 'success');
      setBalance(data.newBalance);
      refreshOpenTrades();
      
      // Reset limit inputs
      setLimitPrice('');
      setStopPrice('');
      setTpPrice('');
      setSlPrice('');
    } catch (err) {
      console.error('Failed to place trade order:', err);
      setErrorMsg('Failed to execute trade.');
      showToast('Failed to execute trade.', 'info');
    }
  };

  // Close open position
  const handleClosePosition = async (tradeId, symbol, entryPrice, autoCloseReason = null) => {
    const exitPrice = prices[symbol] || entryPrice;
    try {
      const response = await fetch('/api/trades', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeId,
          exitPrice
        })
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.error || 'Failed to close position.', 'info');
        return;
      }

      showToast(autoCloseReason || 'Position closed successfully', 'success');
      setBalance(data.newBalance);
      refreshOpenTrades();
      
      // If we are on history tab, refresh history
      if (tableTab === 'history') {
        fetchHistory();
      }
    } catch (err) {
      console.error('Failed to close position:', err);
      showToast('Failed to close position.', 'info');
    }
  };

  const closingTradesRef = useRef(new Set());

  // Clean up closingTradesRef if positions change
  useEffect(() => {
    if (positions) {
      const openIds = new Set(positions.map(p => p.id));
      closingTradesRef.current.forEach(id => {
        if (!openIds.has(id)) {
          closingTradesRef.current.delete(id);
        }
      });
    }
  }, [positions]);

  // Client-side TP/SL Auto-Execution Check
  useEffect(() => {
    // NOTE: Client-side check running on each price tick. A proper production version would need a server-side cron/trigger for this.
    if (!positions || positions.length === 0) return;

    positions.forEach(pos => {
      const currentPrice = prices[pos.symbol];
      if (!currentPrice) return;

      const tp = pos.take_profit ? parseFloat(pos.take_profit) : null;
      const sl = pos.stop_loss ? parseFloat(pos.stop_loss) : null;

      let shouldClose = false;
      let reason = '';

      if (pos.side?.toLowerCase() === 'buy') {
        if (tp && currentPrice >= tp) {
          shouldClose = true;
          reason = `Position auto-closed: Take Profit hit`;
        } else if (sl && currentPrice <= sl) {
          shouldClose = true;
          reason = `Position auto-closed: Stop Loss hit`;
        }
      } else if (pos.side?.toLowerCase() === 'sell') {
        if (tp && currentPrice <= tp) {
          shouldClose = true;
          reason = `Position auto-closed: Take Profit hit`;
        } else if (sl && currentPrice >= sl) {
          shouldClose = true;
          reason = `Position auto-closed: Stop Loss hit`;
        }
      }

      if (shouldClose) {
        if (closingTradesRef.current.has(pos.id)) return;
        closingTradesRef.current.add(pos.id);
        handleClosePosition(pos.id, pos.symbol, pos.entry, reason);
      }
    });
  }, [prices, positions]);


  const handleAssetChange = (sym) => {
    setSelectedAsset(sym);
    setErrorMsg('');
    setVol('0.100');
    setTpslChecked(false);
    setTpPrice('');
    setSlPrice('');
    setIsSearchOpen(false);
  };

  const formatAssetPrice = (val, sym = selectedAsset) => {
    return ['EUR/USD', 'GBP/USD'].includes(sym) 
      ? val.toFixed(4) 
      : val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Dynamic script loader for TradingView tv.js
  useEffect(() => {
    if (window.TradingView) {
      setScriptLoaded(true);
      return;
    }
    const existingScript = document.getElementById('tradingview-widget-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => setScriptLoaded(true));
      return;
    }
    const script = document.createElement('script');
    script.id = 'tradingview-widget-script';
    script.src = 'https://s3.tradingview.com/tv.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  // TradingView widget initialization
  useEffect(() => {
    if (!scriptLoaded || !window.TradingView || !chartContainerRef.current) return;

    const tvSymbols = {
      'BTC': 'BINANCE:BTCUSDT',
      'ETH': 'BINANCE:ETHUSDT',
      'EUR/USD': 'FX_IDC:EURUSD',
      'GBP/USD': 'FX_IDC:GBPUSD',
      'XAU/USD': 'OANDA:XAUUSD',
      'AAPL': 'NASDAQ:AAPL'
    };
    const tvSymbol = tvSymbols[selectedAsset] || `BINANCE:${selectedAsset}USDT`;

    const tvIntervals = {
      '1m': '1',
      '15m': '15',
      '1H': '60',
      '4H': '240',
      '1D': 'D'
    };
    const tvInterval = tvIntervals[timeframe] || '60';

    const tvStyles = {
      'candles': 1,
      'line': 2
    };
    const tvStyle = tvStyles[chartType] || 1;

    // Clear previous containers to avoid duplicate instances
    chartContainerRef.current.innerHTML = '';

    const widgetId = 'tradingview_chart_widget';
    const widgetDiv = document.createElement('div');
    widgetDiv.id = widgetId;
    widgetDiv.style.width = '100%';
    widgetDiv.style.height = '100%';
    chartContainerRef.current.appendChild(widgetDiv);

    try {
      new window.TradingView.widget({
        autosize: true,
        symbol: tvSymbol,
        interval: tvInterval,
        timezone: "Etc/UTC",
        theme: "light",
        style: tvStyle,
        locale: "en",
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        container_id: widgetId,
        studies: [],
        show_popup_button: false
      });
    } catch (err) {
      console.error('Failed to create TradingView widget:', err);
    }
  }, [scriptLoaded, selectedAsset, timeframe, chartType]);

  const renderWatchlist = () => {
    return (
      <div className="flex flex-col h-full overflow-hidden select-none bg-white">
        <div className="p-2 bg-[#FAFAFA] border-b border-gray-100 flex items-center justify-between shrink-0 select-none">
          <span className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">Watchlist</span>
          <div className="text-[10px] font-bold flex gap-2 text-gray-400">
            {['All', 'Forex', 'Stocks', 'Crypto'].map(tab => (
              <button
                key={tab}
                onClick={() => setWatchlistTab(tab)}
                className={`cursor-pointer transition-all uppercase tracking-wider ${
                  watchlistTab === tab ? 'text-[#2563EB] font-bold' : 'hover:text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Watchlist Table */}
        <div className="flex-grow overflow-y-auto px-2">
          <table className="w-full text-left border-collapse text-[10px] font-sans">
            <thead>
              <tr className="border-b border-gray-100 text-[#9CA3AF] font-bold uppercase text-[7.5px] tracking-wider sticky top-0 bg-white z-10 py-1">
                <th className="py-1">Symbol</th>
                <th className="py-1 text-right">Last</th>
                <th className="py-1 text-right">% Chg</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(ASSETS)
                .filter(item => {
                  if (watchlistTab === 'Forex' && item.type !== 'Forex') return false;
                  if (watchlistTab === 'Crypto' && item.type !== 'Crypto') return false;
                  if (watchlistTab === 'Stocks' && item.type !== 'Stocks') return false;
                  return true;
                })
                .map((item) => {
                  const buyPrice = prices[item.symbol];
                  const changePct = getChangePercent(item.symbol);
                  const isUp = changePct >= 0;
                  const isSelected = selectedAsset === item.symbol;

                  return (
                    <tr
                      key={item.symbol}
                      onClick={() => handleAssetChange(item.symbol)}
                      className={`cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-[#2563EB]/5 font-bold border-l-2 border-l-[#2563EB]' : ''
                      }`}
                    >
                      <td className="py-1.5 px-1 font-bold text-gray-900">
                        <div>{item.symbol}/USDT</div>
                      </td>
                      <td className="py-1.5 text-right font-mono text-gray-700 tabular-nums">
                        {formatAssetPrice(buyPrice, item.symbol)}
                      </td>
                      <td className={`py-1.5 text-right font-mono font-bold tabular-nums ${
                        isUp ? 'text-[#089981]' : 'text-[#f23645]'
                      }`}>
                        {isUp ? '+' : ''}{changePct.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderOrderPanel = () => {
    const buyPrice = livePrice;
    const sellPrice = buyPrice * 0.9999;
    const rawSpread = buyPrice - sellPrice;
    const spreadStr = selectedAsset.includes('/') ? rawSpread.toFixed(4) : rawSpread.toFixed(2);
    
    const getAssetColor = (symbol) => {
      switch (symbol) {
        case 'BTC': return '#F0B90B';
        case 'ETH': return '#627EEA';
        case 'EUR/USD': return '#003399';
        case 'GBP/USD': return '#C8102E';
        case 'XAU/USD': return '#D4AF37';
        case 'AAPL': return '#A3AAAE';
        default: return '#2563EB';
      }
    };

    return (
      <div className="flex flex-col h-full bg-white text-gray-900 border-t lg:border-t-0 border-[#E0E3EB] overflow-hidden select-none">
        
        {/* HEADER & BUY/SELL SWITCH ROW (Pinned at top) */}
        <div className="p-3 pb-2 shrink-0 border-b border-gray-100 flex flex-col gap-2.5">
          <div className="flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: getAssetColor(selectedAsset) }}>
                {selectedAsset[0]}
              </span>
              <span className="font-extrabold text-xs text-gray-900 tracking-wide">{selectedAsset}</span>
            </div>
            <button 
              type="button"
              className="text-gray-400 hover:text-gray-700 transition-colors p-0.5 cursor-pointer" 
              title="Close Panel" 
              onClick={() => showToast('Order panel cannot be collapsed in this view.', 'info')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* SELL/BUY SPLIT BUTTON ROW */}
          <div className="relative mt-0.5 select-none">
            <div className="grid grid-cols-2 gap-3">
              {/* Sell Button */}
              <button
                type="button"
                onClick={() => { setOrderType('sell'); setErrorMsg(''); }}
                className={`h-[48px] border rounded-md text-left px-3 py-1.5 transition-all flex flex-col justify-between cursor-pointer ${
                  orderType === 'sell'
                    ? 'bg-[#f23645] text-white border-[#f23645] shadow-sm'
                    : 'bg-transparent text-[#f23645] border-[#f23645]/30 hover:bg-[#f23645]/5'
                }`}
              >
                <span className={`text-[8px] uppercase font-bold tracking-wider ${orderType === 'sell' ? 'text-white/80' : 'text-gray-400'}`}>Sell</span>
                <span className="font-mono font-bold text-xs tabular-nums">{formatAssetPrice(sellPrice)}</span>
              </button>

              {/* Buy Button */}
              <button
                type="button"
                onClick={() => { setOrderType('buy'); setErrorMsg(''); }}
                className={`h-[48px] border rounded-md text-left px-3 py-1.5 transition-all flex flex-col justify-between cursor-pointer ${
                  orderType === 'buy'
                    ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm'
                    : 'bg-transparent text-[#2563EB] border-[#2563EB]/30 hover:bg-[#2563EB]/5'
                }`}
              >
                <span className={`text-[8px] uppercase font-bold tracking-wider ${orderType === 'buy' ? 'text-white/80' : 'text-gray-400'}`}>Buy</span>
                <span className="font-mono font-bold text-xs tabular-nums">{formatAssetPrice(buyPrice)}</span>
              </button>
            </div>

            {/* Spread Badge centered */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none mt-2.5">
              <span className="bg-white border border-[#E0E3EB] text-gray-700 text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm font-mono tabular-nums">
                {spreadStr} USD
              </span>
            </div>
          </div>
        </div>

        {/* MIDDLE SCROLLABLE FORM FIELDS */}
        <div className="flex-grow overflow-y-auto p-3 py-2.5 space-y-3.5 scrollbar-thin">
          
          {/* Regular form dropdown */}
          <div className="relative shrink-0 select-none">
            <button type="button" className="w-full bg-[#FAFAFA] border border-[#E0E3EB] rounded-md py-1.5 px-3 flex items-center justify-between text-xs text-gray-700 font-bold hover:bg-gray-50 transition-colors cursor-pointer">
              <span>Regular form</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {/* Volume Sentiment Indicator */}
          <div className="select-none">
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden flex">
              <div className="bg-[#f23645]" style={{ width: '62%' }} />
              <div className="bg-[#2563EB]" style={{ width: '38%' }} />
            </div>
            <div className="flex justify-between text-[8px] font-extrabold text-gray-400 mt-1 font-mono tracking-wider">
              <span className="text-[#f23645]">SELL 62%</span>
              <span className="text-[#2563EB]">BUY 38%</span>
            </div>
          </div>

          {/* ORDER TYPE TABS */}
          <div className="bg-gray-100 p-0.5 rounded-lg flex select-none">
            <button
              type="button"
              onClick={() => { setOrderSubtype('Market'); }}
              className={`w-1/2 py-1 rounded-md text-center font-bold text-[9.5px] uppercase tracking-wider cursor-pointer transition-all ${
                orderSubtype === 'Market' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Market
            </button>
            <button
              type="button"
              onClick={() => { if (orderSubtype === 'Market') setOrderSubtype('Limit'); }}
              className={`w-1/2 py-1 rounded-md text-center font-bold text-[9.5px] uppercase tracking-wider cursor-pointer transition-all ${
                orderSubtype !== 'Market' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Pending
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* Pending Type selector */}
            {orderSubtype !== 'Market' && (
              <div className="flex gap-2 items-center justify-between select-none">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Pending Type</span>
                <select
                  value={orderSubtype}
                  onChange={(e) => setOrderSubtype(e.target.value)}
                  className="bg-[#FAFAFA] border border-[#E0E3EB] text-gray-700 text-[10px] font-bold rounded-md px-2 py-0.5 focus:outline-none focus:border-[#2563EB] cursor-pointer"
                >
                  <option value="Limit">Limit Order</option>
                  <option value="Stop-Limit">Stop-Limit Order</option>
                </select>
              </div>
            )}

            {/* Pending Price Inputs */}
            {orderSubtype !== 'Market' && (
              <div className="flex flex-col gap-1">
                <label className="block text-[9px] text-gray-400 uppercase tracking-wider font-extrabold">Price (USDT)</label>
                <div className="flex items-center bg-[#FAFAFA] border border-[#E0E3EB] rounded-md px-3 h-8 focus-within:border-[#2563EB] transition-colors">
                  <input
                    type="text"
                    value={limitPrice}
                    onChange={(e) => handlePriceInput(e.target.value)}
                    className="w-full bg-transparent border-none text-xs font-bold font-mono text-gray-900 focus:outline-none focus:ring-0 p-0"
                  />
                  <div className="flex items-center gap-2 select-none">
                    <button type="button" onClick={() => adjustPrice('limit', false)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                      <Minus className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => adjustPrice('limit', true)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {orderSubtype === 'Stop-Limit' && (
              <div className="flex flex-col gap-1">
                <label className="block text-[9px] text-gray-400 uppercase tracking-wider font-extrabold">Stop Price (USDT)</label>
                <div className="flex items-center bg-[#FAFAFA] border border-[#E0E3EB] rounded-md px-3 h-8 focus-within:border-[#2563EB] transition-colors">
                  <input
                    type="text"
                    value={stopPrice}
                    onChange={(e) => setStopPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="w-full bg-transparent border-none text-xs font-bold font-mono text-gray-900 focus:outline-none focus:ring-0 p-0"
                  />
                  <div className="flex items-center gap-2 select-none">
                    <button type="button" onClick={() => adjustPrice('stop', false)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                      <Minus className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => adjustPrice('stop', true)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VOLUME FIELD */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase tracking-wider font-extrabold">
                <span>Volume</span>
              </div>
              <div className="flex items-center bg-[#FAFAFA] border border-[#E0E3EB] rounded-md px-3 h-8 focus-within:border-[#2563EB] transition-colors">
                <input
                  type="text"
                  value={vol}
                  onChange={(e) => handleVolInput(e.target.value)}
                  className="w-full bg-transparent border-none text-xs font-bold font-mono text-gray-900 focus:outline-none focus:ring-0 p-0"
                />
                <span className="text-[10px] font-bold text-gray-400 mr-2 select-none">Lots</span>
                <div className="flex items-center gap-2 select-none">
                  <button type="button" onClick={() => adjustVol(false)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => adjustVol(true)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Size Quick Percentages */}
            <div className="grid grid-cols-4 gap-1 text-[9px] font-bold text-gray-400 select-none">
              {[25, 50, 75, 100].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleSliderChange(pct)}
                  className="py-1 rounded bg-[#FAFAFA] hover:bg-gray-100 border border-[#E0E3EB] text-center cursor-pointer font-bold text-[9.5px] text-gray-500 transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Leverage exposure range slider */}
            <div className="flex flex-col gap-1 select-none border-t border-gray-100 pt-2.5">
              <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase tracking-wider font-extrabold">
                <span>Leverage exposure</span>
                <span className="font-mono font-bold text-[#2563EB]">{leverage}x</span>
              </div>
              <div className="flex items-center gap-3 px-1 mt-0.5">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={leverage}
                  onChange={(e) => setLeverage(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                />
              </div>
              <div className="flex justify-between text-[7px] font-bold text-gray-300 px-1">
                <span>1x</span>
                <span>20x</span>
                <span>50x</span>
                <span>100x</span>
              </div>
            </div>

            {/* TAKE PROFIT FIELD */}
            <div className="flex flex-col gap-1 border-t border-gray-100 pt-2.5">
              <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase tracking-wider font-extrabold">
                <span className="flex items-center gap-1">
                  Take Profit
                  <button type="button" title="Take Profit info" onClick={() => showToast('Take Profit order will trigger automatically when asset price hits this rate to lock gains.', 'info')} className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
                    <HelpCircle className="w-3 h-3" />
                  </button>
                </span>
              </div>
              <div className="flex items-center bg-[#FAFAFA] border border-[#E0E3EB] rounded-md px-3 h-8 focus-within:border-[#2563EB] transition-colors">
                <input
                  type="text"
                  value={tpPrice}
                  placeholder="Not set"
                  onChange={(e) => setTpPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="w-full bg-transparent border-none text-xs font-bold font-mono text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-0 p-0"
                />
                <div className="flex items-center bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-gray-600 mr-2 select-none gap-0.5 cursor-pointer hover:bg-gray-200 hover:text-gray-800 transition-colors">
                  <span>Price</span>
                  <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                </div>
                <div className="flex items-center gap-2 select-none">
                  <button type="button" onClick={() => adjustTp(false)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                    <Minus className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => adjustTp(true)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* STOP LOSS FIELD */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase tracking-wider font-extrabold">
                <span className="flex items-center gap-1">
                  Stop Loss
                  <button type="button" title="Stop Loss info" onClick={() => showToast('Stop Loss order will trigger automatically when asset price hits this rate to protect capital.', 'info')} className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
                    <HelpCircle className="w-3 h-3" />
                  </button>
                </span>
              </div>
              <div className="flex items-center bg-[#FAFAFA] border border-[#E0E3EB] rounded-md px-3 h-8 focus-within:border-[#2563EB] transition-colors">
                <input
                  type="text"
                  value={slPrice}
                  placeholder="Not set"
                  onChange={(e) => setSlPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="w-full bg-transparent border-none text-xs font-bold font-mono text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-0 p-0"
                />
                <div className="flex items-center bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-gray-600 mr-2 select-none gap-0.5 cursor-pointer hover:bg-gray-200 hover:text-gray-800 transition-colors">
                  <span>Price</span>
                  <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                </div>
                <div className="flex items-center gap-2 select-none">
                  <button type="button" onClick={() => adjustSl(false)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                    <Minus className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => adjustSl(true)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-1 text-[9px] text-[#f23645] font-bold mt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* SUBMIT BUTTON & FOOTER STATS (Pinned at bottom) */}
        <div className="p-3 pt-2 border-t border-gray-100 select-none font-bold bg-[#FAFAFA] shrink-0">
          {/* Available Balance */}
          <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-2 select-none">
            <span>Available Balance</span>
            <span className="text-gray-900 font-mono font-bold">{parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={!!errorMsg || !totalUSDT || parseFloat(totalUSDT) <= 0}
            className="w-full text-white py-2 rounded-md font-bold mb-2.5 transition-colors cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider min-h-[44px] flex items-center justify-center animate-fade-in"
            style={{
              backgroundColor: orderType === 'buy' ? '#2563EB' : '#f23645'
            }}
          >
            {orderType === 'buy' ? `Buy ${selectedAsset}` : `Sell ${selectedAsset}`}
          </button>
          
          {/* Account/Margin details */}
          <div className="text-[10px] space-y-1 text-gray-400 font-bold">
            <div className="flex justify-between">
              <span>Margin Required:</span>
              <span className="text-gray-700 font-mono">{(getOrderValueUSD() / leverage).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
            </div>
            <div className="flex justify-between">
              <span>Free Margin:</span>
              <span className="text-gray-700 font-mono">{freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
            </div>
            <div className="flex justify-between">
              <span>Account Equity:</span>
              <span className="text-gray-700 font-mono">{parseFloat(activeEquity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
            </div>
          </div>
        </div>
        
      </div>
    );
  };


  // Tick last candle in real time with live prices
  useEffect(() => {
    if (!candleSeriesRef.current || !livePrice || !lastBarRef.current) return;
    
    const bar = { ...lastBarRef.current };
    bar.close = livePrice;
    bar.high = Math.max(bar.high, livePrice);
    bar.low = Math.min(bar.low, livePrice);
    
    if (chartType === 'candles') {
      candleSeriesRef.current.update(bar);
    } else {
      candleSeriesRef.current.update({
        time: bar.time,
        value: livePrice
      });
    }
  }, [livePrice, chartType]);

  // Sync open positions as horizontal price lines on the chart
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    // 1. Remove all old price lines
    if (priceLinesRef.current.length > 0) {
      priceLinesRef.current.forEach(line => {
        try {
          candleSeriesRef.current.removePriceLine(line);
        } catch (err) {
          // ignore
        }
      });
      priceLinesRef.current = [];
    }

    // 2. Add price line for each active position matching selectedAsset
    const activePositionsForAsset = positions.filter(
      pos => pos.symbol === selectedAsset && pos.status !== 'closed'
    );

    activePositionsForAsset.forEach(pos => {
      try {
        const isBuy = pos.side?.toLowerCase() === 'buy';
        const line = candleSeriesRef.current.createPriceLine({
          price: pos.entry,
          color: isBuy ? '#089981' : '#f23645',
          lineWidth: 1.5,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: `${pos.side?.toUpperCase()} ${pos.size?.toFixed(2)} Lots`,
        });
        priceLinesRef.current.push(line);
      } catch (err) {
        console.error('Failed to create price line:', err);
      }
    });
  }, [positions, selectedAsset]);

  // Intraday values
  const highVal = stats[selectedAsset]?.high24h || livePrice * 1.01;
  const lowVal = stats[selectedAsset]?.low24h || livePrice * 0.99;
  const openVal = livePrice * (1 - selectedChangePct / 100);
  const closeVal = livePrice;

  return (
    <div className="h-screen bg-[#F0F3FA] flex flex-col justify-between font-sans overflow-hidden text-[#111111] select-none">
      {/* Toast Alert */}
      {toast.visible && (
        <div className="fixed top-20 right-6 z-50 animate-fade-in">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[#e0e0e0] shadow-sm bg-white text-gray-800">
            {toast.type === 'info' ? <Info className="w-5 h-5 text-[#2563EB] shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-[#089981] shrink-0" />}
            <span className="text-xs font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Symbol Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[500px] rounded-brand border border-gray-200 shadow-xl flex flex-col overflow-hidden animate-fade-in max-h-[80vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">Search Symbols</h3>
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-100 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-7 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                autoFocus
                placeholder="Search instrument by name or symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-gray-50/50 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
              />
            </div>
            
            <div className="flex-grow overflow-y-auto p-2">
              <div className="space-y-1">
                {Object.values(ASSETS)
                  .filter(item => {
                    return item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.type.toLowerCase().includes(searchQuery.toLowerCase());
                  })
                  .map(item => {
                    const buyPrice = prices[item.symbol];
                    const changePct = getChangePercent(item.symbol);
                    const isUp = changePct >= 0;
                    
                    return (
                      <button
                        key={item.symbol}
                        onClick={() => handleAssetChange(item.symbol)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${isUp ? 'bg-[#089981]' : 'bg-[#f23645]'}`} />
                          <div>
                            <div className="font-bold text-xs text-gray-900 group-hover:text-[#2563EB] transition-colors">{item.symbol}/USDT</div>
                            <div className="text-[10px] text-gray-400 font-medium">{item.name} • {item.type}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xs font-mono">{formatAssetPrice(buyPrice, item.symbol)}</div>
                          <div className={`text-[10px] font-bold font-mono ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                            {isUp ? '+' : ''}{changePct.toFixed(2)}%
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-[#E0E3EB] bg-white sticky top-0 z-40 h-12 flex items-center shrink-0">
        <div className="w-full px-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-sm">
                <TrendingUp className="text-white w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-[#111111]">PaperPulse</span>
            </Link>
            
            <div className="h-6 w-[1px] bg-gray-200 mx-1 hidden sm:block" />

            {/* Quick Symbol Switcher */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-100 rounded-md transition-colors text-xs font-bold text-gray-700"
            >
              <span className="text-[#2563EB] font-mono">{selectedAsset}/USDT</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/dashboard" 
              className="text-[11px] font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider"
            >
              Dashboard
            </Link>
            <Link 
              href="/trade" 
              className="text-[11px] font-bold text-[#2563EB] transition-colors uppercase tracking-wider"
            >
              Trade
            </Link>
            <Link 
              href="/history" 
              className="text-[11px] font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider"
            >
              History
            </Link>
            <Link 
              href="/leaderboard" 
              className="text-[11px] font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider"
            >
              Leaderboard
            </Link>
            <Link 
              href="/competitions" 
              className="text-[11px] font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider"
            >
              Competitions
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Account Details Dropdown */}
            <div 
              onClick={() => showToast('Demo accounts are preset for simulations.', 'info')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-[10px] text-gray-600 font-bold hover:bg-gray-100 cursor-pointer select-none"
            >
              <span>Demo Account #{accountNumber}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>

            <button 
              type="button"
              onClick={() => showToast('Deposit function coming soon!', 'info')}
              className="bg-black text-white px-3 py-1 rounded-md text-[10px] font-bold hover:bg-gray-800 transition-colors cursor-pointer uppercase tracking-wider h-7 flex items-center justify-center"
            >
              Deposit
            </button>
            
            {/* User Profile dropdown */}
            <UserDropdown userName={userName} />
            
            <button title="Support" onClick={() => showToast('Live support chat coming soon!', 'info')} className="p-1 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 cursor-pointer">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* TOP TICKER STRIP */}
      <div className="bg-white border-b border-[#E0E3EB] h-7 overflow-hidden relative flex items-center w-full select-none shrink-0">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-[10px] font-sans py-0.5">
          {[...Object.values(ASSETS), ...Object.values(ASSETS), ...Object.values(ASSETS)].map((item, idx) => {
            const currentPrice = prices[item.symbol] || item.price;
            const changePct = getChangePercent(item.symbol);
            const isUp = changePct >= 0;

            return (
              <button 
                key={idx} 
                onClick={() => handleAssetChange(item.symbol)}
                className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition-opacity cursor-pointer text-left"
              >
                <span className="font-bold text-[#111111]">{item.symbol}</span>
                <span className="text-gray-500 font-semibold tabular-nums">
                  {['EUR/USD', 'GBP/USD'].includes(item.symbol) 
                    ? currentPrice.toFixed(4) 
                    : currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })
                  }
                </span>
                <span className={`text-[9px] font-bold tabular-nums flex items-center gap-0.5 ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                  {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{changePct.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Trading Platform Grid */}
      <div className="flex-grow flex overflow-y-auto lg:overflow-hidden flex-col lg:flex-row w-full relative">
        
        {/* Far Left Drawing Toolbar (TradingView Style) */}
        <aside className="hidden lg:flex w-11 bg-white border-r border-[#E0E3EB] flex-col items-center py-2 justify-between shrink-0 select-none">
          <div className="flex flex-col items-center gap-2 w-full px-1">
            <button 
              title="Crosshair Cursor" 
              onClick={() => { setActiveDrawingTool('cursor'); showToast('Crosshair active', 'info'); }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer w-8 h-8 flex items-center justify-center ${activeDrawingTool === 'cursor' ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20"/></svg>
            </button>
            
            <button 
              title="Trend Line" 
              onClick={() => { setActiveDrawingTool('trend'); showToast('Trend line tool selected. Click on chart to draw.', 'info'); }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer w-8 h-8 flex items-center justify-center ${activeDrawingTool === 'trend' ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="4" y1="20" x2="20" y2="4"/><circle cx="4" cy="20" r="1"/><circle cx="20" cy="4" r="1"/></svg>
            </button>
            
            <button 
              title="Fibonacci Retracement" 
              onClick={() => { setActiveDrawingTool('fib'); showToast('Fibonacci Retracement tool selected.', 'info'); }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer w-8 h-8 flex items-center justify-center ${activeDrawingTool === 'fib' ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            
            <button 
              title="Brush Tool" 
              onClick={() => { setActiveDrawingTool('brush'); showToast('Brush tool selected. Click and drag to draw.', 'info'); }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer w-8 h-8 flex items-center justify-center ${activeDrawingTool === 'brush' ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            
            <button 
              title="Text Annotation" 
              onClick={() => { setActiveDrawingTool('text'); showToast('Text tool selected. Click on chart to place text.', 'info'); }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer w-8 h-8 flex items-center justify-center ${activeDrawingTool === 'text' ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
            </button>

            <button 
              title="Measure (Ruler)" 
              onClick={() => showToast('Measure tool activated. Click two points on the chart to measure distance & percent.', 'info')}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer w-8 h-8 flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M22 12h-4M2 12h4M12 2v4M12 18v4M7 7l3 3M17 17l-3-3"/></svg>
            </button>

            <div className="w-6 h-[1px] bg-gray-100 my-1" />

            <button 
              title={magnetMode ? "Magnet Mode (ON)" : "Magnet Mode (OFF)"}
              onClick={() => { setMagnetMode(!magnetMode); showToast(magnetMode ? "Magnet mode disabled" : "Magnet mode enabled: snap to price points", 'info'); }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer w-8 h-8 flex items-center justify-center ${magnetMode ? 'bg-[#2563EB] text-white' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 5H7a4 4 0 0 0-4 4v5a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4z"/><path d="M7 11h2M15 11h2"/></svg>
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 w-full px-1">
            <button 
              title={drawingsLocked ? "Unlock Drawings" : "Lock All Drawing Tools"}
              onClick={() => { setDrawingsLocked(!drawingsLocked); showToast(drawingsLocked ? "Drawing tools unlocked" : "All drawing tools locked in place", 'info'); }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer w-8 h-8 flex items-center justify-center ${drawingsLocked ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              {drawingsLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>

            <button 
              title={drawingsHidden ? "Show Drawings" : "Hide All Drawings"}
              onClick={() => { setDrawingsHidden(!drawingsHidden); showToast(drawingsHidden ? "Drawings visible" : "All drawings hidden from view", 'info'); }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer w-8 h-8 flex items-center justify-center ${drawingsHidden ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              {drawingsHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            <button 
              title="Remove Drawings & Indicators" 
              onClick={() => showToast('All drawings deleted from chart.', 'success')}
              className="p-1.5 rounded-md text-gray-400 hover:text-[#f23645] hover:bg-[#f23645]/5 transition-colors cursor-pointer w-8 h-8 flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* LEFT Column: Watchlist Panel */}
        <aside className="hidden lg:flex w-[16%] min-w-[200px] max-w-[260px] bg-white border-r border-[#E0E3EB] flex-col overflow-hidden h-full shrink-0">
          {renderWatchlist()}
        </aside>

        {/* Center and Left Work Area (Chart & Bottom Terminal) */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
          
          {/* Chart Section */}
          <div className="flex-grow flex flex-col overflow-hidden min-h-0 relative">
            
            {/* Chart Top Header (TradingView Style) */}
            <div className="h-11 border-b border-[#E0E3EB] bg-white flex items-center justify-between px-3 shrink-0 select-none">
              <div className="flex items-center gap-3">
                
                {/* Active Symbol Display & Modal Trigger */}
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded-md transition-colors text-left"
                >
                  <span className="font-bold text-sm text-gray-900">{selectedAsset}/USDT</span>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">{asset.name}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                
                <div className="h-4 w-[1px] bg-gray-200" />

                {/* Timeframes bar */}
                <div className="flex items-center gap-0.5">
                  {['1m', '15m', '1H', '4H', '1D'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        timeframe === tf
                          ? 'bg-[#2563EB]/10 text-[#2563EB]'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="h-4 w-[1px] bg-gray-200" />

                {/* Chart type icons */}
                <div className="flex items-center gap-0.5">
                  <button 
                    title="Candlestick Chart"
                    onClick={() => { setChartType('candles'); showToast('Switched to Candlestick Chart', 'info'); }}
                    className={`p-1 rounded cursor-pointer transition-colors ${chartType === 'candles' ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'}`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 5h2v3H7V5zm0 11h2v3H7v-3zm-4-4h2v2H3v-2zm8-5h2v10h-2V7zM1 9h2v6H1V9zm18-4h2v6h-2V5zm0 10h2v4h-2v-4zm-8-9h2v1h-2V6zm8-3h2v1h-2V3zM3 17h2v4H3v-4zm8 11h2v1h-2v-1z"/>
                    </svg>
                  </button>
                  <button 
                    title="Line Chart"
                    onClick={() => { setChartType('line'); showToast('Switched to Line Chart', 'info'); }}
                    className={`p-1 rounded cursor-pointer transition-colors ${chartType === 'line' ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/></svg>
                  </button>
                </div>

                <div className="h-4 w-[1px] bg-gray-200" />

                {/* Indicators button */}
                <button 
                  onClick={() => showToast('Indicators list coming soon!', 'info')}
                  className="flex items-center gap-1 px-2 py-0.5 hover:bg-gray-100 rounded text-[10px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
                  <span>Indicators</span>
                </button>
              </div>

              {/* Price details area */}
              <div className="flex items-center gap-4 text-[10px] font-semibold">
                
                {/* Live values with flash */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold font-mono transition-colors duration-300 ${
                    priceFlash === 'up' ? 'text-[#089981]' : priceFlash === 'down' ? 'text-[#f23645]' : 'text-gray-900'
                  }`}>
                    {formatAssetPrice(livePrice)}
                  </span>
                  <span className={`font-mono text-[9px] px-1 py-0.2 rounded font-bold ${
                    selectedIsUp ? 'bg-[#089981]/10 text-[#089981]' : 'bg-[#f23645]/10 text-[#f23645]'
                  }`}>
                    {selectedIsUp ? '+' : ''}{selectedChangePct.toFixed(2)}%
                  </span>
                </div>

                <div className="hidden lg:flex items-center gap-2.5 text-gray-400 border-l border-gray-100 pl-3">
                  <div>O: <span className="font-bold text-gray-600 font-mono">{formatAssetPrice(openVal)}</span></div>
                  <div>H: <span className="font-bold text-[#089981] font-mono">{formatAssetPrice(highVal)}</span></div>
                  <div>L: <span className="font-bold text-[#f23645] font-mono">{formatAssetPrice(lowVal)}</span></div>
                  <div>C: <span className="font-bold text-gray-600 font-mono">{formatAssetPrice(closeVal)}</span></div>
                </div>

                <div className="flex items-center gap-1 border-l border-gray-100 pl-3">
                  <button 
                    title="Fullscreen Chart"
                    onClick={() => showToast('Toggle fullscreen mode', 'info')}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    title="Chart Settings"
                    onClick={() => showToast('Chart settings panel coming soon!', 'info')}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* lightweight-charts Canvas Wrapper */}
            <div ref={chartContainerRef} className="flex-grow w-full h-full bg-white relative" />
          </div>

          {/* Positions / Terminal Section */}
          <div className="h-[210px] bg-white border-t border-[#E0E3EB] overflow-hidden flex flex-col shrink-0">
            {/* Header Tabs */}
            <div className="text-[11px] font-bold border-b border-gray-100 bg-[#FAFAFA] text-gray-400 shrink-0 flex justify-between items-center px-4 py-1">
              <div className="flex gap-4 select-none">
                {['positions', 'pending', 'history'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setTableTab(tab)}
                    className={`cursor-pointer transition-all py-1.5 relative uppercase tracking-wider text-[10px] ${
                      tableTab === tab ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]' : 'text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'positions' ? `Positions (${positions.length})` : tab === 'pending' ? 'Pending Orders (0)' : 'Order History'}
                  </button>
                ))}
              </div>
              
              <div className="text-[9px] text-gray-400 flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#089981] animate-pulse" /> Live connection active
              </div>
            </div>

            {/* Terminal Table */}
            <div className="flex-grow overflow-auto p-2">
              {tableTab === 'positions' ? (
                positions.length > 0 ? (
                  <table className="w-full text-left border-collapse text-xs min-w-[700px] font-sans">
                    <thead>
                      <tr className="border-b border-gray-200/60 bg-gray-50/50 text-gray-400 font-bold uppercase text-[8px] tracking-wider sticky top-0">
                        <th className="px-3 py-1.5">Symbol</th>
                        <th className="px-3 py-1.5">Side</th>
                        <th className="px-3 py-1.5">Vol (Lots)</th>
                        <th className="px-3 py-1.5">Entry Price</th>
                        <th className="px-3 py-1.5">TP/SL</th>
                        <th className="px-3 py-1.5">Current Price</th>
                        <th className="px-3 py-1.5 text-right">P&L (USD)</th>
                        <th className="px-3 py-1.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/60">
                      {positions.map((pos) => {
                        const currentVal = prices[pos.symbol] || pos.entry;
                        const pnl = getPositionPnL(pos);
                        const isUp = pnl >= 0;

                        return (
                          <tr key={pos.id} className="hover:bg-gray-50/50 text-gray-800 text-[11px]">
                            <td className="px-3 py-1.5 font-bold text-gray-900">{pos.symbol}/USDT</td>
                            <td className="px-3 py-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                pos.side?.toLowerCase() === 'buy' ? 'bg-[#089981]/10 text-[#089981]' : 'bg-[#f23645]/10 text-[#f23645]'
                              }`}>
                                {pos.side?.charAt(0).toUpperCase() + pos.side?.slice(1)}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 font-mono tabular-nums">{pos.size.toFixed(2)}</td>
                            <td className="px-3 py-1.5 font-mono tabular-nums">
                              {['EUR/USD', 'GBP/USD'].includes(pos.symbol) ? pos.entry.toFixed(4) : `$${pos.entry.toLocaleString()}`}
                            </td>
                            <td className="px-3 py-1.5 font-mono tabular-nums text-gray-500">
                              {(() => {
                                const tpText = pos.take_profit ? (['EUR/USD', 'GBP/USD'].includes(pos.symbol) ? pos.take_profit.toFixed(4) : pos.take_profit.toLocaleString()) : '--';
                                const slText = pos.stop_loss ? (['EUR/USD', 'GBP/USD'].includes(pos.symbol) ? pos.stop_loss.toFixed(4) : pos.stop_loss.toLocaleString()) : '--';
                                return `${tpText} / ${slText}`;
                              })()}
                            </td>
                            <td className="px-3 py-1.5 font-mono tabular-nums text-gray-900">
                              {['EUR/USD', 'GBP/USD'].includes(pos.symbol) ? currentVal.toFixed(4) : `$${currentVal.toLocaleString()}`}
                            </td>
                            <td className={`px-3 py-1.5 text-right font-mono font-bold tabular-nums ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                              {isUp ? '+' : ''}{pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </td>
                            <td className="px-3 py-1.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => showToast('Close By execution is not available on this instrument.', 'info')}
                                  className="px-1.5 py-0.5 border border-gray-200 hover:bg-gray-50 rounded text-[9px] font-bold text-gray-500 cursor-pointer"
                                >
                                  Close By
                                </button>
                                <button
                                  type="button"
                                  onClick={() => showToast('Reverse position execution requested', 'info')}
                                  className="px-1.5 py-0.5 border border-gray-200 hover:bg-gray-50 rounded text-[9px] font-bold text-gray-500 cursor-pointer"
                                >
                                  Reverse
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleClosePosition(pos.id, pos.symbol, pos.entry)}
                                  className="px-2 py-0.5 bg-black text-white hover:bg-gray-800 rounded text-[9px] font-bold uppercase transition-colors cursor-pointer"
                                >
                                  Close
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center select-none animate-fade-in">
                    <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400 shadow-sm">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                    </div>
                    <h3 className="font-bold text-xs text-gray-700">No open positions</h3>
                    <p className="text-[10px] text-gray-400 mt-1 max-w-xs leading-relaxed font-semibold">
                      Your trades will appear here once you place an order.
                    </p>
                  </div>
                )
              ) : tableTab === 'history' ? (
                loadingHistory ? (
                  <div className="text-center py-8 text-gray-400 text-xs font-semibold select-none animate-pulse">
                    Loading order history...
                  </div>
                ) : historyTrades.length > 0 ? (
                  <table className="w-full text-left border-collapse text-xs min-w-[700px] font-sans">
                    <thead>
                      <tr className="border-b border-gray-200/60 bg-gray-50/50 text-gray-400 font-bold uppercase text-[8px] tracking-wider sticky top-0">
                        <th className="px-3 py-1.5">Symbol</th>
                        <th className="px-3 py-1.5">Side</th>
                        <th className="px-3 py-1.5">Vol (Lots)</th>
                        <th className="px-3 py-1.5">Entry Price</th>
                        <th className="px-3 py-1.5">Close Price</th>
                        <th className="px-3 py-1.5 text-right">P&L (USD)</th>
                        <th className="px-3 py-1.5 text-right">Close Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/60">
                      {historyTrades.map((pos) => {
                        const isUp = pos.pnl >= 0;
                        return (
                          <tr key={pos.id} className="hover:bg-gray-50/50 text-gray-800 text-[11px]">
                            <td className="px-3 py-1.5 font-bold text-gray-900">{pos.symbol}/USDT</td>
                            <td className="px-3 py-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                pos.side?.toLowerCase() === 'buy' ? 'bg-[#089981]/10 text-[#089981]' : 'bg-[#f23645]/10 text-[#f23645]'
                              }`}>
                                {pos.side?.charAt(0).toUpperCase() + pos.side?.slice(1)}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 font-mono tabular-nums">{pos.size?.toFixed(2)}</td>
                            <td className="px-3 py-1.5 font-mono tabular-nums">
                              {['EUR/USD', 'GBP/USD'].includes(pos.symbol) ? pos.entry.toFixed(4) : `$${pos.entry.toLocaleString()}`}
                            </td>
                            <td className="px-3 py-1.5 font-mono tabular-nums text-gray-900">
                              {['EUR/USD', 'GBP/USD'].includes(pos.symbol) ? pos.exit?.toFixed(4) : `$${pos.exit?.toLocaleString()}`}
                            </td>
                            <td className={`px-3 py-1.5 text-right font-mono font-bold tabular-nums ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                              {isUp ? '+' : ''}{pos.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </td>
                            <td className="px-3 py-1.5 text-right text-gray-500 font-semibold">{pos.closed_time}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center select-none animate-fade-in">
                    <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400 shadow-sm">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <h3 className="font-bold text-xs text-gray-700">No closed orders yet</h3>
                    <p className="text-[10px] text-gray-400 mt-1 max-w-xs leading-relaxed font-semibold">
                      Your completed trades will be logged here for tracking.
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs font-semibold">
                  No pending orders found.
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar (Watchlist & Order Ticket Panel) */}
        <aside className="w-[325px] bg-white border-l border-[#E0E3EB] flex flex-col divide-y divide-[#E0E3EB] shrink-0 overflow-hidden h-full">
          
          {/* Watchlist Panel (Top ~38%) */}
          <div className="h-[38%] flex flex-col overflow-hidden min-h-[220px]">
            <div className="p-2 bg-[#FAFAFA] border-b border-gray-100 flex items-center justify-between shrink-0 select-none">
              <span className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">Watchlist</span>
              <div className="text-[10px] font-bold flex gap-2 text-gray-400">
                {['All', 'Forex', 'Stocks', 'Crypto'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setWatchlistTab(tab)}
                    className={`cursor-pointer transition-all uppercase tracking-wider ${
                      watchlistTab === tab ? 'text-[#2563EB] font-bold' : 'hover:text-gray-600'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Watchlist Table */}
            <div className="flex-grow overflow-y-auto px-2">
              <table className="w-full text-left border-collapse text-[10px] font-sans">
                <thead>
                  <tr className="border-b border-gray-100 text-[#9CA3AF] font-bold uppercase text-[7.5px] tracking-wider sticky top-0 bg-white z-10 py-1">
                    <th className="py-1">Symbol</th>
                    <th className="py-1 text-right">Last</th>
                    <th className="py-1 text-right">% Chg</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(ASSETS)
                    .filter(item => {
                      if (watchlistTab === 'Forex' && item.type !== 'Forex') return false;
                      if (watchlistTab === 'Crypto' && item.type !== 'Crypto') return false;
                      if (watchlistTab === 'Stocks' && item.type !== 'Stocks') return false;
                      return true;
                    })
                    .map((item) => {
                      const buyPrice = prices[item.symbol];
                      const changePct = getChangePercent(item.symbol);
                      const isUp = changePct >= 0;
                      const isSelected = selectedAsset === item.symbol;

                      return (
                        <tr
                          key={item.symbol}
                          onClick={() => handleAssetChange(item.symbol)}
                          className={`cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-[#2563EB]/5 font-bold border-l-2 border-l-[#2563EB]' : ''
                          }`}
                        >
                          <td className="py-1.5 px-1 font-bold text-gray-900">
                            <div>{item.symbol}/USDT</div>
                          </td>
                          <td className="py-1.5 text-right font-mono text-gray-700 tabular-nums">
                            {formatAssetPrice(buyPrice, item.symbol)}
                          </td>
                          <td className={`py-1.5 text-right font-mono font-bold tabular-nums ${
                            isUp ? 'text-[#089981]' : 'text-[#f23645]'
                          }`}>
                            {isUp ? '+' : ''}{changePct.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
          {/* Order Placement Panel (Bottom ~62%) */}
          {(() => {
            const buyPrice = livePrice;
            const sellPrice = buyPrice * 0.9999;
            const rawSpread = buyPrice - sellPrice;
            const spreadStr = selectedAsset.includes('/') ? rawSpread.toFixed(4) : rawSpread.toFixed(2);
            
            const getAssetColor = (symbol) => {
              switch (symbol) {
                case 'BTC': return '#F0B90B';
                case 'ETH': return '#627EEA';
                case 'EUR/USD': return '#003399';
                case 'GBP/USD': return '#C8102E';
                case 'XAU/USD': return '#D4AF37';
                case 'AAPL': return '#A3AAAE';
                default: return '#2563EB';
              }
            };

            return (
              <div className="h-[62%] flex flex-col overflow-y-auto p-3.5 justify-between bg-white text-gray-900 border-t border-[#E0E3EB]">
                <div className="flex flex-col gap-3">
                  
                  {/* HEADER ROW */}
                  <div className="flex items-center justify-between pb-1.5 select-none">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: getAssetColor(selectedAsset) }}>
                        {selectedAsset[0]}
                      </span>
                      <span className="font-extrabold text-xs text-gray-900 tracking-wide">{selectedAsset}</span>
                    </div>
                    <button 
                      type="button"
                      className="text-gray-400 hover:text-gray-700 transition-colors p-0.5 cursor-pointer" 
                      title="Close Panel" 
                      onClick={() => showToast('Order panel cannot be collapsed in this view.', 'info')}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* DROPDOWN */}
                  <div className="relative shrink-0 select-none">
                    <button type="button" className="w-full bg-[#FAFAFA] border border-[#E0E3EB] rounded-md py-1.5 px-3 flex items-center justify-between text-xs text-gray-700 font-bold hover:bg-gray-50 transition-colors cursor-pointer">
                      <span>Regular form</span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>

                  {/* SELL/BUY SPLIT BUTTON ROW */}
                  <div className="relative mt-1 select-none">
                    <div className="grid grid-cols-2 gap-3.5">
                      {/* Sell Button */}
                      <button
                        type="button"
                        onClick={() => { setOrderType('sell'); setErrorMsg(''); }}
                        className={`h-[52px] border rounded-md text-left px-3 py-1.5 transition-all flex flex-col justify-between cursor-pointer ${
                          orderType === 'sell'
                            ? 'bg-[#f23645] text-white border-[#f23645] shadow-sm'
                            : 'bg-transparent text-[#f23645] border-[#f23645]/30 hover:bg-[#f23645]/5'
                        }`}
                      >
                        <span className={`text-[8.5px] uppercase font-bold tracking-wider ${orderType === 'sell' ? 'text-white/80' : 'text-gray-400'}`}>Sell</span>
                        <span className="font-mono font-bold text-xs tabular-nums">{formatAssetPrice(sellPrice)}</span>
                      </button>

                      {/* Buy Button */}
                      <button
                        type="button"
                        onClick={() => { setOrderType('buy'); setErrorMsg(''); }}
                        className={`h-[52px] border rounded-md text-left px-3 py-1.5 transition-all flex flex-col justify-between cursor-pointer ${
                          orderType === 'buy'
                            ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm'
                            : 'bg-transparent text-[#2563EB] border-[#2563EB]/30 hover:bg-[#2563EB]/5'
                        }`}
                      >
                        <span className={`text-[8.5px] uppercase font-bold tracking-wider ${orderType === 'buy' ? 'text-white/80' : 'text-gray-400'}`}>Buy</span>
                        <span className="font-mono font-bold text-xs tabular-nums">{formatAssetPrice(buyPrice)}</span>
                      </button>
                    </div>

                    {/* Spread Badge centered, overlapping the bottom edge */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none mt-3.5">
                      <span className="bg-white border border-[#E0E3EB] text-gray-700 text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm font-mono tabular-nums">
                        {spreadStr} USD
                      </span>
                    </div>
                  </div>

                  {/* Volume Ratio Sentiment Indicator */}
                  <div className="mb-1 select-none">
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="bg-[#f23645]" style={{ width: '62%' }} />
                      <div className="bg-[#2563EB]" style={{ width: '38%' }} />
                    </div>
                    <div className="flex justify-between text-[8px] font-extrabold text-gray-400 mt-1 font-mono tracking-wider">
                      <span className="text-[#f23645]">SELL 62%</span>
                      <span className="text-[#2563EB]">BUY 38%</span>
                    </div>
                  </div>

                  {/* ORDER TYPE TABS */}
                  <div className="bg-gray-100 p-0.5 rounded-lg flex select-none">
                    <button
                      type="button"
                      onClick={() => { setOrderSubtype('Market'); }}
                      className={`w-1/2 py-1.5 rounded-md text-center font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all ${
                        orderSubtype === 'Market' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-700'
                      }`}
                    >
                      Market
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (orderSubtype === 'Market') setOrderSubtype('Limit'); }}
                      className={`w-1/2 py-1.5 rounded-md text-center font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all ${
                        orderSubtype !== 'Market' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-700'
                      }`}
                    >
                      Pending
                    </button>
                  </div>

                  <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
                    {/* Pending Type selector if Pending tab active */}
                    {orderSubtype !== 'Market' && (
                      <div className="flex gap-2 items-center justify-between select-none">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Pending Type</span>
                        <select
                          value={orderSubtype}
                          onChange={(e) => setOrderSubtype(e.target.value)}
                          className="bg-[#FAFAFA] border border-[#E0E3EB] text-gray-700 text-[10px] font-bold rounded-md px-2 py-0.5 focus:outline-none focus:border-[#2563EB] cursor-pointer"
                        >
                          <option value="Limit">Limit Order</option>
                          <option value="Stop-Limit">Stop-Limit Order</option>
                        </select>
                      </div>
                    )}

                    {/* Pending Price Inputs */}
                    {orderSubtype !== 'Market' && (
                      <div className="flex flex-col gap-1">
                        <label className="block text-[9px] text-gray-400 uppercase tracking-wider font-extrabold">Price (USDT)</label>
                        <div className="flex items-center bg-[#FAFAFA] border border-[#E0E3EB] rounded-md px-3 h-9 focus-within:border-[#2563EB] transition-colors">
                          <input
                            type="text"
                            value={limitPrice}
                            onChange={(e) => handlePriceInput(e.target.value)}
                            className="w-full bg-transparent border-none text-xs font-bold font-mono text-gray-900 focus:outline-none focus:ring-0 p-0"
                          />
                          <div className="flex items-center gap-2 select-none">
                            <button type="button" onClick={() => adjustPrice('limit', false)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                              <Minus className="w-3 h-3" />
                            </button>
                            <button type="button" onClick={() => adjustPrice('limit', true)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {orderSubtype === 'Stop-Limit' && (
                      <div className="flex flex-col gap-1">
                        <label className="block text-[9px] text-gray-400 uppercase tracking-wider font-extrabold">Stop Price (USDT)</label>
                        <div className="flex items-center bg-[#FAFAFA] border border-[#E0E3EB] rounded-md px-3 h-9 focus-within:border-[#2563EB] transition-colors">
                          <input
                            type="text"
                            value={stopPrice}
                            onChange={(e) => setStopPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                            className="w-full bg-transparent border-none text-xs font-bold font-mono text-gray-900 focus:outline-none focus:ring-0 p-0"
                          />
                          <div className="flex items-center gap-2 select-none">
                            <button type="button" onClick={() => adjustPrice('stop', false)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                              <Minus className="w-3 h-3" />
                            </button>
                            <button type="button" onClick={() => adjustPrice('stop', true)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VOLUME FIELD */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase tracking-wider font-extrabold">
                        <span>Volume</span>
                      </div>
                      <div className="flex items-center bg-[#FAFAFA] border border-[#E0E3EB] rounded-md px-3 h-9 focus-within:border-[#2563EB] transition-colors">
                        <input
                          type="text"
                          value={vol}
                          onChange={(e) => handleVolInput(e.target.value)}
                          className="w-full bg-transparent border-none text-xs font-bold font-mono text-gray-900 focus:outline-none focus:ring-0 p-0"
                        />
                        <span className="text-[10px] font-bold text-gray-400 mr-2 select-none">Lots</span>
                        <div className="flex items-center gap-2 select-none">
                          <button type="button" onClick={() => adjustVol(false)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => adjustVol(true)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Size quick percentages */}
                    <div className="grid grid-cols-4 gap-1 text-[9px] font-bold text-gray-400 select-none">
                      {[25, 50, 75, 100].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleSliderChange(pct)}
                          className="py-1 rounded bg-[#FAFAFA] hover:bg-gray-100 border border-[#E0E3EB] text-center cursor-pointer font-bold text-[9.5px] text-gray-500 transition-colors"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>

                    {/* Leverage exposure range slider */}
                    <div className="flex flex-col gap-1 select-none border-t border-gray-100 pt-2.5">
                      <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase tracking-wider font-extrabold">
                        <span>Leverage exposure</span>
                        <span className="font-mono font-bold text-[#2563EB]">{leverage}x</span>
                      </div>
                      <div className="flex items-center gap-3 px-1 mt-0.5">
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={leverage}
                          onChange={(e) => setLeverage(parseInt(e.target.value))}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                        />
                      </div>
                      <div className="flex justify-between text-[7px] font-bold text-gray-300 px-1">
                        <span>1x</span>
                        <span>20x</span>
                        <span>50x</span>
                        <span>100x</span>
                      </div>
                    </div>

                    {/* TAKE PROFIT FIELD */}
                    <div className="flex flex-col gap-1 border-t border-gray-100 pt-2.5">
                      <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase tracking-wider font-extrabold">
                        <span className="flex items-center gap-1">
                          Take Profit
                          <button type="button" title="Take Profit info" onClick={() => showToast('Take Profit order will trigger automatically when asset price hits this rate to lock gains.', 'info')} className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
                            <HelpCircle className="w-3 h-3" />
                          </button>
                        </span>
                      </div>
                      <div className="flex items-center bg-[#FAFAFA] border border-[#E0E3EB] rounded-md px-3 h-9 focus-within:border-[#2563EB] transition-colors">
                        <input
                          type="text"
                          value={tpPrice}
                          placeholder="Not set"
                          onChange={(e) => setTpPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                          className="w-full bg-transparent border-none text-xs font-bold font-mono text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-0 p-0"
                        />
                        <div className="flex items-center bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-gray-600 mr-2 select-none gap-0.5 cursor-pointer hover:bg-gray-200 hover:text-gray-800 transition-colors">
                          <span>Price</span>
                          <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                        </div>
                        <div className="flex items-center gap-2 select-none">
                          <button type="button" onClick={() => adjustTp(false)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                            <Minus className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => adjustTp(true)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* STOP LOSS FIELD */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase tracking-wider font-extrabold">
                        <span className="flex items-center gap-1">
                          Stop Loss
                          <button type="button" title="Stop Loss info" onClick={() => showToast('Stop Loss order will trigger automatically when asset price hits this rate to protect capital.', 'info')} className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
                            <HelpCircle className="w-3 h-3" />
                          </button>
                        </span>
                      </div>
                      <div className="flex items-center bg-[#FAFAFA] border border-[#E0E3EB] rounded-md px-3 h-9 focus-within:border-[#2563EB] transition-colors">
                        <input
                          type="text"
                          value={slPrice}
                          placeholder="Not set"
                          onChange={(e) => setSlPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                          className="w-full bg-transparent border-none text-xs font-bold font-mono text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-0 p-0"
                        />
                        <div className="flex items-center bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-gray-600 mr-2 select-none gap-0.5 cursor-pointer hover:bg-gray-200 hover:text-gray-800 transition-colors">
                          <span>Price</span>
                          <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                        </div>
                        <div className="flex items-center gap-2 select-none">
                          <button type="button" onClick={() => adjustSl(false)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                            <Minus className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => adjustSl(true)} className="text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors cursor-pointer">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="flex items-center gap-1 text-[9px] text-[#f23645] font-bold mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                  </form>
                </div>

                {/* Submit button and balance details */}
                <div className="mt-3.5 pt-3.5 border-t border-gray-100 select-none">
                  {/* Available Balance */}
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-2.5 select-none">
                    <span>Available Balance</span>
                    <span className="text-gray-900 font-mono font-bold">{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                  </div>

                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={!!errorMsg || !totalUSDT || parseFloat(totalUSDT) <= 0}
                    className="w-full text-white py-2 rounded-md font-bold mb-3 transition-colors cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                    style={{
                      backgroundColor: orderType === 'buy' ? '#2563EB' : '#f23645'
                    }}
                  >
                    {orderType === 'buy' ? `Buy ${selectedAsset}` : `Sell ${selectedAsset}`}
                  </button>
                  
                  {/* Account/Margin details */}
                  <div className="text-[10px] space-y-1 text-gray-400 font-bold">
                    <div className="flex justify-between">
                      <span>Margin Required:</span>
                      <span className="text-gray-700 font-mono">{(getOrderValueUSD() / leverage).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Free Margin:</span>
                      <span className="text-gray-700 font-mono">{freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Account Equity:</span>
                      <span className="text-gray-700 font-mono">{activeEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </aside>
      </div>

      {/* Footer */}
      <footer className="text-center text-[9px] text-[#9CA3AF] py-1 bg-white border-t border-[#E0E3EB] shrink-0 select-none font-medium">
        &copy; {new Date().getFullYear()} PaperPulse. Virtual trading educational simulator. No real money trades are processed.
      </footer>
    </div>
  );
}
