import React from 'react';
import type { TFunction } from 'i18next';
import { Badge } from '@/components/ui/badge';
import type { ContractDocument, DocumentStatus } from '@/types/api/ContractDocument';

/**
 * Check if document has active invites (has been sent and not all cancelled)
 * A document has invites if:
 * - status is 'waiting_for_others' (actively waiting for signatures)
 * - OR status is 'signed' (but this is final state, can't cancel)
 * - OR signersCount > 0 AND status is not 'ready' (has been sent)
 *
 * Note: After cancelling invites, status should be 'ready' and signersCount = 0,
 * which means no active invites, so user can send again.
 */
export const hasInvites = (document: ContractDocument): boolean => {
  // If status is 'waiting_for_others', definitely has active invites
  if (document.status === 'waiting_for_others') {
    return true;
  }

  // If status is 'signed', document is complete (can't cancel)
  if (document.status === 'signed') {
    return false; // Can't cancel signed documents
  }

  // If status is 'ready', 'uploaded', or 'processing', no active invites
  if (['ready', 'uploaded', 'processing'].includes(document.status || '')) {
    return false;
  }

  // For other statuses, check if there are signers
  // But only if status indicates invites were sent
  if (document.signersCount && document.signersCount > 0) {
    // Check if any signers are still pending (not all signed)
    if (document.signers && document.signers.length > 0) {
      const hasPendingSigners = document.signers.some(
        (s) => s.status === 'pending' || s.status === 'sent' || !s.status || s.status === ''
      );
      return hasPendingSigners;
    }
    return true;
  }

  return false;
};

/**
 * Get status badge config for a document status
 */
export const getStatusBadgeConfig = (
  status: DocumentStatus,
  t: TFunction,
  variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline'
) => {
  const translate = (key: string, defaultValue?: string) => {
    const result = t(key, defaultValue);
    return typeof result === 'string' ? result : String(result);
  };
  const statusConfig: Record<
    DocumentStatus,
    { label: string; className: string; badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' }
  > = {
    uploaded: {
      label: translate('contracts.status.uploaded', 'Uploaded'),
      className: 'bg-blue-500/10 text-blue-700 border-blue-200',
      badgeVariant: variant === 'outline' ? 'outline' : 'default'
    },
    processing: {
      label: translate('contracts.status.processing', 'Processing'),
      className: 'bg-amber-500/10 text-amber-700 border-amber-200',
      badgeVariant: variant === 'outline' ? 'outline' : 'secondary'
    },
    ready: {
      label: translate('contracts.status.ready', 'Ready'),
      className: 'bg-green-500/10 text-green-700 border-green-200',
      badgeVariant: variant === 'outline' ? 'outline' : 'default'
    },
    waiting_for_others: {
      label: translate('contracts.status.waiting_for_others', 'Waiting for Others'),
      className: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
      badgeVariant: variant === 'outline' ? 'outline' : 'secondary'
    },
    signed: {
      label: translate('contracts.status.signed', 'Signed'),
      className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
      badgeVariant: variant === 'outline' ? 'outline' : 'default'
    },
    archived: {
      label: translate('contracts.status.archived', 'Archived'),
      className: 'bg-gray-500/10 text-gray-700 border-gray-200',
      badgeVariant: variant === 'outline' ? 'outline' : 'secondary'
    },
    deleted: {
      label: translate('contracts.status.deleted', 'Deleted'),
      className: 'bg-red-500/10 text-red-700 border-red-200',
      badgeVariant: 'destructive'
    }
  };

  return statusConfig[status] || statusConfig.uploaded;
};

/**
 * Get status badge component for a document status
 */
export const getStatusBadge = (
  status: DocumentStatus,
  t: TFunction,
  variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline'
) => {
  const config = getStatusBadgeConfig(status, t, variant);
  return (
    <Badge variant={config.badgeVariant || variant} className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
};

/**
 * Get contract type badge config
 */
export const getContractTypeBadgeConfig = (t: TFunction, type?: string) => {
  if (!type) return null;
  const translate = (key: string, defaultValue?: string) => {
    const result = t(key, defaultValue);
    return typeof result === 'string' ? result : String(result);
  };

  const typeConfig: Record<string, { label: string; className: string }> = {
    membership: {
      label: translate('contracts.type_membership', 'Membership'),
      className: 'bg-primary/10 text-primary border-primary/20'
    },
    service_pt: {
      label: translate('contracts.type_pt', 'PT (1-on-1)'),
      className: 'bg-purple-500/10 text-purple-700 border-purple-200'
    },
    service_class: {
      label: translate('contracts.type_class', 'Class (Group)'),
      className: 'bg-blue-500/10 text-blue-700 border-blue-200'
    },
    custom: {
      label: translate('contracts.type_custom', 'Custom'),
      className: 'bg-gray-500/10 text-gray-700 border-gray-200'
    }
  };

  return typeConfig[type] || typeConfig.custom;
};

/**
 * Get contract type badge component
 */
export const getContractTypeBadge = (t: TFunction, type?: string): React.ReactElement | null => {
  const config = getContractTypeBadgeConfig(t, type);
  if (!config) return null;

  return (
    <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
};
