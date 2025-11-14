import type { Dispatch, SetStateAction } from 'react';
export type Status = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type Role = 'STAFF' | 'OWNER' | 'ADMIN' | 'CUSTOMER';

export interface User {
  _id: string;
  username: string;
  email: string;
  role: Role;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
  status: Status;
  avatar?: {
    publicId?: string;
    url?: string;
  };
  customerId?: string;
  customer?: {
    _id: string;
    branchId?: string | string[];
    status?: string;
  } | null;
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

export interface PopulatedUser {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: Status;
}

export interface AccountsListQuery {
  role?: 'CUSTOMER' | 'OWNER';
  status?: Status | 'DELETED';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'fullName' | 'email' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface AccountsListResponse {
  accounts: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
