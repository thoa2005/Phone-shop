'use client';

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  // Fix hydration mismatch issues
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: { background: '#1a1a2e', color: '#fff', border: '1px solid #2a2a3e' }
        }}
      />
      {children}
    </QueryClientProvider>
  );
}
