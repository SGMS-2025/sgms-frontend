export interface OwnerMetric {
  label: string;
  value: string;
  description: string;
}

export interface OwnerBenefit {
  title: string;
  description: string;
  painPoint: string;
}

export interface OwnerFeature {
  title: string;
  description: string;
  icon: string;
  highlights: string[];
}

export interface OwnerWorkflowStep {
  title: string;
  description: string;
  result: string;
  icon: string;
}

export interface OwnerTestimonial {
  name: string;
  role: string;
  quote: string;
  result: string;
  avatar: string;
  rating: number;
}

export interface OwnerIntegration {
  name: string;
  description: string;
}

export interface OwnerCTA {
  title: string;
  subtitle: string;
  description: string;
}

export interface OwnerTimelineItem {
  title: string;
  duration: string;
  description: string;
  highlights: string[];
  icon: string;
}

export interface OwnerPricingTier {
  name: string;
  price: string;
  description: string;
  badge?: string;
  features: string[];
  cta: string;
  mostPopular?: boolean;
}

export interface OwnerFAQItem {
  question: string;
  answer: string;
}
