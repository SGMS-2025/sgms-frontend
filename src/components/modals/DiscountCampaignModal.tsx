import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Percent, MapPin, User, Edit, Trash2, Package } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/utils/utils';
import { useMatrix } from '@/hooks/useMatrix';
import { createMatrixCellKey } from '@/utils/matrixUtils';
import { getStatusBadgeConfig } from '@/utils/discountUtils';
import type { DiscountCampaign } from '@/types/api/Discount';

interface DiscountCampaignModalProps {
  campaign: DiscountCampaign | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (campaign: DiscountCampaign) => void;
  onDelete?: (campaign: DiscountCampaign) => void;
  mode?: 'view' | 'edit' | 'delete';
  canManage?: boolean;
}

const DiscountCampaignModal: React.FC<DiscountCampaignModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  mode = 'view',
  canManage = false
}) => {
  const { t } = useTranslation();
  const { features, cells } = useMatrix();

  if (!campaign) return null;

  const handleEdit = () => {
    onEdit?.(campaign);
  };

  const handleDelete = async () => {
    try {
      await onDelete?.(campaign);
      onClose();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const badgeConfig = getStatusBadgeConfig(campaign, t);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="overflow-y-auto max-h-[calc(90vh-4rem)] pr-2 hide-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">{campaign.campaignName}</DialogTitle>
          </DialogHeader>

          <DialogDescription className="text-sm text-gray-700 leading-6 whitespace-pre-line">
            {campaign.description || t('discount.no_description')}
          </DialogDescription>

          <Separator className="my-4" />

          <div className="space-y-6">
            {/* Campaign Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Discount Percentage */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">{t('discount.discount_percentage')}</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">{campaign.discountPercentage}%</p>
              </div>

              {/* Campaign Duration */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">{t('discount.campaign_duration')}</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {campaign.campaignDuration} {t('discount.days')}
                </p>
              </div>

              {/* Discount Code */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">{t('discount.discount_code')}</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{campaign.discountCode}</p>
              </div>

              {/* Usage Limit */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-teal-500" />
                  <span className="text-sm font-medium text-gray-700">{t('discount.usage_limit')}</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {campaign.usageLimit == null || campaign.usageLimit === 0
                    ? t('discount.unlimited')
                    : campaign.usageLimit}
                </p>
              </div>

              {/* Usage Count */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{t('discount.usage_count')}</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {typeof campaign.usageCount === 'number' ? campaign.usageCount : 0}
                </p>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">{t('discount.date_range')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">{t('discount.start_date')}</span>
                  <p className="text-gray-900">{formatDate(campaign.startDate)}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">{t('discount.end_date')}</span>
                  <p className="text-gray-900">{formatDate(campaign.endDate)}</p>
                </div>
              </div>
            </div>

            {/* Applicable Services */}
            {campaign.packageId && campaign.packageId.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">{t('discount.applicable_services')}</h4>
                <TooltipProvider>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {campaign.packageId.map((pkg, index) => {
                      const included = features.filter((f) => {
                        const key = createMatrixCellKey(pkg._id, f.id);
                        const cell = cells[key];
                        return Boolean(cell?.isIncluded);
                      });

                      return (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Package className="w-5 h-5 text-gray-500" />
                          <div className="min-w-0 w-full flex items-start justify-between gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="font-medium text-gray-900 truncate cursor-help flex-1 min-w-0">
                                  {pkg.name || pkg._id}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent
                                align="start"
                                className="max-w-sm whitespace-normal bg-white text-gray-900 border border-gray-200 shadow-lg rounded-md p-3"
                              >
                                <div className="text-xs text-gray-700 space-y-1">
                                  <p className="font-semibold text-gray-900">{pkg.name || pkg._id}</p>
                                  {pkg.defaultDurationMonths ? (
                                    <p>
                                      {t('class_service.duration')}: {pkg.defaultDurationMonths}
                                    </p>
                                  ) : null}
                                  <p>{t('common.feature_title')}</p>
                                  {included.length > 0 ? (
                                    <ul className="list-disc pl-4 space-y-1">
                                      {included.map((f) => (
                                        <li key={`${pkg._id}-${f.id}`}>{f.name}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p>{t('common.not_available')}</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TooltipProvider>
              </div>
            )}

            {/* Branches */}
            {campaign.branchId && campaign.branchId.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">{t('discount.applicable_branches')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {campaign.branchId.map((branch, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">{branch.branchName}</p>
                        <p className="text-sm text-gray-600">{branch.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Creator Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">{t('discount.campaign_info')}</h4>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">
                    {t('discount.created_by')}: {campaign.createBy.fullName}
                  </p>
                  <p className="text-sm text-gray-600">{campaign.createBy.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">{t('discount.created_at')}:</span>
                  <p>{formatDate(campaign.createdAt)}</p>
                </div>
                <div>
                  <span className="font-medium">{t('discount.last_updated')}:</span>
                  <p>{formatDate(campaign.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Campaign Status Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">{t('discount.status_info')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-sm text-gray-600">{t('discount.status')}</p>
                  <Badge variant={badgeConfig.variant}>{badgeConfig.text}</Badge>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-sm text-gray-600">{t('discount.days_remaining')}</p>
                  <p className="font-semibold text-gray-900">{campaign.daysRemaining}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {mode === 'view' && canManage && (
            <div className="flex justify-end space-x-3 pt-6 border-t">
              {onEdit && (
                <Button variant="outline" onClick={handleEdit} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  {t('common.edit')}
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" onClick={handleDelete} className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  {t('common.delete')}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiscountCampaignModal;
