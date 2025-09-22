import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X, Plus, MapPin } from 'lucide-react';
import { cn, formatDate } from '@/utils/utils';
import { useBranch } from '@/contexts/BranchContext';
import type { DiscountCampaign } from '@/types/api/Discount';
import type { DiscountCampaignFormData } from '@/types/api/Discount';

// Validation schema
const discountCampaignSchema = z
  .object({
    campaignName: z
      .string()
      .min(1, 'Campaign name is required')
      .max(100, 'Campaign name must not exceed 100 characters'),
    description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
    discountPercentage: z
      .number()
      .min(1, 'Discount percentage must be at least 1%')
      .max(100, 'Discount percentage must not exceed 100%'),
    branchId: z.array(z.string()).min(1, 'At least one branch must be selected'),
    startDate: z.date({
      message: 'Start date is required'
    }),
    endDate: z.date({
      message: 'End date is required'
    }),
    status: z.string().optional()
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
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
  const { branches, loading: branchesLoading, error: branchesError } = useBranch();
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

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
      branchId: campaign?.branchId?.map((branch) => branch._id) || [],
      startDate: campaign?.startDate ? new Date(campaign.startDate) : undefined,
      endDate: campaign?.endDate ? new Date(campaign.endDate) : undefined,
      status: campaign?.status || 'PENDING'
    }
  });

  // Initialize form with campaign data
  useEffect(() => {
    if (campaign) {
      setSelectedBranches(campaign.branchId?.map((branch) => branch._id) || []);
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

  // Update form values when branches change
  useEffect(() => {
    setValue('branchId', selectedBranches);
  }, [selectedBranches, setValue]);

  const handleBranchToggle = (branchId: string) => {
    setSelectedBranches((prev) =>
      prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]
    );
  };

  const handleSelectAllBranches = () => {
    const allBranchIds = branches.map((branch) => branch._id);
    setSelectedBranches(allBranchIds);
  };

  const handleClearAllBranches = () => {
    setSelectedBranches([]);
  };

  const onFormSubmit = async (data: DiscountCampaignFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      // TODO: Add proper error handling with user notification
    }
  };

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

        {/* Branch Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">{t('discount.select_branches')} *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllBranches}
                disabled={branchesLoading}
              >
                {t('discount.select_all')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAllBranches}
                disabled={branchesLoading}
              >
                {t('discount.clear_all')}
              </Button>
            </div>
          </div>

          {branchesLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">{t('discount.loading_branches')}</p>
            </div>
          ) : branchesError ? (
            <div className="text-center py-4">
              <p className="text-sm text-red-600 mb-2">{branchesError}</p>
              <p className="text-xs text-gray-500">
                Please try refreshing the page or contact support if the issue persists.
              </p>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-2">{t('discount.no_branches')}</p>
              <p className="text-xs text-gray-500 mb-3">{t('discount.create_branch_first')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-lg p-4">
              {branches.map((branch) => (
                <div key={branch._id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`branch-${branch._id}`}
                    checked={selectedBranches.includes(branch._id)}
                    onCheckedChange={() => handleBranchToggle(branch._id)}
                  />
                  <Label
                    htmlFor={`branch-${branch._id}`}
                    className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                      <div>
                        <div className="font-medium">{branch.branchName}</div>
                        <div className="text-xs text-gray-500">{branch.location}</div>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          )}

          {selectedBranches.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">{t('discount.selected_branches')}:</p>
              <div className="flex flex-wrap gap-2">
                {selectedBranches.map((branchId) => {
                  const branch = branches.find((b) => b._id === branchId);
                  return branch ? (
                    <Badge key={branchId} variant="secondary" className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {branch.branchName}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-500"
                        onClick={() => handleBranchToggle(branchId)}
                      />
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {errors.branchId && <p className="text-sm text-red-600">{errors.branchId.message}</p>}
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
