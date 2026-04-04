'use client';

import { useState, useEffect } from 'react';
import { Authenticated, Unauthenticated } from 'convex/react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';

const authImages = [
  '/images/auth-main-1.webp',
  '/images/auth-main-2.webp',
  '/images/auth-main-3.webp',
];

export function AuthGate({ children }: { children: React.ReactNode }) {
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
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % authImages.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="flex-1 flex flex-col md:flex-row min-h-0">
      {/* Left half — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:p-12">
        <div className="flex flex-col gap-8 sm:gap-10 w-full max-w-sm">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">Pairfect</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Your perfect pairing, at every restaurant</p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <a
              href="/sign-in"
              className="block text-center bg-accent text-background px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium text-base sm:text-lg hover:bg-accent-hover transition-colors"
            >
              Sign in
            </a>
            <a
              href="/sign-up"
              className="block text-center border border-accent text-accent px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium text-base sm:text-lg hover:bg-surface transition-colors"
            >
              Create account
            </a>
          </div>
        </div>
      </div>

      {/* Right half — image */}
      <div className="hidden md:block flex-1 relative bg-surface overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={imageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <Image
              src={authImages[imageIndex]}
              alt="Paired dishes and drinks"
              fill
              sizes="50vw"
              className="object-cover"
              priority={imageIndex === 0}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
