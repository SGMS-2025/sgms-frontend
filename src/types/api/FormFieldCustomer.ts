import type { LucideIcon } from 'lucide-react';
import type { UpdateProfileData } from './User';

//formfieldcustomer.tsx
export interface FormFieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  placeholder?: string;
  type?: string;
  isEditing: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isTextarea?: boolean;
  rows?: number;
  min?: string;
  max?: string;
  error?: string;
  required?: boolean;
}

//infocard.tsx
export interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}

//personalinfotab.tsx
export interface PersonalInfoTabProps {
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  isSaving: boolean;
  formData: UpdateProfileData;
  userData: {
    name: string;
    email: string;
    phone: string;
    birthDate: string;
    gender: string;
    address: string;
    bio: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleGenderChange: (value: string) => void;
  handleSaveProfile: () => Promise<void>;
  handleCancelEdit: () => void;
  setFormData: (data: UpdateProfileData) => void;
  validationErrors: Record<string, string>;
}

//servicepackagetab.tsx
export interface ServicePackageTabProps {
  servicePackage: {
    name: string;
    schedule: string;
    description: string;
    startDate: string;
    endDate: string;
    sessions: string;
    time: string;
    trainer: string;
    gym: string;
    paymentStatus: string;
  };
}
//statusbadge.tsx
export interface StatusBadgeProps {
  status: string;
  completedText?: string;
  warningText?: string;
  missedText?: string;
}

//TrainingProgressTab.tsx
export interface WorkoutStat {
  label: string;
  value: string;
  color: string;
  icon: React.ElementType;
}

export interface WorkoutSession {
  date: string;
  time: string;
  status: string;
  workout: string;
}

export interface FitnessMetric {
  current: string;
  previous: string;
}

export interface TrainingProgressTabProps {
  workoutStats: WorkoutStat[];
  workoutSchedule: WorkoutSession[];
  fitnessMetrics: Record<string, FitnessMetric>;
}
