'use client';

import { SessionProvider } from 'next-auth/react';
import { FilterProvider } from '@/lib/FilterContext';
import { ReactNode } from 'react';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <FilterProvider>{children}</FilterProvider>
    </SessionProvider>
  );
}