import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { contractDocumentApi } from '@/services/api/contractDocumentApi';
import type { ContractDocument } from '@/types/api/ContractDocument';
import { Loader2 } from 'lucide-react';

interface TemplateSelectionStepProps {
  contractId: string | null;
  contractType: 'service_pt' | 'service_class';
  branchId: string | undefined;
  customerId: string;
  onTemplateSelected: (contractDocument: ContractDocument) => void;
  onSkip: () => void;
}

export const TemplateSelectionStep: React.FC<TemplateSelectionStepProps> = ({
  contractId,
  contractType,
  branchId,
  customerId,
  onTemplateSelected,
  onSkip
}) => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<ContractDocument[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (branchId && contractId) {
      fetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, contractType, contractId]);

  const fetchTemplates = async () => {
    if (!branchId) return;

    setLoading(true);
    try {
      const response = await contractDocumentApi.listDocuments({
        type: 'templates',
        branchId,
        status: 'all',
        page: 1,
        limit: 100
      });

      if (response.success && response.data) {
        const documents = Array.isArray(response.data) ? response.data : response.data.documents || [];
        const filteredTemplates = documents.filter(
          (doc: ContractDocument) =>
            doc.isTemplate && doc.templateContractType === contractType && doc.status !== 'deleted'
        );
        setTemplates(filteredTemplates);

        // Auto-select first template if available
        if (filteredTemplates.length > 0) {
          setSelectedTemplateId(filteredTemplates[0]._id);
        }
      } else {
        toast.error(t('contracts.fetch_templates_error', 'Failed to fetch templates'));
      }
    } catch {
      toast.error(t('contracts.fetch_templates_error', 'Failed to fetch templates'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async () => {
    if (!selectedTemplateId || !contractId || !branchId) {
      toast.error(t('contracts.select_template_first', 'Vui lòng chọn mẫu hợp đồng'));
      return;
    }

    setCreating(true);
    try {
      const response = await contractDocumentApi.createContractFromTemplate(customerId, {
        templateDocumentId: selectedTemplateId,
        contractId,
        branchId,
        contractType
      });

      if (response.success && response.data) {
        toast.success(t('contracts.contract_created', 'Đã tạo hợp đồng thành công'));
        onTemplateSelected(response.data);
      } else {
        toast.error(response.message || t('contracts.create_contract_error', 'Không thể tạo hợp đồng'));
      }
    } catch {
      toast.error(t('contracts.create_contract_error', 'Không thể tạo hợp đồng'));
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-3xl border border-border bg-card shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">
            {t('contracts.loading_templates', 'Đang tải danh sách mẫu hợp đồng...')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {t('contracts.select_template', 'Chọn mẫu hợp đồng')}
        </CardTitle>
        <CardDescription>
          {t('contracts.select_template_description', 'Chọn mẫu hợp đồng để tạo hợp đồng cho khách hàng (Tùy chọn)')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {templates.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              {t('contracts.no_templates', 'Không có mẫu hợp đồng nào')}
            </p>
            <Button variant="outline" onClick={onSkip}>
              {t('contracts.skip', 'Bỏ qua')}
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] pr-4">
              <RadioGroup value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div
                      key={template._id}
                      className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedTemplateId === template._id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedTemplateId(template._id)}
                    >
                      <RadioGroupItem value={template._id} id={template._id} className="mt-1" />
                      <Label htmlFor={template._id} className="flex-1 cursor-pointer space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{template.title}</p>
                          {template.isTemplate && (
                            <Badge variant="secondary" className="ml-2">
                              {t('contracts.template', 'Mẫu')}
                            </Badge>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </ScrollArea>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={onSkip}>
                {t('contracts.skip', 'Bỏ qua')}
              </Button>
              <Button onClick={handleCreateContract} disabled={creating || !selectedTemplateId}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('contracts.creating', 'Đang tạo...')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t('contracts.create_contract', 'Tạo hợp đồng')}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
