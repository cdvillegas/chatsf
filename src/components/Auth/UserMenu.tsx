'use client';

import { signOut, useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';

export default function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session?.user) return null;

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
        }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 600,
          fontSize: '14px',
          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
        }}>
          {session.user.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <span style={{ 
          fontWeight: 600, 
          color: '#111827',
          fontSize: '14px',
        }}>
          {session.user.name}
        </span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          marginTop: '8px',
          width: '240px',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          padding: '8px',
          zIndex: 50,
          animation: 'slideDown 0.2s ease-out',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            marginBottom: '4px',
          }}>
            <p style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#111827',
              margin: '0 0 4px 0',
            }}>
              {session.user.name}
            </p>
            <p style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {session.user.email}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 16px',
              fontSize: '14px',
              color: '#dc2626',
              background: 'transparent',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Sign Out
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
