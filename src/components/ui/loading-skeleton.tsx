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

export const GymDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Skeleton */}
      <div className="relative h-[60vh] min-h-[500px] bg-slate-200 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        <div className="absolute bottom-8 left-8 right-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="flex gap-3 mb-4">
                  <Skeleton className="h-8 w-20 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
                <Skeleton className="h-16 w-3/4 mb-4" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-6 w-2/3 mb-6" />
                <div className="space-y-3">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-40" />
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <Skeleton className="h-8 w-48 mb-6" />
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="w-5 h-5 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-20 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Skeleton className="w-5 h-5 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-16 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <Skeleton className="h-8 w-56 mb-6" />
              <div className="text-center">
                <Skeleton className="h-16 w-20 mx-auto mb-4" />
                <Skeleton className="h-6 w-32 mx-auto mb-4" />
                <div className="flex justify-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="w-5 h-5 rounded" />
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Facilities Skeleton */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-80 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export { Skeleton };
