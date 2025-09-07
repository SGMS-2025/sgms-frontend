export interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
  status: string;
  avatar?: {
    publicId?: string;
    url?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
}

// Helper components defined outside to prevent re-creation on each render
export interface FormFieldProps {
  id: string;
  label: string;
  icon: React.ElementType;
  value: string;
  placeholder?: string;
  type?: string;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isTextarea?: boolean;
  rows?: number;
  min?: string;
  max?: string;
}
