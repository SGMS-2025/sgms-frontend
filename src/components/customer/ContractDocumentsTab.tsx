import React, { useState, useEffect } from 'react';
import { FileText, Loader2, AlertCircle, Eye, Edit, Send, Calendar, Tag, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { contractDocumentApi } from '@/services/api/contractDocumentApi';
import { toast } from 'sonner';
import type { ContractDocument } from '@/types/api/ContractDocument';
import EmbeddedDocumentViewer from '@/components/contracts/EmbeddedDocumentViewer';

interface ContractDocumentsTabProps {
  customerId: string;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    uploaded: { label: 'Đã tải lên', className: 'bg-blue-500/10 text-blue-700 border-blue-200' },
    processing: { label: 'Đang xử lý', className: 'bg-amber-500/10 text-amber-700 border-amber-200' },
    ready: { label: 'Sẵn sàng', className: 'bg-green-500/10 text-green-700 border-green-200' },
    signed: { label: 'Đã ký', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
    archived: { label: 'Đã lưu trữ', className: 'bg-gray-500/10 text-gray-700 border-gray-200' },
    deleted: { label: 'Đã xóa', className: 'bg-red-500/10 text-red-700 border-red-200' }
  };

  const config = statusConfig[status] || statusConfig.uploaded;
  return (
    <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
};

const getContractTypeBadge = (type?: string) => {
  if (!type) return null;
  const typeConfig: Record<string, { label: string; className: string }> = {
    membership: { label: 'Gói hội viên', className: 'bg-primary/10 text-primary border-primary/20' },
    service_class: { label: 'Gói lớp học', className: 'bg-blue-500/10 text-blue-700 border-blue-200' },
    service_pt: { label: 'Gói PT', className: 'bg-purple-500/10 text-purple-700 border-purple-200' },
    custom: { label: 'Tùy chỉnh', className: 'bg-gray-500/10 text-gray-700 border-gray-200' }
  };

  const config = typeConfig[type] || typeConfig.custom;
  return (
    <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
};

export const ContractDocumentsTab: React.FC<ContractDocumentsTabProps> = ({ customerId }) => {
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

  useEffect(() => {
    if (customerId) {
      fetchContracts();
    }
  }, [customerId]);

  const fetchContracts = async () => {
    setLoading(true);
    setError(null);

    const response = await contractDocumentApi.getCustomerContracts(customerId);
    if (response.success && response.data) {
      setContracts(response.data);
    } else {
      setError(response.message || 'Không thể tải danh sách hợp đồng');
    }

    setLoading(false);
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

  const handleOpenSending = async (document: ContractDocument) => {
    const redirectUrl = `${window.location.origin}/manage/customers/${customerId}/detail`;
    const response = await contractDocumentApi.createEmbeddedSending(document._id, {
      type: 'document',
      redirectUrl,
      linkExpiration: 45,
      redirectTarget: 'self'
    });

    if (response.success && response.data?.link) {
      setSelectedDocument(document);
      setEmbeddedMode('view');
      setIframeUrl(response.data.link);
      setEmbeddedViewerOpen(true);
    } else {
      toast.error(response.message || 'Không thể tạo liên kết gửi hợp đồng');
    }
  };

  const handleEmbeddedClose = () => {
    setIframeUrl(null);
    setSelectedDocument(null);
    fetchContracts();
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true);

    const response = await contractDocumentApi.getTemplates();
    if (response.success && response.data) {
      setTemplates(response.data);
    } else {
      toast.error(response.message || 'Không thể tải danh sách template');
    }

    setLoadingTemplates(false);
  };

  const handleOpenTemplateDialog = () => {
    setTemplateDialogOpen(true);
    fetchTemplates();
  };

  const handleCreateFromTemplate = async (templateId: string, contractType?: string) => {
    setCreatingContract(true);

    const response = await contractDocumentApi.createContractFromTemplate(customerId, {
      templateDocumentId: templateId,
      contractType: contractType as 'membership' | 'service_class' | 'service_pt' | 'custom' | undefined
    });

    if (response.success && response.data) {
      toast.success('Tạo hợp đồng từ template thành công');
      setTemplateDialogOpen(false);
      fetchContracts();
    } else {
      toast.error(response.message || 'Không thể tạo hợp đồng từ template');
    }

    setCreatingContract(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải danh sách hợp đồng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="rounded-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Không thể tải danh sách hợp đồng</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={fetchContracts} variant="outline" size="sm" className="mt-3 rounded-full">
          Thử lại
        </Button>
      </Alert>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card className="rounded-2xl border border-dashed border-border bg-muted/30 shadow-none">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-semibold text-foreground">Chưa có hợp đồng</p>
            <p className="text-sm text-muted-foreground">Các hợp đồng của khách hàng sẽ hiển thị ở đây</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Danh sách hợp đồng ({contracts.length})</h3>
          <p className="text-sm text-muted-foreground">Quản lý và xem các hợp đồng của khách hàng</p>
        </div>
        <Button onClick={handleOpenTemplateDialog} className="rounded-full">
          <Plus className="mr-2 h-4 w-4" />
          Tạo hợp đồng mới
        </Button>
      </div>

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
                      {getContractTypeBadge(contract.contractType)}
                      {getStatusBadge(contract.status)}
                      {contract.isTemplate && (
                        <Badge
                          variant="outline"
                          className="text-xs font-medium bg-purple-500/10 text-purple-700 border-purple-200"
                        >
                          Mẫu
                        </Badge>
                      )}
                      {contract.signersCount !== undefined && contract.signersCount !== null && (
                        <Badge
                          variant="outline"
                          className="text-xs font-medium bg-gray-100 text-gray-700 border-gray-200"
                        >
                          Signers: {contract.signersCount}
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
                      <p className="text-xs text-muted-foreground">File</p>
                      <p className="font-medium text-foreground">{contract.fileName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ngày tạo</p>
                      <p className="font-medium text-foreground">{formatDate(contract.createdAt)}</p>
                    </div>
                  </div>

                  {contract.branchId && (
                    <div className="flex items-start gap-2 text-sm">
                      <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Chi nhánh</p>
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
                        <p className="text-xs text-muted-foreground">Tags</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {contract.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

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
                    Xem
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditor(contract)}
                    disabled={contract.status === 'deleted'}
                    className="rounded-full"
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Chỉnh sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenSending(contract)}
                    disabled={contract.status === 'deleted'}
                    className="rounded-full bg-orange-500 text-white hover:bg-orange-600"
                  >
                    <Send className="mr-1 h-3 w-3" />
                    Gửi ký
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
            <DialogTitle>Chọn template hợp đồng</DialogTitle>
            <DialogDescription>Chọn một template có sẵn để tạo hợp đồng mới cho khách hàng</DialogDescription>
          </DialogHeader>

          {loadingTemplates ? (
            <div className="flex min-h-[20vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Đang tải danh sách template...</p>
              </div>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex min-h-[20vh] items-center justify-center">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-3 font-semibold text-foreground">Chưa có template nào</p>
                <p className="text-sm text-muted-foreground">Vui lòng tạo template trước khi tạo hợp đồng</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 py-4">
              {templates.map((template) => (
                <Card
                  key={template._id}
                  className="cursor-pointer rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary"
                  onClick={() => !creatingContract && handleCreateFromTemplate(template._id, template.contractType)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {getContractTypeBadge(template.contractType)}
                          {template.isTemplate && (
                            <Badge
                              variant="outline"
                              className="text-xs font-medium bg-purple-500/10 text-purple-700 border-purple-200"
                            >
                              Mẫu
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
