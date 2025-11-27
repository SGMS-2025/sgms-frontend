// ===== GYM COMPONENT TYPES =====

/**
 * Branch interface for GymHeroSection component
 */
export interface BranchHero {
  coverImage?: string;
  images?: string[];
  branchName: string;
  rating: number;
  totalReviews: number;
  location: string;
}

/**
 * Branch interface for GymReviews component
 */
export interface BranchReviews {
  _id?: string;
  rating?: number;
  totalReviews?: number;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Service Package interface for GymServices component
 */
export interface ServicePackage {
  name: string;
  price: string;
  period: string;
  features: string[];
  isPopular: boolean;
}

/**
 * Promotional Offer interface for GymServices component
 */
export interface PromotionalOffer {
  title: string;
  location: string;
  time: string;
  price: string;
  image: string;
}

/**
 * Trainer interface for GymTrainers component
 */
export interface Trainer {
  id: number;
  name: string;
  title: string;
  experience: string;
  specialties: string;
  rating: number;
  image: string;
}

// ===== COMPONENT PROPS TYPES =====

export interface GymHeroSectionProps {
  branch: BranchHero;
  onJoinClick?: () => void;
  membershipState?: {
    isJoined: boolean;
    onCancelClick?: () => void;
    cancelDisabled?: boolean;
    manageLabel?: string;
  };
}

export interface GymReviewsProps {
  branch: BranchReviews;
}

export interface GymServicesProps {
  servicePackages: ServicePackage[];
  promotionalOffers: PromotionalOffer[];
}

export interface GymTrainersProps {
  trainers: Trainer[];
}

/**
 * Gallery interface for GymGallery component
 */
export interface GymGalleryProps {
  images: string[];
}
