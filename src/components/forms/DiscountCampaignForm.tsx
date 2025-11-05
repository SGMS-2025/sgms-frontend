import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TFunction } from 'i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X, Plus, Package } from 'lucide-react';
import { cn, formatDate } from '@/utils/utils';
import { createMatrixCellKey } from '@/utils/matrixUtils';
import { useMatrix } from '@/hooks/useMatrix';
import type { DiscountCampaign, DiscountCampaignFormData } from '@/types/api/Discount';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Validation schema builder with i18n
const buildDiscountCampaignSchema = (t: TFunction) =>
  z
    .object({
      campaignName: z
        .string()
        .min(1, t('discount.validation.campaign_name_required', { defaultValue: 'Campaign name is required' }))
        .max(
          100,
          t('discount.validation.campaign_name_max', {
            defaultValue: 'Campaign name must not exceed 100 characters'
          })
        ),
      description: z
        .string()
        .max(
          1000,
          t('discount.validation.description_max', { defaultValue: 'Description must not exceed 1000 characters' })
        )
        .optional(),
      discountPercentage: z
        .number()
        .min(1, t('discount.validation.percentage_min', { defaultValue: 'Discount percentage must be at least 1%' }))
        .max(
          100,
          t('discount.validation.percentage_max', { defaultValue: 'Discount percentage must not exceed 100%' })
        ),
      packageId: z
        .array(z.string())
        .min(1, t('discount.validation.select_at_least_one', { defaultValue: 'Select at least one service/package' })),
      discountCode: z
        .string()
        .trim()
        .min(1, t('discount.validation.discount_code_required', { defaultValue: 'Discount code is required' }))
        .max(50, t('discount.validation.discount_code_too_long', { defaultValue: 'Discount code too long' })),
      usageLimit: z
        .union([
          z
            .number()
            .min(
              0,
              t('discount.validation.usage_limit_non_negative', { defaultValue: 'Usage limit must be non-negative' })
            ),
          z.null()
        ])
        .optional(),
      startDate: z.date({
        message: t('discount.validation.start_date_required', { defaultValue: 'Start date is required' })
      }),
      endDate: z.date({
        message: t('discount.validation.end_date_required', { defaultValue: 'End date is required' })
      }),
      status: z.string().optional()
    })
    .refine((data) => data.endDate > data.startDate, {
      message: t('discount.validation.end_after_start', { defaultValue: 'End date must be after start date' }),
      path: ['endDate']
    });

interface DiscountCampaignFormProps {
  campaign?: DiscountCampaign;
  onSubmit: (data: DiscountCampaignFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const DiscountCampaignForm: React.FC<DiscountCampaignFormProps> = ({
  campaign,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const { t } = useTranslation();
  const { services, features, cells, loading: matrixLoading, error: matrixError } = useMatrix();
  const discountCampaignSchema = React.useMemo(() => buildDiscountCampaignSchema(t), [t]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isDiscountCodeManuallyEdited, setIsDiscountCodeManuallyEdited] = useState<boolean>(false);
  const [autoSuffix, setAutoSuffix] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<DiscountCampaignFormData>({
    resolver: zodResolver(discountCampaignSchema),
    defaultValues: {
      campaignName: campaign?.campaignName || '',
      description: campaign?.description || '',
      discountPercentage: campaign?.discountPercentage || 1,
      packageId: Array.isArray(campaign?.packageId)
        ? campaign.packageId.map((pkg) => pkg._id).filter((id): id is string => Boolean(id))
        : [],
      discountCode: campaign?.discountCode || '',
      usageLimit: campaign?.usageLimit ?? null,
      startDate: campaign?.startDate ? new Date(campaign.startDate) : undefined,
      endDate: campaign?.endDate ? new Date(campaign.endDate) : undefined,
      status: campaign?.status || 'PENDING'
    }
  });

  // Auto-generate discountCode from campaignName when creating (not editing) until user edits code manually
  const campaignNameValue = watch('campaignName');
  useEffect(() => {
    if (campaign) return; // only on create
    if (isDiscountCodeManuallyEdited) return; // stop auto if user edited
    if (!campaignNameValue) {
      setValue('discountCode', '');
      return;
    }
    const ensureSuffix = () => {
      if (autoSuffix) return autoSuffix;
      const s = Math.random().toString(36).slice(2, 6).toUpperCase();
      setAutoSuffix(s);
      return s;
    };
    const slug = campaignNameValue
      .normalize('NFD')
      .replaceAll(/\p{Diacritic}/gu, '')
      .replaceAll(/[^a-zA-Z0-9]+/g, '-')
      .replaceAll(/^-+|-+$/g, '')
      .toUpperCase();
    const suffix = ensureSuffix();
    const maxBaseLen = Math.max(0, 30 - (suffix ? suffix.length + 1 : 0));
    const base = slug.slice(0, maxBaseLen);
    const generated = suffix ? `${base}-${suffix}` : base;
    setValue('discountCode', generated);
  }, [campaign, campaignNameValue, isDiscountCodeManuallyEdited, setValue, autoSuffix]);

  // Initialize form with campaign data
  useEffect(() => {
    if (campaign) {
      const initialPackages = Array.isArray(campaign.packageId)
        ? campaign.packageId.map((pkg) => pkg._id).filter((id): id is string => Boolean(id))
        : [];
      setSelectedPackages(initialPackages);
      setStartDate(campaign.startDate ? new Date(campaign.startDate) : undefined);
      setEndDate(campaign.endDate ? new Date(campaign.endDate) : undefined);
    }
  }, [campaign]);

  // Update form values when dates change
  useEffect(() => {
    if (startDate) {
      setValue('startDate', startDate);
    }
  }, [startDate, setValue]);

  useEffect(() => {
    if (endDate) {
      setValue('endDate', endDate);
    }
  }, [endDate, setValue]);

  // Update form values when selected packages change
  useEffect(() => {
    setValue('packageId', selectedPackages);
  }, [selectedPackages, setValue]);

  const handlePackageToggle = (pkgId: string) => {
    setSelectedPackages((prev) => (prev.includes(pkgId) ? prev.filter((id) => id !== pkgId) : [...prev, pkgId]));
  };

  const handleSelectAllPackages = () => {
    const allIds = services.map((s) => s.id);
    setSelectedPackages(allIds);
  };

  const handleClearAllPackages = () => {
    setSelectedPackages([]);
  };

  const onFormSubmit = (data: DiscountCampaignFormData) => onSubmit(data);

  const renderPackagesContent = (() => {
    if (matrixLoading) {
      return (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">{t('discount.loading_services')}</p>
        </div>
      );
    }
    if (matrixError) {
      return (
        <div className="text-center py-4">
          <p className="text-sm text-red-600 mb-2">{matrixError}</p>
          <p className="text-xs text-gray-500">{t('common.try_refresh_contact_support')}</p>
        </div>
      );
    }
    if (services.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 mb-2">{t('discount.no_services')}</p>
        </div>
      );
    }
    return (
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-lg p-4">
          {services.map((svc) => {
            const included = features.filter((f) => {
              const key = createMatrixCellKey(svc.id, f.id);
              const cell = cells[key];
              return Boolean(cell?.isIncluded);
            });
            return (
              <div key={svc.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`pkg-${svc.id}`}
                  checked={selectedPackages.includes(svc.id)}
                  onCheckedChange={() => handlePackageToggle(svc.id)}
                />
                <Label htmlFor={`pkg-${svc.id}`} className="flex-1 text-sm font-medium leading-none cursor-pointer">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="font-medium truncate cursor-help">{svc.name}</div>
                    </TooltipTrigger>
                    <TooltipContent
                      align="start"
                      className="max-w-sm whitespace-normal bg-white text-gray-900 border border-gray-200 shadow-lg rounded-md p-3"
                    >
                      <div className="text-xs text-gray-700 space-y-1">
                        <p className="font-semibold text-gray-900">{svc.name}</p>
                        {svc.durationInMonths ? (
                          <p>
                            {t('class_service.duration')}: {svc.durationInMonths}
                          </p>
                        ) : null}
                        <p>{t('common.feature_title')}</p>
                        {included.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-1">
                            {included.map((f) => (
                              <li key={`${svc.id}-${f.id}`}>{f.name}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>{t('common.not_available')}</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </Label>
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    );
  })();

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Campaign Name */}
        <div className="space-y-2">
          <Label htmlFor="campaignName" className="text-sm font-medium text-gray-700">
            {t('discount.campaign_name')} *
          </Label>
          <Input
            id="campaignName"
            {...register('campaignName')}
            placeholder={t('discount.campaign_name_placeholder')}
            className={cn(errors.campaignName && 'border-red-500')}
          />
          {errors.campaignName && <p className="text-sm text-red-600">{errors.campaignName.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            {t('discount.description')}
          </Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder={t('discount.description_placeholder')}
            rows={3}
            className={cn(errors.description && 'border-red-500')}
          />
          {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
        </div>

        {/* Discount Percentage */}
        <div className="space-y-2">
          <Label htmlFor="discountPercentage" className="text-sm font-medium text-gray-700">
            {t('discount.discount_percentage')} *
          </Label>
          <div className="relative">
            <Input
              id="discountPercentage"
              type="number"
              min="1"
              max="100"
              step="0.1"
              {...register('discountPercentage', { valueAsNumber: true })}
              placeholder="1"
              className={cn('pr-8', errors.discountPercentage && 'border-red-500')}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
          </div>
          {errors.discountPercentage && <p className="text-sm text-red-600">{errors.discountPercentage.message}</p>}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm font-medium text-gray-700">
            {t('discount.status')} *
          </Label>
          <Select value={watch('status')} onValueChange={(value) => setValue('status', value)} disabled={loading}>
            <SelectTrigger className={cn(errors.status && 'border-red-500')}>
              <SelectValue placeholder={t('discount.select_status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">{t('discount.pending')}</SelectItem>
              <SelectItem value="ACTIVE">{t('discount.active')}</SelectItem>
              <SelectItem value="INACTIVE">{t('discount.inactive')}</SelectItem>
              <SelectItem value="EXPIRED">{t('discount.expired')}</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-sm text-red-600">{errors.status.message}</p>}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">{t('discount.start_date')} *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground',
                    errors.startDate && 'border-red-500'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? formatDate(startDate) : <span>{t('discount.select_start_date')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < new Date() || false}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.startDate && <p className="text-sm text-red-600">{errors.startDate.message}</p>}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">{t('discount.end_date')} *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground',
                    errors.endDate && 'border-red-500'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? formatDate(endDate) : <span>{t('discount.select_end_date')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date < new Date() || (startDate ? date <= startDate : false)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.endDate && <p className="text-sm text-red-600">{errors.endDate.message}</p>}
          </div>
        </div>

        {/* Service/Package Selection via Matrix */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">{t('discount.select_services')} *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllPackages}
                disabled={matrixLoading}
              >
                {t('discount.select_all')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAllPackages}
                disabled={matrixLoading}
              >
                {t('discount.clear_all')}
              </Button>
            </div>
          </div>

          {renderPackagesContent}

          {selectedPackages.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">{t('discount.selected_services')}:</p>
              <TooltipProvider>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedPackages.map((pkgId) => {
                    const svc = services.find((s) => s.id === pkgId);
                    if (!svc) return null;
                    const included = features.filter((f) => {
                      const key = createMatrixCellKey(svc.id, f.id);
                      const cell = cells[key];
                      return Boolean(cell?.isIncluded);
                    });
                    return (
                      <div key={pkgId} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Package className="w-5 h-5 text-gray-500" />
                        <div className="min-w-0 w-full flex items-start justify-between gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="font-medium text-gray-900 truncate cursor-help flex-1 min-w-0">
                                {svc.name}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent
                              align="start"
                              className="max-w-sm whitespace-normal bg-white text-gray-900 border border-gray-200 shadow-lg rounded-md p-3"
                            >
                              <div className="text-xs text-gray-700 space-y-1">
                                <p className="font-semibold text-gray-900">{svc.name}</p>
                                {svc.durationInMonths ? (
                                  <p>
                                    {t('class_service.duration')}: {svc.durationInMonths}
                                  </p>
                                ) : null}
                                {included.length > 0 ? (
                                  <ul className="list-disc pl-4 space-y-1">
                                    {included.map((f) => (
                                      <li key={`${svc.id}-${f.id}`}>{f.name}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p>{t('common.not_available')}</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                          <button
                            type="button"
                            onClick={() => handlePackageToggle(pkgId)}
                            className="shrink-0 text-gray-400 hover:text-red-500"
                            aria-label="remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TooltipProvider>
            </div>
          )}

          {errors.packageId && <p className="text-sm text-red-600">{errors.packageId.message}</p>}
        </div>

        {/* Discount Code */}
        <div className="space-y-2">
          <Label htmlFor="discountCode" className="text-sm font-medium text-gray-700">
            {t('discount.discount_code')} *
          </Label>
          <Input
            id="discountCode"
            {...register('discountCode', {
              onChange: () => setIsDiscountCodeManuallyEdited(true)
            })}
            placeholder={t('discount.discount_code_placeholder')}
            className={cn(errors.discountCode && 'border-red-500')}
          />
          {errors.discountCode && <p className="text-sm text-red-600">{errors.discountCode.message}</p>}
        </div>

        {/* Usage Limit */}
        <div className="space-y-2">
          <Label htmlFor="usageLimit" className="text-sm font-medium text-gray-700">
            {t('discount.usage_limit')} ({t('discount.null_unlimited')})
          </Label>
          <Input
            id="usageLimit"
            type="number"
            min="0"
            step="1"
            {...register('usageLimit', { valueAsNumber: true })}
            placeholder={t('discount.usage_limit_placeholder')}
            className={cn(errors.usageLimit && 'border-red-500')}
          />
          {errors.usageLimit && <p className="text-sm text-red-600">{errors.usageLimit.message}</p>}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {campaign ? t('discount.updating') : t('discount.creating')}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                {campaign ? t('discount.update_campaign') : t('discount.create_campaign')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DiscountCampaignForm;
