'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/components/theme-provider';

export default function ToastProvider() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      position="bottom-right"
      theme={theme === 'dark' ? 'dark' : 'light'}
      toastOptions={{
        style: {
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-foreground)',
          fontSize: '12px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-float)',
        },
        duration: 3000,
      }}
      closeButton
      richColors={false}
    />
  );
}
