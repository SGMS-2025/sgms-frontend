import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { contractDocumentApi } from '@/services/api/contractDocumentApi';
import type { ContractDocument } from '@/types/api/ContractDocument';

interface UseContractDocumentActionsOptions {
  onRefresh?: () => void | Promise<void>;
}

export const useContractDocumentActions = (options: UseContractDocumentActionsOptions = {}) => {
  const { t } = useTranslation();
  const { onRefresh } = options;

  const handleCancelInvite = useCallback(
    async (document: ContractDocument) => {
      try {
        const response = await contractDocumentApi.cancelInvite(document._id);
        if (response.success) {
          toast.success(response.message || t('contracts.cancel_invite_success', 'Invite cancelled successfully'));
          // Wait a bit to ensure DB is updated, then fetch fresh data
          await new Promise((resolve) => setTimeout(resolve, 500));
          await onRefresh?.();
        } else {
          toast.error(response.message || t('contracts.cancel_invite_error', 'Failed to cancel invite'));
        }
      } catch (error) {
        console.error('Failed to cancel invite:', error);
        toast.error(t('contracts.cancel_invite_error', 'Failed to cancel invite'));
      }
    },
    [t, onRefresh]
  );

  const handleDownloadDocument = useCallback(
    async (contractDoc: ContractDocument) => {
      try {
        const blob = await contractDocumentApi.downloadDocument(contractDoc._id);

        // Check if blob is valid
        if (!blob || blob.size === 0) {
          toast.error(t('contracts.download_error', 'Failed to download document: Empty file'));
          return;
        }

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = contractDoc.fileName || `${contractDoc.title}.pdf`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success(t('contracts.download_success', 'Document downloaded successfully'));
      } catch (error) {
        console.error('Failed to download document:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(t('contracts.download_error', `Failed to download document: ${errorMessage}`));
      }
    },
    [t]
  );

  const handleOpenSending = useCallback(
    async (document: ContractDocument): Promise<string | null> => {
      // Use callback page to handle redirect and prevent nested dashboard
      const redirectUrl = `${globalThis.location.origin}/signnow/callback`;
      const response = await contractDocumentApi.createEmbeddedSending(document._id, {
        type: 'document', // 'document' allows editing fields before sending, 'invite' opens invite page directly
        redirectUrl,
        linkExpiration: 45, // Max 45 minutes (SignNow API limit for embedded-sending)
        redirectTarget: 'self' // Redirect in same iframe, but callback page will handle closing
      });

      if (response.success && response.data?.link) {
        return response.data.link;
      } else {
        toast.error(response.message || t('contracts.send_error', 'Failed to create sending link'));
        return null;
      }
    },
    [t]
  );

  const handleRefreshDocument = useCallback(
    async (documentId: string) => {
      try {
        const response = await contractDocumentApi.refreshDocument(documentId);
        if (response.success && response.data) {
          const data = response.data as {
            updated?: boolean;
            message?: string;
            status?: string;
            signers?: Array<{ email: string; status?: string }>;
          };
          if (data.updated) {
            toast.success(data.message || 'Document refreshed successfully');
          } else {
            toast.info('Document is up to date');
          }
          // Wait a bit to ensure DB is updated, then fetch fresh data
          await new Promise((resolve) => setTimeout(resolve, 500));
          await onRefresh?.();
        }
      } catch (error) {
        console.error('Failed to refresh document:', error);
        toast.error('Failed to refresh document');
      }
    },
    [onRefresh]
  );

  return {
    handleCancelInvite,
    handleDownloadDocument,
    handleOpenSending,
    handleRefreshDocument
  };
};
