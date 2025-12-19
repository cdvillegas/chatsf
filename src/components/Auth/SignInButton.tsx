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
          padding: '8px 16px',
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 400,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#333';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#000';
        }}
      >
        Sign in
      </button>
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}
