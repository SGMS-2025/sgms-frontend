import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmbeddedDocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId?: string;
  documentTitle: string;
  mode: 'edit' | 'view' | 'sending';
  onClose?: () => void;
  onSave?: () => void;
  iframeUrl?: string | null; // Allow external URL to be passed
}

export default function EmbeddedDocumentViewer({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  mode,
  onClose,
  onSave,
  iframeUrl: externalIframeUrl
}: EmbeddedDocumentViewerProps) {
  const { t } = useTranslation();
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (externalIframeUrl) {
      // If external URL is provided (e.g., from embedded sending), use it directly
      setIframeUrl(externalIframeUrl);
      setLoading(false);
      setError(null);
    } else if (open && documentId) {
      loadEmbeddedLink();
    } else {
      setIframeUrl(null);
      setError(null);
    }
  }, [open, documentId, mode, externalIframeUrl]);

  const loadEmbeddedLink = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!documentId) {
        setError('Document ID is required');
        setLoading(false);
        return;
      }

      const { contractDocumentApi } = await import('@/services/api/contractDocumentApi');

      const redirectUrl = `${window.location.origin}/manage/contracts`;
      let response;

      if (mode === 'edit') {
        response = await contractDocumentApi.createEmbeddedEditor(documentId, {
          redirectUrl
        });
      } else {
        response = await contractDocumentApi.createEmbeddedView(documentId, {
          redirectUrl
        });
      }

      console.log('Embedded response:', response);

      if (response.success && response.data?.link) {
        console.log('Setting iframe URL:', response.data.link);
        setIframeUrl(response.data.link);
      } else {
        console.error('Invalid response format:', response);
        setError(response.message || 'Failed to load document');
      }
    } catch (err) {
      console.error('Error loading embedded document:', err);
      const errorMessage =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Failed to load document. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIframeUrl(null);
    setError(null);
    onOpenChange(false);
    onClose?.();
  };

  // Listen for messages from iframe (SignNow callbacks)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (!event.origin.includes('signnow.com')) {
        return;
      }

      // Handle SignNow events
      if (event.data && typeof event.data === 'object') {
        // Document saved/closed
        if (event.data.event === 'document.saved' || event.data.event === 'editor.closed') {
          onSave?.();
          handleClose();
        }
      }
    };

    if (open) {
      window.addEventListener('message', handleMessage);
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [open, onSave]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-6xl w-full h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {mode === 'edit'
                ? t('contracts.edit_document', 'Edit Document')
                : mode === 'sending'
                  ? t('contracts.send_document', 'Send Document')
                  : t('contracts.view_document', 'View Document')}
              {documentTitle && <span className="ml-2 text-sm font-normal text-gray-500">- {documentTitle}</span>}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
                <p className="text-sm text-gray-600">{t('contracts.loading_document', 'Loading document...')}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 p-6">
              <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
                <Button variant="outline" size="sm" onClick={loadEmbeddedLink} className="mt-4">
                  {t('common.retry', 'Retry')}
                </Button>
              </Alert>
            </div>
          )}

          {iframeUrl && !loading && !error && (
            <iframe
              src={iframeUrl}
              className="w-full h-full border-0"
              title={mode === 'edit' ? 'Document Editor' : 'Document Viewer'}
              allow="clipboard-read; clipboard-write; autoplay; camera; microphone"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation"
              allowFullScreen
              style={{ minHeight: '600px' }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
