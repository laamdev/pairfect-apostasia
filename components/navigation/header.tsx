'use client';

import Link from 'next/link';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export const Header = () => {
  const { user, signOut } = useAuth();
  const currentUser = useQuery(api.users.currentUser);

  const isStaff = currentUser?.role === 'staff';

  if (!user) return null;

  return (
    <header className="sticky top-0 z-10 bg-surface p-4 border-b border-border flex flex-row justify-between items-center">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-semibold text-accent">
          Pairfect
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/preferences" className="text-muted hover:text-foreground transition-colors">
            My Preferences
          </Link>
          {isStaff && (
            <Link href="/admin" className="text-accent hover:text-accent-hover font-medium transition-colors">
              Admin
            </Link>
          )}
        </nav>
      </div>
      <UserMenu email={user.email ?? ''} onSignOut={signOut} />
    </header>
  );
};

function UserMenu({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted">{email}</span>
      <button
        onClick={onSignOut}
        className="text-sm px-3 py-1 rounded-md border border-border text-muted hover:text-foreground hover:border-foreground transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
