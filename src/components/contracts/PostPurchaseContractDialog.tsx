import { useTranslation } from 'react-i18next';
import { FileText, Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { ContractDocument } from '@/types/api/ContractDocument';

interface PostPurchaseContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractDocument: ContractDocument | null;
  onSendNow: () => void;
  onSendLater: () => void;
}

export default function PostPurchaseContractDialog({
  open,
  onOpenChange,
  contractDocument,
  onSendNow,
  onSendLater
}: PostPurchaseContractDialogProps) {
  const { t } = useTranslation();

  if (!contractDocument) return null;

  const handleSendNow = () => {
    onOpenChange(false);
    onSendNow();
  };

  const handleSendLater = () => {
    onOpenChange(false);
    onSendLater();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle>{t('contracts.document_created', 'Contract Document Created')}</DialogTitle>
              <DialogDescription className="mt-1">
                {t('contracts.document_ready_to_send', 'The contract document is ready to be sent to the customer')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{contractDocument.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {t('contracts.type', 'Type')}:{' '}
                  <span className="font-medium">
                    {contractDocument.contractType === 'service_pt' && t('contracts.type_pt', 'PT Contract (1-on-1)')}
                    {contractDocument.contractType === 'service_class' &&
                      t('contracts.type_class', 'Class Contract (Group)')}
                    {contractDocument.contractType === 'membership' &&
                      t('contracts.type_membership', 'Membership Contract')}
                    {contractDocument.contractType === 'custom' && t('contracts.type_custom', 'Custom Contract')}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            {t(
              'contracts.send_now_or_later',
              'Would you like to send this contract to the customer for signing now, or send it later?'
            )}
          </div>
        </div>

        <DialogFooter className="sm:gap-3">
          <Button type="button" variant="outline" onClick={handleSendLater} className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('contracts.send_later', 'Send Later')}
          </Button>
          <Button type="button" onClick={handleSendNow} className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            {t('contracts.send_now', 'Send Now')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
