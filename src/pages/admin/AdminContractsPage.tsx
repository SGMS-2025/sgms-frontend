import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  FileText,
  Upload,
  Edit,
  Trash2,
  Download,
  Eye,
  Plus,
  Filter,
  Send,
  Mail,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { contractDocumentApi } from '@/services/api/contractDocumentApi';
import type { ContractDocument } from '@/types/api/ContractDocument';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmbeddedDocumentViewer from '@/components/contracts/EmbeddedDocumentViewer';
import { useContractDocumentActions } from '@/hooks/useContractDocumentActions';
import { getStatusBadge, hasInvites } from '@/utils/contractDocumentUtils';

const AdminContractsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [templates, setTemplates] = useState<ContractDocument[]>([]);
  const [contracts, setContracts] = useState<ContractDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [viewDialogOpen, setViewDialogOpen] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractDocument | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'templates' | 'contracts'>('templates');

  // Embedded viewer state
  const [embeddedViewerOpen, setEmbeddedViewerOpen] = useState<boolean>(false);
  const [embeddedMode, setEmbeddedMode] = useState<'edit' | 'view' | 'sending'>('view');
  const [embeddedIframeUrl, setEmbeddedIframeUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    document: null as File | null,
    title: '',
    description: '',
    templateContractType: 'custom' as 'membership' | 'service_pt' | 'service_class' | 'custom',
    tags: ''
  });
  const [uploading, setUploading] = useState<boolean>(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await contractDocumentApi.getTemplates();
      if (result.success && result.data) {
        // Filter for subscription templates (custom type or tags contain 'subscription')
        let filtered = result.data.filter(
          (doc) =>
            doc.isTemplate &&
            (doc.templateContractType === 'custom' ||
              doc.tags?.some((tag) => tag.toLowerCase().includes('subscription')))
        );

        // Apply search filter
        if (searchQuery) {
          filtered = filtered.filter(
            (doc) =>
              doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        // Apply type filter
        if (filterType !== 'all') {
          filtered = filtered.filter((doc) => doc.templateContractType === filterType);
        }

        setTemplates(filtered);
      } else {
        setError(result.message || t('admin.contracts.error.load_failed'));
        setTemplates([]);
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        t('admin.contracts.error.load_failed');
      setError(errorMessage);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [filterType, searchQuery, t]);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page: 1,
        limit: 100,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
        status: 'all' as const,
        type: 'contracts' as const, // This will include subscription contracts
        search: searchQuery || undefined,
        tags: ['subscription'] // Filter subscription contracts
      };

      const result = await contractDocumentApi.listDocuments(params);

      if (result.success && result.data) {
        // Backend returns data as array directly, not as { documents: [...] }
        // So result.data is already the documents array
        const documents = Array.isArray(result.data) ? result.data : [];

        // Backend already filters by tags, contractId, and customerId
        // So we can use the documents directly without additional filtering
        // The backend query should have already filtered for:
        // - type='contracts'
        // - tags=['subscription']
        // - contractId exists
        // - customerId is null or doesn't exist
        let filtered: ContractDocument[] = documents;

        // Apply type filter if needed
        if (filterType !== 'all') {
          filtered = filtered.filter((doc: ContractDocument) => doc.contractType === filterType);
        }

        setContracts(filtered);
      } else {
        setError(result.message || t('admin.contracts.error.load_failed'));
        setContracts([]);
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        t('admin.contracts.error.load_failed');
      setError(errorMessage);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, [filterType, searchQuery, t]);

  useEffect(() => {
    // Only fetch when viewMode, filterType, or searchQuery actually changes
    // fetchTemplates and fetchContracts are memoized with useCallback
    if (viewMode === 'templates') {
      fetchTemplates();
    } else {
      fetchContracts();
    }
  }, [viewMode, fetchTemplates, fetchContracts]);

  const formatDate = (iso: string | undefined) => {
    if (!iso) return '-';
    const date = new Date(iso);
    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleUploadClick = () => {
    setUploadForm({
      document: null,
      title: '',
      description: '',
      templateContractType: 'custom',
      tags: ''
    });
    setUploadDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm((prev) => ({
        ...prev,
        document: file,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '')
      }));
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadForm.document) {
      toast.error(t('admin.contracts.upload.error.no_file'));
      return;
    }

    if (!uploadForm.title.trim()) {
      toast.error(t('admin.contracts.upload.error.no_title'));
      return;
    }

    setUploading(true);
    try {
      const tags = uploadForm.tags
        ? uploadForm.tags
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : ['subscription'];

      // Ensure 'subscription' tag is included
      if (!tags.some((tag) => tag.toLowerCase() === 'subscription')) {
        tags.push('subscription');
      }

      const result = await contractDocumentApi.uploadDocument({
        document: uploadForm.document,
        title: uploadForm.title,
        description: uploadForm.description || undefined,
        tags: tags,
        isTemplate: true,
        templateContractType: uploadForm.templateContractType,
        branchId: undefined // Global template for subscription
      });

      if (result.success) {
        toast.success(t('admin.contracts.upload.success'));
        setUploadDialogOpen(false);
        setUploadForm({
          document: null,
          title: '',
          description: '',
          templateContractType: 'custom',
          tags: ''
        });
        fetchTemplates();
      } else {
        toast.error(result.message || t('admin.contracts.upload.error.failed'));
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        t('admin.contracts.upload.error.failed');
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (template: ContractDocument) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTemplate) return;

    try {
      const result = await contractDocumentApi.deleteDocument(selectedTemplate._id);
      if (result.success) {
        toast.success(t('admin.contracts.delete.success'));
        setDeleteDialogOpen(false);
        setSelectedTemplate(null);
        if (viewMode === 'templates') {
          fetchTemplates();
        } else {
          fetchContracts();
        }
      } else {
        toast.error(result.message || t('admin.contracts.delete.error.failed'));
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        t('admin.contracts.delete.error.failed');
      toast.error(errorMessage);
    }
  };

  // Refresh function that adapts to current view mode
  const refreshData = () => {
    if (viewMode === 'templates') {
      fetchTemplates();
    } else {
      fetchContracts();
    }
  };

  // Use contract document actions hook
  const { handleOpenSending, handleCancelInvite, handleDownloadDocument, handleRefreshDocument } =
    useContractDocumentActions({
      onRefresh: refreshData
    });

  const handleOpenViewer = (template: ContractDocument) => {
    setSelectedTemplate(template);
    setEmbeddedMode('view');
    setEmbeddedIframeUrl(null);
    setEmbeddedViewerOpen(true);
  };

  const handleOpenEditor = (template: ContractDocument) => {
    setSelectedTemplate(template);
    setEmbeddedMode('edit');
    setEmbeddedIframeUrl(null);
    setEmbeddedViewerOpen(true);
  };

  const handleOpenSendingDialog = async (template: ContractDocument) => {
    try {
      const link = await handleOpenSending(template);
      if (link) {
        setSelectedTemplate(template);
        setEmbeddedMode('sending');
        setEmbeddedIframeUrl(link);
        setEmbeddedViewerOpen(true);
      }
    } catch (error: unknown) {
      console.error('Failed to open sending dialog:', error);

      // If document has already been sent, refresh it to update status
      const errorMessage =
        (error as { response?: { data?: { error?: { message?: string } } }; message?: string })?.response?.data?.error
          ?.message ||
        (error as { message?: string })?.message ||
        '';
      if (errorMessage.includes('already sent') || errorMessage.includes('already sent to a signer')) {
        toast.info(t('admin.contracts.send.already_sent', 'Document has already been sent. Refreshing...'));
        try {
          // Refresh document to update status
          const refreshResponse = await contractDocumentApi.refreshDocument(template._id);
          if (refreshResponse.success) {
            toast.success(t('admin.contracts.refresh.success', 'Document refreshed successfully'));
            // Wait a bit then refresh list
            await new Promise((resolve) => setTimeout(resolve, 500));
            if (viewMode === 'templates') {
              await fetchTemplates();
            } else {
              await fetchContracts();
            }
          }
        } catch (refreshError) {
          console.error('Failed to refresh document:', refreshError);
          // Still refresh list to get updated data
          if (viewMode === 'templates') {
            await fetchTemplates();
          } else {
            await fetchContracts();
          }
        }
      } else {
        toast.error(errorMessage || t('admin.contracts.send.error', 'Failed to open sending dialog'));
      }
    }
  };

  const handleEmbeddedClose = async () => {
    // Prevent multiple simultaneous refresh calls
    if (isRefreshing) {
      return;
    }

    // If we were editing or sending a document, refresh its data from SignNow
    if ((embeddedMode === 'edit' || embeddedMode === 'sending') && selectedTemplate) {
      setIsRefreshing(true);
      try {
        const response = await contractDocumentApi.refreshDocument(selectedTemplate._id);
        if (response.success && response.data) {
          const data = response.data as {
            updated?: boolean;
            message?: string;
            status?: string;
            signers?: Array<{ email: string; status?: string }>;
          };
          if (data.updated) {
            toast.success(data.message || t('admin.contracts.refresh.success', 'Document updated successfully'));
          }
          // Wait a bit to ensure DB is updated, then fetch fresh data
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error('Failed to refresh document:', error);
        // Don't show error toast - just continue with normal refresh
      } finally {
        setIsRefreshing(false);
      }
    }

    // Clear iframe URL when closing
    setEmbeddedIframeUrl(null);
    setSelectedTemplate(null);
    setEmbeddedViewerOpen(false);

    // Refresh documents list after editing/viewing/sending
    if (viewMode === 'templates') {
      await fetchTemplates();
    } else {
      await fetchContracts();
    }
  };

  const handleDownload = (doc: ContractDocument) => {
    handleDownloadDocument(doc);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.contracts.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.contracts.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (viewMode === 'templates') {
                fetchTemplates();
              } else {
                fetchContracts();
              }
            }}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.contracts.button.refresh')}
          </Button>
          {viewMode === 'templates' && (
            <Button onClick={handleUploadClick} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('admin.contracts.button.upload')}
            </Button>
          )}
        </div>
      </div>

      {/* View Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('admin.contracts.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">{t('admin.contracts.view_mode', 'View Mode')}</Label>
              <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('templates')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'templates'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('admin.contracts.view_mode.templates', 'Templates')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('contracts')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'contracts'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('admin.contracts.view_mode.contracts', 'Contracts')}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t('admin.contracts.filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block text-sm font-medium">{t('admin.contracts.filter.type')}</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.contracts.filter.type_all')}</SelectItem>
                  <SelectItem value="custom">{t('admin.contracts.filter.type_custom')}</SelectItem>
                  <SelectItem value="membership">{t('admin.contracts.filter.type_membership')}</SelectItem>
                  <SelectItem value="service_pt">{t('admin.contracts.filter.type_service_pt')}</SelectItem>
                  <SelectItem value="service_class">{t('admin.contracts.filter.type_service_class')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block text-sm font-medium">{t('admin.contracts.filter.search')}</Label>
              <Input
                placeholder={t('admin.contracts.filter.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates/Contracts Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {viewMode === 'templates'
              ? t('admin.contracts.table.title')
              : t('admin.contracts.table.contracts_title', 'Subscription Contracts')}
            {(viewMode === 'templates' ? templates.length : contracts.length) > 0 && (
              <Badge variant="secondary" className="ml-2">
                {viewMode === 'templates' ? templates.length : contracts.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {viewMode === 'templates'
              ? t('admin.contracts.table.description')
              : t('admin.contracts.table.contracts_description', 'List of subscription contracts created by owners')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
              <p className="text-sm text-gray-600">{t('admin.contracts.loading')}</p>
            </div>
          ) : (viewMode === 'templates' ? templates.length : contracts.length) === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('admin.contracts.table.empty_title')}</h3>
              <p className="text-sm text-gray-500 max-w-md">{t('admin.contracts.table.empty')}</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 divide-y">
              {(viewMode === 'templates' ? templates : contracts).map((doc) => (
                <div key={doc._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <FileText className="h-5 w-5 text-orange-500" />
                        <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                        {getStatusBadge(doc.status, t, 'default')}
                        {doc.signersCount !== undefined && doc.signersCount !== null && (
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                            Signers: {doc.signersCount}
                          </Badge>
                        )}
                      </div>
                      {doc.description && <p className="text-sm text-gray-600 mb-2">{doc.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <span>{doc.fileName}</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex gap-1">
                            {doc.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        {t('admin.contracts.table.header.created', 'Created')}: {formatDate(doc.createdAt)}
                        {doc.createdBy && typeof doc.createdBy === 'object' && 'fullName' in doc.createdBy && (
                          <>
                            {' '}
                            • {t('admin.contracts.by', 'by')} {doc.createdBy.fullName}
                          </>
                        )}
                      </div>
                      {/* Signers Information */}
                      {doc.signers && doc.signers.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-start gap-2 text-sm">
                            <Mail className="mt-0.5 h-4 w-4 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 mb-2">
                                {t('admin.contracts.signers_emails', 'Signers Email')}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {doc.signers.map((signer, index) => {
                                  // Check multiple possible status values
                                  const signerStatus = signer.status?.toLowerCase() || '';
                                  const isSigned =
                                    signerStatus === 'signed' ||
                                    signerStatus === 'completed' ||
                                    signerStatus === 'fulfilled' ||
                                    signerStatus === 'signed_completed' ||
                                    signerStatus === 'completed_signed';

                                  return (
                                    <div
                                      key={signer.email || index}
                                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
                                        isSigned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                      }`}
                                    >
                                      {isSigned ? (
                                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                                      ) : (
                                        <Mail className="h-3 w-3 text-gray-400" />
                                      )}
                                      <span
                                        className={`text-xs font-medium ${isSigned ? 'text-green-700' : 'text-gray-700'}`}
                                      >
                                        {index + 1}. {signer.email}
                                      </span>
                                      {signer.name && <span className="text-xs text-gray-500">({signer.name})</span>}
                                      {isSigned && <span className="text-xs text-green-600 font-medium">✓</span>}
                                      {/* Debug: Show status if not signed */}
                                      {!isSigned && signer.status && (
                                        <span className="text-xs text-gray-400">({signer.status})</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenViewer(doc)}
                        disabled={doc.status === 'deleted'}
                        title={t('admin.contracts.actions.view')}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        {t('admin.contracts.actions.view', 'View')}
                      </Button>
                      {/* Refresh button for waiting documents to update signers status */}
                      {(doc.status === 'waiting_for_others' || (doc.signersCount && doc.signersCount > 0)) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await handleRefreshDocument(doc._id);
                            // Refresh list after refreshing document
                            if (viewMode === 'templates') {
                              await fetchTemplates();
                            } else {
                              await fetchContracts();
                            }
                          }}
                          title={t('admin.contracts.actions.refresh', 'Refresh Document Status')}
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                        </Button>
                      )}
                      {doc.status === 'signed' ? (
                        // For signed documents, only show View and Download
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          disabled={false}
                          title={t('admin.contracts.actions.download')}
                        >
                          <Download className="mr-1 h-3 w-3" />
                          {t('admin.contracts.actions.download', 'Download')}
                        </Button>
                      ) : (
                        // For non-signed documents, show Edit, Send/Cancel Invite, and Delete
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditor(doc)}
                            disabled={doc.status === 'deleted'}
                            title={t('admin.contracts.actions.edit')}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            {t('admin.contracts.actions.edit', 'Edit')}
                          </Button>
                          {hasInvites(doc) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelInvite(doc)}
                              disabled={doc.status === 'deleted'}
                              title={t('admin.contracts.actions.cancel_invite', 'Cancel Invite')}
                              className="bg-red-500 text-white hover:bg-red-600"
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              {t('admin.contracts.actions.cancel_invite', 'Cancel Invite')}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenSendingDialog(doc)}
                              disabled={doc.status === 'deleted'}
                              title={t('admin.contracts.actions.send')}
                              className="bg-orange-500 text-white hover:bg-orange-600"
                            >
                              <Send className="mr-1 h-3 w-3" />
                              {t('admin.contracts.actions.send', 'Send')}
                            </Button>
                          )}
                          {viewMode === 'templates' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(doc)}
                              disabled={doc.status === 'deleted'}
                              className="text-red-600 hover:text-red-700"
                              title={t('admin.contracts.actions.delete')}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('admin.contracts.upload.title')}</DialogTitle>
            <DialogDescription>{t('admin.contracts.upload.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="document">
                {t('admin.contracts.upload.file_label')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="document"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {uploadForm.document && <p className="text-sm text-gray-500">{uploadForm.document.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                {t('admin.contracts.upload.title_label')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={t('admin.contracts.upload.title_placeholder')}
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('admin.contracts.upload.description_label')}</Label>
              <Textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={t('admin.contracts.upload.description_placeholder')}
                rows={3}
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateContractType">{t('admin.contracts.upload.type_label')}</Label>
              <Select
                value={uploadForm.templateContractType}
                onValueChange={(value) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    templateContractType: value as 'membership' | 'service_pt' | 'service_class' | 'custom'
                  }))
                }
                disabled={uploading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">{t('admin.contracts.upload.type_custom')}</SelectItem>
                  <SelectItem value="membership">{t('admin.contracts.upload.type_membership')}</SelectItem>
                  <SelectItem value="service_pt">{t('admin.contracts.upload.type_service_pt')}</SelectItem>
                  <SelectItem value="service_class">{t('admin.contracts.upload.type_service_class')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">{t('admin.contracts.upload.tags_label')}</Label>
              <Input
                id="tags"
                value={uploadForm.tags}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder={t('admin.contracts.upload.tags_placeholder')}
                disabled={uploading}
              />
              <p className="text-xs text-gray-500">{t('admin.contracts.upload.tags_hint')}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
              {t('admin.contracts.upload.button_cancel')}
            </Button>
            <Button onClick={handleUploadSubmit} disabled={uploading || !uploadForm.document || !uploadForm.title}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t('admin.contracts.upload.uploading')}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {t('admin.contracts.upload.button_upload')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <DialogTitle>{t('admin.contracts.delete.title')}</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-2">
                  {t('admin.contracts.delete.description')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedTemplate && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t('admin.contracts.delete.template_title')}:</span>
                <span className="font-medium text-gray-900">{selectedTemplate.title}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t('admin.contracts.delete.file_name')}:</span>
                <span className="font-medium text-gray-900">{selectedTemplate.fileName}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('admin.contracts.delete.button_cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} className="gap-2">
              <Trash2 className="w-4 h-4" />
              {t('admin.contracts.delete.button_confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin.contracts.view.title')}</DialogTitle>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">{t('admin.contracts.view.title_label')}</Label>
                  <p className="mt-1">{selectedTemplate.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">{t('admin.contracts.view.type_label')}</Label>
                  <p className="mt-1">
                    <Badge variant="outline" className="capitalize">
                      {selectedTemplate.templateContractType || 'custom'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    {t('admin.contracts.view.status_label')}
                  </Label>
                  <p className="mt-1">{getStatusBadge(selectedTemplate.status, t, 'default')}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    {t('admin.contracts.view.file_size_label')}
                  </Label>
                  <p className="mt-1">{formatFileSize(selectedTemplate.fileSize)}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    {t('admin.contracts.view.file_name_label')}
                  </Label>
                  <p className="mt-1">{selectedTemplate.fileName}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    {t('admin.contracts.view.created_label')}
                  </Label>
                  <p className="mt-1">{formatDate(selectedTemplate.createdAt)}</p>
                </div>
              </div>
              {selectedTemplate.description && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    {t('admin.contracts.view.description_label')}
                  </Label>
                  <p className="mt-1 text-gray-600">{selectedTemplate.description}</p>
                </div>
              )}
              {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">{t('admin.contracts.view.tags_label')}</Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedTemplate.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              {t('admin.contracts.view.button_close')}
            </Button>
            {selectedTemplate && (
              <Button onClick={() => handleDownload(selectedTemplate)} className="gap-2">
                <Download className="w-4 h-4" />
                {t('admin.contracts.view.button_download')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Embedded Document Viewer/Editor/Sending */}
      {selectedTemplate && (
        <EmbeddedDocumentViewer
          open={embeddedViewerOpen}
          onOpenChange={setEmbeddedViewerOpen}
          documentId={selectedTemplate._id}
          documentTitle={selectedTemplate.title}
          mode={embeddedMode}
          iframeUrl={embeddedIframeUrl}
          onClose={handleEmbeddedClose}
          onSave={handleEmbeddedClose}
        />
      )}
    </div>
  );
};

export default AdminContractsPage;
