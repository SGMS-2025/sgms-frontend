import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmbeddedDocumentViewerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly documentId?: string;
  readonly documentTitle: string;
  readonly mode: 'edit' | 'view' | 'sending';
  readonly onClose?: () => void;
  readonly onSave?: () => void;
  readonly iframeUrl?: string | null; // Allow external URL to be passed
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
  const hasHandledCloseRef = useRef(false);

  const loadEmbeddedLink = async () => {
    setLoading(true);
    setError(null);

    if (!documentId) {
      setError('Document ID is required');
      setLoading(false);
      return;
    }

    const { contractDocumentApi } = await import('@/services/api/contractDocumentApi');

    const redirectUrl = `${globalThis.location.origin}/manage/contracts`;
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

    if (response.success && response.data?.link) {
      setIframeUrl(response.data.link);
    } else {
      setError(response.message || 'Failed to load document');
    }

    setLoading(false);
  };

  const handleClose = () => {
    setIframeUrl(null);
    setError(null);
    onOpenChange(false);
    onClose?.();
  };

  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    handleClose();
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, documentId, mode, externalIframeUrl]);

  // Listen for messages from iframe (SignNow callbacks and callback page)
  useEffect(() => {
    // Reset close handler flag when opening
    if (open) {
      hasHandledCloseRef.current = false;
    }

    const handleMessage = (event: MessageEvent) => {
      // Prevent multiple close handlers
      if (hasHandledCloseRef.current) {
        return;
      }

      // Verify origin for security - allow messages from same origin (callback page) and SignNow
      const isSameOrigin = event.origin === window.location.origin;
      const isSignNow = event.origin.includes('signnow.com');

      if (!isSameOrigin && !isSignNow) {
        return;
      }

      // Handle messages from callback page (same origin)
      if (isSameOrigin && event.data && typeof event.data === 'object') {
        if (event.data.type === 'signnow-callback') {
          if (event.data.action === 'close-iframe') {
            // Callback page is requesting to close the iframe
            hasHandledCloseRef.current = true;
            onSave?.();
            handleClose();
            return;
          }
          if (event.data.action === 'redirect') {
            // Callback page is requesting redirect (handled by callback page itself)
            return;
          }
        }
      }

      // Handle SignNow events
      if (isSignNow && event.data && typeof event.data === 'object') {
        // Document saved/closed
        if (event.data.event === 'document.saved' || event.data.event === 'editor.closed') {
          hasHandledCloseRef.current = true;
          onSave?.();
          handleClose();
        }
        // Document sent successfully
        if (event.data.event === 'document.sent' || event.data.event === 'invite.sent') {
          hasHandledCloseRef.current = true;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onSave]);

  const getModeTitle = () => {
    switch (mode) {
      case 'edit':
        return t('contracts.edit_document', 'Edit Document');
      case 'sending':
        return t('contracts.send_document', 'Send Document');
      case 'view':
        return t('contracts.view_document', 'View Document');
      default:
        return t('contracts.document', 'Document');
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'edit':
        return t('contracts.edit_document_description', 'Add fields, assign signers, and prepare document for sending');
      case 'sending':
        return t('contracts.send_document_description', 'Configure recipients and send document for signature');
      case 'view':
        return t('contracts.view_document_description', 'View document contents and current status');
      default:
        return '';
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="right"
        className="w-screen sm:w-[95vw] lg:w-[90vw] xl:w-[85vw] max-w-none sm:max-w-none p-0 gap-0 flex flex-col [&>button]:hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <SheetTitle className="text-xl font-semibold">
                {getModeTitle()}
                {documentTitle && <span className="ml-2 text-base font-normal text-gray-500">- {documentTitle}</span>}
              </SheetTitle>
              <SheetDescription className="mt-1">{getModeDescription()}</SheetDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0 shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden bg-gray-50">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
                <p className="text-sm text-gray-600">{t('contracts.loading_document', 'Loading document...')}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 p-6 z-10">
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
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
