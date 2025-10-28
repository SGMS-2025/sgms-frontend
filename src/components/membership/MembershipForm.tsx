import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BranchSelector } from './BranchSelector';

import type { MembershipPlan, MembershipPlanBranchInfo } from '@/types/api/Membership';
import type { MembershipOverrideFormValues, MembershipTemplateFormValues } from '@/types/forms/membership';

interface MembershipFormProps {
  isOpen: boolean;
  onClose: () => void;
  isCreateMode: boolean;
  plan?: MembershipPlan;
  editingBranchId?: string;
  branchOptions: MembershipPlanBranchInfo[];
  branchMap: Record<string, MembershipPlanBranchInfo>;
  onSubmit: (
    data: MembershipTemplateFormValues | MembershipOverrideFormValues
  ) => Promise<{ success: boolean; message?: string }>;
  isSubmitting?: boolean;
}

const initialTemplateForm: MembershipTemplateFormValues = {
  name: '',
  description: '',
  price: '',
  currency: 'VND',
  durationInMonths: '1',
  benefits: '',
  branchId: [],
  isActive: true
};

const initialOverrideForm: MembershipOverrideFormValues = {
  name: '',
  description: '',
  price: '',
  currency: 'VND',
  durationInMonths: '1',
  benefits: '',
  targetBranchIds: [],
  revertBranchIds: [],
  isActive: true
};

export const MembershipForm: React.FC<MembershipFormProps> = ({
  isOpen,
  onClose,
  isCreateMode,
  plan,
  editingBranchId,
  branchOptions,
  branchMap,
  onSubmit,
  isSubmitting = false
}) => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'template' | 'overrides'>('template');
  const [templateForm, setTemplateForm] = useState<MembershipTemplateFormValues>(initialTemplateForm);
  const [overrideForm, setOverrideForm] = useState<MembershipOverrideFormValues>(initialOverrideForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset forms when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (isCreateMode) {
        setTemplateForm(initialTemplateForm);
        setOverrideForm(initialOverrideForm);
        setActiveTab('template');
      } else if (plan) {
        // Load existing plan data for template form
        setTemplateForm({
          name: plan.name,
          description: plan.description || '',
          price: plan.price.toString(),
          currency: plan.currency,
          durationInMonths: plan.durationInMonths.toString(),
          benefits: plan.benefits.join('\n'),
          branchId: plan.branchId?.map((b) => b._id) || [],
          isActive: plan.isActive
        });

        // If editing an override (editingBranchId exists), find and load the override data
        let overrideData = null;
        if (editingBranchId && plan.overrides) {
          overrideData = plan.overrides.find((override) => override.appliesToBranchId === editingBranchId);
        }

        // Pre-populate override form with override data if editing, otherwise use template data as defaults
        setOverrideForm({
          name: overrideData?.name || plan.name,
          description: overrideData?.description || plan.description || '',
          price: (overrideData?.price || plan.price).toString(),
          currency: overrideData?.currency || plan.currency,
          durationInMonths: (overrideData?.durationInMonths || plan.durationInMonths).toString(),
          benefits: (overrideData?.benefits || plan.benefits).join('\n'),
          targetBranchIds: editingBranchId ? [editingBranchId] : [],
          revertBranchIds: [],
          isActive: overrideData?.isActive ?? plan.isActive
        });

        // Set active tab based on context: if editing from override detail, open Branches tab
        setActiveTab(editingBranchId ? 'overrides' : 'template');
      }
      setErrors({});
    }
  }, [isOpen, isCreateMode, plan, editingBranchId]);

  const updateTemplateForm = <Field extends keyof MembershipTemplateFormValues>(
    field: Field,
    value: MembershipTemplateFormValues[Field]
  ) => {
    setTemplateForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const updateOverrideForm = <Field extends keyof MembershipOverrideFormValues>(
    field: Field,
    value: MembershipOverrideFormValues[Field]
  ) => {
    setOverrideForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (formData: MembershipTemplateFormValues | MembershipOverrideFormValues): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('membershipManager.validation.nameRequired');
    }

    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = t('membershipManager.validation.priceInvalid');
    }

    if (
      !formData.durationInMonths ||
      isNaN(Number(formData.durationInMonths)) ||
      Number(formData.durationInMonths) <= 0
    ) {
      newErrors.durationInMonths = t('membershipManager.validation.durationInvalid');
    }

    if ('branchId' in formData && (!formData.branchId || formData.branchId.length === 0)) {
      newErrors.branchId = t('membershipManager.validation.branchMissing');
    }

    if ('targetBranchIds' in formData) {
      if (formData.targetBranchIds.length === 0 && formData.revertBranchIds.length === 0) {
        newErrors.targetBranchIds = t('membershipManager.validation.overrideDataMissing');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    const formData = activeTab === 'template' ? templateForm : overrideForm;

    if (!validateForm(formData)) {
      return;
    }

    const response = await onSubmit(formData);
    if (response?.success) {
      onClose();
    }
  };

  const handleTemplateBranchToggle = (branchId: string) => {
    const isSelected = templateForm.branchId.includes(branchId);
    updateTemplateForm(
      'branchId',
      isSelected ? templateForm.branchId.filter((id) => id !== branchId) : [...templateForm.branchId, branchId]
    );
  };

  const handleOverrideTargetToggle = (branchId: string) => {
    const isSelected = overrideForm.targetBranchIds.includes(branchId);
    updateOverrideForm(
      'targetBranchIds',
      isSelected
        ? overrideForm.targetBranchIds.filter((id) => id !== branchId)
        : [...overrideForm.targetBranchIds, branchId]
    );
  };

  const handleOverrideRevertToggle = (branchId: string) => {
    const isSelected = overrideForm.revertBranchIds.includes(branchId);
    updateOverrideForm(
      'revertBranchIds',
      isSelected
        ? overrideForm.revertBranchIds.filter((id) => id !== branchId)
        : [...overrideForm.revertBranchIds, branchId]
    );
  };

  const getBranchesUsingTemplate = () => {
    if (!plan) {
      return [];
    }
    return (
      plan.branchId
        ?.map((branch) => branchMap[branch._id] ?? branch)
        .filter((branch): branch is MembershipPlanBranchInfo => Boolean(branch)) || []
    );
  };

  const getBranchesUsingOverride = () => {
    if (!plan) {
      return [];
    }
    return plan.overrides?.map((override) => branchMap[override.appliesToBranchId]).filter(Boolean) ?? [];
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex h-full w-full flex-col overflow-hidden sm:max-w-2xl">
        <SheetHeader className="px-4 pt-6 pb-4">
          <SheetTitle>
            {isCreateMode ? t('membershipManager.sheet.createTitle') : t('membershipManager.sheet.editTitle')}
          </SheetTitle>
          <SheetDescription>
            {isCreateMode
              ? t('membershipManager.sheet.createDescription')
              : t('membershipManager.sheet.editDescription')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 px-4 min-h-0 overflow-y-auto">
          <div className="space-y-6 pb-6">
            {!isCreateMode && (
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'template' | 'overrides')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="template">{t('membershipManager.sheet.scopeTemplate')}</TabsTrigger>
                  <TabsTrigger value="overrides">{t('membershipManager.sheet.scopeBranches')}</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {activeTab === 'template' && (
              <div className="space-y-6">
                <Alert>
                  <AlertDescription>{t('membershipManager.sheet.templateGuidance')}</AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">{t('membershipManager.sheet.form.name')}</Label>
                      <Input
                        id="template-name"
                        value={templateForm.name}
                        onChange={(e) => updateTemplateForm('name', e.target.value)}
                        placeholder={t('membershipManager.sheet.form.namePlaceholder')}
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-price">{t('membershipManager.sheet.form.price')}</Label>
                      <div className="flex gap-2">
                        <Input
                          id="template-price"
                          type="number"
                          value={templateForm.price}
                          onChange={(e) => updateTemplateForm('price', e.target.value)}
                          className={errors.price ? 'border-red-500' : ''}
                        />
                        <select
                          value={templateForm.currency}
                          onChange={(e) => updateTemplateForm('currency', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="VND">VND</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                      {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template-description">{t('membershipManager.sheet.form.description')}</Label>
                    <Textarea
                      id="template-description"
                      value={templateForm.description}
                      onChange={(e) => updateTemplateForm('description', e.target.value)}
                      placeholder={t('membershipManager.sheet.form.descriptionPlaceholder')}
                    />
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="template-duration">{t('membershipManager.sheet.form.duration')}</Label>
                      <Input
                        id="template-duration"
                        type="number"
                        value={templateForm.durationInMonths}
                        onChange={(e) => updateTemplateForm('durationInMonths', e.target.value)}
                        className={errors.durationInMonths ? 'border-red-500' : ''}
                      />
                      {errors.durationInMonths && <p className="text-sm text-red-500">{errors.durationInMonths}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template-benefits">{t('membershipManager.sheet.form.benefits')}</Label>
                    <Textarea
                      id="template-benefits"
                      rows={4}
                      value={templateForm.benefits}
                      onChange={(e) => updateTemplateForm('benefits', e.target.value)}
                      placeholder={t('membershipManager.sheet.form.benefitsPlaceholder')}
                    />
                  </div>

                  <BranchSelector
                    branches={branchOptions}
                    selectedBranchIds={templateForm.branchId}
                    onToggleBranch={handleTemplateBranchToggle}
                    branchMap={branchMap}
                    title={t('membershipManager.sheet.form.applyBranches')}
                    selectedCount={templateForm.branchId.length}
                    emptyMessage={t('membershipManager.sheet.form.noBranches')}
                  />

                  <div className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        {t('membershipManager.sheet.form.statusTitle')}
                      </h4>
                      <p className="text-xs text-slate-500">{t('membershipManager.sheet.form.statusHint')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">
                        {templateForm.isActive
                          ? t('membershipManager.sheet.form.activeStatus')
                          : t('membershipManager.sheet.form.inactiveStatus')}
                      </span>
                      <Switch
                        checked={templateForm.isActive}
                        onCheckedChange={(value) => updateTemplateForm('isActive', value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'overrides' && (
              <div className="space-y-6">
                <Alert>
                  <AlertDescription>{t('membershipManager.sheet.overrideGuidance')}</AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="override-name">{t('membershipManager.sheet.form.name')}</Label>
                      <Input
                        id="override-name"
                        value={overrideForm.name}
                        onChange={(e) => updateOverrideForm('name', e.target.value)}
                        placeholder={t('membershipManager.sheet.form.namePlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="override-price">{t('membershipManager.sheet.form.price')}</Label>
                      <div className="flex gap-2">
                        <Input
                          id="override-price"
                          type="number"
                          value={overrideForm.price}
                          onChange={(e) => updateOverrideForm('price', e.target.value)}
                        />
                        <select
                          value={overrideForm.currency}
                          onChange={(e) => updateOverrideForm('currency', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="VND">VND</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="override-description">{t('membershipManager.sheet.form.description')}</Label>
                    <Textarea
                      id="override-description"
                      value={overrideForm.description}
                      onChange={(e) => updateOverrideForm('description', e.target.value)}
                      placeholder={t('membershipManager.sheet.form.descriptionPlaceholder')}
                    />
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="override-duration">{t('membershipManager.sheet.form.duration')}</Label>
                      <Input
                        id="override-duration"
                        type="number"
                        value={overrideForm.durationInMonths}
                        onChange={(e) => updateOverrideForm('durationInMonths', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="override-benefits">{t('membershipManager.sheet.form.benefits')}</Label>
                    <Textarea
                      id="override-benefits"
                      rows={4}
                      value={overrideForm.benefits}
                      onChange={(e) => updateOverrideForm('benefits', e.target.value)}
                      placeholder={t('membershipManager.sheet.form.benefitsPlaceholder')}
                    />
                  </div>

                  <BranchSelector
                    branches={getBranchesUsingTemplate()}
                    selectedBranchIds={overrideForm.targetBranchIds}
                    onToggleBranch={handleOverrideTargetToggle}
                    branchMap={branchMap}
                    title={t('membershipManager.sheet.overrideTargets')}
                    selectedCount={overrideForm.targetBranchIds.length}
                    emptyMessage={t('membershipManager.sheet.noTargetBranches')}
                  />

                  <BranchSelector
                    branches={getBranchesUsingOverride()}
                    selectedBranchIds={overrideForm.revertBranchIds}
                    onToggleBranch={handleOverrideRevertToggle}
                    branchMap={branchMap}
                    title={t('membershipManager.sheet.overrideReverts')}
                    selectedCount={overrideForm.revertBranchIds.length}
                    emptyMessage={t('membershipManager.sheet.noRevertBranches')}
                  />

                  <div className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        {t('membershipManager.sheet.overrideStatusTitle')}
                      </h4>
                      <p className="text-xs text-slate-500">{t('membershipManager.sheet.overrideStatusHint')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">
                        {overrideForm.isActive
                          ? t('membershipManager.sheet.form.activeStatus')
                          : t('membershipManager.sheet.form.inactiveStatus')}
                      </span>
                      <Switch
                        checked={overrideForm.isActive}
                        onCheckedChange={(value) => updateOverrideForm('isActive', value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="px-4 pb-6">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t('membershipManager.sheet.actions.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <div className="mr-2 h-4 w-4" />
                  {t('membershipManager.sheet.actions.save')}
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
