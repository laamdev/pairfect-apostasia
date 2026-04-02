'use client';

import { Authenticated, Unauthenticated } from 'convex/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith('/auth')) {
    return <>{children}</>;
  }

  return (
    <>
      <Authenticated>{children}</Authenticated>
      <Unauthenticated>
        <PairfectLanding />
      </Unauthenticated>
    </>
  );
}

function PairfectLanding() {
  return (
    <main className="flex-1 flex flex-col md:flex-row">
      {/* Left half */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-10">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-5xl font-bold tracking-tight">PAIRFECT</h1>
          <p className="text-muted text-center">Your perfect pairing, at every restaurant</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Link
            href="/auth/client"
            className="flex-1 text-center bg-accent text-background px-6 py-3 rounded-lg font-medium text-lg hover:bg-accent-hover transition-colors"
          >
            Client
          </Link>
          <Link
            href="/auth/restaurant"
            className="flex-1 text-center border border-accent text-accent px-6 py-3 rounded-lg font-medium text-lg hover:bg-surface transition-colors"
          >
            Restaurant
          </Link>
        </div>
      </div>

      {/* Right half */}
      <div className="flex-1 relative hidden md:block bg-surface">
        <Image src="/images/auth-main.webp" alt="Paired dishes and drinks" fill className="object-cover" priority />
      </div>
    </main>
  );
}
