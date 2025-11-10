import type { ApiResponse, PaginatedApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  ContractDocument,
  DocumentListParams,
  DocumentListResponse,
  UploadDocumentRequest,
  CreateEmbeddedEditLinkRequest,
  EmbeddedEditLinkResponse,
  CreateEmbeddedEditorRequest,
  CreateEmbeddedViewRequest,
  CreateEmbeddedSendingRequest,
  EmbeddedResponse,
  UpdateDocumentRequest,
  CreateContractFromTemplateRequest
} from '@/types/api/ContractDocument';

export const contractDocumentApi = {
  /**
   * Upload document to SignNow
   */
  uploadDocument: async (data: UploadDocumentRequest): Promise<ApiResponse<ContractDocument>> => {
    const formData = new FormData();
    formData.append('document', data.document);

    if (data.title) {
      formData.append('title', data.title);
    }
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.tags) {
      if (Array.isArray(data.tags)) {
        data.tags.forEach((tag) => formData.append('tags', tag));
      } else {
        formData.append('tags', data.tags);
      }
    }
    if (data.branchId) {
      formData.append('branchId', data.branchId);
    }
    if (data.isTemplate !== undefined) {
      formData.append('isTemplate', String(data.isTemplate));
    }
    if (data.templateContractType) {
      formData.append('templateContractType', data.templateContractType);
    }

    const response = await api.post<ApiResponse<ContractDocument>>('/signnow/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * List documents with filters and pagination
   */
  listDocuments: async (params: DocumentListParams = {}): Promise<PaginatedApiResponse<DocumentListResponse>> => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const queryString = searchParams.toString();
    const url = queryString ? `/signnow/documents?${queryString}` : '/signnow/documents';

    const response = await api.get<PaginatedApiResponse<DocumentListResponse>>(url);
    return response.data;
  },

  /**
   * Get document by ID
   */
  getDocument: async (documentId: string): Promise<ApiResponse<ContractDocument>> => {
    const response = await api.get<ApiResponse<ContractDocument>>(`/signnow/documents/${documentId}`);
    return response.data;
  },

  /**
   * Create embedded edit link (v1 - legacy)
   */
  createEmbeddedEditLink: async (
    documentId: string,
    data?: CreateEmbeddedEditLinkRequest
  ): Promise<ApiResponse<EmbeddedEditLinkResponse>> => {
    const response = await api.post<ApiResponse<EmbeddedEditLinkResponse>>(
      `/signnow/documents/${documentId}/embedded-edit`,
      data || {}
    );
    return response.data;
  },

  /**
   * Create embedded editor v2 (iframe-ready)
   */
  createEmbeddedEditor: async (
    documentId: string,
    data?: CreateEmbeddedEditorRequest
  ): Promise<ApiResponse<EmbeddedResponse>> => {
    const response = await api.post<ApiResponse<EmbeddedResponse>>(
      `/signnow/documents/${documentId}/embedded-editor`,
      data || {}
    );
    return response.data;
  },

  /**
   * Create embedded view v2 (iframe-ready)
   */
  createEmbeddedView: async (
    documentId: string,
    data?: CreateEmbeddedViewRequest
  ): Promise<ApiResponse<EmbeddedResponse>> => {
    const response = await api.post<ApiResponse<EmbeddedResponse>>(
      `/signnow/documents/${documentId}/embedded-view`,
      data || {}
    );
    return response.data;
  },

  /**
   * Create embedded sending v2 (iframe-ready)
   */
  createEmbeddedSending: async (
    documentId: string,
    data: CreateEmbeddedSendingRequest
  ): Promise<ApiResponse<EmbeddedResponse>> => {
    const response = await api.post<ApiResponse<EmbeddedResponse>>(
      `/signnow/documents/${documentId}/embedded-sending`,
      data
    );
    return response.data;
  },

  /**
   * Update document
   */
  updateDocument: async (documentId: string, data: UpdateDocumentRequest): Promise<ApiResponse<ContractDocument>> => {
    const response = await api.patch<ApiResponse<ContractDocument>>(`/signnow/documents/${documentId}`, data);
    return response.data;
  },

  /**
   * Delete document
   */
  deleteDocument: async (documentId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/signnow/documents/${documentId}`);
    return response.data;
  },

  /**
   * Get template documents
   */
  getTemplates: async (filters?: { branchId?: string; search?: string }): Promise<ApiResponse<ContractDocument[]>> => {
    const searchParams = new URLSearchParams();
    if (filters?.branchId) {
      searchParams.append('branchId', filters.branchId);
    }
    if (filters?.search) {
      searchParams.append('search', filters.search);
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/signnow/documents/templates?${queryString}` : '/signnow/documents/templates';

    const response = await api.get<ApiResponse<ContractDocument[]>>(url);
    return response.data;
  },

  /**
   * Get contracts by customer ID
   */
  getCustomerContracts: async (
    customerId: string,
    filters?: { contractType?: string; status?: string }
  ): Promise<ApiResponse<ContractDocument[]>> => {
    const searchParams = new URLSearchParams();
    if (filters?.contractType) {
      searchParams.append('contractType', filters.contractType);
    }
    if (filters?.status) {
      searchParams.append('status', filters.status);
    }

    const queryString = searchParams.toString();
    const url = queryString
      ? `/signnow/customers/${customerId}/contracts?${queryString}`
      : `/signnow/customers/${customerId}/contracts`;

    const response = await api.get<ApiResponse<ContractDocument[]>>(url);
    return response.data;
  },

  /**
   * Create contract from template for customer
   */
  createContractFromTemplate: async (
    customerId: string,
    data: CreateContractFromTemplateRequest
  ): Promise<ApiResponse<ContractDocument>> => {
    const response = await api.post<ApiResponse<ContractDocument>>(
      `/signnow/customers/${customerId}/contracts/create-from-template`,
      data
    );
    return response.data;
  }
};
