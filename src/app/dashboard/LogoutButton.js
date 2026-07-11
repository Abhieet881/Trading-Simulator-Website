'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#DC2626] hover:bg-[#b91c1c] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all disabled:opacity-50 cursor-pointer"
    >
      <LogOut className="w-4 h-4" />
      {loading ? 'Logging out...' : 'Log Out'}
    </button>
  );
}
