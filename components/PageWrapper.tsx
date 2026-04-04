import { cn } from '@/lib/utils';

export const PageWrapper = ({ className, children, ...props }: React.ComponentProps<'main'>) => {
  return (
    <main className={cn('px-4 py-6 sm:p-6 md:p-8 max-w-3xl mx-auto w-full flex flex-col gap-5 sm:gap-6 md:gap-8 mt-4 sm:mt-8', className)} {...props}>
      {children}
    </main>
  );
};
