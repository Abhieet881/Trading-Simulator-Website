'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Shield, BarChart3, Users, Award, 
  ArrowRight, CheckCircle2, Play, AlertCircle, Sparkles, Mail, User
} from 'lucide-react';

export default function Home() {
  // Waitlist form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Live Chart Mocking
  const [chartData, setChartData] = useState([
    { open: 120, close: 125, high: 128, low: 118, time: 1 },
    { open: 125, close: 122, high: 127, low: 120, time: 2 },
    { open: 122, close: 130, high: 132, low: 121, time: 3 },
    { open: 130, close: 128, high: 134, low: 126, time: 4 },
    { open: 128, close: 135, high: 138, low: 127, time: 5 },
    { open: 135, close: 142, high: 145, low: 133, time: 6 },
    { open: 142, close: 139, high: 144, low: 137, time: 7 },
    { open: 139, close: 146, high: 149, low: 136, time: 8 },
    { open: 146, close: 152, high: 155, low: 144, time: 9 },
  ]);
  const [currentPrice, setCurrentPrice] = useState(152);
  const [priceDirection, setPriceDirection] = useState('up'); // up, down, flat

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

    // Live chart price ticking simulator
    const interval = setInterval(() => {
      setChartData((prev) => {
        const next = [...prev];
        const lastIndex = next.length - 1;
        const last = { ...next[lastIndex] };
        
        // Fluctuating last candle
        const drift = (Math.random() - 0.48) * 3;
        const prevClose = last.close;
        const nextClose = parseFloat((last.close + drift).toFixed(2));
        
        if (nextClose > prevClose) {
          setPriceDirection('up');
        } else if (nextClose < prevClose) {
          setPriceDirection('down');
        } else {
          setPriceDirection('flat');
        }
        
        setCurrentPrice(nextClose);
        
        last.close = nextClose;
        last.high = Math.max(last.high, nextClose);
        last.low = Math.min(last.low, nextClose);
        next[lastIndex] = last;

        // Create new candle every 8 ticks
        if (Math.random() > 0.85) {
          const newCandle = {
            open: last.close,
            close: last.close,
            high: last.close,
            low: last.close,
            time: last.time + 1
          };
          if (next.length > 12) {
            next.shift();
          }
          next.push(newCandle);
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
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
            <a href="#problem" className="hover:text-[#111111] transition-colors">Why Paper Trading</a>
            <a href="#features" className="hover:text-[#111111] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#111111] transition-colors">How It Works</a>
            <a href="#founder" className="hover:text-[#111111] transition-colors">Founder</a>
          </nav>

          <div>
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
      <section className="relative py-20 md:py-28 overflow-hidden bg-white">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-columns-2 gap-12 items-center">
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5E7EB]/50 border border-[#E5E7EB] text-xs font-semibold text-[#6B7280] mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Risk-free paper trading platform</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#111111] leading-[1.1] mb-6">
              Learn Trading <br />
              <span className="text-[#2563EB]">Without Risking</span> <br />
              Real Money
            </h1>

            <p className="text-lg text-[#6B7280] leading-relaxed mb-8 max-w-lg">
              Practice trading cryptocurrencies, forex, and stocks using virtual money with real-time market data. Zero risk, absolute learning, and weekly challenges.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
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

            <div className="flex items-center gap-6 mt-12 text-sm text-[#6B7280]">
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

          {/* Visual Candlestick Centerpiece */}
          <div className="flex justify-center w-full">
            <div className="w-full max-w-[480px] bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] relative">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Live Simulator Preview</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-[#111111]">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${priceDirection === 'up' ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'bg-[#DC2626]/10 text-[#DC2626]'}`}>
                      {priceDirection === 'up' ? '▲' : '▼'} {priceDirection === 'up' ? '+1.42%' : '-0.85%'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
                  <span className="text-xs text-[#6B7280] font-medium">Live Market Stream</span>
                </div>
              </div>

              {/* Render dynamic SVG candlestick chart */}
              <div className="h-[220px] w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="50" x2="400" y2="50" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1="0" y1="100" x2="400" y2="100" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1="0" y1="150" x2="400" y2="150" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="3" />

                  {/* Draw mock candles */}
                  {chartData.map((candle, idx) => {
                    const isGreen = candle.close >= candle.open;
                    const x = 30 + idx * 30;
                    
                    // Simple scaling formulas
                    const yOpen = 200 - (candle.open - 100) * 3;
                    const yClose = 200 - (candle.close - 100) * 3;
                    const yHigh = 200 - (candle.high - 100) * 3;
                    const yLow = 200 - (candle.low - 100) * 3;
                    
                    const rectY = Math.min(yOpen, yClose);
                    const rectHeight = Math.max(1, Math.abs(yOpen - yClose));
                    
                    const strokeColor = isGreen ? '#16A34A' : '#DC2626';
                    const fillColor = isGreen ? '#16A34A' : '#DC2626';

                    return (
                      <g key={idx}>
                        {/* Shadow wick */}
                        <line 
                          x1={x} 
                          y1={yHigh} 
                          x2={x} 
                          y2={yLow} 
                          stroke={strokeColor} 
                          strokeWidth="1.5" 
                        />
                        {/* Real body */}
                        <rect
                          x={x - 6}
                          y={rectY}
                          width="12"
                          height={rectHeight}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth="1"
                          rx="1"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Order Controls Mock */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#E5E7EB]">
                <button className="py-2.5 rounded-lg bg-[#16A34A] hover:bg-[#15803d] text-white font-semibold text-sm transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                  Buy BTC
                </button>
                <button className="py-2.5 rounded-lg bg-[#DC2626] hover:bg-[#b91c1c] text-white font-semibold text-sm transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                  Sell BTC
                </button>
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

            {/* Waitlist Database Table Preview */}
            <div className="mt-12 pt-8 border-t border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-bold text-[#111111]">Real-time Database Entries</h4>
                  <span className="text-xs text-[#6B7280]">Verifiable waitlist registry stored in the backend database.</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB]">
                    {waitlist.length} Registrants
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4 text-right">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-8 text-center text-sm text-[#6B7280]">
                          No waitlist entries yet. Be the first to register!
                        </td>
                      </tr>
                    ) : (
                      waitlist.slice().reverse().map((entry, idx) => (
                        <tr key={entry.id || idx} className="border-b border-[#E5E7EB] hover:bg-[#FAFAFA] transition-colors text-sm">
                          <td className="py-3.5 px-4 font-semibold text-[#111111]">{entry.name}</td>
                          <td className="py-3.5 px-4 text-[#6B7280]">{obfuscateEmail(entry.email)}</td>
                          <td className="py-3.5 px-4 text-[#6B7280] text-right">
                            {new Date(entry.created_at).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Credibility Section */}
      <section id="founder" className="py-20 bg-[#FAFAFA] border-t border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 md:p-12 shadow-[0_1px_3px_rgba(0,0,0,0.06)] grid md:grid-cols-[120px_1fr] gap-8 items-center">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-[#2563EB]/10 flex items-center justify-center border-2 border-[#2563EB]/30 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                <Award className="text-[#2563EB] w-12 h-12" />
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
            <a href="#" className="hover:text-[#111111] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#111111] transition-colors">Terms of Service</a>
            <a href="https://github.com/Abhieet881/Trading-Simulator-Website" target="_blank" className="hover:text-[#111111] transition-colors">GitHub Repository</a>
          </div>

          <div>
            <p>&copy; {new Date().getFullYear()} PaperPulse. Virtual trading educational simulator. No real money trades are processed.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
