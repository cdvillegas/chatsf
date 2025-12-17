'use client';

import { useSession } from 'next-auth/react';
import SignInButton from './SignInButton';
import UserMenu from './UserMenu';
import Link from 'next/link';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
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
              gap: '12px',
              textDecoration: 'none',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}>
              🏘️
            </div>
            <span style={{
              fontSize: '18px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}>
              Rate My Neighborhood
            </span>
          </Link>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            {status === 'loading' ? (
              <div style={{
                height: '40px',
                width: '96px',
                background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                borderRadius: '12px',
              }} />
            ) : session ? (
              <UserMenu />
            ) : (
              <SignInButton />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </nav>
  );
}
