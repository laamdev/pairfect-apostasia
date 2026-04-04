import { Skeleton } from '@/components/ui/skeleton';

export const CardSkeleton = () => (
  <div className="border border-border rounded-lg p-4 bg-surface flex flex-col gap-3">
    <div className="flex items-start gap-3">
      <Skeleton className="size-14 rounded-md shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
    <div className="flex gap-1.5">
      <Skeleton className="size-4 rounded-full" />
      <Skeleton className="size-4 rounded-full" />
      <Skeleton className="size-4 rounded-full" />
    </div>
  </div>
);

export const CardListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const PageHeaderSkeleton = () => (
  <div className="flex items-center gap-4">
    <Skeleton className="size-16 rounded-lg shrink-0" />
    <div className="flex flex-col gap-2">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  </div>
);

export const FormSkeleton = () => (
  <div className="border border-border rounded-lg p-5 bg-surface flex flex-col gap-5">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-9 w-full" />
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-9 w-full" />
    <Skeleton className="h-9 w-32" />
  </div>
);
