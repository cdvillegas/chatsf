'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import AuthModal from './AuthModal';

export default function SignInButton() {
  const [showModal, setShowModal] = useState(false);
  const { theme } = useTheme();

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: '8px 16px',
          background: theme === 'dark' ? '#fff' : '#000',
          color: theme === 'dark' ? '#000' : '#fff',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 400,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = theme === 'dark' ? '#e5e5e5' : '#333';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = theme === 'dark' ? '#fff' : '#000';
        }}
      >
        Sign in
      </button>
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}
