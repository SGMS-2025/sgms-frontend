import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Send, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { contractDocumentApi } from '@/services/api/contractDocumentApi';
import type { ContractDocument } from '@/types/api/ContractDocument';
import EmbeddedDocumentViewer from '@/components/contracts/EmbeddedDocumentViewer';

interface SendContractStepProps {
  contractDocument: ContractDocument | null;
  onSendNow: () => void;
  onSendLater: () => void;
}

export const SendContractStep: React.FC<SendContractStepProps> = ({ contractDocument, onSendNow, onSendLater }) => {
  const { t } = useTranslation();
  const [showSendingViewer, setShowSendingViewer] = useState(false);
  const [sendingIframeUrl, setSendingIframeUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSendNow = async () => {
    if (!contractDocument) {
      toast.error(t('contracts.no_document', 'Không có hợp đồng để gửi'));
      return;
    }

    setIsSending(true);
    try {
      const response = await contractDocumentApi.createEmbeddedSending(contractDocument._id, {
        type: 'invite',
        redirectUrl: `${globalThis.location.origin}/manage/contracts`
      });

      if (response.success && response.data?.link) {
        setSendingIframeUrl(response.data.link);
        setShowSendingViewer(true);
      } else {
        toast.error(t('contracts.cannot_create_sending_link', 'Không thể tạo link gửi hợp đồng'));
      }
    } catch {
      toast.error(t('contracts.send_error', 'Có lỗi khi gửi hợp đồng'));
    } finally {
      setIsSending(false);
    }
  };

  const handleSendingViewerClose = () => {
    setShowSendingViewer(false);
    setSendingIframeUrl(null);
    toast.success(t('contracts.contract_sent', 'Hợp đồng đã được gửi đi!'));
    onSendNow();
  };

  if (!contractDocument) {
    return (
      <Card className="rounded-3xl border border-border bg-card shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            {t('contracts.no_document_created', 'Chưa có hợp đồng được tạo')}
          </p>
          <Button variant="outline" onClick={onSendLater}>
            {t('contracts.continue', 'Tiếp tục')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-3xl border border-border bg-card shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle>{t('contracts.document_created', 'Hợp đồng đã được tạo')}</CardTitle>
              <CardDescription className="mt-1">
                {t('contracts.document_ready_to_send', 'Hợp đồng đã sẵn sàng để gửi cho khách hàng')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{contractDocument.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {t('contracts.type', 'Loại')}:{' '}
                  <span className="font-medium">
                    {contractDocument.contractType === 'service_pt' && t('contracts.type_pt', 'Hợp đồng PT (1-1)')}
                    {contractDocument.contractType === 'service_class' &&
                      t('contracts.type_class', 'Hợp đồng Lớp học (Nhóm)')}
                    {contractDocument.contractType === 'membership' &&
                      t('contracts.type_membership', 'Hợp đồng Thành viên')}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onSendLater} className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              {t('contracts.send_later', 'Gửi sau')}
            </Button>
            <Button onClick={handleSendNow} disabled={isSending} className="flex-1">
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('contracts.sending', 'Đang gửi...')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('contracts.send_now', 'Gửi ngay')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Embedded Sending Viewer */}
      {showSendingViewer && sendingIframeUrl && (
        <EmbeddedDocumentViewer
          open={showSendingViewer}
          onOpenChange={setShowSendingViewer}
          documentTitle={contractDocument.title || 'Contract Document'}
          mode="sending"
          iframeUrl={sendingIframeUrl}
          onClose={handleSendingViewerClose}
        />
      )}
    </>
  );
};
