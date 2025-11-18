import type { PaginationResponse } from '@/types/common/BaseTypes';

export type DocumentStatus =
  | 'uploaded'
  | 'processing'
  | 'ready'
  | 'waiting_for_others'
  | 'signed'
  | 'archived'
  | 'deleted';

export interface ContractDocument {
  _id: string;
  signNowDocumentId: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  tags: string[];
  status: DocumentStatus;
  branchId?: {
    _id: string;
    branchName: string;
    location?: string;
  };
  createdBy: {
    _id: string;
    username: string;
    fullName?: string;
    email: string;
  };
  documentOwner?: string;
  pageCount?: number;
  signersCount?: number;
  signers?: Array<{
    email: string;
    name?: string;
    role?: string;
    status?: string;
  }>;
  signNowData?: Record<string, unknown>;
  // New fields for customer contracts
  customerId?:
    | string
    | {
        _id: string;
        userId?: {
          _id: string;
          fullName?: string;
          email?: string;
          phoneNumber?: string;
        };
      };
  contractType?: 'membership' | 'service_class' | 'service_pt' | 'custom';
  contractId?: string;
  contractModel?: 'MembershipContract' | 'ServiceContract';
  isTemplate?: boolean;
  templateContractType?: 'membership' | 'service_pt' | 'service_class' | 'custom';
  templateDocumentId?:
    | string
    | {
        _id: string;
        title: string;
        fileName: string;
      };
  createdAt: string;
  updatedAt: string;
}

export interface DocumentListParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'fileName';
  sortOrder?: 'asc' | 'desc';
  status?: DocumentStatus | 'all';
  type?: 'templates' | 'contracts';
  search?: string;
  branchId?: string;
  tags?: string | string[];
}

export interface DocumentListResponse {
  documents: ContractDocument[];
  pagination: PaginationResponse;
}

export interface UploadDocumentRequest {
  document: File;
  title?: string;
  description?: string;
  tags?: string | string[];
  branchId?: string;
  isTemplate?: boolean;
  templateContractType?: 'membership' | 'service_pt' | 'service_class' | 'custom';
}

export interface CreateEmbeddedEditLinkRequest {
  redirectUrl?: string;
}

export interface EmbeddedEditLinkResponse {
  documentId: string;
  link: string;
  expiresAt?: string;
}

export interface CreateEmbeddedEditorRequest {
  redirectUrl?: string;
  callbackUrl?: string;
  fieldInvite?: boolean;
}

export interface CreateEmbeddedViewRequest {
  redirectUrl?: string;
  callbackUrl?: string;
}

export interface CreateEmbeddedSendingRequest {
  type: 'invite' | 'document'; // Required
  redirectUrl?: string;
  linkExpiration?: number; // Minutes, max 43200 (30 days)
  redirectTarget?: 'blank' | 'self';
}

export interface EmbeddedResponse {
  documentId: string;
  link: string;
  expiresAt?: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  tags?: string | string[];
  status?: DocumentStatus;
}

export interface CreateContractFromTemplateRequest {
  templateDocumentId: string;
  contractType?: 'membership' | 'service_class' | 'service_pt' | 'custom';
  contractId?: string;
  branchId?: string;
}
