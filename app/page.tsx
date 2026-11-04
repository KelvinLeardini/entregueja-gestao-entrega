'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LandingPage } from '@/src/components/LandingPage';

export const dynamic = 'force-dynamic';

export default function RootPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const handleNavigateToDemo = () => {
    router.push('/hardbeerburguer');
  };

  const handleNavigateToCheckout = (plan?: 'ESSENCIAL' | 'PROFISSIONAL' | 'TURBO') => {
    const selectedPlan = plan || 'PROFISSIONAL';
    router.push(`/checkout?plan=${selectedPlan.toLowerCase()}`);
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof document !== 'undefined') {
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <LandingPage
      onNavigateToDemo={handleNavigateToDemo}
      onNavigateToCheckout={handleNavigateToCheckout}
      theme={theme}
      onToggleTheme={handleToggleTheme}
    />
  );
}
