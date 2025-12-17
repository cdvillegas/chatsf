'use client';

import { useSession } from 'next-auth/react';
import SignInButton from './SignInButton';
import UserMenu from './UserMenu';
import Link from 'next/link';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏘️</span>
            <span className="text-xl font-bold text-gray-900">
              Rate My Neighborhood
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-lg"></div>
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
