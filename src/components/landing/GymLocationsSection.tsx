import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { GymCard } from '@/components/cards/GymCard';
import { GymCardSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorMessage } from '@/components/ui/error-message';
import { useTopGyms } from '@/hooks/useBranches';
import type { LandingPageProps } from '@/types/pages/landing';

const GymLocationsSection: React.FC<LandingPageProps> = ({ className = '' }) => {
  const navigate = useNavigate();

  // Fetch top 3 gyms from API
  const { gymCards, loading, error, refetch } = useTopGyms();

  return (
    <section id="gyms" className={`py-24 px-4 bg-slate-50 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold text-slate-900 mb-4 tracking-tight">
            Phòng tập{' '}
            <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
              hàng đầu
            </span>
          </h2>
          <p className="text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed px-4">
            Khám phá các phòng tập chuyên nghiệp với cơ sở vật chất hiện đại và đội ngũ huấn luyện viên giàu kinh nghiệm
          </p>
        </div>

        {/* Gym Cards Grid - Relume Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {loading && <GymCardSkeleton count={3} />}

          {error && (
            <div className="col-span-full">
              <ErrorMessage message={error} onRetry={refetch} />
            </div>
          )}

          {!loading &&
            !error &&
            gymCards.map((gym, i) => (
              <GymCard key={gym.id} gym={gym} index={i} showAnimation={true} variant="landing" />
            ))}
        </div>

        {/* View All Button - Relume style */}
        <div className="text-center mt-12 lg:mt-16">
          <div
            className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 transition-colors duration-300 cursor-pointer group"
            onClick={() => navigate('/gyms')}
          >
            <span className="text-lg font-medium">Xem tất cả phòng tập</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
          <div className="mt-4 w-16 h-0.5 bg-gradient-to-r from-orange-500 to-purple-500 mx-auto group-hover:w-24 transition-all duration-300"></div>
        </div>
      </div>
    </section>
  );
};

export default GymLocationsSection;
