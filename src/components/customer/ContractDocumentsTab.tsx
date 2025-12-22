import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Loader2,
  AlertCircle,
  Eye,
  Edit,
  Send,
  Calendar,
  Tag,
  Plus,
  AlertTriangle,
  TrendingUp,
  Mail,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { contractDocumentApi } from '@/services/api/contractDocumentApi';
import { membershipApi } from '@/services/api/membershipApi';
import { serviceContractApi } from '@/services/api/serviceContractApi';
import { useBranch } from '@/contexts/BranchContext';
import { toast } from 'sonner';
import type { ContractDocument } from '@/types/api/ContractDocument';
import EmbeddedDocumentViewer from '@/components/contracts/EmbeddedDocumentViewer';
import { hasInvites, getStatusBadge, getContractTypeBadge } from '@/utils/contractDocumentUtils';
import { useContractDocumentActions } from '@/hooks/useContractDocumentActions';
import { useContractDocumentEvents, useVisibilityRefresh } from '@/hooks/useContractDocumentEvents';

interface ContractDocumentsTabProps {
  customerId: string;
}

interface ContractWithoutDocument {
  _id: string;
  type: 'membership' | 'service_pt' | 'service_class';
  name: string;
  startDate: string;
  endDate?: string;
  status: string;
  total: number;
}

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

export const ContractDocumentsTab: React.FC<ContractDocumentsTabProps> = ({ customerId }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const { currentBranch } = useBranch();
  const [contracts, setContracts] = useState<ContractDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<ContractDocument | null>(null);
  const [embeddedViewerOpen, setEmbeddedViewerOpen] = useState(false);
  const [embeddedMode, setEmbeddedMode] = useState<'edit' | 'view' | 'sending'>('view');
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  // Template selection states
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<ContractDocument[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [creatingContract, setCreatingContract] = useState(false);
  const [selectedContractForCreation, setSelectedContractForCreation] = useState<ContractWithoutDocument | null>(null);

  // Contracts without documents
  const [contractsWithoutDocuments, setContractsWithoutDocuments] = useState<ContractWithoutDocument[]>([]);
  const [loadingMissingContracts, setLoadingMissingContracts] = useState(false);

  const fetchContracts = async () => {
    setLoading(true);
    setError(null);

    const response = await contractDocumentApi.getCustomerContracts(customerId);
    if (response.success && response.data) {
      setContracts(response.data);
    } else {
      setError(response.message || t('customer_detail.contracts.error.fetch_failed'));
    }

    setLoading(false);
  };

  useEffect(() => {
    if (customerId) {
      fetchContracts();
      fetchContractsWithoutDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  // Use shared hooks for event listeners
  useContractDocumentEvents({
    onDocumentUpdate: () => {
      fetchContracts();
    }
  });

  useVisibilityRefresh(fetchContracts);

  const fetchContractsWithoutDocuments = async () => {
    setLoadingMissingContracts(true);

    try {
      // Fetch all contracts (membership + service)
      const [memberships, services, documentsRes] = await Promise.all([
        membershipApi.getCustomerMemberships(customerId),
        serviceContractApi.getCustomerServiceContracts(customerId),
        contractDocumentApi.getCustomerContracts(customerId)
      ]);

      const missingContracts: ContractWithoutDocument[] = [];

      // Check membership contracts
      if (Array.isArray(memberships)) {
        for (const membership of memberships) {
          const hasDocument = documentsRes.data?.some(
            (doc) => doc.contractId === membership._id && doc.contractType === 'membership'
          );
          if (!hasDocument && membership.status === 'ACTIVE') {
            // Handle populated membershipPlanId (can be string or populated object)
            let planName = t('contracts.type_membership');
            const planId = membership.membershipPlanId;
            if (planId && typeof planId === 'object' && planId !== null && 'name' in planId) {
              const planIdObj = planId as { name?: string };
              if (typeof planIdObj.name === 'string') {
                planName = planIdObj.name;
              }
            }
            missingContracts.push({
              _id: membership._id,
              type: 'membership',
              name: planName,
              startDate: membership.startDate,
              endDate: membership.endDate,
              status: membership.status,
              total: membership.total || 0
            });
          }
        }
      }

      // Check service contracts
      interface ServiceResponse {
        success?: boolean;
        data?: unknown;
      }
      interface ServiceItem {
        _id: string;
        packageType?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        total?: number;
        servicePackageId?: { name?: string } | string;
      }
      const serviceResponse = services as ServiceResponse;
      if (
        serviceResponse &&
        typeof serviceResponse === 'object' &&
        'success' in serviceResponse &&
        'data' in serviceResponse
      ) {
        const serviceData = serviceResponse.data;
        let serviceList: unknown[] = [];
        if (Array.isArray(serviceData)) {
          serviceList = serviceData;
        } else if (serviceData) {
          serviceList = [serviceData];
        }

        for (const service of serviceList) {
          const serviceItem = service as ServiceItem;
          const contractType = serviceItem.packageType === 'PT' ? 'service_pt' : 'service_class';

          const hasDocument = documentsRes.data?.some(
            (doc) => doc.contractId === serviceItem._id && doc.contractType === contractType
          );

          if (!hasDocument && serviceItem.status === 'ACTIVE') {
            const servicePackageName =
              typeof serviceItem.servicePackageId === 'object' && serviceItem.servicePackageId?.name
                ? serviceItem.servicePackageId.name
                : serviceItem.packageType === 'PT'
                  ? t('contracts.type_pt')
                  : t('contracts.type_class');
            missingContracts.push({
              _id: serviceItem._id,
              type: contractType,
              name: servicePackageName,
              startDate: serviceItem.startDate || '',
              endDate: serviceItem.endDate,
              status: serviceItem.status || '',
              total: serviceItem.total || 0
            });
          }
        }
      }

      setContractsWithoutDocuments(missingContracts);
    } catch (error) {
      console.error('Error fetching contracts without documents:', error);
    } finally {
      setLoadingMissingContracts(false);
    }
  };

  const handleOpenViewer = (document: ContractDocument) => {
    setSelectedDocument(document);
    setEmbeddedMode('view');
    setEmbeddedViewerOpen(true);
  };

  const handleOpenEditor = (document: ContractDocument) => {
    setSelectedDocument(document);
    setEmbeddedMode('edit');
    setEmbeddedViewerOpen(true);
  };

  // Use shared actions hook
  const {
    handleCancelInvite,
    handleDownloadDocument,
    handleOpenSending: handleOpenSendingAction,
    handleRefreshDocument
  } = useContractDocumentActions({
    onRefresh: fetchContracts
  });

  const handleOpenSending = async (document: ContractDocument) => {
    const link = await handleOpenSendingAction(document);
    if (link) {
      setSelectedDocument(document);
      setEmbeddedMode('sending');
      setIframeUrl(link);
      setEmbeddedViewerOpen(true);
    }
  };

  const handleEmbeddedClose = async () => {
    // If we were sending a document, refresh its data to get signers info
    if (embeddedMode === 'sending' && selectedDocument) {
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
      }
    }

    setIframeUrl(null);
    setSelectedDocument(null);
    setEmbeddedViewerOpen(false);

    // Fetch fresh data after closing
    await fetchContracts();
    fetchContractsWithoutDocuments();
  };

  const fetchTemplates = async (contractType?: string) => {
    setLoadingTemplates(true);

    const filters = currentBranch?._id ? { branchId: currentBranch._id } : undefined;
    const response = await contractDocumentApi.getTemplates(filters);
    if (response.success && response.data) {
      // Filter templates by contract type if specified
      let filteredTemplates = response.data;
      if (contractType) {
        filteredTemplates = response.data.filter((template) => {
          // Match template's templateContractType with the contract type we need
          return template.templateContractType === contractType;
        });
      }
      setTemplates(filteredTemplates);
    } else {
      toast.error(response.message || t('contracts.fetch_templates_error'));
    }

    setLoadingTemplates(false);
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    if (!selectedContractForCreation) {
      toast.error(t('customer_detail.contracts.error.create_failed'));
      return;
    }

    setCreatingContract(true);

    const response = await contractDocumentApi.createContractFromTemplate(customerId, {
      templateDocumentId: templateId,
      contractType: selectedContractForCreation.type,
      contractId: selectedContractForCreation._id
    });

    if (response.success && response.data) {
      toast.success(t('customer_detail.contracts.success.created'));
      setTemplateDialogOpen(false);
      setSelectedContractForCreation(null);
      fetchContracts();
      fetchContractsWithoutDocuments();
    } else {
      toast.error(response.message || t('customer_detail.contracts.error.create_error'));
    }

    setCreatingContract(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('customer_detail.contracts.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="rounded-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('customer_detail.contracts.error.title')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={fetchContracts} variant="outline" size="sm" className="mt-3 rounded-full">
          {t('customer_detail.contracts.error.retry')}
        </Button>
      </Alert>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getTypeBadgeLabel = (type: string) => {
    switch (type) {
      case 'membership':
        return t('contracts.type_membership');
      case 'service_pt':
        return t('contracts.type_pt');
      case 'service_class':
        return t('contracts.type_class');
      default:
        return type;
    }
  };

  const handleQuickCreateContract = (contractData: ContractWithoutDocument) => {
    setSelectedContractForCreation(contractData);
    setTemplateDialogOpen(true);

    // Convert contract type to template contract type for filtering
    let templateType: string | undefined;
    if (contractData.type === 'membership') {
      templateType = 'membership';
    } else if (contractData.type === 'service_pt') {
      templateType = 'service_pt';
    } else if (contractData.type === 'service_class') {
      templateType = 'service_class';
    }

    fetchTemplates(templateType);
    toast.info(t('customer_detail.contracts.searching_template', { name: contractData.name }));
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Statistics Section */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="rounded-xl md:rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
              <FileText className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              {t('customer_detail.contracts.stats.total_contracts')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-xl md:text-2xl font-bold text-foreground">{contracts.length}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              {t('customer_detail.contracts.stats.contracts_created')}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl md:rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm">
          <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-amber-600" />
              <span className="truncate">{t('customer_detail.contracts.stats.missing_contracts')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-xl md:text-2xl font-bold text-amber-600">
              {loadingMissingContracts ? '...' : contractsWithoutDocuments.length}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              {t('customer_detail.contracts.stats.services_need_contract')}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl md:rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
              {t('customer_detail.contracts.stats.completion')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-xl md:text-2xl font-bold text-green-600">
              {contracts.length > 0
                ? Math.round((contracts.length / (contracts.length + contractsWithoutDocuments.length)) * 100)
                : 0}
              %
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              {t('customer_detail.contracts.stats.completion_rate')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Missing Contracts Alert */}
      {!loadingMissingContracts && contractsWithoutDocuments.length > 0 && (
        <Alert className="rounded-xl md:rounded-2xl border-amber-200 bg-amber-50/50 p-3 md:p-4">
          <div className="flex gap-2 md:gap-3">
            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <AlertTitle className="text-amber-900 text-xs md:text-base font-semibold mb-1 md:mb-2">
                {t('customer_detail.contracts.alert.title')}
              </AlertTitle>
              <AlertDescription className="text-amber-800">
                <p className="mb-2 md:mb-3 text-[10px] md:text-sm leading-relaxed">
                  {t('customer_detail.contracts.alert.description', { count: contractsWithoutDocuments.length })}
                </p>
                <div className="space-y-2">
                  {contractsWithoutDocuments.map((contract) => (
                    <div
                      key={contract._id}
                      className="rounded-lg md:rounded-xl border border-amber-200 bg-white p-2.5 md:p-3 space-y-2"
                    >
                      <div className="flex items-start gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] md:text-xs bg-primary/10 text-primary border-primary/20 flex-shrink-0"
                        >
                          {getTypeBadgeLabel(contract.type)}
                        </Badge>
                        <span className="font-medium text-xs md:text-sm text-foreground leading-tight">
                          {contract.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[10px] md:text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="whitespace-nowrap">{formatDate(contract.startDate, locale)}</span>
                          </span>
                          <span className="font-semibold text-amber-700 whitespace-nowrap">
                            {formatCurrency(contract.total)}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickCreateContract(contract)}
                        disabled={creatingContract}
                        className="rounded-full border-amber-300 text-amber-700 hover:bg-amber-100 w-full text-xs h-8 font-medium"
                      >
                        <Plus className="h-3 w-3 mr-1.5" />
                        {t('customer_detail.contracts.create_contract')}
                      </Button>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      <div>
        <h3 className="text-base md:text-lg font-semibold text-foreground">
          {t('customer_detail.contracts.list_title')} ({contracts.length})
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground">{t('customer_detail.contracts.list_description')}</p>
      </div>

      {contracts.length === 0 ? (
        <Card className="rounded-xl md:rounded-2xl border border-dashed border-border bg-muted/30 shadow-none">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 md:py-16 text-center">
            <FileText className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm md:text-base text-foreground">
                {t('customer_detail.contracts.empty.title')}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                {t('customer_detail.contracts.empty.description')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:gap-4">
          {contracts.map((contract) => (
            <Card
              key={contract._id}
              className="rounded-xl md:rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="p-3 md:p-5">
                <div className="space-y-3 md:space-y-4">
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-2 md:gap-3">
                    <div className="flex-1 space-y-1.5 md:space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                        {getContractTypeBadge(t, contract.contractType)}
                        {getStatusBadge(contract.status, t, 'outline')}
                        {contract.isTemplate && (
                          <Badge
                            variant="outline"
                            className="text-[10px] md:text-xs font-medium bg-purple-500/10 text-purple-700 border-purple-200"
                          >
                            {t('contracts.template')}
                          </Badge>
                        )}
                        {contract.signersCount !== undefined && contract.signersCount !== null && (
                          <Badge
                            variant="outline"
                            className="text-[10px] md:text-xs font-medium bg-gray-100 text-gray-700 border-gray-200"
                          >
                            {t('customer_detail.contracts.details.signers', { count: contract.signersCount })}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm md:text-base text-foreground truncate">{contract.title}</h4>
                      {contract.description && (
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{contract.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid gap-2 md:gap-3 grid-cols-1 sm:grid-cols-2">
                    <div className="flex items-start gap-2 text-xs md:text-sm">
                      <FileText className="mt-0.5 h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] md:text-xs text-muted-foreground">
                          {t('customer_detail.contracts.details.file')}
                        </p>
                        <p className="font-medium text-foreground truncate">{contract.fileName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-xs md:text-sm">
                      <Calendar className="mt-0.5 h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] md:text-xs text-muted-foreground">
                          {t('customer_detail.contracts.details.created_date')}
                        </p>
                        <p className="font-medium text-foreground">{formatDate(contract.createdAt, locale)}</p>
                      </div>
                    </div>

                    {contract.branchId && (
                      <div className="flex items-start gap-2 text-xs md:text-sm">
                        <Tag className="mt-0.5 h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] md:text-xs text-muted-foreground">
                            {t('customer_detail.contracts.details.branch')}
                          </p>
                          <p className="font-medium text-foreground truncate">
                            {typeof contract.branchId === 'object' ? contract.branchId.branchName : '—'}
                          </p>
                        </div>
                      </div>
                    )}

                    {contract.tags && contract.tags.length > 0 && (
                      <div className="flex items-start gap-2 text-xs md:text-sm">
                        <Tag className="mt-0.5 h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] md:text-xs text-muted-foreground">
                            {t('customer_detail.contracts.details.tags')}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {contract.tags.map((tag) => {
                              const translationKey = `admin.contracts.tags.${tag}`;
                              const translated = t(translationKey as never, tag);
                              return (
                                <Badge key={tag} variant="outline" className="text-[10px] md:text-xs">
                                  {translated}
                                </Badge>
                              );
                            })}
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
                            {t('customer_detail.contracts.details.signers_emails', 'Signers Email')}
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
                      className="rounded-full h-7 md:h-8 text-xs"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      <span className="hidden sm:inline">{t('contracts.view')}</span>
                      <span className="sm:hidden">{t('contracts.view', 'View')}</span>
                    </Button>
                    {contract.status === 'signed' ? (
                      // For signed documents, only show View and Download
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(contract)}
                        disabled={false}
                        className="rounded-full h-7 md:h-8 text-xs"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        <span className="hidden sm:inline">{t('contracts.download', 'Download')}</span>
                        <span className="sm:hidden">DL</span>
                      </Button>
                    ) : (
                      // For non-signed documents, show Edit, Send/Cancel Invite, and Refresh
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditor(contract)}
                          disabled={contract.status === 'deleted'}
                          className="rounded-full h-7 md:h-8 text-xs"
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          <span className="hidden sm:inline">{t('contracts.edit')}</span>
                          <span className="sm:hidden">Edit</span>
                        </Button>
                        {hasInvites(contract) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelInvite(contract)}
                            disabled={contract.status === 'deleted'}
                            className="rounded-full bg-red-500 text-white hover:bg-red-600 h-7 md:h-8 text-xs"
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            <span className="hidden sm:inline">{t('contracts.cancel_invite', 'Cancel')}</span>
                            <span className="sm:hidden">Cancel</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenSending(contract)}
                            disabled={contract.status === 'deleted'}
                            className="rounded-full bg-orange-500 text-white hover:bg-orange-600 h-7 md:h-8 text-xs"
                          >
                            <Send className="mr-1 h-3 w-3" />
                            <span className="hidden sm:inline">{t('contracts.send')}</span>
                            <span className="sm:hidden">Send</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefreshDocument(contract._id)}
                          disabled={contract.status === 'deleted'}
                          className="rounded-full h-7 md:h-8 text-xs"
                          title={t('customer_detail.contracts.refresh_status')}
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                          <span className="hidden sm:inline">{t('customer_detail.contracts.refresh')}</span>
                          <span className="sm:hidden">↻</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

      {/* Template Selection Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('customer_detail.contracts.template_dialog.title')}</DialogTitle>
            <DialogDescription>
              {selectedContractForCreation ? (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                    {getTypeBadgeLabel(selectedContractForCreation.type)}
                  </Badge>
                  <span className="text-sm">
                    {t('customer_detail.contracts.template_dialog.create_for', {
                      name: selectedContractForCreation.name
                    })}
                  </span>
                </div>
              ) : (
                t('customer_detail.contracts.template_dialog.description')
              )}
            </DialogDescription>
          </DialogHeader>

          {loadingTemplates ? (
            <div className="flex min-h-[20vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {t('customer_detail.contracts.template_dialog.loading')}
                </p>
              </div>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex min-h-[20vh] items-center justify-center">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-3 font-semibold text-foreground">
                  {t('customer_detail.contracts.template_dialog.no_templates')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedContractForCreation
                    ? t('customer_detail.contracts.template_dialog.no_template_for_type', {
                        type: getTypeBadgeLabel(selectedContractForCreation.type)
                      })
                    : t('customer_detail.contracts.template_dialog.create_template_first')}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 py-4">
              {templates.map((template) => (
                <Card
                  key={template._id}
                  className="cursor-pointer rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary"
                  onClick={() => !creatingContract && handleCreateFromTemplate(template._id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {getContractTypeBadge(t, template.templateContractType || template.contractType)}
                          {template.isTemplate && (
                            <Badge
                              variant="outline"
                              className="text-xs font-medium bg-purple-500/10 text-purple-700 border-purple-200"
                            >
                              {t('contracts.template')}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-foreground">{template.title}</h4>
                        {template.description && (
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>{template.fileName}</span>
                          </div>
                          {template.branchId && (
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              <span>{typeof template.branchId === 'object' ? template.branchId.branchName : '—'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {creatingContract && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
