'use client';

import React, { useState } from 'react';
import { Wallet, Sparkles, CheckCircle } from 'lucide-react';

export default function OnboardingBalanceSelector({ onBalanceSet }) {
  const presets = [1000, 5000, 10000, 25000, 50000, 100000];
  const [selectedPreset, setSelectedPreset] = useState(10000);
  const [customAmount, setCustomAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    let amount = selectedPreset;
    if (customAmount) {
      const parsed = parseFloat(customAmount);
      if (isNaN(parsed) || parsed < 100 || parsed > 1000000) {
        setError('Please enter an amount between $100 and $1,000,000.');
        return;
      }
      amount = parsed;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/wallets/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (onBalanceSet) {
          onBalanceSet(data.balance);
        } else {
          window.location.reload();
        }
      } else {
        setError(data.error || 'Failed to set starting balance.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 max-w-xl mx-auto shadow-[0_4px_20px_rgba(0,0,0,0.04)] mb-8 select-none animate-fade-in">
      <div className="flex items-center gap-3.5 mb-5">
        <div className="w-11 h-11 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
          <Wallet className="w-5.5 h-5.5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#111111] flex items-center gap-1.5">
            Set Your Starting Balance
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          </h2>
          <p className="text-xs font-semibold text-[#6B7280]">
            Choose how much virtual capital you want to practice with.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-lg text-[#DC2626] text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Preset Selectors */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Presets</label>
          <div className="grid grid-cols-3 gap-3">
            {presets.map((preset) => {
              const isSelected = selectedPreset === preset && !customAmount;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(preset);
                    setCustomAmount('');
                    setError('');
                  }}
                  className={`py-3 px-4 border rounded-xl font-mono font-bold text-sm transition-all cursor-pointer text-center ${
                    isSelected
                      ? 'border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB] shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                  }`}
                >
                  ${preset.toLocaleString()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Or Enter Custom Amount</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 font-mono font-bold">$</span>
            <input
              type="number"
              min="100"
              max="1000000"
              placeholder="Min $100 - Max $1,000,000"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedPreset(0);
                setError('');
              }}
              className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
            />
          </div>
        </div>

        {/* Confirm Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-sm rounded-xl shadow-[0_2px_4px_rgba(37,99,235,0.15)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            'Configuring Balance...'
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Confirm starting balance
            </>
          )}
        </button>
      </form>
    </div>
  );
}
