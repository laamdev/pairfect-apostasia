import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { Header } from '@/components/navigation/header';
import { AuthGate } from '@/components/AuthGate';
import { TooltipProvider } from '@/components/ui/tooltip';

const playfair = Playfair_Display({
  variable: '--font-heading',
  subsets: ['latin'],
});

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pairfect',
  description: 'Discover the perfect pairings for you at every restaurant',
  icons: {
    icon: '/convex.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let accessToken: string | undefined;
  try {
    const result = await withAuth();
    accessToken = result.accessToken;
  } catch {
    accessToken = undefined;
  }
  return (
    <html lang="en" className={`dark ${jakarta.variable} ${playfair.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <ConvexClientProvider expectAuth={!!accessToken}>
          <TooltipProvider>
            <Header />
            <AuthGate>{children}</AuthGate>
          </TooltipProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
