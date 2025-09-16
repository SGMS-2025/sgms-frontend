import React from 'react';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Header } from '@/components/layout/BaseHeader';
import { Footer } from '@/components/layout/BaseFooter';
import { ScrollingBanner } from '@/components/layout/ScrollingBanner';
import HeroSection from '@/components/landing/HeroSection';
import OffersSection from '@/components/landing/OffersSection';
import GymLocationsSection from '@/components/landing/GymLocationsSection';
import TrainersSection from '@/components/landing/TrainersSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';

const LandingPage: React.FC = () => {
  // Scroll to top when component mounts
  useScrollToTop();

  return (
    <div className="min-h-screen bg-white">
      {/* Use enhanced Header component */}
      <Header />

      {/* Hero Section */}
      <HeroSection />

      {/* Offers Section */}
      <OffersSection />

      {/* Gym Locations Section */}
      <GymLocationsSection />

      {/* Trainers Section */}
      <TrainersSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Scrolling Banner before Footer */}
      <ScrollingBanner />

      {/* Use existing Footer component */}
      <Footer />
    </div>
  );
};

export default LandingPage;
