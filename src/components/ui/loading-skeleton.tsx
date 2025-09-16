import React from 'react';
import { cn } from '@/utils/utils';
import { Card, CardContent, CardFooter } from './card';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="skeleton" className={cn('bg-accent animate-pulse rounded-md', className)} {...props} />;
}

interface GymCardSkeletonProps {
  count?: number;
}

export const GymCardSkeleton: React.FC<GymCardSkeletonProps> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden animate-fade-in"
          style={{ animationDelay: `${index * 150}ms` }}
        >
          {/* Image Skeleton */}
          <div className="relative h-40 sm:h-48 rounded-t-2xl">
            <Skeleton className="w-full h-full" />
            <Skeleton className="absolute top-4 right-4 px-3 py-1 rounded-full w-16 h-6" />
          </div>

          {/* Content Skeleton */}
          <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
            {/* Logo and Name */}
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <Skeleton className="h-6 w-32" />
            </div>

            {/* Description */}
            <div className="space-y-2 mb-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Features */}
            <div className="space-y-2 mb-6">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>

            {/* Location & Hours */}
            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2">
                <Skeleton className="w-4 h-4 rounded mt-0.5" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>

          {/* Button Skeleton */}
          <CardFooter className="p-3 sm:p-4 pt-0">
            <Skeleton className="h-12 w-full rounded-lg" />
          </CardFooter>
        </Card>
      ))}
    </>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-blue-600', sizeClasses[size])} />
    </div>
  );
};

export { Skeleton };
