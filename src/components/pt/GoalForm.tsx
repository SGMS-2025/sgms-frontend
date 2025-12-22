import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, ArrowRight, ChevronDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useCustomerGoal } from '@/hooks/useCustomerGoal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { trainingProgressApi } from '@/services/api/trainingProgressApi';
import type {
  CreateCustomerGoalRequest,
  UpdateCustomerGoalRequest,
  CustomerGoalDisplay
} from '@/types/api/CustomerGoal';

interface GoalFormProps {
  customerId: string;
  serviceContractId?: string;
  trainerId?: string;
  branchId: string;
  initialGoal?: CustomerGoalDisplay | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export const GoalForm: React.FC<GoalFormProps> = ({
  customerId,
  serviceContractId,
  trainerId,
  branchId,
  initialGoal,
  onSubmit,
  onCancel
}) => {
  const { t } = useTranslation();
  const { createGoal, updateGoal, createLoading, updateLoading } = useCustomerGoal(customerId);

  const isEditing = !!initialGoal;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    // Targets
    weight: '',
    height: '',
    strength: '',
    bodyFatPercentage: '',
    chest: '',
    waist: '',
    hips: '',
    arms: '',
    thighs: '',
    muscleMassPercentage: '',
    bodyWaterPercentage: '',
    metabolicAge: ''
  });

  // Baseline data to create initial training progress
  const [baselineData, setBaselineData] = useState({
    weight: '',
    height: '',
    strength: '',
    bodyFatPercentage: '',
    chest: '',
    waist: '',
    hips: '',
    arms: '',
    thighs: '',
    muscleMassPercentage: '',
    bodyWaterPercentage: '',
    metabolicAge: '',
    notes: ''
  });

  const targetInputClass =
    'bg-[#FFF7F3] border-[#F05A29]/70 focus-visible:ring-[#F05A29] focus-visible:ring-2 focus-visible:ring-offset-0 focus:border-[#F05A29]';

  const handleBaselineChange = (field: keyof typeof baselineData, value: string) => {
    setBaselineData((prev) => ({ ...prev, [field]: value }));
  };

  const [showTargets, setShowTargets] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const selectedStartDate = useMemo(() => {
    if (!formData.startDate) return undefined;
    const date = new Date(`${formData.startDate}T00:00:00`);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }, [formData.startDate]);

  const selectedEndDate = useMemo(() => {
    if (!formData.endDate) return undefined;
    const date = new Date(`${formData.endDate}T00:00:00`);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }, [formData.endDate]);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!initialGoal) return;

      // Prefill targets from goal (cột Mục tiêu)
      setFormData({
        name: initialGoal.name || '',
        description: initialGoal.description || '',
        startDate: initialGoal.startDate ? new Date(initialGoal.startDate).toISOString().split('T')[0] : '',
        endDate: initialGoal.endDate ? new Date(initialGoal.endDate).toISOString().split('T')[0] : '',
        weight: initialGoal.targets?.weight?.toString() || '',
        height: initialGoal.targets?.height?.toString() || '',
        strength: initialGoal.targets?.strength?.toString() || '',
        bodyFatPercentage: initialGoal.targets?.bodyFatPercentage?.toString() || '',
        chest: initialGoal.targets?.chest?.toString() || '',
        waist: initialGoal.targets?.waist?.toString() || '',
        hips: initialGoal.targets?.hips?.toString() || '',
        arms: initialGoal.targets?.arms?.toString() || '',
        thighs: initialGoal.targets?.thighs?.toString() || '',
        muscleMassPercentage: initialGoal.targets?.muscleMassPercentage?.toString() || '',
        bodyWaterPercentage: initialGoal.targets?.bodyWaterPercentage?.toString() || '',
        metabolicAge: initialGoal.targets?.metabolicAge?.toString() || ''
      });

      setShowTargets(
        !!(
          initialGoal.targets?.weight ||
          initialGoal.targets?.height ||
          initialGoal.targets?.strength ||
          initialGoal.targets?.bodyFatPercentage ||
          initialGoal.targets?.chest ||
          initialGoal.targets?.waist ||
          initialGoal.targets?.hips ||
          initialGoal.targets?.arms ||
          initialGoal.targets?.thighs ||
          initialGoal.targets?.muscleMassPercentage ||
          initialGoal.targets?.bodyWaterPercentage ||
          initialGoal.targets?.metabolicAge
        )
      );

      // Load training progress đầu tiên để fill cột "Hiện tại"
      try {
        const response = await trainingProgressApi.getTrainingProgressList({
          customerId,
          serviceContractId,
          sortBy: 'trackingDate',
          sortOrder: 'asc',
          limit: 1
        });

        if (response.success && response.data.progressRecords.length > 0) {
          const first = response.data.progressRecords[0];
          setBaselineData((prev) => ({
            ...prev,
            weight: first.weight != null ? first.weight.toString() : '',
            height: first.height != null ? first.height.toString() : '',
            strength: first.strength != null ? first.strength.toString() : '',
            bodyFatPercentage: first.bodyFatPercentage != null ? first.bodyFatPercentage.toString() : '',
            chest: first.chest != null ? first.chest.toString() : '',
            waist: first.waist != null ? first.waist.toString() : '',
            hips: first.hips != null ? first.hips.toString() : '',
            arms: first.arms != null ? first.arms.toString() : '',
            thighs: first.thighs != null ? first.thighs.toString() : '',
            muscleMassPercentage: first.muscleMassPercentage != null ? first.muscleMassPercentage.toString() : '',
            bodyWaterPercentage: first.bodyWaterPercentage != null ? first.bodyWaterPercentage.toString() : '',
            metabolicAge: first.metabolicAge != null ? first.metabolicAge.toString() : '',
            notes: first.notes || prev.notes
          }));
        }
      } catch (err) {
        // Không chặn form nếu load baseline lỗi
        // eslint-disable-next-line no-console
        console.error('Failed to load first training progress for goal edit:', err);
      }
    };

    loadInitialData();
  }, [initialGoal, customerId, serviceContractId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.name.trim()) {
      toast.error(t('goal_form.name_required', 'Goal name is required'));
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error(t('goal_form.dates_required', 'Start date and end date are required'));
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end <= start) {
      toast.error(t('goal_form.end_date_after_start', 'End date must be after start date'));
      return;
    }

    // Require baseline (current) core fields
    if (!baselineData.weight.trim() || !baselineData.height.trim() || !baselineData.strength.trim()) {
      toast.error(
        t('goal_form.validation.current_core_required', 'Vui lòng nhập đầy đủ cân nặng, chiều cao và sức mạnh HIỆN TẠI')
      );
      return;
    }

    // Require target core fields
    if (!formData.weight.trim() || !formData.height.trim() || !formData.strength.trim()) {
      toast.error(
        t('goal_form.validation.target_core_required', 'Vui lòng nhập đầy đủ cân nặng, chiều cao và sức mạnh MỤC TIÊU')
      );
      return;
    }

    // Validate targets values
    // Validate weight: min 0, max 500
    if (formData.weight && formData.weight.trim() !== '') {
      const weightValue = parseFloat(formData.weight);
      if (isNaN(weightValue) || weightValue < 0 || weightValue > 500) {
        toast.error(t('goal_form.validation.weight_range', 'Cân nặng phải từ 0 đến 500 kg'));
        return;
      }
    }

    // Validate height: min 0, max 300
    if (formData.height && formData.height.trim() !== '') {
      const heightValue = parseFloat(formData.height);
      if (isNaN(heightValue) || heightValue < 0 || heightValue > 300) {
        toast.error(t('goal_form.validation.height_range', 'Chiều cao phải từ 0 đến 300 cm'));
        return;
      }
    }

    // Validate strength: min 0, max 100
    if (formData.strength && formData.strength.trim() !== '') {
      const strengthValue = parseFloat(formData.strength);
      if (isNaN(strengthValue) || strengthValue < 0 || strengthValue > 100) {
        toast.error(t('goal_form.validation.strength_range', 'Sức mạnh phải từ 0 đến 100'));
        return;
      }
    }

    // Validate body measurements: chest, waist, hips: min 0, max 300
    if (formData.chest && formData.chest.trim() !== '') {
      const chestValue = parseFloat(formData.chest);
      if (isNaN(chestValue) || chestValue < 0 || chestValue > 300) {
        toast.error(t('goal_form.validation.chest_range', 'Vòng ngực phải từ 0 đến 300 cm'));
        return;
      }
    }
    if (formData.waist && formData.waist.trim() !== '') {
      const waistValue = parseFloat(formData.waist);
      if (isNaN(waistValue) || waistValue < 0 || waistValue > 300) {
        toast.error(t('goal_form.validation.waist_range', 'Vòng eo phải từ 0 đến 300 cm'));
        return;
      }
    }
    if (formData.hips && formData.hips.trim() !== '') {
      const hipsValue = parseFloat(formData.hips);
      if (isNaN(hipsValue) || hipsValue < 0 || hipsValue > 300) {
        toast.error(t('goal_form.validation.hips_range', 'Vòng mông phải từ 0 đến 300 cm'));
        return;
      }
    }

    // Validate arms: min 0, max 100
    if (formData.arms && formData.arms.trim() !== '') {
      const armsValue = parseFloat(formData.arms);
      if (isNaN(armsValue) || armsValue < 0 || armsValue > 100) {
        toast.error(t('goal_form.validation.arms_range', 'Vòng tay phải từ 0 đến 100 cm'));
        return;
      }
    }

    // Validate thighs: min 0, max 150
    if (formData.thighs && formData.thighs.trim() !== '') {
      const thighsValue = parseFloat(formData.thighs);
      if (isNaN(thighsValue) || thighsValue < 0 || thighsValue > 150) {
        toast.error(t('goal_form.validation.thighs_range', 'Vòng đùi phải từ 0 đến 150 cm'));
        return;
      }
    }

    // Validate percentages: min 0, max 100
    if (formData.bodyFatPercentage && formData.bodyFatPercentage.trim() !== '') {
      const bodyFatValue = parseFloat(formData.bodyFatPercentage);
      if (isNaN(bodyFatValue) || bodyFatValue < 0 || bodyFatValue > 100) {
        toast.error(t('goal_form.validation.body_fat_range', 'Tỷ lệ mỡ cơ thể phải từ 0 đến 100%'));
        return;
      }
    }
    if (formData.muscleMassPercentage && formData.muscleMassPercentage.trim() !== '') {
      const muscleMassValue = parseFloat(formData.muscleMassPercentage);
      if (isNaN(muscleMassValue) || muscleMassValue < 0 || muscleMassValue > 100) {
        toast.error(t('goal_form.validation.muscle_mass_range', 'Tỷ lệ cơ bắp phải từ 0 đến 100%'));
        return;
      }
    }
    if (formData.bodyWaterPercentage && formData.bodyWaterPercentage.trim() !== '') {
      const bodyWaterValue = parseFloat(formData.bodyWaterPercentage);
      if (isNaN(bodyWaterValue) || bodyWaterValue < 0 || bodyWaterValue > 100) {
        toast.error(t('goal_form.validation.body_water_range', 'Tỷ lệ nước phải từ 0 đến 100%'));
        return;
      }
    }

    // Validate metabolic age: min 1, max 150
    if (formData.metabolicAge && formData.metabolicAge.trim() !== '') {
      const metabolicAgeValue = parseInt(formData.metabolicAge, 10);
      if (isNaN(metabolicAgeValue) || metabolicAgeValue < 1 || metabolicAgeValue > 150) {
        toast.error(t('goal_form.validation.metabolic_age_range', 'Tuổi trao đổi chất phải từ 1 đến 150'));
        return;
      }
    }

    // Build targets object - only include non-empty values
    const targets: Record<string, number> = {};
    if (formData.weight && formData.weight.trim() !== '') {
      targets.weight = parseFloat(formData.weight);
    }
    if (formData.height && formData.height.trim() !== '') {
      targets.height = parseFloat(formData.height);
    }
    if (formData.strength && formData.strength.trim() !== '') {
      targets.strength = parseFloat(formData.strength);
    }
    if (formData.bodyFatPercentage && formData.bodyFatPercentage.trim() !== '') {
      targets.bodyFatPercentage = parseFloat(formData.bodyFatPercentage);
    }
    if (formData.chest && formData.chest.trim() !== '') {
      targets.chest = parseFloat(formData.chest);
    }
    if (formData.waist && formData.waist.trim() !== '') {
      targets.waist = parseFloat(formData.waist);
    }
    if (formData.hips && formData.hips.trim() !== '') {
      targets.hips = parseFloat(formData.hips);
    }
    if (formData.arms && formData.arms.trim() !== '') {
      targets.arms = parseFloat(formData.arms);
    }
    if (formData.thighs && formData.thighs.trim() !== '') {
      targets.thighs = parseFloat(formData.thighs);
    }
    if (formData.muscleMassPercentage && formData.muscleMassPercentage.trim() !== '') {
      targets.muscleMassPercentage = parseFloat(formData.muscleMassPercentage);
    }
    if (formData.bodyWaterPercentage && formData.bodyWaterPercentage.trim() !== '') {
      targets.bodyWaterPercentage = parseFloat(formData.bodyWaterPercentage);
    }
    if (formData.metabolicAge && formData.metabolicAge.trim() !== '') {
      targets.metabolicAge = parseInt(formData.metabolicAge, 10);
    }

    if (Object.keys(targets).length === 0) {
      toast.error(t('goal_form.at_least_one_target', 'At least one target must be specified'));
      return;
    }

    // Helper: build initialProgress payload từ baselineData
    const buildInitialProgressPayload = () => {
      // Bắt buộc phải có đủ 3 giá trị chính mới gửi initialProgress
      if (!baselineData.weight.trim() || !baselineData.height.trim() || !baselineData.strength.trim()) {
        return undefined;
      }

      const toNumber = (value?: string) => {
        if (!value || value.trim() === '') return undefined;
        const num = parseFloat(value);
        return Number.isFinite(num) ? num : undefined;
      };

      return {
        date: formData.startDate,
        weight: toNumber(baselineData.weight),
        height: toNumber(baselineData.height),
        strength: toNumber(baselineData.strength),
        bodyFatPercentage: toNumber(baselineData.bodyFatPercentage),
        chest: toNumber(baselineData.chest),
        waist: toNumber(baselineData.waist),
        hips: toNumber(baselineData.hips),
        arms: toNumber(baselineData.arms),
        thighs: toNumber(baselineData.thighs),
        muscleMassPercentage: toNumber(baselineData.muscleMassPercentage),
        bodyWaterPercentage: toNumber(baselineData.bodyWaterPercentage),
        metabolicAge: toNumber(baselineData.metabolicAge),
        notes: baselineData.notes?.trim() || undefined
      };
    };

    const initialProgress = buildInitialProgressPayload();

    try {
      if (isEditing && initialGoal) {
        const updateData: UpdateCustomerGoalRequest = {
          name: formData.name,
          description: formData.description || undefined,
          startDate: formData.startDate,
          endDate: formData.endDate,
          targets,
          // Nếu có baseline mới thì gửi initialProgress cho backend xử lý (nếu backend hỗ trợ)
          initialProgress
        };
        const response = await updateGoal(initialGoal._id || initialGoal.id || '', updateData);
        if (response.success) {
          toast.success(t('goal_form.goal_updated', 'Goal updated successfully'));
          onSubmit();
        } else {
          toast.error(response.message || t('goal_form.update_failed', 'Failed to update goal'));
        }
      } else {
        const createData: CreateCustomerGoalRequest = {
          customerId,
          serviceContractId: serviceContractId || undefined,
          trainerId: trainerId || undefined,
          // branchId is optional - backend will extract from serviceContract if available
          branchId: branchId || undefined,
          name: formData.name,
          description: formData.description || undefined,
          startDate: formData.startDate,
          endDate: formData.endDate,
          targets,
          initialProgress
        };
        const response = await createGoal(createData);
        if (response.success) {
          toast.success(t('goal_form.goal_created', 'Goal created successfully'));
          onSubmit();
        } else {
          toast.error(response.message || t('goal_form.create_failed', 'Failed to create goal'));
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('goal_form.error', 'An error occurred'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      {/* Goal Name */}
      <div className="space-y-2">
        <Label htmlFor="name">{t('goal_form.name', 'Goal Name')} *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder={t('goal_form.name_placeholder', 'Nhập tên mục tiêu (ví dụ: Giảm mỡ Q1 2025)')}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">{t('goal_form.description', 'Description')}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder={t('goal_form.description_placeholder', 'Mô tả mục tiêu bạn muốn đạt được...')}
          rows={3}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">{t('goal_form.start_date', 'Start Date')} *</Label>
          <Popover open={startDateOpen} onOpenChange={setStartDateOpen} modal={false}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between text-left font-normal">
                <span className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {selectedStartDate
                    ? format(selectedStartDate, 'dd/MM/yyyy', { locale: vi })
                    : t('membership_registration.activation_date_placeholder', { defaultValue: 'Chọn ngày bắt đầu' })}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto rounded-2xl border border-border bg-white p-0 shadow-lg z-[9999]"
              align="start"
              side="bottom"
              sideOffset={8}
              collisionPadding={8}
            >
              <CalendarComponent
                mode="single"
                selected={selectedStartDate}
                onSelect={(date) => {
                  if (date) {
                    setFormData((prev) => ({ ...prev, startDate: format(date, 'yyyy-MM-dd') }));
                    setStartDateOpen(false);
                  }
                }}
                initialFocus
                locale={vi}
                className="bg-white"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">{t('goal_form.end_date', 'End Date')} *</Label>
          <Popover open={endDateOpen} onOpenChange={setEndDateOpen} modal={false}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between text-left font-normal">
                <span className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {selectedEndDate
                    ? format(selectedEndDate, 'dd/MM/yyyy', { locale: vi })
                    : t('membership_registration.activation_date_placeholder', { defaultValue: 'Chọn ngày kết thúc' })}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto rounded-2xl border border-border bg-white p-0 shadow-lg z-[9999]"
              align="start"
              side="bottom"
              sideOffset={8}
              collisionPadding={8}
            >
              <CalendarComponent
                mode="single"
                selected={selectedEndDate}
                onSelect={(date) => {
                  if (date) {
                    setFormData((prev) => ({ ...prev, endDate: format(date, 'yyyy-MM-dd') }));
                    setEndDateOpen(false);
                  }
                }}
                initialFocus
                locale={vi}
                className="bg-white"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Targets Toggle */}
      <div className="border rounded-lg bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowTargets(!showTargets)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 rounded-lg transition-colors"
        >
          <span className="font-medium text-[#101D33]">{t('goal_form.targets', 'Targets')} *</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showTargets ? 'rotate-180' : ''}`} />
        </button>

        {showTargets && (
          <div className="px-4 pb-4 space-y-4">
            <div className="flex flex-col gap-3 rounded-lg bg-slate-50/80 px-3 py-3">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 text-[#F05A29]" />
                <p>
                  {t(
                    'goal_form.targets_helper',
                    'Cột Hiện tại dùng làm mốc ban đầu; cột Mục tiêu là đích đến. Sao chép nhanh từ Hiện tại nếu mục tiêu gần với mốc xuất phát.'
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  {t('goal_form.current_column', 'Hiện tại')}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="rounded-full border border-[#F05A29]/30 bg-[#FFF7F3] px-3 py-1 text-xs font-medium text-[#F05A29]">
                  {t('goal_form.target_column', 'Mục tiêu')}
                </span>
              </div>
            </div>
            {/* Basic: Current vs Target */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('goal_form.weight', 'Weight (kg)')}</Label>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <Input
                    id="currentWeight"
                    type="number"
                    step="0.1"
                    min="0"
                    max="500"
                    placeholder="..."
                    value={baselineData.weight}
                    onChange={(e) => handleBaselineChange('weight', e.target.value)}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                  <Input
                    id="targetWeight"
                    type="number"
                    step="0.1"
                    min="0"
                    max="500"
                    placeholder="..."
                    value={formData.weight}
                    onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                    className={targetInputClass}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('goal_form.height', 'Height (cm)')}</Label>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <Input
                    id="currentHeight"
                    type="number"
                    step="1"
                    min="0"
                    max="300"
                    placeholder="..."
                    value={baselineData.height}
                    onChange={(e) => handleBaselineChange('height', e.target.value)}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                  <Input
                    id="targetHeight"
                    type="number"
                    step="1"
                    min="0"
                    max="300"
                    placeholder="..."
                    value={formData.height}
                    onChange={(e) => setFormData((prev) => ({ ...prev, height: e.target.value }))}
                    className={targetInputClass}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('goal_form.strength', 'Strength')}</Label>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <Input
                    id="currentStrength"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="..."
                    value={baselineData.strength}
                    onChange={(e) => handleBaselineChange('strength', e.target.value)}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                  <Input
                    id="targetStrength"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="..."
                    value={formData.strength}
                    onChange={(e) => setFormData((prev) => ({ ...prev, strength: e.target.value }))}
                    className={targetInputClass}
                  />
                </div>
              </div>
            </div>

            {/* Measurements: Current vs Target */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('goal_form.chest', 'Chest (cm)')}</Label>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <Input
                    id="currentChest"
                    type="number"
                    step="0.1"
                    min="0"
                    max="300"
                    placeholder="..."
                    value={baselineData.chest}
                    onChange={(e) => handleBaselineChange('chest', e.target.value)}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                  <Input
                    id="targetChest"
                    type="number"
                    step="0.1"
                    min="0"
                    max="300"
                    placeholder="..."
                    value={formData.chest}
                    onChange={(e) => setFormData((prev) => ({ ...prev, chest: e.target.value }))}
                    className={targetInputClass}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('goal_form.waist', 'Waist (cm)')}</Label>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <Input
                    id="currentWaist"
                    type="number"
                    step="0.1"
                    min="0"
                    max="300"
                    placeholder="..."
                    value={baselineData.waist}
                    onChange={(e) => handleBaselineChange('waist', e.target.value)}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                  <Input
                    id="targetWaist"
                    type="number"
                    step="0.1"
                    min="0"
                    max="300"
                    placeholder="..."
                    value={formData.waist}
                    onChange={(e) => setFormData((prev) => ({ ...prev, waist: e.target.value }))}
                    className={targetInputClass}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('goal_form.hips', 'Hips (cm)')}</Label>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <Input
                    id="currentHips"
                    type="number"
                    step="0.1"
                    min="0"
                    max="300"
                    placeholder="..."
                    value={baselineData.hips}
                    onChange={(e) => handleBaselineChange('hips', e.target.value)}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                  <Input
                    id="targetHips"
                    type="number"
                    step="0.1"
                    min="0"
                    max="300"
                    placeholder="..."
                    value={formData.hips}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hips: e.target.value }))}
                    className={targetInputClass}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('goal_form.arms', 'Arms (cm)')}</Label>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <Input
                    id="currentArms"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="..."
                    value={baselineData.arms}
                    onChange={(e) => handleBaselineChange('arms', e.target.value)}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                  <Input
                    id="targetArms"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="..."
                    value={formData.arms}
                    onChange={(e) => setFormData((prev) => ({ ...prev, arms: e.target.value }))}
                    className={targetInputClass}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('goal_form.thighs', 'Thighs (cm)')}</Label>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <Input
                    id="currentThighs"
                    type="number"
                    step="0.1"
                    min="0"
                    max="150"
                    placeholder="..."
                    value={baselineData.thighs}
                    onChange={(e) => handleBaselineChange('thighs', e.target.value)}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                  <Input
                    id="targetThighs"
                    type="number"
                    step="0.1"
                    min="0"
                    max="150"
                    placeholder="..."
                    value={formData.thighs}
                    onChange={(e) => setFormData((prev) => ({ ...prev, thighs: e.target.value }))}
                    className={targetInputClass}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('goal_form.body_fat', 'Body Fat %')}</Label>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <Input
                    id="currentBodyFat"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="..."
                    value={baselineData.bodyFatPercentage}
                    onChange={(e) => handleBaselineChange('bodyFatPercentage', e.target.value)}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                  <Input
                    id="targetBodyFat"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="..."
                    value={formData.bodyFatPercentage}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bodyFatPercentage: e.target.value }))}
                    className={targetInputClass}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('goal_form.muscle_mass', 'Muscle Mass %')}</Label>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <Input
                    id="currentMuscleMass"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="..."
                    value={baselineData.muscleMassPercentage}
                    onChange={(e) => handleBaselineChange('muscleMassPercentage', e.target.value)}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                  <Input
                    id="targetMuscleMass"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="..."
                    value={formData.muscleMassPercentage}
                    onChange={(e) => setFormData((prev) => ({ ...prev, muscleMassPercentage: e.target.value }))}
                    className={targetInputClass}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('goal_form.body_water', 'Body Water %')}</Label>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <Input
                    id="currentBodyWater"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="..."
                    value={baselineData.bodyWaterPercentage}
                    onChange={(e) => handleBaselineChange('bodyWaterPercentage', e.target.value)}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                  <Input
                    id="targetBodyWater"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="..."
                    value={formData.bodyWaterPercentage}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bodyWaterPercentage: e.target.value }))}
                    className={targetInputClass}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('goal_form.metabolic_age', 'Metabolic Age')}</Label>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <Input
                    id="currentMetabolicAge"
                    type="number"
                    step="1"
                    min="1"
                    max="150"
                    placeholder="..."
                    value={baselineData.metabolicAge}
                    onChange={(e) => handleBaselineChange('metabolicAge', e.target.value)}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                  <Input
                    id="targetMetabolicAge"
                    type="number"
                    step="1"
                    min="1"
                    max="150"
                    placeholder="..."
                    value={formData.metabolicAge}
                    onChange={(e) => setFormData((prev) => ({ ...prev, metabolicAge: e.target.value }))}
                    className={targetInputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={createLoading || updateLoading}
          className="flex-1 bg-[#F05A29] hover:bg-[#E04A1F] text-white"
        >
          {createLoading || updateLoading
            ? isEditing
              ? t('goal_form.updating', 'Updating...')
              : t('goal_form.creating', 'Creating...')
            : isEditing
              ? t('goal_form.update_goal', 'Update Goal')
              : t('goal_form.create_goal', 'Create Goal')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={createLoading || updateLoading}
          className="flex-1"
        >
          {t('goal_form.cancel', 'Cancel')}
        </Button>
      </div>
    </form>
  );
};
