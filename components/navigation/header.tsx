'use client';

import Link from 'next/link';
import { useAuth } from '@workos-inc/authkit-nextjs/components';

export const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
      <div className="flex items-center gap-4">
        <span className="font-semibold">Pairfood</span>
        {user && (
          <Link href="/mis-preferencias" className="text-sm underline">
            MIS PREFERENCIAS
          </Link>
        )}
      </div>
      {user && <UserMenu email={user.email ?? ''} onSignOut={signOut} />}
    </header>
  );
};

function UserMenu({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{email}</span>
      <button onClick={onSignOut} className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600">
        Sign out
      </button>
    </div>
  );
}
