import type { Dispatch, SetStateAction } from 'react';

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

export interface ProfileUserData {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  address: string;
  bio: string;
  avatar: string;
}

export interface ProfileHeaderProps {
  userData: ProfileUserData;
  userRole?: string;
  username?: string;
  isUploading: boolean;
  setIsUploading: (loading: boolean) => void;
  setUserData: Dispatch<SetStateAction<ProfileUserData>>;
  setShowDeleteDialog: (show: boolean) => void;
}
