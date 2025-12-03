import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { contractDocumentApi } from '@/services/api/contractDocumentApi';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import type { ContractDocument } from '@/types/api/ContractDocument';

interface SelectSubscriptionTemplateStepProps {
  subscriptionId: string;
  onTemplateSelected: (contractDocument: ContractDocument) => void;
  onSkip: () => void;
}

export const SelectSubscriptionTemplateStep: React.FC<SelectSubscriptionTemplateStepProps> = ({
  subscriptionId,
  onTemplateSelected,
  onSkip
}) => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<ContractDocument[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await contractDocumentApi.getTemplates();
        if (result.success && result.data) {
          // Filter for subscription templates (custom type with subscription tag, global template)
          const filtered = result.data.filter(
            (doc) =>
              doc.isTemplate &&
              doc.templateContractType === 'custom' &&
              doc.tags?.some((tag) => tag.toLowerCase() === 'subscription') &&
              (!doc.branchId || doc.branchId === null) &&
              doc.status !== 'deleted'
          );

          setTemplates(filtered);
          // Auto-select first template if available
          if (filtered.length > 0) {
            setSelectedTemplateId(filtered[0]._id);
          }
        } else {
          setError(result.message || t('subscription.contract.step.error.load_failed'));
          setTemplates([]);
        }
      } catch (err: unknown) {
        const errorMessage =
          (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
          (err as { message?: string })?.message ||
          t('subscription.contract.step.error.load_failed');
        setError(errorMessage);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [t]);

  const handleCreateContract = async () => {
    if (!selectedTemplateId) {
      toast.error(t('subscription.contract.step.error.select_template'));
      return;
    }

    setCreating(true);
    try {
      const result = await subscriptionApi.createSubscriptionContractFromTemplate(subscriptionId, selectedTemplateId);

      if (result.success && result.data) {
        toast.success(t('subscription.contract.step.success.create'));
        onTemplateSelected(result.data as ContractDocument);
      } else {
        toast.error(result.message || t('subscription.contract.step.error.create_failed'));
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        t('subscription.contract.step.error.create_failed');
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-4" />
        <p className="text-sm text-gray-600">{t('subscription.contract.step.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-8 py-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{t('subscription.contract.step.title')}</h3>
        <p className="text-sm text-gray-600">{t('subscription.contract.step.description')}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {templates.length === 0 ? (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>{t('subscription.contract.step.no_templates')}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          <Label className="text-sm font-semibold text-gray-900">
            {t('subscription.contract.step.select_template')}
          </Label>
          <ScrollArea className="h-[400px] rounded-lg border border-gray-200 bg-white p-4">
            <RadioGroup value={selectedTemplateId || ''} onValueChange={setSelectedTemplateId}>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template._id}
                    className={`relative flex items-start gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                      selectedTemplateId === template._id
                        ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-white shadow-md'
                        : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/40 cursor-pointer'
                    }`}
                    onClick={() => setSelectedTemplateId(template._id)}
                  >
                    <RadioGroupItem value={template._id} id={template._id} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <label
                            htmlFor={template._id}
                            className={`text-sm font-semibold ${
                              selectedTemplateId === template._id ? 'text-orange-900' : 'text-gray-900'
                            } cursor-pointer`}
                          >
                            {template.title}
                          </label>
                          {template.description && (
                            <p
                              className={`mt-1 text-xs ${
                                selectedTemplateId === template._id ? 'text-orange-700' : 'text-gray-600'
                              }`}
                            >
                              {template.description}
                            </p>
                          )}
                        </div>
                        {selectedTemplateId === template._id && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white flex-shrink-0">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      {template.tags && template.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {template.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </ScrollArea>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onSkip} className="h-11" disabled={creating}>
          <X className="h-4 w-4 mr-2" />
          {t('subscription.contract.step.button.skip')}
        </Button>
        <Button
          onClick={handleCreateContract}
          disabled={creating || !selectedTemplateId}
          className="h-11 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/40"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('subscription.contract.step.button.creating', 'Creating...')}
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              {t('subscription.contract.step.button.create', 'Create Contract')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
