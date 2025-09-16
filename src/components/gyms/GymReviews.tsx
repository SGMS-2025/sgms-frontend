import React from 'react';
import { Star } from 'lucide-react';
import type { GymReviewsProps } from '@/types/components/gym';

export const GymReviews: React.FC<GymReviewsProps> = ({ branch }) => {
  const getStarPercentage = (stars: number) => {
    if (stars === 5) return 70;
    if (stars === 4) return 20;
    return 5;
  };
  return (
    <section>
      <h2 className="text-2xl font-bold text-gym-orange mb-6">ĐÁNH GIÁ & NHẬN XÉT</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="text-6xl font-bold text-gym-orange mb-2">{branch.rating}</div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={`star-${i}`}
                className={`w-5 h-5 ${i < Math.floor(branch.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <p className="text-gym-gray">{branch.totalReviews} đánh giá</p>
        </div>
        <div className="md:col-span-2">
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center gap-4">
                <span className="text-sm w-8">{stars} sao</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gym-orange h-2 rounded-full"
                    style={{ width: `${getStarPercentage(stars)}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gym-gray w-8">{getStarPercentage(stars)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
