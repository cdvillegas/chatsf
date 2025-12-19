'use client';

import { useSession } from 'next-auth/react';
import SignInButton from './SignInButton';
import UserMenu from './UserMenu';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function Navbar() {
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'var(--navbar-bg)',
        backdropFilter: 'var(--backdrop-blur)',
        WebkitBackdropFilter: 'var(--backdrop-blur)',
        borderBottom: '1px solid var(--navbar-border)',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px',
        }}>
          <Link 
            href="/" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
            }}
          >
            <img 
              src={theme === 'dark' ? '/chatsf-white.png' : '/chatsf-black.png'}
              alt="ChatSF"
              style={{
                width: '28px',
                height: '28px',
                objectFit: 'contain',
              }}
            />
            <span style={{
              fontSize: '18px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}>
              ChatSF
            </span>
          </Link>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                transition: 'all 0.15s ease',
              }}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {status === 'loading' ? (
              <div style={{
                height: '40px',
                width: '96px',
                background: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '10px',
              }} />
            ) : session ? (
              <UserMenu />
            ) : (
              <SignInButton />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
