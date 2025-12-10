import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TFunction } from 'i18next';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/utils/utils';
import type { MealPlanStatus, DayPlan, Meal, MealItem } from '@/types/api/MealPlan';

export interface MealPlanFormValues {
  customerId: string;
  customerGoalId: string;
  name: string;
  goal?: string;
  focus?: string;
  targetCalories?: number;
  notes?: string;
  coachingNotes?: string;
  status?: MealPlanStatus;
  days?: DayPlan[];
}

interface MealPlanFormProps {
  initialValues: MealPlanFormValues;
  loading?: boolean;
  onSubmit: (values: MealPlanFormValues) => void;
}

// Zod schema builder with i18n
const buildMealPlanSchema = (t: TFunction) => {
  const mealItemSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, t('meal_plan.validation.item_name_required'))
      .max(200, t('meal_plan.validation.item_name_max')),
    calories: z
      .number()
      .min(0, t('meal_plan.validation.item_calories_min'))
      .max(5000, t('meal_plan.validation.item_calories_max'))
      .optional()
      .or(z.undefined()),
    protein: z
      .number()
      .min(0, t('meal_plan.validation.item_protein_min'))
      .max(500, t('meal_plan.validation.item_protein_max'))
      .optional()
      .or(z.undefined()),
    carbs: z
      .number()
      .min(0, t('meal_plan.validation.item_carbs_min'))
      .max(1000, t('meal_plan.validation.item_carbs_max'))
      .optional()
      .or(z.undefined()),
    fat: z
      .number()
      .min(0, t('meal_plan.validation.item_fat_min'))
      .max(500, t('meal_plan.validation.item_fat_max'))
      .optional()
      .or(z.undefined()),
    ingredients: z
      .array(z.string().trim().max(200, t('meal_plan.validation.ingredient_max')))
      .optional()
      .default([])
  });

  const mealSchema = z.object({
    mealType: z
      .string()
      .trim()
      .min(1, t('meal_plan.validation.meal_type_required'))
      .max(100, t('meal_plan.validation.meal_type_max')),
    items: z.array(mealItemSchema).min(1, t('meal_plan.validation.items_min')).default([]),
    totalCalories: z
      .number()
      .min(0, t('meal_plan.validation.meal_total_calories_min'))
      .max(5000, t('meal_plan.validation.meal_total_calories_max'))
      .optional()
      .or(z.undefined()),
    notes: z.string().trim().max(500, t('meal_plan.validation.meal_notes_max')).optional().or(z.undefined())
  });

  const dayPlanSchema = z.object({
    day: z.string().trim().min(1, t('meal_plan.validation.day_required')).max(100, t('meal_plan.validation.day_max')),
    meals: z
      .array(mealSchema)
      .min(3, t('meal_plan.validation.meals_min'))
      .default([])
      .superRefine((meals, ctx) => {
        const mealTypes = meals.map((meal) => meal.mealType?.trim().toLowerCase()).filter(Boolean);
        const duplicates = mealTypes.filter((type, index) => mealTypes.indexOf(type) !== index);

        if (duplicates.length > 0) {
          const uniqueDuplicates = new Set(duplicates);
          meals.forEach((meal, index) => {
            const mealTypeLower = meal.mealType?.trim().toLowerCase();
            if (uniqueDuplicates.has(mealTypeLower)) {
              ctx.addIssue({
                code: 'custom',
                message: t('meal_plan.validation.meal_type_duplicate'),
                path: [index, 'mealType']
              });
            }
          });
        }
      }),
    totalCalories: z
      .number()
      .min(0, t('meal_plan.validation.day_total_calories_min'))
      .max(10000, t('meal_plan.validation.day_total_calories_max'))
      .optional()
      .or(z.undefined())
  });

  return z.object({
    customerId: z.string().min(1),
    customerGoalId: z.string().min(1),
    name: z
      .string()
      .trim()
      .min(1, t('meal_plan.validation.name_required'))
      .max(200, t('meal_plan.validation.name_max')),
    goal: z.string().trim().max(500, t('meal_plan.validation.goal_max')).optional().or(z.undefined()),
    focus: z.string().trim().max(100, t('meal_plan.validation.focus_max')).optional().or(z.undefined()),
    targetCalories: z
      .number()
      .min(0, t('meal_plan.validation.target_calories_min'))
      .max(10000, t('meal_plan.validation.target_calories_max'))
      .optional()
      .or(z.undefined()),
    notes: z.string().trim().max(2000, t('meal_plan.validation.notes_max')).optional().or(z.undefined()),
    coachingNotes: z
      .string()
      .trim()
      .max(2000, t('meal_plan.validation.coaching_notes_max'))
      .optional()
      .or(z.undefined()),
    status: z.enum(['SUGGESTED', 'EDITED', 'FINAL', 'ARCHIVED', 'DELETED']).optional(),
    days: z
      .array(dayPlanSchema)
      .min(1, t('meal_plan.validation.days_min'))
      .max(14, t('meal_plan.validation.days_max'))
      .optional()
      .default([])
  });
};

export const MealPlanForm = ({ initialValues, loading, onSubmit }: MealPlanFormProps) => {
  const { t } = useTranslation();
  const schema = useMemo(() => buildMealPlanSchema(t), [t]);

  const computeMealWithTotal = (meal: Meal) => {
    const mealTotal = (meal.items || []).reduce((sum, item) => sum + (item.calories || 0), 0);
    return { ...meal, totalCalories: mealTotal > 0 ? mealTotal : undefined };
  };

  const computeDayWithTotals = (day: DayPlan) => {
    const meals = (day.meals || []).map(computeMealWithTotal);
    const dayTotal = meals.reduce((sum, m) => sum + (m.totalCalories || 0), 0);
    return { ...day, meals, totalCalories: dayTotal > 0 ? dayTotal : undefined };
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    trigger,
    formState: { errors }
  } = useForm<MealPlanFormValues>({
    resolver: zodResolver(schema) as Resolver<MealPlanFormValues>,
    defaultValues: {
      customerId: initialValues.customerId,
      customerGoalId: initialValues.customerGoalId,
      name: initialValues.name || '',
      goal: initialValues.goal,
      focus: initialValues.focus,
      targetCalories: initialValues.targetCalories,
      notes: initialValues.notes,
      coachingNotes: initialValues.coachingNotes,
      status: initialValues.status || 'SUGGESTED',
      days: initialValues.days || []
    },
    mode: 'onChange'
  });

  const {
    fields: dayFields,
    append: appendDay,
    remove: removeDay
  } = useFieldArray({
    control,
    name: 'days'
  });

  const watchedDays = watch('days') || [];

  const getArrayErrorMessage = (arrError: unknown): string | undefined => {
    if (!arrError || typeof arrError !== 'object') return undefined;
    const anyErr = arrError as { message?: unknown; _errors?: unknown; root?: { message?: unknown } };
    if (typeof anyErr.message === 'string') return anyErr.message;
    if (anyErr.root && typeof anyErr.root.message === 'string') return anyErr.root.message;
    if (Array.isArray(anyErr._errors) && typeof anyErr._errors[0] === 'string') return anyErr._errors[0] as string;
    return undefined;
  };

  // Recalculate totals when data changes
  useEffect(() => {
    if (!watchedDays || watchedDays.length === 0) return;

    const daysWithTotals = watchedDays.map(computeDayWithTotals);

    // Clear day.meals min errors when satisfied
    watchedDays.forEach((d, idx) => {
      if ((d.meals?.length || 0) >= 3) {
        clearErrors(`days.${idx}.meals`);
      }
    });

    // Update days with calculated totals
    daysWithTotals.forEach((day, dayIdx) => {
      const currentDay = watchedDays[dayIdx];
      const currentDayTotal = currentDay?.totalCalories ?? undefined;
      const newDayTotal = day.totalCalories ?? undefined;

      // Update day totalCalories
      if (currentDayTotal !== newDayTotal) {
        setValue(`days.${dayIdx}.totalCalories`, newDayTotal, { shouldValidate: false, shouldDirty: false });
      }

      // Update meal totalCalories
      day.meals?.forEach((meal, mealIdx) => {
        const currentMeal = currentDay?.meals?.[mealIdx];
        const currentMealTotal = currentMeal?.totalCalories ?? undefined;
        const newMealTotal = meal.totalCalories ?? undefined;

        if (currentMealTotal !== newMealTotal) {
          setValue(`days.${dayIdx}.meals.${mealIdx}.totalCalories`, newMealTotal, {
            shouldValidate: false,
            shouldDirty: false
          });
        }
      });
    });

    // Calculate target calories (sum of all days)
    const countedDays = daysWithTotals.filter((d) => typeof d.totalCalories === 'number' && d.totalCalories > 0);
    const targetCalories =
      countedDays.length > 0 ? countedDays.reduce((sum, d) => sum + (d.totalCalories || 0), 0) : undefined;

    const currentTarget = watch('targetCalories') ?? undefined;
    if (targetCalories !== currentTarget) {
      setValue('targetCalories', targetCalories, { shouldValidate: false, shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedDays]);

  const addDay = () => {
    const currentDays = watch('days') || [];
    const dayNumber = currentDays.length + 1;
    const dayPrefix = t('meal_plan.form.day_prefix');
    const newDay: DayPlan = {
      day: `${dayPrefix} ${dayNumber}`,
      meals: []
    };
    appendDay(newDay);
  };

  const addMeal = (dayIdx: number) => {
    const currentDays = watch('days') || [];
    const day = currentDays[dayIdx];
    const meals = day?.meals || [];
    const newMeal: Meal = { mealType: '', items: [] };
    const nextMeals = [...meals, newMeal];
    setValue(`days.${dayIdx}.meals`, nextMeals, { shouldValidate: true });
    if (nextMeals.length >= 3) {
      clearErrors(`days.${dayIdx}.meals`);
    } else {
      void trigger(`days.${dayIdx}.meals`);
    }
  };

  const removeMeal = (dayIdx: number, mealIdx: number) => {
    const currentDays = watch('days') || [];
    const day = currentDays[dayIdx];
    const meals = day?.meals || [];
    meals.splice(mealIdx, 1);
    setValue(`days.${dayIdx}.meals`, meals, { shouldValidate: true });
    void trigger(`days.${dayIdx}.meals`);
    if (meals.length >= 3) {
      clearErrors(`days.${dayIdx}.meals`);
    }
  };

  const addItem = (dayIdx: number, mealIdx: number) => {
    const currentDays = watch('days') || [];
    const day = currentDays[dayIdx];
    const meal = day?.meals?.[mealIdx];
    const items = meal?.items || [];
    const newItem: MealItem = { name: '' };
    setValue(`days.${dayIdx}.meals.${mealIdx}.items`, [...items, newItem], { shouldValidate: true });
  };

  const removeItem = (dayIdx: number, mealIdx: number, itemIdx: number) => {
    const currentDays = watch('days') || [];
    const day = currentDays[dayIdx];
    const meal = day?.meals?.[mealIdx];
    const items = meal?.items || [];
    items.splice(itemIdx, 1);
    setValue(`days.${dayIdx}.meals.${mealIdx}.items`, items, { shouldValidate: true });
  };

  const [itemsModal, setItemsModal] = useState<{ dayIdx: number; mealIdx: number } | null>(null);

  const onFormSubmit = (data: MealPlanFormValues) => {
    const processedData: MealPlanFormValues = {
      ...data,
      days: (data.days || []).map(computeDayWithTotals)
    };
    onSubmit(processedData);
  };

  return (
    <form className="space-y-4 px-1" onSubmit={handleSubmit(onFormSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            {t('meal_plan.form.name')} <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <div>
                <Input
                  id="name"
                  {...field}
                  value={field.value || ''}
                  placeholder={t('meal_plan.form.name_placeholder')}
                  className={cn(errors.name && 'border-red-500')}
                />
                <div className="min-h-[20px]">
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
                </div>
              </div>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">{t('meal_plan.form.status')}</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <div>
                <Select value={field.value || 'SUGGESTED'} onValueChange={field.onChange}>
                  <SelectTrigger id="status" className={cn('w-full', errors.status && 'border-red-500')}>
                    <SelectValue placeholder={t('meal_plan.form.status_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUGGESTED">{t('meal_plan.status.SUGGESTED')}</SelectItem>
                    <SelectItem value="FINAL">{t('meal_plan.status.FINAL')}</SelectItem>
                    <SelectItem value="EDITED">{t('meal_plan.status.EDITED')}</SelectItem>
                    <SelectItem value="ARCHIVED">{t('meal_plan.status.ARCHIVED')}</SelectItem>
                    <SelectItem value="DELETED">{t('meal_plan.status.DELETED')}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="min-h-[20px]">
                  {errors.status && <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>}
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="focus">{t('meal_plan.form.focus')}</Label>
          <Controller
            name="focus"
            control={control}
            render={({ field }) => (
              <div>
                <Input
                  id="focus"
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={t('meal_plan.form.focus_placeholder')}
                  className={cn(errors.focus && 'border-red-500')}
                />
                <div className="min-h-[20px]">
                  {errors.focus && <p className="text-sm text-red-600 mt-1">{errors.focus.message}</p>}
                </div>
              </div>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetCalories">{t('meal_plan.form.target_calories')}</Label>
          <Controller
            name="targetCalories"
            control={control}
            render={({ field }) => {
              // Calculate target calories from days (sum of all days)
              const daysWithTotals = watchedDays.map(computeDayWithTotals);
              const countedDays = daysWithTotals.filter(
                (d) => typeof d.totalCalories === 'number' && d.totalCalories > 0
              );
              const calculatedTarget =
                countedDays.length > 0 ? countedDays.reduce((sum, d) => sum + (d.totalCalories || 0), 0) : undefined;

              return (
                <div>
                  <Input
                    id="targetCalories"
                    type="number"
                    {...field}
                    value={calculatedTarget ?? ''}
                    disabled
                    placeholder={t('meal_plan.form.target_calories_placeholder')}
                    className={cn(errors.targetCalories && 'border-red-500')}
                  />
                  <div className="min-h-[20px]">
                    {errors.targetCalories && (
                      <p className="text-sm text-red-600 mt-1">{errors.targetCalories.message}</p>
                    )}
                  </div>
                </div>
              );
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t('meal_plan.form.notes')}</Label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <div>
              <Textarea
                id="notes"
                {...field}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={t('meal_plan.form.notes_placeholder')}
                className={cn(errors.notes && 'border-red-500')}
              />
              <div className="min-h-[20px]">
                {errors.notes && <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>}
              </div>
            </div>
          )}
        />
      </div>

      <div className="flex items-center justify-between">
        <CardTitle className="text-lg">{t('meal_plan.form.days')}</CardTitle>
        <Button type="button" variant="outline" onClick={addDay}>
          {t('meal_plan.form.add_day')}
        </Button>
      </div>
      <div className="min-h-[20px]">
        {errors.days && typeof errors.days === 'object' && 'message' in errors.days && (
          <p className="text-sm text-red-600 mt-1">{errors.days.message as string}</p>
        )}
      </div>

      <div className="space-y-3">
        {dayFields.map((dayField, dayIdx) => {
          const day = watchedDays[dayIdx];
          const dayErrors = errors.days?.[dayIdx];
          const mealsArrayMessage = getArrayErrorMessage(dayErrors?.meals);
          return (
            <Card key={dayField.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="space-y-1">
                    <Controller
                      name={`days.${dayIdx}.day`}
                      control={control}
                      render={({ field }) => (
                        <div>
                          <Input
                            className={cn('w-40', dayErrors?.day && 'border-red-500')}
                            {...field}
                            placeholder={t('meal_plan.form.day_label_placeholder')}
                          />
                          <div className="min-h-[16px]">
                            {dayErrors?.day && <p className="text-xs text-red-600 mt-1">{dayErrors.day.message}</p>}
                          </div>
                        </div>
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="relative w-32">
                      <Input
                        className="w-full pr-12"
                        type="text"
                        value={
                          computeDayWithTotals(day || { day: '', meals: [] }).totalCalories
                            ? `${computeDayWithTotals(day || { day: '', meals: [] }).totalCalories} cal`
                            : ''
                        }
                        disabled
                      />
                    </div>
                    <div className="min-h-[16px]"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex gap-2 h-10 items-center">
                    <Button type="button" variant="outline" size="sm" onClick={() => addMeal(dayIdx)}>
                      {t('meal_plan.table.add_meal')}
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeDay(dayIdx)}>
                      {t('common.remove')}
                    </Button>
                  </div>
                  <div className="min-h-[16px]"></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-2 text-left">{t('meal_plan.table.meal')}</th>
                        <th className="p-2 text-left w-24">{t('meal_plan.table.total_cal')}</th>
                        <th className="p-2 text-left w-1/3">{t('meal_plan.table.notes')}</th>
                        <th className="p-2 text-left w-40">{t('meal_plan.table.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(day?.meals || []).map((meal, mealIdx) => {
                        const mealErrors = dayErrors?.meals?.[mealIdx];
                        return (
                          <tr key={mealIdx} className="border-t">
                            <td className="p-2">
                              <div className="space-y-1">
                                <Controller
                                  name={`days.${dayIdx}.meals.${mealIdx}.mealType`}
                                  control={control}
                                  render={({ field }) => (
                                    <div>
                                      <Select value={field.value || ''} onValueChange={field.onChange}>
                                        <SelectTrigger
                                          className={cn('w-full', mealErrors?.mealType && 'border-red-500')}
                                        >
                                          <SelectValue placeholder={t('meal_plan.table.meal_placeholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="breakfast">
                                            {t('meal_plan.table.meal_types.breakfast')}
                                          </SelectItem>
                                          <SelectItem value="lunch">{t('meal_plan.table.meal_types.lunch')}</SelectItem>
                                          <SelectItem value="dinner">
                                            {t('meal_plan.table.meal_types.dinner')}
                                          </SelectItem>
                                          <SelectItem value="snack">{t('meal_plan.table.meal_types.snack')}</SelectItem>
                                          <SelectItem value="pre_workout">
                                            {t('meal_plan.table.meal_types.pre_workout')}
                                          </SelectItem>
                                          <SelectItem value="post_workout">
                                            {t('meal_plan.table.meal_types.post_workout')}
                                          </SelectItem>
                                          <SelectItem value="late_night">
                                            {t('meal_plan.table.meal_types.late_night')}
                                          </SelectItem>
                                          <SelectItem value="other">{t('meal_plan.table.meal_types.other')}</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <div className="min-h-[16px]">
                                        {mealErrors?.mealType && (
                                          <p className="text-xs text-red-600 mt-1">{mealErrors.mealType.message}</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                />
                              </div>
                            </td>
                            <td className="p-2 align-middle w-24">
                              <div className="min-h-[54px] flex items-start">
                                <Input
                                  type="number"
                                  value={computeMealWithTotal(meal).totalCalories ?? ''}
                                  disabled
                                  className="w-24"
                                />
                              </div>
                            </td>
                            <td className="p-2 align-middle w-1/3">
                              <div className="space-y-1">
                                <Controller
                                  name={`days.${dayIdx}.meals.${mealIdx}.notes`}
                                  control={control}
                                  render={({ field }) => (
                                    <div>
                                      <Textarea
                                        {...field}
                                        value={field.value || ''}
                                        onChange={(e) => field.onChange(e.target.value)}
                                        placeholder={t('meal_plan.table.notes_placeholder')}
                                        className={cn(
                                          'min-h-[38px] h-[38px] resize-none',
                                          mealErrors?.notes && 'border-red-500'
                                        )}
                                      />
                                      <div className="min-h-[16px]">
                                        {mealErrors?.notes && (
                                          <p className="text-xs text-red-600 mt-1">{mealErrors.notes.message}</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                />
                              </div>
                            </td>
                            <td className="p-2 align-middle">
                              <div className="min-h-[54px] flex items-center">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setItemsModal({ dayIdx, mealIdx })}
                                  >
                                    {t('meal_plan.table.items')}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeMeal(dayIdx, mealIdx)}
                                  >
                                    {t('common.remove')}
                                  </Button>
                                </div>
                              </div>
                              <div className="min-h-[16px]">
                                {mealErrors?.items &&
                                  typeof mealErrors.items === 'object' &&
                                  'message' in mealErrors.items && (
                                    <p className="text-xs leading-4 text-red-600">
                                      {mealErrors.items.message as string}
                                    </p>
                                  )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {(day?.meals || []).length === 0 && (
                        <tr>
                          <td className="p-3 text-center text-gray-500" colSpan={4}>
                            {t('meal_plan.table.no_meals')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {mealsArrayMessage && (
                  <div className="min-h-[20px]">
                    <p className="text-sm text-red-600">{mealsArrayMessage}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!itemsModal} onOpenChange={() => setItemsModal(null)}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('meal_plan.items_dialog.title')}</DialogTitle>
          </DialogHeader>
          {itemsModal && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addItem(itemsModal.dayIdx, itemsModal.mealIdx)}
                >
                  {t('meal_plan.items_dialog.add_item')}
                </Button>
              </div>
              <div className="space-y-2">
                {watchedDays[itemsModal.dayIdx]?.meals?.[itemsModal.mealIdx]?.items?.map((_item, itemIdx) => {
                  const itemErrors = errors.days?.[itemsModal.dayIdx]?.meals?.[itemsModal.mealIdx]?.items?.[itemIdx];
                  return (
                    <div key={itemIdx} className="border rounded-md p-3">
                      <div className="grid grid-cols-1 md:grid-cols-9 gap-2 items-start">
                        <div className="md:col-span-2 space-y-1">
                          <Label>{t('meal_plan.items_dialog.name_label')}</Label>
                          <Controller
                            name={`days.${itemsModal.dayIdx}.meals.${itemsModal.mealIdx}.items.${itemIdx}.name`}
                            control={control}
                            render={({ field }) => (
                              <div>
                                <Input {...field} className={cn(itemErrors?.name && 'border-red-500')} />
                                <div className="min-h-[16px]">
                                  {itemErrors?.name && (
                                    <p className="text-xs text-red-600 mt-1">{itemErrors.name.message}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>{t('meal_plan.items_dialog.cal_label')}</Label>
                          <Controller
                            name={`days.${itemsModal.dayIdx}.meals.${itemsModal.mealIdx}.items.${itemIdx}.calories`}
                            control={control}
                            render={({ field }) => (
                              <div>
                                <Input
                                  type="number"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  className={cn(itemErrors?.calories && 'border-red-500')}
                                />
                                <div className="min-h-[16px]">
                                  {itemErrors?.calories && (
                                    <p className="text-xs text-red-600 mt-1">{itemErrors.calories.message}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>{t('meal_plan.items_dialog.protein_label')}</Label>
                          <Controller
                            name={`days.${itemsModal.dayIdx}.meals.${itemsModal.mealIdx}.items.${itemIdx}.protein`}
                            control={control}
                            render={({ field }) => (
                              <div>
                                <Input
                                  type="number"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  className={cn(itemErrors?.protein && 'border-red-500')}
                                />
                                <div className="min-h-[16px]">
                                  {itemErrors?.protein && (
                                    <p className="text-xs text-red-600 mt-1">{itemErrors.protein.message}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>{t('meal_plan.items_dialog.carbs_label')}</Label>
                          <Controller
                            name={`days.${itemsModal.dayIdx}.meals.${itemsModal.mealIdx}.items.${itemIdx}.carbs`}
                            control={control}
                            render={({ field }) => (
                              <div>
                                <Input
                                  type="number"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  className={cn(itemErrors?.carbs && 'border-red-500')}
                                />
                                <div className="min-h-[16px]">
                                  {itemErrors?.carbs && (
                                    <p className="text-xs text-red-600 mt-1">{itemErrors.carbs.message}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>{t('meal_plan.items_dialog.fat_label')}</Label>
                          <Controller
                            name={`days.${itemsModal.dayIdx}.meals.${itemsModal.mealIdx}.items.${itemIdx}.fat`}
                            control={control}
                            render={({ field }) => (
                              <div>
                                <Input
                                  type="number"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  className={cn(itemErrors?.fat && 'border-red-500')}
                                />
                                <div className="min-h-[16px]">
                                  {itemErrors?.fat && (
                                    <p className="text-xs text-red-600 mt-1">{itemErrors.fat.message}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <Label>{t('meal_plan.items_dialog.ingredients_label')}</Label>
                          <Controller
                            name={`days.${itemsModal.dayIdx}.meals.${itemsModal.mealIdx}.items.${itemIdx}.ingredients`}
                            control={control}
                            render={({ field }) => (
                              <div>
                                <Input
                                  className={cn('w-full', itemErrors?.ingredients && 'border-red-500')}
                                  value={(field.value || []).join(', ')}
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? e.target.value.split(',').map((s) => s.trim()) : [])
                                  }
                                />
                                <div className="min-h-[16px]">
                                  {itemErrors?.ingredients && (
                                    <p className="text-xs text-red-600 mt-1">{itemErrors.ingredients.message}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          />
                        </div>
                        <div className="flex items-start">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="shrink-0 mt-[22px]"
                            onClick={() => removeItem(itemsModal.dayIdx, itemsModal.mealIdx, itemIdx)}
                          >
                            {t('common.remove')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {(() => {
                const mealErrors = errors.days?.[itemsModal.dayIdx]?.meals?.[itemsModal.mealIdx];
                const itemsError = mealErrors?.items;
                if (itemsError && typeof itemsError === 'object' && 'message' in itemsError) {
                  return (
                    <div className="min-h-[20px]">
                      <p className="text-sm text-red-600">{itemsError.message as string}</p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" className="bg-[#F05A29] hover:bg-[#E04A1F]" disabled={loading}>
          {loading ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );
};
