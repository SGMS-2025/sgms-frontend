import type { DiscountCampaign } from '@/types/api/Discount';

/**
 * Get status badge configuration for discount campaign
 * @param campaign - The discount campaign object
 * @param t - Translation function
 * @returns Object containing variant and text for Badge component
 */
export function getStatusBadgeConfig(campaign: DiscountCampaign, t: (key: string) => string) {
  switch (campaign.status) {
    case 'ACTIVE':
      return { variant: 'default' as const, text: t('discount.active') };
    case 'PENDING':
      return { variant: 'outline' as const, text: t('discount.pending') };
    case 'EXPIRED':
      return { variant: 'destructive' as const, text: t('discount.expired') };
    case 'INACTIVE':
      return { variant: 'secondary' as const, text: t('discount.inactive') };
    case 'DELETED':
      return { variant: 'destructive' as const, text: 'Deleted' };
    default:
      return { variant: 'secondary' as const, text: 'Unknown' };
  }
}
