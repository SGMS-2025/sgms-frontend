import React from 'react';
import { Header } from '@/components/layout/BaseHeader';
import { Footer } from '@/components/layout/BaseFooter';
import { ScrollingBanner } from '@/components/layout/ScrollingBanner';
import {
  HeroSection,
  OffersSection,
  GymLocationsSection,
  TrainersSection,
  FeaturesSection,
  TestimonialsSection
} from '@/components/landing';

const LandingPage: React.FC = () => {
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
