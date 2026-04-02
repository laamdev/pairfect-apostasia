import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans, Geist } from 'next/font/google';
import './globals.css';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { Header } from '@/components/navigation/header';
import { AuthGate } from '@/components/AuthGate';
import { cn } from "@/lib/utils";

const playfair = Playfair_Display({
  variable: '--font-heading',
  subsets: ['latin'],
});

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${playfair.variable} ${geist.variable} antialiased min-h-screen flex flex-col`}>
        <ConvexClientProvider expectAuth={!!accessToken}>
          <Header />
          <AuthGate>{children}</AuthGate>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
