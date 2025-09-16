import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin } from 'lucide-react';
import type { GymHeroSectionProps } from '@/types/components/gym';

export const GymHeroSection: React.FC<GymHeroSectionProps> = ({ branch }) => {
  return (
    <section className="relative bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-80 bg-gradient-to-r from-blue-100 to-blue-200 relative overflow-hidden rounded-b-xl">
          <img
            src={branch.coverImage || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200'}
            alt="Gym Hero"
            className="w-full h-full object-cover rounded-b-xl"
          />
          <div className="absolute inset-0 bg-black/20 rounded-b-xl"></div>

          {/* Gym Information Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 rounded-b-xl">
            <div className="flex items-end gap-6">
              {/* Gym logo */}
              <div className="w-32 h-32 bg-gradient-to-br from-orange-400/60 via-orange-500/40 to-orange-600/60 rounded-lg p-0.5 shadow-lg">
                <div className="w-full h-full bg-gray-50 rounded-lg p-1">
                  <img
                    src={branch.images?.[0] || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120'}
                    alt="Gym Avatar"
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              </div>

              {/* Gym info */}
              <div className="flex-1 text-white pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default" className="bg-gym-orange text-white font-semibold px-3 py-1 shadow-lg">
                    Gym
                  </Badge>
                </div>
                <h1 className="text-4xl font-bold mb-3">{branch.branchName}</h1>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{branch.rating}</span>
                    <span className="text-white/80">({branch.totalReviews} đánh giá)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-white/80">{branch.location.split(',').pop()?.trim()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
