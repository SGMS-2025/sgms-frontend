import React from 'react';
import { Star } from 'lucide-react';

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showNumber?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  className = '',
  showNumber = false
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const stars = Array.from({ length: maxRating }, (_, i) => (
    <Star
      key={i}
      className={`${sizeClasses[size]} ${
        i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
      } ${className}`}
    />
  ));

  return (
    <div className="flex items-center gap-1">
      {stars}
      {showNumber && <span className="text-sm font-semibold text-slate-700 ml-1">{rating.toFixed(1)}</span>}
    </div>
  );
};

// Alternative function for custom star rendering (like TrainerCard)
export const renderCustomStars = (rating: number, maxRating: number = 5) => {
  return [...Array(maxRating)].map((_, i) => (
    <span key={i} className={`text-sm ${i < Math.floor(rating) ? 'text-yellow-300' : 'text-white/30'}`}>
      ★
    </span>
  ));
};
