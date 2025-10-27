// Business Verification Types

export const BusinessVerificationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

export type BusinessVerificationStatus = (typeof BusinessVerificationStatus)[keyof typeof BusinessVerificationStatus];

export interface Logo {
  publicId: string;
  url: string;
}

export interface Document {
  publicId: string;
  url: string;
  fileName?: string;
  uploadedAt: string;
}

export interface BusinessVerification {
  _id: string;
  userId: string;
  taxCode: string;
  businessCode?: string;
  businessName: string;
  logo: Logo;
  documents?: Document[];
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  description?: string;
  status: BusinessVerificationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  adminNotes?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  userInfo?: {
    _id: string;
    username: string;
    email: string;
    fullName?: string;
    phoneNumber?: string;
  };
  reviewerInfo?: {
    _id: string;
    username: string;
    email: string;
    fullName?: string;
  };
  isPending: boolean;
  isApproved: boolean;
  isRejected: boolean;
  daysSinceSubmission?: number;
}

export interface SubmitBusinessVerificationRequest {
  taxCode?: string;
  businessCode?: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  description?: string;
  logo: File;
}

export interface UpdateBusinessVerificationRequest {
  taxCode?: string;
  businessCode?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  description?: string;
  logo?: File;
}

export interface ApproveBusinessVerificationRequest {
  adminNotes?: string;
}

export interface RejectBusinessVerificationRequest {
  rejectionReason: string;
  adminNotes?: string;
}

export interface BusinessVerificationListQuery {
  status?: BusinessVerificationStatus;
  page?: number;
  limit?: number;
  sortBy?: 'submittedAt' | 'reviewedAt' | 'businessName' | 'status';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface BusinessVerificationListResponse {
  success: boolean;
  data: {
    verifications: BusinessVerification[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message: string;
}

export interface BusinessVerificationStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface VerificationStatus {
  hasVerification: boolean;
  status: BusinessVerificationStatus | null;
  isPending: boolean;
  isApproved: boolean;
  isRejected: boolean;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface BusinessVerificationResponse {
  success: boolean;
  data: BusinessVerification;
  message: string;
}

export interface BusinessVerificationStatusResponse {
  success: boolean;
  data: VerificationStatus;
  message: string;
}

export interface BusinessVerificationStatisticsResponse {
  success: boolean;
  data: BusinessVerificationStatistics;
  message: string;
}
