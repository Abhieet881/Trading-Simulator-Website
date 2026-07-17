'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, Shield, BarChart3, Users, Award, 
  ArrowRight, CheckCircle2, Play, AlertCircle, Sparkles, Mail, User
} from 'lucide-react';

// Helper to get initials from a full name (e.g. "John Doe" -> "JD", "Priya" -> "P")
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

// Helper to deterministically choose a premium avatar color palette based on name
const getAvatarColors = (name) => {
  const colors = [
    { bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]' }, // Blue
    { bg: 'bg-[#F5F3FF]', text: 'text-[#7C3AED]' }, // Purple
    { bg: 'bg-[#ECFDF5]', text: 'text-[#059669]' }, // Emerald
    { bg: 'bg-[#FFF7ED]', text: 'text-[#EA580C]' }, // Orange
    { bg: 'bg-[#FDF2F8]', text: 'text-[#DB2777]' }, // Pink
    { bg: 'bg-[#F0FDF4]', text: 'text-[#16A34A]' }, // Green
    { bg: 'bg-[#FFF1F2]', text: 'text-[#E11D48]' }, // Rose
    { bg: 'bg-[#F0FDFA]', text: 'text-[#0D9488]' }  // Teal
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export default function Home() {
  // Waitlist form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Live Trading Terminal Mockup States
  const [btcPrice, setBtcPrice] = useState(67240.50);
  const [btcPriceDirection, setBtcPriceDirection] = useState('up');
  const [amount, setAmount] = useState('');
  const chartContainerRef = React.useRef(null);

  // Fetch waitlist members
  const fetchWaitlist = async () => {
    try {
      const res = await fetch('/api/waitlist');
      const json = await res.json();
      if (json.success) {
        setWaitlist(json.data);
      }
    } catch (err) {
      console.error('Error fetching waitlist:', err);
    }
  };

  useEffect(() => {
    fetchWaitlist();

    let chart;
    let candleSeries;
    let volSeries;
    let interval;

    const initChart = async () => {
      const { createChart, CandlestickSeries, HistogramSeries } = await import('lightweight-charts');
      if (!chartContainerRef.current) return;

      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: 'solid', color: '#161A1E' },
          textColor: '#A0A5AD',
        },
        grid: {
          vertLines: { color: '#23292F' },
          horzLines: { color: '#23292F' },
        },
        crosshair: {
          mode: 1, // Normal crosshair
        },
        rightPriceScale: {
          borderColor: '#2B3139',
          scaleMargins: {
            top: 0.1,
            bottom: 0.25,
          },
        },
        timeScale: {
          borderColor: '#2B3139',
          timeVisible: true,
          secondsVisible: false,
        },
        width: chartContainerRef.current.clientWidth,
        height: 240,
      });

      candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#0ECB81',
        downColor: '#F6465D',
        borderUpColor: '#0ECB81',
        borderDownColor: '#F6465D',
        wickUpColor: '#0ECB81',
        wickDownColor: '#F6465D',
      });

      volSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '', // overlay mode
      });

      volSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8, // volume bars occupy only the bottom 20%
          bottom: 0,
        },
      });

      // Realistic 4-hour historical candlestick data ending at realistic BTC levels
      const data = [
        { time: 1783850400, open: 66450, high: 66600, low: 66350, close: 66520 },
        { time: 1783851300, open: 66520, high: 66720, low: 66480, close: 66680 },
        { time: 1783852200, open: 66680, high: 66750, low: 66550, close: 66600 },
        { time: 1783853100, open: 66600, high: 66680, low: 66450, close: 66510 },
        { time: 1783854000, open: 66510, high: 66580, low: 66380, close: 66420 },
        { time: 1783854900, open: 66420, high: 66490, low: 66250, close: 66300 },
        { time: 1783855800, open: 66300, high: 66550, low: 66280, close: 66510 },
        { time: 1783856700, open: 66510, high: 66780, low: 66490, close: 66720 },
        { time: 1783857600, open: 66720, high: 66820, low: 66650, close: 66750 },
        { time: 1783858500, open: 66750, high: 66900, low: 66700, close: 66850 },
        { time: 1783859400, open: 66850, high: 66980, low: 66800, close: 66920 },
        { time: 1783860300, open: 66920, high: 67150, low: 66880, close: 67080 },
        { time: 1783861200, open: 67080, high: 67120, low: 66950, close: 67020 },
        { time: 1783862100, open: 67020, high: 67250, low: 66980, close: 67210 },
        { time: 1783863000, open: 67210, high: 67380, low: 67150, close: 67320 },
        { time: 1783863900, open: 67320, high: 67450, low: 67280, close: 67350 },
        { time: 1783864800, open: 67350, high: 67390, low: 67120, close: 67190 },
        { time: 1783865700, open: 67190, high: 67280, low: 67050, close: 67110 },
        { time: 1783866600, open: 67110, high: 67350, low: 67090, close: 67280 },
        { time: 1783867500, open: 67280, high: 67480, low: 67240, close: 67420 },
        { time: 1783868400, open: 67420, high: 67500, low: 67310, close: 67350 },
        { time: 1783869300, open: 67350, high: 67420, low: 67220, close: 67290 },
        { time: 1783870200, open: 67290, high: 67380, low: 67180, close: 67220 },
        { time: 1783871100, open: 67220, high: 67300, low: 67110, close: 67150 },
        { time: 1783872000, open: 67150, high: 67400, low: 67120, close: 67380 },
        { time: 1783872900, open: 67380, high: 67550, low: 67320, close: 67490 },
        { time: 1783873800, open: 67490, high: 67680, low: 67420, close: 67580 },
        { time: 1783874700, open: 67580, high: 67620, low: 67380, close: 67410 },
        { time: 1783875600, open: 67410, high: 67480, low: 67200, close: 67240 }
      ];

      const volData = data.map(d => ({
        time: d.time,
        value: Math.floor(Math.random() * 200) + 50,
        color: d.close >= d.open ? 'rgba(14, 203, 129, 0.2)' : 'rgba(246, 70, 93, 0.2)'
      }));

      candleSeries.setData(data);
      volSeries.setData(volData);

      chart.timeScale().fitContent();

      // Setup Resize Observer for perfect responsiveness of the canvas
      const resizeObserver = new ResizeObserver((entries) => {
        if (entries.length === 0 || !chart) return;
        const { width } = entries[0].contentRect;
        chart.resize(width, 240);
      });
      resizeObserver.observe(chartContainerRef.current);

      // Real-time ticking updates on the last candle
      let currentClose = data[data.length - 1].close;
      let currentHigh = data[data.length - 1].high;
      let currentLow = data[data.length - 1].low;
      let currentOpen = data[data.length - 1].open;
      const lastTimestamp = data[data.length - 1].time;

      interval = setInterval(() => {
        const drift = (Math.random() - 0.49) * 12;
        const nextPrice = parseFloat((currentClose + drift).toFixed(2));
        
        if (nextPrice > currentClose) {
          setBtcPriceDirection('up');
        } else if (nextPrice < currentClose) {
          setBtcPriceDirection('down');
        }

        currentClose = nextPrice;
        currentHigh = Math.max(currentHigh, nextPrice);
        currentLow = Math.min(currentLow, nextPrice);
        
        setBtcPrice(nextPrice);

        candleSeries.update({
          time: lastTimestamp,
          open: currentOpen,
          high: currentHigh,
          low: currentLow,
          close: currentClose
        });
      }, 1000);
    };

    initChart();

    return () => {
      if (chart) chart.remove();
      if (interval) clearInterval(interval);
    };
  }, []);

  // Handle Waitlist Signup Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const json = await res.json();

      if (json.success) {
        setSuccess(true);
        setName('');
        setEmail('');
        fetchWaitlist(); // Refresh table
      } else {
        setError(json.error || 'Failed to register.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to obfuscate email address
  const obfuscateEmail = (emailStr) => {
    if (!emailStr) return '';
    const parts = emailStr.split('@');
    if (parts.length !== 2) return emailStr;
    const namePart = parts[0];
    const domainPart = parts[1];
    
    if (namePart.length <= 2) {
      return `${namePart[0]}***@${domainPart}`;
    }
    return `${namePart[0]}***${namePart[namePart.length - 1]}@${domainPart}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111111]">
      {/* Header Bar */}
      <header className="border-b border-[#E5E7EB] bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <TrendingUp className="text-white w-4.5 h-4.5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[#111111]">PaperPulse</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B7280]">
            <a href="#problem" className="nav-link">Why Paper Trading</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#founder" className="nav-link">Founder</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-semibold text-[#6B7280] hover:text-[#111111] transition-colors nav-link"
            >
              Log In
            </Link>
            <div className="h-4 w-[1px] bg-gray-200" />
            <a 
              href="#waitlist" 
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 md:pt-28 pb-0 overflow-hidden bg-white border-b border-[#E5E7EB]">
        {/* Subtle Background Blob Decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#2563EB]/5 to-transparent blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-[#3B82F6]/5 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5E7EB]/50 border border-[#E5E7EB] text-xs font-semibold text-[#6B7280] mb-6 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Risk-free paper trading platform</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#111111] leading-[1.1] mb-6 max-w-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Learn Trading <br />
            <span className="text-[#2563EB]">Without Risking</span> Real Money
          </h1>

          <p className="text-lg text-[#6B7280] leading-relaxed mb-8 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Practice trading cryptocurrencies, forex, and stocks using virtual money with real-time market data. Zero risk, absolute learning, and weekly challenges.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <a 
              href="#waitlist" 
              className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all text-base gap-2 group"
            >
              Join Early Access
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a 
              href="#features" 
              className="inline-flex items-center justify-center px-6 py-3 font-semibold text-[#6B7280] hover:text-[#111111] bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg hover:bg-zinc-100 transition-all text-base gap-2"
            >
              <Play className="w-4 h-4 text-[#6B7280] fill-current" />
              See Features
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-[#6B7280] mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-[#16A34A]" />
              <span>$10,000 Mock Balance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-[#16A34A]" />
              <span>Real-time Feeds</span>
            </div>
          </div>
        </div>

        {/* Floating App Preview Dashboard Widget */}
        <div className="max-w-[960px] mx-auto px-6 relative z-10 translate-y-24 mt-8">
          <div className="w-full bg-[#161A1E] border border-[#2B3139] rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative">
            
            {/* Browser Chrome Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#1F2226] border-b border-[#2B3139]">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] opacity-80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] opacity-80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] opacity-80" />
              </div>
              <span className="text-[10px] text-[#848E9C] font-mono select-none">BTC/USDT Trading Terminal</span>
              <div className="w-12" />
            </div>

            {/* Inner Dashboard Wrapper */}
            <div className="p-4 flex flex-col gap-4">
              {/* Header Row */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    {/* Golden Bitcoin Icon */}
                    <div className="w-6 h-6 rounded-full bg-[#F0B90B]/10 flex items-center justify-center text-[#F0B90B]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.25 15.5h-2.5v-1.5H12c1.38 0 2.5-1.12 2.5-2.5 0-1.04-.63-1.92-1.53-2.31.72-.42 1.21-1.2 1.21-2.1 0-1.38-1.12-2.5-2.5-2.5h-.43V3.5h2.5v1.5h1v1.5h-1v5h1v1.5h-1v4.5h1v1.5zm-3.5-3v-2.5h2c.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25h-2zm0-4.5V8h1.75c.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25h-1.75z"/>
                      </svg>
                    </div>
                    <span className="font-bold text-base tracking-wide text-white">BTC/USDT</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2B3139] text-[#A0A5AD] font-semibold uppercase tracking-wider">Spot</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight font-mono text-white">
                      ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${btcPriceDirection === 'up' ? 'bg-[#0ECB81]/15 text-[#0ECB81]' : 'bg-[#F6465D]/15 text-[#F6465D]'}`}>
                      {btcPriceDirection === 'up' ? '▲ +1.42%' : '▼ -1.42%'}
                    </span>
                  </div>
                </div>
                
                {/* Live Connection status badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0ECB81]/10 border border-[#0ECB81]/20">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0ECB81] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0ECB81]"></span>
                  </span>
                  <span className="text-[10px] font-bold text-[#0ECB81] tracking-wider uppercase">Live</span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#848E9C] border-b border-[#2B3139] pb-3">
                <div>
                  <span className="text-[#707A8A]">24h High:</span> <span className="font-mono text-[#EAECEF]">$68,100.00</span>
                </div>
                <div>
                  <span className="text-[#707A8A]">24h Low:</span> <span className="font-mono text-[#EAECEF]">$65,890.00</span>
                </div>
                <div>
                  <span className="text-[#707A8A]">24h Volume:</span> <span className="font-mono text-[#EAECEF]">18.4K BTC ($1.2B)</span>
                </div>
              </div>

              {/* Timeframe Tabs */}
              <div className="flex gap-2 text-xs border-b border-[#2B3139] pb-2">
                <button className="px-2.5 py-1 rounded text-[#848E9C] hover:text-white transition-colors cursor-default">1m</button>
                <button className="px-2.5 py-1 rounded text-[#848E9C] hover:text-white transition-colors cursor-default">15m</button>
                <button className="px-2.5 py-1 rounded bg-[#2563EB]/25 text-[#3B82F6] border border-[#2563EB]/40 font-semibold cursor-default">1H</button>
                <button className="px-2.5 py-1 rounded text-[#848E9C] hover:text-white transition-colors cursor-default">4H</button>
                <button className="px-2.5 py-1 rounded text-[#848E9C] hover:text-white transition-colors cursor-default">1D</button>
              </div>

              {/* Main Content: Chart + Orderbook Grid */}
              <div className="grid grid-cols-[1fr_200px] gap-3">
                {/* Left Side: Candlestick Chart */}
                <div ref={chartContainerRef} className="h-[240px] min-w-0 bg-[#161A1E]" />

                {/* Right Side: Orderbook */}
                <div className="flex flex-col justify-between h-[240px] text-[11px] font-mono border-l border-[#2B3139] pl-3">
                  {/* Orderbook Header */}
                  <div className="flex justify-between text-[#707A8A] font-sans text-[10px] pb-1 border-b border-[#2B3139]/50">
                    <span>Price(USDT)</span>
                    <span>Size(BTC)</span>
                  </div>

                  {/* Sell Orders (Asks) - Descending */}
                  <div className="flex flex-col gap-0.5 py-1">
                    <div className="flex justify-between px-1 rounded relative overflow-hidden" style={{ background: 'linear-gradient(270deg, rgba(246, 70, 93, 0.08) 0%, rgba(246, 70, 93, 0.08) 25%, transparent 25%)' }}>
                      <span className="text-[#F6465D]">67,285.00</span>
                      <span className="text-[#EAECEF]">0.452</span>
                    </div>
                    <div className="flex justify-between px-1 rounded relative overflow-hidden" style={{ background: 'linear-gradient(270deg, rgba(246, 70, 93, 0.08) 0%, rgba(246, 70, 93, 0.08) 55%, transparent 55%)' }}>
                      <span className="text-[#F6465D]">67,270.50</span>
                      <span className="text-[#EAECEF]">1.128</span>
                    </div>
                    <div className="flex justify-between px-1 rounded relative overflow-hidden" style={{ background: 'linear-gradient(270deg, rgba(246, 70, 93, 0.08) 0%, rgba(246, 70, 93, 0.08) 12%, transparent 12%)' }}>
                      <span className="text-[#F6465D]">67,260.00</span>
                      <span className="text-[#EAECEF]">0.085</span>
                    </div>
                    <div className="flex justify-between px-1 rounded relative overflow-hidden" style={{ background: 'linear-gradient(270deg, rgba(246, 70, 93, 0.08) 0%, rgba(246, 70, 93, 0.08) 75%, transparent 75%)' }}>
                      <span className="text-[#F6465D]">67,252.00</span>
                      <span className="text-[#EAECEF]">2.341</span>
                    </div>
                  </div>

                  {/* Mid-Market Price (Spread Display) */}
                  <div className="py-1 px-1 my-0.5 border-y border-[#2B3139]/50 bg-[#23292F]/30 text-center flex items-center justify-center gap-1.5">
                    <span className={`font-bold ${btcPriceDirection === 'up' ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                      {btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[9px] ${btcPriceDirection === 'up' ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                      {btcPriceDirection === 'up' ? '↗' : '↘'}
                    </span>
                  </div>

                  {/* Buy Orders (Bids) - Ascending */}
                  <div className="flex flex-col gap-0.5 py-1">
                    <div className="flex justify-between px-1 rounded relative overflow-hidden" style={{ background: 'linear-gradient(270deg, rgba(14, 203, 129, 0.08) 0%, rgba(14, 203, 129, 0.08) 60%, transparent 60%)' }}>
                      <span className="text-[#0ECB81]">67,230.00</span>
                      <span className="text-[#EAECEF]">1.890</span>
                    </div>
                    <div className="flex justify-between px-1 rounded relative overflow-hidden" style={{ background: 'linear-gradient(270deg, rgba(14, 203, 129, 0.08) 0%, rgba(14, 203, 129, 0.08) 32%, transparent 32%)' }}>
                      <span className="text-[#0ECB81]">67,225.50</span>
                      <span className="text-[#EAECEF]">0.612</span>
                    </div>
                    <div className="flex justify-between px-1 rounded relative overflow-hidden" style={{ background: 'linear-gradient(270deg, rgba(14, 203, 129, 0.08) 0%, rgba(14, 203, 129, 0.08) 8%, transparent 8%)' }}>
                      <span className="text-[#0ECB81]">67,210.00</span>
                      <span className="text-[#EAECEF]">0.054</span>
                    </div>
                    <div className="flex justify-between px-1 rounded relative overflow-hidden" style={{ background: 'linear-gradient(270deg, rgba(14, 203, 129, 0.08) 0%, rgba(14, 203, 129, 0.08) 85%, transparent 85%)' }}>
                      <span className="text-[#0ECB81]">67,195.00</span>
                      <span className="text-[#EAECEF]">3.112</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Ticket Panel */}
              <div className="border-t border-[#2B3139] pt-3 flex flex-col gap-2">
                <div className="flex justify-between text-[11px] text-[#848E9C]">
                  <span>Available Balance: <strong className="text-white font-mono">10,000.00 USDT</strong></span>
                  <span className="font-mono">0.00 BTC</span>
                </div>
                
                {/* Amount Input */}
                <div className="relative rounded-lg bg-[#2B3139] border border-[#475262] focus-within:border-[#2563EB] flex items-center px-3 py-2 text-sm transition-colors">
                  <span className="text-xs text-[#848E9C] mr-2">Amount</span>
                  <input 
                    type="text" 
                    placeholder="0.00 BTC"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-transparent border-none outline-none text-white w-full text-right font-semibold font-mono placeholder-[#475262]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button className="py-2.5 rounded-lg bg-[#0ECB81] hover:bg-[#0b9a62] text-white font-semibold text-sm transition-all shadow-[0_1px_2px_rgba(0,0,0,0.1)] cursor-default">
                    Buy BTC
                  </button>
                  <button className="py-2.5 rounded-lg bg-[#F6465D] hover:bg-[#d1354b] text-white font-semibold text-sm transition-all shadow-[0_1px_2px_rgba(0,0,0,0.1)] cursor-default">
                    Sell BTC
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section id="problem" className="py-20 bg-[#FAFAFA] border-y border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#111111] mb-4">Why Paper Trading Matters</h2>
          <p className="text-[#6B7280] max-w-xl mx-auto mb-16 leading-relaxed">
            Trading is 90% psychology and risk management. Losing real capital while learning is a costly bottleneck.
          </p>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="bg-white p-8 rounded-xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#DC2626]/10 flex items-center justify-center">
                <AlertCircle className="text-[#DC2626] w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-[#111111]">The Problem</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Most new traders lose their first accounts within weeks. Market noise, emotional panic, and structural mistakes erode capital before they can grasp successful portfolio strategies.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#16A34A]/10 flex items-center justify-center">
                <Shield className="text-[#16A34A] w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-[#111111]">The Solution</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                PaperPulse replicates real broker dynamics. Trade in live-simulated markets with $10,000 in virtual credit. Test setups, practice indicators, and build confidence with zero risk.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#111111] mb-4">Features Engineered for Learning</h2>
            <p className="text-[#6B7280] max-w-xl mx-auto leading-relaxed">
              Designed with a minimal Groww-style fintech UI, focused entirely on clarity and speed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
                <BarChart3 className="text-[#2563EB] w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-[#111111]">Multi-Asset Platform</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Diversify across markets. Trade popular Cryptos, major Forex pairs, and top Stocks (like Tesla, Apple, and Amazon) inside one single wallet.
              </p>
            </div>

            <div className="p-8 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
                <TrendingUp className="text-[#2563EB] w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-[#111111]">Ticking Price Feeds</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Experience real latency-matched pricing fluctuations. Make immediate market buying and selling calls with automatic fee calculations.
              </p>
            </div>

            <div className="p-8 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
                <Users className="text-[#2563EB] w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-[#111111]">Competitive Challenges</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Join weekly challenges. Rise on public leaderboards while keeping personal transaction details strictly anonymous.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-[#FAFAFA] border-y border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#111111] mb-4">Start Trading in 3 Steps</h2>
            <p className="text-[#6B7280] max-w-xl mx-auto leading-relaxed">
              No deposit required. Skip verification blocks and immediately enter simulated trading.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-lg mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                1
              </div>
              <h3 className="font-bold text-lg text-[#111111] mb-2">Register Early</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed max-w-xs">
                Submit your email below to reserve your early account spot on our waitlist.
              </p>
            </div>

            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-lg mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                2
              </div>
              <h3 className="font-bold text-lg text-[#111111] mb-2">Get virtual balance</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed max-w-xs">
                Receive an invitation code to login with a pre-loaded $10,000 paper trading wallet.
              </p>
            </div>

            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-lg mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                3
              </div>
              <h3 className="font-bold text-lg text-[#111111] mb-2">Trade & compete</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed max-w-xs">
                Execute paper orders, track portfolio growth, and climb the public standings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Signup Form Section */}
      <section id="waitlist" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl p-8 md:p-12 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="max-w-xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight text-[#111111] mb-4">Join the PaperPulse Waitlist</h2>
              <p className="text-[#6B7280] mb-8 leading-relaxed">
                Reserve your early account access slot. We release beta invite tokens weekly to waitlisted users.
              </p>

              {success ? (
                <div className="p-6 rounded-xl bg-[#16A34A]/10 border border-[#16A34A]/30 text-center animate-fade-in flex flex-col items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-[#16A34A]" />
                  <h4 className="font-bold text-[#111111]">Successfully Registered!</h4>
                  <p className="text-sm text-[#6B7280]">
                    Thank you for signing up. You have been added to the database. We will contact you soon.
                  </p>
                  <button 
                    onClick={() => setSuccess(false)}
                    className="text-xs text-[#2563EB] hover:underline font-semibold mt-2"
                  >
                    Register another email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-[#6B7280]" />
                      <input 
                        type="text" 
                        placeholder="e.g. John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-lg focus:border-[#2563EB] focus:outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-[#6B7280]" />
                      <input 
                        type="email" 
                        placeholder="e.g. johndoe@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-lg focus:border-[#2563EB] focus:outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#DC2626] mt-1 bg-[#DC2626]/10 px-3 py-2 rounded">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all text-base mt-2 flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? 'Submitting to database...' : 'Secure Your Spots'}
                  </button>
                </form>
              )}
            </div>

            {/* Waitlist Database Activity Feed Preview */}
            <div className="mt-12 pt-8 border-t border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-bold text-[#111111]">Live Waitlist Feed</h4>
                  <span className="text-xs text-[#6B7280]">Real-time registration updates from our backend database.</span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#16A34A]"></span>
                    </span>
                    {waitlist.length} {waitlist.length === 1 ? 'Registrant' : 'Registrants'}
                  </span>
                </div>
              </div>

              {waitlist.length === 0 ? (
                <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl p-10 text-center flex flex-col items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-[#2563EB]/10 flex items-center justify-center mb-4 text-[#2563EB]">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-[#111111] text-base mb-2">Be the first to join!</h4>
                  <p className="text-sm text-[#6B7280] max-w-sm">
                    Reserve your early account access slot. Submit your email above to get started.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  {/* Column Headers for Grid Alignment on Desktop */}
                  <div className="hidden md:grid md:grid-cols-[1.5fr_1.2fr_0.8fr] items-center px-6 py-3 bg-[#FAFAFA] border-b border-[#E5E7EB] text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    <span>Name</span>
                    <span>Email Address</span>
                    <span className="text-right">Joined Date</span>
                  </div>

                  <div className="divide-y divide-[#E5E7EB]">
                    {waitlist.slice().reverse().slice(0, 5).map((entry, idx) => {
                      const initials = getInitials(entry.name);
                      const colors = getAvatarColors(entry.name);
                      return (
                        <div 
                          key={entry.id || idx} 
                          className="grid grid-cols-[1fr_auto] md:grid-cols-[1.5fr_1.2fr_0.8fr] items-center px-6 py-4 hover:bg-[#FAFAFA]/50 transition-colors gap-4 animate-fade-in"
                        >
                          {/* Name column */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${colors.bg} ${colors.text}`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-[#111111] text-sm truncate">{entry.name}</div>
                              <div className="text-xs text-[#6B7280] truncate md:hidden mt-0.5">
                                {obfuscateEmail(entry.email)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Email column (Desktop only) */}
                          <div className="hidden md:block text-[#6B7280] text-sm truncate font-medium">
                            {obfuscateEmail(entry.email)}
                          </div>
                          
                          {/* Joined date column */}
                          <div className="text-[#6B7280] text-xs text-right truncate">
                            {new Date(entry.created_at).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {waitlist.length > 5 && (
                    <div className="bg-[#FAFAFA] px-6 py-3 border-t border-[#E5E7EB] text-center">
                      <span className="text-xs font-semibold text-[#6B7280] tracking-wide">
                        + {waitlist.length - 5} more joined the waitlist
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Founder Credibility Section */}
      <section id="founder" className="py-20 bg-[#FAFAFA] border-t border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 md:p-12 shadow-[0_1px_3px_rgba(0,0,0,0.06)] grid md:grid-cols-[120px_1fr] gap-8 items-center">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-[#2563EB] flex items-center justify-center border-2 border-white shadow-[0_4px_12px_rgba(37,99,235,0.18)] select-none">
                <span className="text-white font-extrabold text-2xl tracking-wide">AP</span>
              </div>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-[#111111] mb-2">Built by Traders, For Traders</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed mb-4">
                Managing virtual and live capital for over a decade in major forex and equity market streams. PaperPulse was built to solve the primary hurdle faced by beginner retail accounts: emotional discipline. 
              </p>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-[#111111]">Abhijeet Patil</span>
                <span className="text-xs text-[#6B7280]">— Founder, PaperPulse</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-[#6B7280]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#2563EB] flex items-center justify-center">
              <TrendingUp className="text-white w-3 h-3" />
            </div>
            <span className="font-bold text-[#111111]">PaperPulse</span>
          </div>

          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-[#111111] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#111111] transition-colors">Terms of Service</Link>
          </div>

          <div>
            <p>&copy; {new Date().getFullYear()} PaperPulse. Virtual trading educational simulator. No real money trades are processed.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
