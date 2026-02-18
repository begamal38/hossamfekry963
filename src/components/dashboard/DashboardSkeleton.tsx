import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-muted/20 pb-mobile-nav">
      {/* Navbar spacer */}
      <div className="h-16" />
      
      <div className="container mx-auto px-3 sm:px-4 max-w-4xl xl:max-w-5xl pt-4 sm:pt-8 space-y-5">
        {/* Hero card skeleton */}
        <div className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-7 w-48 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-10 w-full mt-4 rounded-lg" />
          </div>
        </div>

        {/* Quick actions skeleton */}
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20 w-20 rounded-xl flex-shrink-0" />
          ))}
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>

        {/* Course section skeleton */}
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
};
