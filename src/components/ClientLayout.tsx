'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import SessionProvider from '@/components/Auth/SessionProvider';
import Navbar from '@/components/Auth/Navbar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <Navbar />
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}
