import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Benefit {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  metric: string;
}

interface BenefitsCarouselProps {
  benefits: Benefit[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

const BenefitsCarousel: React.FC<BenefitsCarouselProps> = ({
  benefits,
  autoPlay = true,
  interval = 4000,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || benefits.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % benefits.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, benefits.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % benefits.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + benefits.length) % benefits.length);
  };

  const currentBenefit = benefits[currentIndex];

  return (
    <div className={`relative ${className}`}>
      {/* Main content */}
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200">
            <currentBenefit.icon className="w-12 h-12 text-orange-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-slate-900">{currentBenefit.title}</h3>
          <p className="text-lg text-slate-600 max-w-md mx-auto">{currentBenefit.description}</p>
          <div className="text-3xl font-bold text-orange-600">{currentBenefit.metric}</div>
        </div>
      </div>

      {/* Navigation dots */}
      {benefits.length > 1 && (
        <div className="flex justify-center space-x-2 mt-8">
          {benefits.map((benefit, index) => (
            <button
              key={`${benefit.title}-${index}`}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-orange-500 scale-125' : 'bg-orange-200 hover:bg-orange-300'
              }`}
            />
          ))}
        </div>
      )}

      {/* Navigation arrows */}
      {benefits.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-2 rounded-full bg-white/80 shadow-lg hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-2 rounded-full bg-white/80 shadow-lg hover:bg-white"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
};

export default BenefitsCarousel;
