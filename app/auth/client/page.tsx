'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function AuthClientPage() {
  return (
    <main className="flex-1 flex flex-col md:flex-row">
      {/* Left half */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-10">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-5xl font-bold tracking-tight">Client</h1>
          <p className="text-muted text-center">Discover personalized pairings at your favorite restaurants</p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Link
            href="/sign-in?intent=client"
            className="text-center bg-accent text-background px-6 py-3 rounded-lg font-medium text-lg hover:bg-accent-hover transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-center border border-accent text-accent px-6 py-3 rounded-lg font-medium text-lg hover:bg-surface transition-colors"
          >
            Create account
          </Link>
        </div>

        <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
          Back
        </Link>
      </div>

      {/* Right half */}
      <div className="flex-1 relative hidden md:block bg-surface">
        <Image src="/images/auth-client.webp" alt="Client dining experience" fill className="object-cover" priority />
      </div>
    </main>
  );
}
