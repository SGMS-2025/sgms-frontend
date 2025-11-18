import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Send,
  Mail,
  CheckCircle2,
  XCircle,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { contractDocumentApi } from '@/services/api/contractDocumentApi';
import { toast } from 'sonner';
import DocumentUploadDialog from './DocumentUploadDialog';
import EmbeddedDocumentViewer from './EmbeddedDocumentViewer';
import type { ContractDocument, DocumentStatus } from '@/types/api/ContractDocument';

export default function ContractDocumentManager() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'templates' | 'contracts'>('templates');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [embeddedViewerOpen, setEmbeddedViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ContractDocument | null>(null);
  const [embeddedMode, setEmbeddedMode] = useState<'edit' | 'view' | 'sending'>('view');
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);

    const response = await contractDocumentApi.listDocuments({
      page,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      status: statusFilter,
      type: typeFilter,
      search: search || undefined
    });

    if (response.success) {
      // API returns data as array directly and pagination at root level
      const documents = Array.isArray(response.data) ? response.data : [];
      setDocuments(documents);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);
    } else {
      toast.error('Failed to load documents');
    }

    setLoading(false);
  }, [page, statusFilter, typeFilter, search]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Listen for contract signing events to refresh data
  useEffect(() => {
    const handleContractSignerSigned = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;

      // Refresh documents to show updated signer status
      if (data?.data?.documentId) {
        // Wait a bit for backend to fully update, then refresh
        setTimeout(() => {
          fetchDocuments();
        }, 500);
      }
    };

    const handleContractCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;

      // Refresh documents to show completed status
      if (data?.data?.documentId) {
        // Wait a bit for backend to fully update, then refresh
        setTimeout(() => {
          fetchDocuments();
        }, 500);
      }
    };

    // Listen for contract signing events
    globalThis.addEventListener('contract:signer:signed', handleContractSignerSigned);
    globalThis.addEventListener('contract:completed', handleContractCompleted);

    return () => {
      globalThis.removeEventListener('contract:signer:signed', handleContractSignerSigned);
      globalThis.removeEventListener('contract:completed', handleContractCompleted);
    };
  }, [fetchDocuments]);

  // Refresh when window/tab becomes visible (user comes back to the page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to the page, refresh documents to get latest status
        fetchDocuments();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [fetchDocuments]);

  const handleUploaded = () => {
    fetchDocuments();
  };

  const handleOpenEditor = (document: ContractDocument) => {
    setSelectedDocument(document);
    setEmbeddedMode('edit');
    setEmbeddedViewerOpen(true);
  };

  const handleOpenViewer = (document: ContractDocument) => {
    setSelectedDocument(document);
    setEmbeddedMode('view');
    setEmbeddedViewerOpen(true);
  };

  /**
   * Check if document has active invites (has been sent and not all cancelled)
   * A document has invites if:
   * - status is 'waiting_for_others' (actively waiting for signatures)
   * - OR status is 'signed' (but this is final state, can't cancel)
   * - OR signersCount > 0 AND status is not 'ready' (has been sent)
   *
   * Note: After cancelling invites, status should be 'ready' and signersCount = 0,
   * which means no active invites, so user can send again.
   */
  const hasInvites = (document: ContractDocument): boolean => {
    // If status is 'waiting_for_others', definitely has active invites
    if (document.status === 'waiting_for_others') {
      return true;
    }

    // If status is 'signed', document is complete (can't cancel)
    if (document.status === 'signed') {
      return false; // Can't cancel signed documents
    }

    // If status is 'ready', 'uploaded', or 'processing', no active invites
    if (['ready', 'uploaded', 'processing'].includes(document.status || '')) {
      return false;
    }

    // For other statuses, check if there are signers
    // But only if status indicates invites were sent
    if (document.signersCount && document.signersCount > 0) {
      // Check if any signers are still pending (not all signed)
      if (document.signers && document.signers.length > 0) {
        const hasPendingSigners = document.signers.some(
          (s) => s.status === 'pending' || s.status === 'sent' || !s.status || s.status === ''
        );
        return hasPendingSigners;
      }
      return true;
    }

    return false;
  };

  const handleCancelInvite = async (document: ContractDocument) => {
    try {
      const response = await contractDocumentApi.cancelInvite(document._id);
      if (response.success) {
        toast.success(response.message || t('contracts.cancel_invite_success', 'Invite cancelled successfully'));
        // Wait a bit to ensure DB is updated, then fetch fresh data
        await new Promise((resolve) => setTimeout(resolve, 500));
        await fetchDocuments();
      } else {
        toast.error(response.message || t('contracts.cancel_invite_error', 'Failed to cancel invite'));
      }
    } catch (error) {
      console.error('Failed to cancel invite:', error);
      toast.error(t('contracts.cancel_invite_error', 'Failed to cancel invite'));
    }
  };

  const handleDownloadDocument = async (contractDoc: ContractDocument) => {
    try {
      const blob = await contractDocumentApi.downloadDocument(contractDoc._id);

      // Check if blob is valid
      if (!blob || blob.size === 0) {
        toast.error(t('contracts.download_error', 'Failed to download document: Empty file'));
        return;
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = contractDoc.fileName || `${contractDoc.title}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t('contracts.download_success', 'Document downloaded successfully'));
    } catch (error) {
      console.error('Failed to download document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(t('contracts.download_error', `Failed to download document: ${errorMessage}`));
    }
  };

  const handleOpenSending = async (document: ContractDocument) => {
    // Use callback page to handle redirect and prevent nested dashboard
    const redirectUrl = `${globalThis.location.origin}/signnow/callback`;
    const response = await contractDocumentApi.createEmbeddedSending(document._id, {
      type: 'document', // 'document' allows editing fields before sending, 'invite' opens invite page directly
      redirectUrl,
      linkExpiration: 45, // Max 45 minutes (SignNow API limit for embedded-sending)
      redirectTarget: 'self' // Redirect in same iframe, but callback page will handle closing
    });

    if (response.success && response.data?.link) {
      setSelectedDocument(document);
      setEmbeddedMode('sending'); // Set mode to 'sending' for proper handling
      setIframeUrl(response.data.link);
      setEmbeddedViewerOpen(true);
    } else {
      toast.error('Failed to create sending link');
    }
  };

  const handleEmbeddedClose = async () => {
    // Prevent multiple simultaneous refresh calls
    if (isRefreshing) {
      return;
    }

    // If we were editing or sending a document, refresh its data from SignNow
    if ((embeddedMode === 'edit' || embeddedMode === 'sending') && selectedDocument) {
      setIsRefreshing(true);
      try {
        const response = await contractDocumentApi.refreshDocument(selectedDocument._id);
        if (response.success && response.data) {
          const data = response.data as {
            updated?: boolean;
            message?: string;
            status?: string;
            signers?: Array<{ email: string; status?: string }>;
          };
          if (data.updated) {
            toast.success(data.message || 'Document updated successfully');
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
    setIframeUrl(null);
    setSelectedDocument(null);

    // Refresh documents list after editing/viewing/sending
    await fetchDocuments();
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm(t('contracts.confirm_delete', 'Are you sure you want to delete this document?'))) {
      return;
    }

    const response = await contractDocumentApi.deleteDocument(documentId);
    if (response.success) {
      toast.success('Document deleted successfully');
      fetchDocuments();
    } else {
      toast.error('Failed to delete document');
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    const statusConfig: Record<
      DocumentStatus,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      uploaded: { label: t('contracts.status.uploaded', 'Uploaded'), variant: 'default' },
      processing: { label: t('contracts.status.processing', 'Processing'), variant: 'secondary' },
      ready: { label: t('contracts.status.ready', 'Ready'), variant: 'default' },
      waiting_for_others: {
        label: t('contracts.status.waiting_for_others', 'Waiting for Others'),
        variant: 'secondary'
      },
      signed: { label: t('contracts.status.signed', 'Signed'), variant: 'default' },
      archived: { label: t('contracts.status.archived', 'Archived'), variant: 'secondary' },
      deleted: { label: t('contracts.status.deleted', 'Deleted'), variant: 'destructive' }
    };

    const config = statusConfig[status] || statusConfig.uploaded;
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const getContractTypeBadge = (contractType?: string) => {
    if (!contractType) return null;

    const typeConfig: Record<string, { label: string; className: string }> = {
      membership: { label: 'Membership', className: 'bg-blue-500/10 text-blue-700 border-blue-200' },
      service_pt: { label: 'PT (1-on-1)', className: 'bg-green-500/10 text-green-700 border-green-200' },
      service_class: { label: 'Class (Group)', className: 'bg-purple-500/10 text-purple-700 border-purple-200' },
      custom: { label: 'Custom', className: 'bg-gray-500/10 text-gray-700 border-gray-200' }
    };

    const config = typeConfig[contractType] || typeConfig.custom;
    return (
      <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('contracts.title', 'Contract Documents')}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {t('contracts.subtitle', 'Manage and edit your contract documents')}
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="mr-2 h-4 w-4" />
          {t('contracts.upload_document', 'Upload Document')}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={typeFilter}
        onValueChange={(value) => {
          setTypeFilter(value as 'templates' | 'contracts');
          setPage(1);
        }}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="templates">{t('contracts.templates', 'Templates')}</TabsTrigger>
          <TabsTrigger value="contracts">{t('contracts.customer_contracts', 'Customer Contracts')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('contracts.search_placeholder', 'Search documents...')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as DocumentStatus | 'all');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('contracts.filter_by_status', 'Filter by status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('contracts.all_status', 'All Status')}</SelectItem>
            <SelectItem value="uploaded">{t('contracts.status.uploaded', 'Uploaded')}</SelectItem>
            <SelectItem value="processing">{t('contracts.status.processing', 'Processing')}</SelectItem>
            <SelectItem value="ready">{t('contracts.status.ready', 'Ready')}</SelectItem>
            <SelectItem value="waiting_for_others">
              {t('contracts.status.waiting_for_others', 'Waiting for Others')}
            </SelectItem>
            <SelectItem value="signed">{t('contracts.status.signed', 'Signed')}</SelectItem>
            <SelectItem value="archived">{t('contracts.status.archived', 'Archived')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents List */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      )}
      {!loading && documents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>{t('contracts.no_documents', 'No documents found')}</p>
        </div>
      )}
      {!loading && documents.length > 0 && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 divide-y">
            {documents.map((doc) => (
              <div key={doc._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <FileText className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                      {getStatusBadge(doc.status)}
                      {doc.isTemplate && doc.templateContractType && getContractTypeBadge(doc.templateContractType)}
                      {!doc.isTemplate && doc.contractType && getContractTypeBadge(doc.contractType)}
                      {doc.isTemplate && (
                        <Badge
                          variant="outline"
                          className="text-xs font-medium bg-purple-500/10 text-purple-700 border-purple-200"
                        >
                          Template
                        </Badge>
                      )}
                      {doc.signersCount !== undefined && doc.signersCount !== null && (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                          Signers: {doc.signersCount}
                        </Badge>
                      )}
                    </div>
                    {doc.description && <p className="text-sm text-gray-600 mb-2">{doc.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{doc.fileName}</span>
                      <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                      {doc.tags.length > 0 && (
                        <div className="flex gap-1">
                          {doc.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {t('contracts.created_at', 'Created')}: {new Date(doc.createdAt).toLocaleDateString()}
                      {doc.createdBy?.fullName && (
                        <>
                          {' '}
                          • {t('contracts.by', 'by')} {doc.createdBy.fullName}
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
                              {t('contracts.signers_emails', 'Signers Email')}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {doc.signers.map((signer, index) => {
                                const isSigned = signer.status === 'signed';
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
                      title={t('contracts.view_document', 'View Document')}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      {t('contracts.view', 'View')}
                    </Button>
                    {doc.status === 'signed' ? (
                      // For signed documents, only show View and Download
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc)}
                        disabled={false}
                        title={t('contracts.download_document', 'Download Document')}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        {t('contracts.download', 'Download')}
                      </Button>
                    ) : (
                      // For non-signed documents, show Edit, Send/Cancel Invite, and Delete
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditor(doc)}
                          disabled={doc.status === 'deleted'}
                          title={t('contracts.edit_document', 'Edit Document')}
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          {t('contracts.edit', 'Edit')}
                        </Button>
                        {hasInvites(doc) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelInvite(doc)}
                            disabled={doc.status === 'deleted'}
                            title={t('contracts.cancel_invite', 'Cancel Invite')}
                            className="bg-red-500 text-white hover:bg-red-600"
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            {t('contracts.cancel_invite', 'Cancel Invite')}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenSending(doc)}
                            disabled={doc.status === 'deleted'}
                            title={t('contracts.send_document', 'Send Document for Signature')}
                            className="bg-orange-500 text-white hover:bg-orange-600"
                          >
                            <Send className="mr-1 h-3 w-3" />
                            {t('contracts.send', 'Send')}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(doc._id)}
                          disabled={doc.status === 'deleted'}
                          className="text-red-600 hover:text-red-700"
                          title={t('contracts.delete', 'Delete')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {t('common.showing', 'Showing')} {(page - 1) * 10 + 1}-{Math.min(page * 10, total)}{' '}
                {t('common.of', 'of')} {total} {t('common.results', 'results')}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t('common.previous', 'Previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t('common.next', 'Next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Dialog */}
      <DocumentUploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} onUploaded={handleUploaded} />

      {/* Embedded Document Viewer/Editor/Sending */}
      {selectedDocument && (
        <EmbeddedDocumentViewer
          open={embeddedViewerOpen}
          onOpenChange={setEmbeddedViewerOpen}
          documentId={selectedDocument._id}
          documentTitle={selectedDocument.title}
          mode={embeddedMode}
          onClose={handleEmbeddedClose}
          onSave={handleEmbeddedClose}
          iframeUrl={iframeUrl}
        />
      )}
    </div>
  );
}
