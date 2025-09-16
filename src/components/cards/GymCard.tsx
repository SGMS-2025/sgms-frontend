import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { MapPin, Clock, Star, ArrowRight } from 'lucide-react';
import { getColorClasses } from '@/utils/utils';
import type { GymCardData } from '@/types/api/Branch';

interface GymCardProps {
  gym: GymCardData;
  index?: number;
  showAnimation?: boolean;
  variant?: 'landing' | 'list';
}

export const GymCard: React.FC<GymCardProps> = ({ gym, index = 0, showAnimation = true, variant = 'list' }) => {
  const navigate = useNavigate();
  const colorClasses = getColorClasses(gym.color);

  // Handle button click based on variant
  const handleButtonClick = () => {
    // Both variants navigate to gym detail page
    navigate(`/gym/${gym.id}`);
  };

  // Get button text based on variant
  const buttonText = variant === 'landing' ? 'Xem chi tiết' : 'Xem thêm';

  return (
    <Card
      className={`group bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative ${
        showAnimation ? 'animate-fade-in' : ''
      }`}
      style={showAnimation ? { animationDelay: `${index * 100}ms` } : undefined}
    >
      {/* Image Section - Top Half */}
      <div className="relative h-40 sm:h-48 overflow-hidden rounded-t-2xl">
        {/* Main Cover Image - Ô lớn: coverImage */}
        <img
          src={gym.image}
          alt={gym.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback image if API image fails
            e.currentTarget.src = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800';
          }}
        />

        {/* Rating Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm z-40">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-slate-700">{gym.rating}</span>
          </div>
        </div>
      </div>

      {/* Content Section - Bottom Half */}
      <CardContent className="p-3 sm:p-4 flex-1 flex flex-col relative z-10">
        {/* Logo and Gym Name - Side by side */}
        <div className="flex items-center gap-3 mb-3">
          {/* Logo - Ô nhỏ: images[0] */}
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md border-2 border-orange-200">
            <img
              src={gym.logo}
              alt={`${gym.name} logo`}
              className="w-10 h-10 object-cover rounded"
              onError={(e) => {
                // Fallback logo
                e.currentTarget.src = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100';
              }}
            />
          </div>

          <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors duration-300">
            {gym.name}
          </CardTitle>
        </div>

        {/* Description - Single sentence */}
        <CardDescription className="text-slate-600 text-sm leading-relaxed mb-4">{gym.description}</CardDescription>

        {/* Features List - With Checkmark Icons */}
        <div className="space-y-2 mb-6">
          {gym.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 text-sm">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses.bgColor}`}
              >
                <div className={`w-2 h-2 rounded-full ${colorClasses.dotColor}`}></div>
              </div>
              <span className="text-slate-600 font-semibold">{feature}</span>
            </div>
          ))}
        </div>

        {/* Location & Hours */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colorClasses.textColor}`} />
            <span className="text-slate-600">{gym.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className={`w-4 h-4 flex-shrink-0 ${colorClasses.textColor}`} />
            <span className="text-slate-600">{gym.hours}</span>
          </div>
        </div>
      </CardContent>

      {/* CTA Button - Outline Style like Relume */}
      <CardFooter className="p-3 sm:p-4 pt-0">
        <Button
          variant="outline"
          className="w-full font-medium py-3 rounded-lg border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 group-hover:scale-105 transition-all duration-300 shadow-sm group-hover:shadow-lg"
          onClick={handleButtonClick}
        >
          <span className="flex items-center justify-center gap-2">
            {buttonText}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
};
