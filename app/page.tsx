'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LandingPage } from '@/src/components/LandingPage';

export default function RootPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Demo e checkout não existem ainda. Enquanto isso, tudo leva ao login.
  const handleNavigateToDemo = () => {
    router.push('/login');
  };

  const handleNavigateToCheckout = (_plan?: 'ESSENCIAL' | 'PROFISSIONAL' | 'TURBO') => {
    router.push('/login');
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