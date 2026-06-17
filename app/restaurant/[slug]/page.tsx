'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { RestaurantMenuView } from '@/components/RestaurantMenuView';
import { PageWrapper } from '@/components/PageWrapper';
import { ArrowLeft } from 'lucide-react';
import { PageHeaderSkeleton, CardListSkeleton } from '@/components/skeletons';

export default function RestaurantPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const restaurant = useQuery(api.restaurants.getBySlug, { slug });

  if (restaurant === undefined)
    return (
      <PageWrapper>
        <PageHeaderSkeleton />
        <CardListSkeleton count={4} />
      </PageWrapper>
    );

  if (restaurant === null) {
    return (
      <PageWrapper>
        <p className="text-muted-foreground">No se encontró el restaurante.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-accent">
          Volver al inicio
        </Link>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="size-3.5" />
          Volver al inicio
        </Link>
      </div>
      <RestaurantMenuView restaurant={restaurant} />
    </PageWrapper>
  );
}
