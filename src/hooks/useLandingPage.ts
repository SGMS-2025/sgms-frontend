import { useState, useEffect } from 'react';
import { SLIDE_COUNTS, ANIMATION_DURATIONS } from '@/constants/landing-data';

interface LandingPageState {
  currentTrainerSlide: number;
  currentTestimonialSlide: number;
  trainerFilter: 'all' | 'gym' | 'yoga' | 'boxing';
  userGoal: string;
}

interface LandingPageActions {
  setCurrentTrainerSlide: (slide: number) => void;
  setCurrentTestimonialSlide: (slide: number) => void;
  setTrainerFilter: (filter: 'all' | 'gym' | 'yoga' | 'boxing') => void;
  setUserGoal: (goal: string) => void;
  nextTrainerSlide: () => void;
  prevTrainerSlide: () => void;
  nextTestimonialSlide: () => void;
  prevTestimonialSlide: () => void;
}

export const useLandingPage = (): LandingPageState & LandingPageActions => {
  const [currentTrainerSlide, setCurrentTrainerSlide] = useState(0);
  const [currentTestimonialSlide, setCurrentTestimonialSlide] = useState(0);
  const [trainerFilter, setTrainerFilter] = useState<'all' | 'gym' | 'yoga' | 'boxing'>('all');
  const [userGoal, setUserGoal] = useState('');

  // Auto-slide for trainers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTrainerSlide((prev) => (prev + 1) % SLIDE_COUNTS.TRAINERS);
    }, ANIMATION_DURATIONS.TRAINER_SLIDE);
    return () => clearInterval(interval);
  }, []);

  // Auto-slide for testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonialSlide((prev) => (prev + 1) % SLIDE_COUNTS.TESTIMONIALS);
    }, ANIMATION_DURATIONS.TESTIMONIAL_SLIDE);
    return () => clearInterval(interval);
  }, []);

  const nextTrainerSlide = () => {
    setCurrentTrainerSlide((prev) => (prev + 1) % SLIDE_COUNTS.TRAINERS);
  };

  const prevTrainerSlide = () => {
    setCurrentTrainerSlide((prev) => (prev - 1 + SLIDE_COUNTS.TRAINERS) % SLIDE_COUNTS.TRAINERS);
  };

  const nextTestimonialSlide = () => {
    setCurrentTestimonialSlide((prev) => (prev + 1) % SLIDE_COUNTS.TESTIMONIALS);
  };

  const prevTestimonialSlide = () => {
    setCurrentTestimonialSlide((prev) => (prev - 1 + SLIDE_COUNTS.TESTIMONIALS) % SLIDE_COUNTS.TESTIMONIALS);
  };

  return {
    // State
    currentTrainerSlide,
    currentTestimonialSlide,
    trainerFilter,
    userGoal,
    // Actions
    setCurrentTrainerSlide,
    setCurrentTestimonialSlide,
    setTrainerFilter,
    setUserGoal,
    nextTrainerSlide,
    prevTrainerSlide,
    nextTestimonialSlide,
    prevTestimonialSlide
  };
};
