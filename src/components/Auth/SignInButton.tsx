'use client';

import { useState } from 'react';
import AuthModal from './AuthModal';

export default function SignInButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: '10px 24px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          letterSpacing: '-0.01em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.98)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
      >
        Sign In
      </button>
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}
