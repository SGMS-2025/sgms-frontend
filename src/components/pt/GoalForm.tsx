import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useCustomerGoal } from '@/hooks/useCustomerGoal';
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
    bmi: '',
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

  const [showTargets, setShowTargets] = useState(false);

  useEffect(() => {
    if (initialGoal) {
      setFormData({
        name: initialGoal.name || '',
        description: initialGoal.description || '',
        startDate: initialGoal.startDate ? new Date(initialGoal.startDate).toISOString().split('T')[0] : '',
        endDate: initialGoal.endDate ? new Date(initialGoal.endDate).toISOString().split('T')[0] : '',
        weight: initialGoal.targets?.weight?.toString() || '',
        bmi: initialGoal.targets?.bmi?.toString() || '',
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
          initialGoal.targets?.bmi ||
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
    }
  }, [initialGoal]);

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

    // Build targets object - only include non-empty values
    const targets: Record<string, number> = {};
    if (formData.weight && formData.weight.trim() !== '') {
      targets.weight = parseFloat(formData.weight);
    }
    if (formData.bmi && formData.bmi.trim() !== '') {
      targets.bmi = parseFloat(formData.bmi);
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

    try {
      if (isEditing && initialGoal) {
        const updateData: UpdateCustomerGoalRequest = {
          name: formData.name,
          description: formData.description || undefined,
          startDate: formData.startDate,
          endDate: formData.endDate,
          targets
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
          targets
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
          placeholder={t('goal_form.name_placeholder', 'e.g., Giảm cân & tăng cơ - Q1 2025')}
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
          placeholder={t('goal_form.description_placeholder', 'Describe your goal...')}
          rows={3}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">{t('goal_form.start_date', 'Start Date')} *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">{t('goal_form.end_date', 'End Date')} *</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
            required
          />
        </div>
      </div>

      {/* Targets Toggle */}
      <div className="border rounded-lg">
        <button
          type="button"
          onClick={() => setShowTargets(!showTargets)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 rounded-lg transition-colors"
        >
          <span className="font-medium text-[#101D33]">{t('goal_form.targets', 'Targets')} *</span>
          <span className={`transform transition-transform ${showTargets ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {showTargets && (
          <div className="px-4 pb-4 space-y-4">
            {/* Basic Targets */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">{t('goal_form.weight', 'Weight (kg)')}</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="70"
                  value={formData.weight}
                  onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bmi">{t('goal_form.bmi', 'BMI')}</Label>
                <Input
                  id="bmi"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="22"
                  value={formData.bmi}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bmi: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="strength">{t('goal_form.strength', 'Strength')}</Label>
                <Input
                  id="strength"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  placeholder="80"
                  value={formData.strength}
                  onChange={(e) => setFormData((prev) => ({ ...prev, strength: e.target.value }))}
                />
              </div>
            </div>

            {/* Body Measurements */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chest">{t('goal_form.chest', 'Chest (cm)')}</Label>
                <Input
                  id="chest"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="95"
                  value={formData.chest}
                  onChange={(e) => setFormData((prev) => ({ ...prev, chest: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waist">{t('goal_form.waist', 'Waist (cm)')}</Label>
                <Input
                  id="waist"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="80"
                  value={formData.waist}
                  onChange={(e) => setFormData((prev) => ({ ...prev, waist: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hips">{t('goal_form.hips', 'Hips (cm)')}</Label>
                <Input
                  id="hips"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="95"
                  value={formData.hips}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hips: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arms">{t('goal_form.arms', 'Arms (cm)')}</Label>
                <Input
                  id="arms"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="35"
                  value={formData.arms}
                  onChange={(e) => setFormData((prev) => ({ ...prev, arms: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thighs">{t('goal_form.thighs', 'Thighs (cm)')}</Label>
                <Input
                  id="thighs"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="55"
                  value={formData.thighs}
                  onChange={(e) => setFormData((prev) => ({ ...prev, thighs: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyFatPercentage">{t('goal_form.body_fat', 'Body Fat %')}</Label>
                <Input
                  id="bodyFatPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="18"
                  value={formData.bodyFatPercentage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bodyFatPercentage: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="muscleMassPercentage">{t('goal_form.muscle_mass', 'Muscle Mass %')}</Label>
                <Input
                  id="muscleMassPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="45"
                  value={formData.muscleMassPercentage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, muscleMassPercentage: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyWaterPercentage">{t('goal_form.body_water', 'Body Water %')}</Label>
                <Input
                  id="bodyWaterPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="55"
                  value={formData.bodyWaterPercentage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bodyWaterPercentage: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metabolicAge">{t('goal_form.metabolic_age', 'Metabolic Age')}</Label>
                <Input
                  id="metabolicAge"
                  type="number"
                  step="1"
                  min="1"
                  max="150"
                  placeholder="25"
                  value={formData.metabolicAge}
                  onChange={(e) => setFormData((prev) => ({ ...prev, metabolicAge: e.target.value }))}
                />
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
