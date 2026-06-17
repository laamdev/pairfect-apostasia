'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useEnsureUser } from '../../hooks/useEnsureUser';
import { User, Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from '../ui/popover';

export const Header = () => {
  const { user, signOut } = useAuth();
  const currentUser = useQuery(api.users.currentUser);
  useEnsureUser();

  const isStaffOrAdmin = currentUser?.role === 'admin' || currentUser?.isRestaurantMember;

  if (!user) return null;

  const initials = (currentUser?.name ?? user.email ?? '')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-10 bg-surface p-4 border-b border-border flex flex-row justify-between items-center">
      <Link href="/" aria-label="La Apostasía" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent">
        <Image
          src="/images/apostasia-logo.webp"
          alt="La Apostasía"
          width={40}
          height={40}
          priority
          className="size-9 object-contain invert"
        />
      </Link>

      <Popover>
        <PopoverTrigger className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <Avatar>
            {currentUser?.avatarUrl && <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name ?? 'Perfil'} />}
            <AvatarFallback>{initials || '?'}</AvatarFallback>
          </Avatar>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-56">
          <PopoverHeader>
            <p className="font-medium text-foreground truncate">
              {currentUser?.name ?? 'Usuario'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </PopoverHeader>
          <div className="h-px bg-border" />
          <nav className="flex flex-col gap-0.5">
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <User className="size-4" />
              Mi perfil
            </Link>
            {isStaffOrAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Settings className="size-4" />
                Panel
              </Link>
            )}
          </nav>
          <div className="h-px bg-border" />
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </PopoverContent>
      </Popover>
    </header>
  );
};
