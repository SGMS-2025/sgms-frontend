import { useState, useEffect } from 'react';

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
      setCurrentTrainerSlide((prev) => (prev + 1) % 8); // 8 slides
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-slide for testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonialSlide((prev) => (prev + 1) % 6); // 6 slides
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const nextTrainerSlide = () => {
    setCurrentTrainerSlide((prev) => (prev + 1) % 8);
  };

  const prevTrainerSlide = () => {
    setCurrentTrainerSlide((prev) => (prev - 1 + 8) % 8);
  };

  const nextTestimonialSlide = () => {
    setCurrentTestimonialSlide((prev) => (prev + 1) % 6);
  };

  const prevTestimonialSlide = () => {
    setCurrentTestimonialSlide((prev) => (prev - 1 + 6) % 6);
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
