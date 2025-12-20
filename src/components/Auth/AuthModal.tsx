'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSocialSignIn = async (provider: string) => {
    setLoading(true);
    setError('');
    try {
      await signIn(provider, { callbackUrl: '/' });
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password');
        setLoading(false);
      } else {
        router.refresh();
        onClose();
      }
    } catch (err) {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        setLoading(false);
        return;
      }

      // Sign in after successful signup
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Account created but failed to sign in');
        setLoading(false);
      } else {
        router.refresh();
        onClose();
      }
    } catch (err) {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px',
          maxWidth: '420px',
          width: '100%',
          padding: '40px',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            color: '#666',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f0f0f0';
            e.currentTarget.style.color = '#000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#666';
          }}
        >
          ✕
        </button>

        <h2 style={{
          fontSize: '24px',
          fontWeight: '500',
          color: '#000',
          marginBottom: '32px',
          textAlign: 'center',
          letterSpacing: '-0.02em',
        }}>
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h2>

        {error && (
          <div style={{
            marginBottom: '20px',
            padding: '12px 16px',
            background: '#fee',
            border: '1px solid #fcc',
            color: '#c00',
            borderRadius: '8px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Social Login Buttons */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => handleSocialSignIn('google')}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '12px 16px',
              border: '1px solid #e5e5e5',
              borderRadius: '10px',
              background: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              fontSize: '15px',
              fontWeight: '400',
              color: '#000',
              marginBottom: '10px',
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#f9f9f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            onClick={() => handleSocialSignIn('facebook')}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '12px 16px',
              border: '1px solid #e5e5e5',
              borderRadius: '10px',
              background: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              fontSize: '15px',
              fontWeight: '400',
              color: '#000',
              marginBottom: '10px',
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#f9f9f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Continue with Facebook</span>
          </button>

          <button
            onClick={() => handleSocialSignIn('twitter')}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '12px 16px',
              border: '1px solid #e5e5e5',
              borderRadius: '10px',
              background: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              fontSize: '15px',
              fontWeight: '400',
              color: '#000',
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#f9f9f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>Continue with Twitter</span>
          </button>
        </div>

        <div style={{ 
          position: 'relative', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{ flex: 1, height: '1px', background: '#e5e5e5' }}></div>
          <span style={{ fontSize: '13px', color: '#666' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#e5e5e5' }}></div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={isSignUp ? handleSignUp : handleEmailSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isSignUp && (
            <div>
              <label htmlFor="name" style={{ display: 'block', fontSize: '14px', fontWeight: '400', color: '#000', marginBottom: '6px' }}>
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                }}
                placeholder="Your name"
                onFocus={(e) => e.target.style.borderColor = '#000'}
                onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: '400', color: '#000', marginBottom: '6px' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.15s ease',
              }}
              placeholder="you@example.com"
              onFocus={(e) => e.target.style.borderColor = '#000'}
              onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '14px', fontWeight: '400', color: '#000', marginBottom: '6px' }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.15s ease',
              }}
              placeholder="••••••••"
              onFocus={(e) => e.target.style.borderColor = '#000'}
              onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: loading ? '#e5e5e5' : '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '400',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              marginTop: '8px',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#333';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#000';
            }}
          >
            {loading ? 'Loading...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            style={{
              color: '#000',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '400',
              textDecoration: 'underline',
            }}
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
