import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, FileText, Edit, Trash2, Eye, Loader2, Send } from 'lucide-react';
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

  const handleOpenSending = async (document: ContractDocument) => {
    const redirectUrl = `${window.location.origin}/manage/contracts`;
    const response = await contractDocumentApi.createEmbeddedSending(document._id, {
      type: 'document', // 'document' allows editing fields before sending, 'invite' opens invite page directly
      redirectUrl,
      linkExpiration: 45, // Max 45 minutes (SignNow API limit for embedded-sending)
      redirectTarget: 'self'
    });

    if (response.success && response.data?.link) {
      setSelectedDocument(document);
      setEmbeddedMode('view'); // Reuse viewer component
      setIframeUrl(response.data.link);
      setEmbeddedViewerOpen(true);
    } else {
      toast.error('Failed to create sending link');
    }
  };

  const handleEmbeddedClose = () => {
    // Clear iframe URL when closing
    setIframeUrl(null);
    setSelectedDocument(null);
    // Refresh documents list after editing/viewing/sending
    fetchDocuments();
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
            <SelectItem value="signed">{t('contracts.status.signed', 'Signed')}</SelectItem>
            <SelectItem value="archived">{t('contracts.status.archived', 'Archived')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>{t('contracts.no_documents', 'No documents found')}</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 divide-y">
            {documents.map((doc) => (
              <div key={doc._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                      {getStatusBadge(doc.status)}
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
                          {doc.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
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
