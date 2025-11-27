import React from 'react';
import { GymTestimonials } from './GymTestimonials';
import type { GymReviewsProps } from '@/types/components/gym';

export const GymReviews: React.FC<GymReviewsProps> = ({ branch }) => {
  // Get branch ID from branch object - branch can be any object with _id property
  const branchId = branch?._id || null;

  if (!branchId) {
    return (
      <section>
        <h2 className="text-2xl font-bold text-gym-orange mb-6">TESTIMONIALS</h2>
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy thông tin phòng tập.</p>
        </div>
      </section>
    );
  }

  return <GymTestimonials branchId={branchId} />;
};
