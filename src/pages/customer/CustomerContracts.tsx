import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Loader2,
  AlertCircle,
  Eye,
  Download,
  Calendar,
  Tag,
  Mail,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { contractDocumentApi } from '@/services/api/contractDocumentApi';
import { useAuthState } from '@/hooks/useAuth';
import type { ContractDocument } from '@/types/api/ContractDocument';
import EmbeddedDocumentViewer from '@/components/contracts/EmbeddedDocumentViewer';
import { getStatusBadge, getContractTypeBadge } from '@/utils/contractDocumentUtils';
import { useContractDocumentActions } from '@/hooks/useContractDocumentActions';

const formatDate = (dateString?: string, locale: string = 'vi-VN') => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function CustomerContracts() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const { user } = useAuthState();
  const customerId = user?.customerId || user?.customer?._id;

  const [contracts, setContracts] = useState<ContractDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<ContractDocument | null>(null);
  const [embeddedViewerOpen, setEmbeddedViewerOpen] = useState(false);

  const fetchContracts = async () => {
    if (!customerId) {
      setError(t('customer.contracts.error.no_customer_id', { defaultValue: 'Customer ID not found' }));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await contractDocumentApi.getCustomerContracts(customerId);
      if (response.success && response.data) {
        setContracts(response.data);
      } else {
        setError(
          response.message || t('customer.contracts.error.fetch_failed', { defaultValue: 'Failed to fetch contracts' })
        );
      }
    } catch (err) {
      console.error('Error fetching contracts:', err);
      setError(t('customer.contracts.error.fetch_failed', { defaultValue: 'Failed to fetch contracts' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchContracts();
    }
  }, [customerId]);

  const handleOpenViewer = (document: ContractDocument) => {
    setSelectedDocument(document);
    setEmbeddedViewerOpen(true);
  };

  const { handleDownloadDocument, handleRefreshDocument } = useContractDocumentActions({
    onRefresh: fetchContracts
  });

  const handleEmbeddedClose = async () => {
    setSelectedDocument(null);
    setEmbeddedViewerOpen(false);
    await fetchContracts();
  };

  if (!customerId) {
    return (
      <div className="space-y-6 pb-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('customer.contracts.error.title', { defaultValue: 'Error' })}</AlertTitle>
          <AlertDescription>
            {t('customer.contracts.error.no_customer_id', {
              defaultValue: 'Customer ID not found. Please contact support.'
            })}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {t('customer.contracts.loading', { defaultValue: 'Loading contracts...' })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 pb-8">
        <Alert variant="destructive" className="rounded-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('customer.contracts.error.title', { defaultValue: 'Error' })}</AlertTitle>
          <AlertDescription>
            {error}
            <Button onClick={fetchContracts} variant="outline" size="sm" className="mt-3 rounded-full">
              {t('customer.contracts.error.retry', { defaultValue: 'Retry' })}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-orange-500">
            <FileText className="h-4 w-4" /> {t('customer.contracts.title', { defaultValue: 'Contracts' })}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {t('customer.contracts.heading', { defaultValue: 'My Contracts' })}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {t('customer.contracts.description', { defaultValue: 'View and manage your contracts.' })}
          </p>
        </div>
        <Button onClick={fetchContracts} variant="outline" size="sm" className="rounded-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('customer.contracts.refresh', { defaultValue: 'Refresh' })}
        </Button>
      </div>

      {/* Statistics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {t('customer.contracts.stats.total_contracts', { defaultValue: 'Total Contracts' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{contracts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('customer.contracts.stats.contracts_created', { defaultValue: 'Contracts created' })}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-green-200 bg-green-50/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {t('customer.contracts.stats.signed_contracts', { defaultValue: 'Signed Contracts' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {contracts.filter((c) => c.status === 'signed').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('customer.contracts.stats.completed', { defaultValue: 'Completed' })}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              {t('customer.contracts.stats.pending_contracts', { defaultValue: 'Pending Contracts' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {contracts.filter((c) => c.status !== 'signed' && c.status !== 'deleted').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('customer.contracts.stats.awaiting_signature', { defaultValue: 'Awaiting signature' })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground">
          {t('customer.contracts.list_title', { defaultValue: 'Contract List' })} ({contracts.length})
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('customer.contracts.list_description', { defaultValue: 'All your contracts are listed below' })}
        </p>
      </div>

      {contracts.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border bg-muted/30 shadow-none">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-semibold text-foreground">
                {t('customer.contracts.empty.title', { defaultValue: 'No contracts found' })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('customer.contracts.empty.description', { defaultValue: "You don't have any contracts yet." })}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contracts.map((contract) => (
            <Card
              key={contract._id}
              className="rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {getContractTypeBadge(t, contract.contractType)}
                        {getStatusBadge(contract.status, t, 'outline')}
                        {contract.isTemplate && (
                          <Badge
                            variant="outline"
                            className="text-xs font-medium bg-purple-500/10 text-purple-700 border-purple-200"
                          >
                            {t('contracts.template', { defaultValue: 'Template' })}
                          </Badge>
                        )}
                        {contract.signersCount !== undefined && contract.signersCount !== null && (
                          <Badge
                            variant="outline"
                            className="text-xs font-medium bg-gray-100 text-gray-700 border-gray-200"
                          >
                            {t('customer.contracts.details.signers', {
                              count: contract.signersCount,
                              defaultValue: `${contract.signersCount} signers`
                            })}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-foreground">{contract.title}</h4>
                      {contract.description && <p className="text-sm text-muted-foreground">{contract.description}</p>}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-start gap-2 text-sm">
                      <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t('customer.contracts.details.file', { defaultValue: 'File' })}
                        </p>
                        <p className="font-medium text-foreground">{contract.fileName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t('customer.contracts.details.created_date', { defaultValue: 'Created Date' })}
                        </p>
                        <p className="font-medium text-foreground">{formatDate(contract.createdAt, locale)}</p>
                      </div>
                    </div>

                    {contract.branchId && (
                      <div className="flex items-start gap-2 text-sm">
                        <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t('customer.contracts.details.branch', { defaultValue: 'Branch' })}
                          </p>
                          <p className="font-medium text-foreground">
                            {typeof contract.branchId === 'object' ? contract.branchId.branchName : '—'}
                          </p>
                        </div>
                      </div>
                    )}

                    {contract.tags && contract.tags.length > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t('customer.contracts.details.tags', { defaultValue: 'Tags' })}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {contract.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Signers Information */}
                  {contract.signers && contract.signers.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-start gap-2 text-sm">
                        <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-2">
                            {t('customer.contracts.details.signers_emails', { defaultValue: 'Signers Email' })}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {contract.signers.map((signer, index) => {
                              const isSigned = signer.status === 'signed';
                              return (
                                <div
                                  key={signer.email || index}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
                                    isSigned ? 'bg-green-50 border-green-200' : 'bg-muted/50 border-border'
                                  }`}
                                >
                                  {isSigned ? (
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                  )}
                                  <span
                                    className={`text-xs font-medium ${isSigned ? 'text-green-700' : 'text-foreground'}`}
                                  >
                                    {index + 1}. {signer.email}
                                  </span>
                                  {signer.name && (
                                    <span className="text-xs text-muted-foreground">({signer.name})</span>
                                  )}
                                  {isSigned && <span className="text-xs text-green-600 font-medium">✓</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenViewer(contract)}
                      disabled={contract.status === 'deleted'}
                      className="rounded-full"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      {t('contracts.view', { defaultValue: 'View' })}
                    </Button>
                    {contract.status === 'signed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(contract)}
                        disabled={false}
                        className="rounded-full"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        {t('contracts.download', { defaultValue: 'Download' })}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRefreshDocument(contract._id)}
                      disabled={contract.status === 'deleted'}
                      className="rounded-full"
                      title={t('customer.contracts.refresh_status', {
                        defaultValue: 'Refresh document status from SignNow'
                      })}
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      {t('customer.contracts.refresh', { defaultValue: 'Refresh' })}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Embedded Document Viewer */}
      {selectedDocument && (
        <EmbeddedDocumentViewer
          open={embeddedViewerOpen}
          onOpenChange={setEmbeddedViewerOpen}
          documentId={selectedDocument._id}
          documentTitle={selectedDocument.title}
          mode="view"
          onClose={handleEmbeddedClose}
          onSave={handleEmbeddedClose}
        />
      )}
    </div>
  );
}
