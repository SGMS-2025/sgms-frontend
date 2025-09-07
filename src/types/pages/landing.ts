// Landing page specific types

export interface Offer {
  title: string;
  location: string;
  time: string;
  price: string;
  tag: string;
  image: string;
}

export interface GymLocation {
  name: string;
  category: string;
  description: string;
  image: string;
  features: string[];
  address: string;
  hours: string;
  rating: number;
  color: 'orange' | 'green' | 'purple';
  tag: string;
  logo: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

export interface Trainer {
  name: string;
  specialty: string;
  gym: string;
  experience: string;
  image: string;
  category: 'gym' | 'yoga' | 'boxing';
  rating: number;
  price: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface Testimonial {
  name: string;
  company: string;
  content: string;
  avatar: string;
}

export type TrainerFilter = 'all' | 'gym' | 'yoga' | 'boxing';

export interface LandingPageProps {
  className?: string;
}
