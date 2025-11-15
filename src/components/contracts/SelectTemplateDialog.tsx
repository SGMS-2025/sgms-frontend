import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { contractDocumentApi } from '@/services/api/contractDocumentApi';
import type { ContractDocument } from '@/types/api/ContractDocument';

interface SelectTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractType: 'membership' | 'service_pt' | 'service_class';
  branchId: string;
  customerId: string;
  contractId: string;
  onTemplateSelected: (contractDocument: ContractDocument) => void;
  onSkip: () => void;
}

export default function SelectTemplateDialog({
  open,
  onOpenChange,
  contractType,
  branchId,
  customerId,
  contractId,
  onTemplateSelected,
  onSkip
}: SelectTemplateDialogProps) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<ContractDocument[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open && branchId) {
      fetchTemplates();
    }
  }, [open, branchId, contractType]);

  const fetchTemplates = async () => {
    setLoading(true);
    const response = await contractDocumentApi.listDocuments({
      type: 'templates',
      branchId,
      status: 'all',
      page: 1,
      limit: 100
    });

    if (response.success && response.data) {
      // Filter templates by contractType
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

    setLoading(false);
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplateId) {
      toast.error(t('contracts.select_template_required', 'Please select a template'));
      return;
    }

    setCreating(true);
    const response = await contractDocumentApi.createContractFromTemplate(customerId, {
      templateDocumentId: selectedTemplateId,
      contractType,
      contractId,
      branchId
    });

    if (response.success && response.data) {
      toast.success(t('contracts.contract_created_success', 'Contract document created successfully'));
      onTemplateSelected(response.data);
      onOpenChange(false);
    } else {
      toast.error(t('contracts.contract_create_failed', 'Failed to create contract document'));
    }

    setCreating(false);
  };

  const handleSkip = () => {
    onOpenChange(false);
    onSkip();
  };

  const getContractTypeLabel = () => {
    switch (contractType) {
      case 'service_pt':
        return t('contracts.type_pt', 'PT Contract (1-on-1)');
      case 'service_class':
        return t('contracts.type_class', 'Class Contract (Group)');
      case 'membership':
        return t('contracts.type_membership', 'Membership Contract');
      default:
        return t('contracts.type_custom', 'Custom Contract');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle>{t('contracts.select_template', 'Select Contract Template')}</DialogTitle>
                <DialogDescription className="mt-1">
                  {t('contracts.select_template_description', 'Choose a template to create the contract document')}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contract Type Info */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{getContractTypeLabel()}</Badge>
            </div>
          </div>

          {/* Templates List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">{t('contracts.loading_templates', 'Loading templates...')}</div>
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-900">
                {t('contracts.no_templates_found', 'No templates found')}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t(
                  'contracts.no_templates_description',
                  'There are no contract templates available for this type. Please upload a template first.'
                )}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] rounded-lg border border-gray-200">
              <RadioGroup value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <div className="space-y-2 p-4">
                  {templates.map((template) => (
                    <div
                      key={template._id}
                      className={`relative flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                        selectedTemplateId === template._id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <RadioGroupItem value={template._id} id={template._id} className="mt-1" />
                      <Label htmlFor={template._id} className="flex-1 cursor-pointer space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{template.title}</span>
                        </div>
                        {template.description && <p className="text-xs text-gray-600">{template.description}</p>}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{template.fileName}</span>
                          {template.branchId && (
                            <Badge variant="outline" className="text-xs">
                              {t('contracts.branch_specific', 'Branch Specific')}
                            </Badge>
                          )}
                        </div>
                      </Label>
                      {selectedTemplateId === template._id && <ChevronRight className="h-5 w-5 text-primary" />}
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="sm:gap-3">
          <Button type="button" variant="outline" onClick={handleSkip} disabled={creating}>
            {t('contracts.skip', 'Skip for Now')}
          </Button>
          <Button
            type="button"
            onClick={handleCreateFromTemplate}
            disabled={!selectedTemplateId || creating || templates.length === 0}
          >
            {creating ? t('contracts.creating', 'Creating...') : t('contracts.create_from_template', 'Create Contract')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
