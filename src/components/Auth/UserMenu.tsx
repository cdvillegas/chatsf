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
          width: '36px',
          height: '36px',
          background: 'var(--text-primary)',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--bg-primary)',
          fontWeight: 600,
          fontSize: '14px',
          transition: 'all 0.2s',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.opacity = '1';
        }}
      >
        {session.user.name?.[0]?.toUpperCase() || 'U'}
      </button>

      {isOpen && (
        <div className="card" style={{
          position: 'absolute',
          right: 0,
          marginTop: '8px',
          width: '220px',
          padding: '6px',
          zIndex: 100,
        }}>
          <div style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--border-primary)',
            marginBottom: '4px',
          }}>
            <p style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: 'var(--text-primary)',
              margin: '0 0 2px 0',
            }}>
              {session.user.name}
            </p>
            <p style={{ 
              fontSize: '12px', 
              color: 'var(--text-secondary)',
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
              padding: '8px 12px',
              fontSize: '14px',
              color: 'var(--text-primary)',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
