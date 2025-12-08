import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MealPlan, MealPlanStatus, DayPlan, Meal, MealItem } from '@/types/api/MealPlan';

export interface MealPlanFormValues extends Partial<MealPlan> {
  customerId: string;
  customerGoalId: string;
  status?: MealPlanStatus;
}

interface MealPlanFormProps {
  initialValues: MealPlanFormValues;
  loading?: boolean;
  onSubmit: (values: MealPlanFormValues) => void;
}

export const MealPlanForm = ({ initialValues, loading, onSubmit }: MealPlanFormProps) => {
  const { t } = useTranslation();
  const computeMealWithTotal = (meal: Meal) => {
    const mealTotal = (meal.items || []).reduce((sum, item) => sum + (item.calories || 0), 0);
    return { ...meal, totalCalories: mealTotal || undefined };
  };

  const computeDayWithTotals = (day: DayPlan) => {
    const meals = (day.meals || []).map(computeMealWithTotal);
    const dayTotal = meals.reduce((sum, m) => sum + (m.totalCalories || 0), 0);
    return { ...day, meals, totalCalories: dayTotal || undefined };
  };

  const recalcTotals = (v: MealPlanFormValues): MealPlanFormValues => {
    const days = (v.days || []).map(computeDayWithTotals);
    const countedDays = days.filter((d) => typeof d.totalCalories === 'number');
    const targetCalories =
      countedDays.length > 0
        ? Math.round(countedDays.reduce((sum, d) => sum + (d.totalCalories || 0), 0) / countedDays.length)
        : v.targetCalories;

    return { ...v, days, targetCalories };
  };

  const [values, setValues] = useState<MealPlanFormValues>(() =>
    recalcTotals({
      ...initialValues,
      days: initialValues.days || [],
      status: initialValues.status || 'SUGGESTED'
    })
  );

  const updateField = (field: keyof MealPlanFormValues, value: unknown) => {
    setValues((prev) => recalcTotals({ ...prev, [field]: value }));
  };

  const addDay = () => {
    const newDay: DayPlan = { day: `Day ${values.days?.length ? values.days.length + 1 : 1}`, meals: [] };
    setValues((prev) => recalcTotals({ ...prev, days: [...(prev.days || []), newDay] }));
  };

  const updateDay = (index: number, updater: (day: DayPlan) => DayPlan) => {
    setValues((prev) => {
      const days = [...(prev.days || [])];
      days[index] = updater(days[index]);
      return recalcTotals({ ...prev, days });
    });
  };

  const removeDay = (index: number) => {
    setValues((prev) => {
      const days = [...(prev.days || [])];
      days.splice(index, 1);
      return recalcTotals({ ...prev, days });
    });
  };

  const addMeal = (dayIdx: number) =>
    updateDay(dayIdx, (day) => ({
      ...day,
      meals: [...(day.meals || []), { mealType: 'meal', items: [] } as Meal]
    }));

  const updateMeal = (dayIdx: number, mealIdx: number, updater: (meal: Meal) => Meal) =>
    updateDay(dayIdx, (day) => {
      const meals = [...(day.meals || [])];
      meals[mealIdx] = updater(meals[mealIdx]);
      return { ...day, meals };
    });

  const removeMeal = (dayIdx: number, mealIdx: number) =>
    updateDay(dayIdx, (day) => {
      const meals = [...(day.meals || [])];
      meals.splice(mealIdx, 1);
      return { ...day, meals };
    });

  const addItem = (dayIdx: number, mealIdx: number) =>
    updateMeal(dayIdx, mealIdx, (meal) => ({
      ...meal,
      items: [...(meal.items || []), { name: 'Item' } as MealItem]
    }));

  const updateItem = (dayIdx: number, mealIdx: number, itemIdx: number, updater: (item: MealItem) => MealItem) =>
    updateMeal(dayIdx, mealIdx, (meal) => {
      const items = [...(meal.items || [])];
      items[itemIdx] = updater(items[itemIdx]);
      return { ...meal, items };
    });

  const removeItem = (dayIdx: number, mealIdx: number, itemIdx: number) =>
    updateMeal(dayIdx, mealIdx, (meal) => {
      const items = [...(meal.items || [])];
      items.splice(itemIdx, 1);
      return { ...meal, items };
    });

  const [itemsModal, setItemsModal] = useState<{ dayIdx: number; mealIdx: number } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form className="space-y-4 px-1" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('meal_plan.form.name')}</Label>
          <Input
            id="name"
            value={values.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder={t('meal_plan.form.name_placeholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">{t('meal_plan.form.status')}</Label>
          <Select
            value={values.status || 'SUGGESTED'}
            onValueChange={(val) => updateField('status', val as MealPlanStatus)}
          >
            <SelectTrigger id="status" className="w-full">
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="focus">{t('meal_plan.form.focus')}</Label>
          <Input
            id="focus"
            value={values.focus || ''}
            onChange={(e) => updateField('focus', e.target.value)}
            placeholder={t('meal_plan.form.focus_placeholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetCalories">{t('meal_plan.form.target_calories')}</Label>
          <Input
            id="targetCalories"
            type="number"
            value={values.targetCalories ?? ''}
            disabled
            placeholder={t('meal_plan.form.target_calories_placeholder')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t('meal_plan.form.notes')}</Label>
        <Textarea
          id="notes"
          value={values.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder={t('meal_plan.form.notes_placeholder')}
        />
      </div>

      <div className="flex items-center justify-between">
        <CardTitle className="text-lg">{t('meal_plan.form.days')}</CardTitle>
        <Button type="button" variant="outline" onClick={addDay}>
          {t('meal_plan.form.add_day')}
        </Button>
      </div>

      <div className="space-y-3">
        {(values.days || []).map((day, dayIdx) => (
          <Card key={dayIdx}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">
                  {t('meal_plan.form.day_prefix')} {dayIdx + 1}
                </CardTitle>
                <Input
                  className="w-40"
                  value={day.day}
                  onChange={(e) =>
                    updateDay(dayIdx, (d) => ({
                      ...d,
                      day: e.target.value
                    }))
                  }
                  placeholder={t('meal_plan.form.day_label_placeholder')}
                />
                <Input className="w-32" type="number" value={day.totalCalories ?? ''} disabled />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => addMeal(dayIdx)}>
                  {t('meal_plan.table.add_meal')}
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => removeDay(dayIdx)}>
                  {t('common.remove')}
                </Button>
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
                      <th className="p-2 text-left">{t('meal_plan.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(day.meals || []).map((meal, mealIdx) => (
                      <tr key={mealIdx} className="border-t">
                        <td className="p-2">
                          <Input
                            value={meal.mealType}
                            onChange={(e) => updateMeal(dayIdx, mealIdx, (m) => ({ ...m, mealType: e.target.value }))}
                            placeholder={t('meal_plan.table.meal_placeholder')}
                          />
                        </td>
                        <td className="p-2 align-middle w-24">
                          <Input
                            type="number"
                            value={meal.totalCalories ?? ''}
                            disabled
                            className="min-h-[38px] w-24"
                          />
                        </td>
                        <td className="p-2 align-middle w-1/3">
                          <Textarea
                            value={meal.notes || ''}
                            onChange={(e) =>
                              updateMeal(dayIdx, mealIdx, (m) => ({
                                ...m,
                                notes: e.target.value
                              }))
                            }
                            placeholder={t('meal_plan.table.notes_placeholder')}
                            className="min-h-[38px] h-[38px] resize-none"
                          />
                        </td>
                        <td className="p-2">
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
                        </td>
                      </tr>
                    ))}
                    {(day.meals || []).length === 0 && (
                      <tr>
                        <td className="p-3 text-center text-gray-500" colSpan={4}>
                          {t('meal_plan.table.no_meals')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!itemsModal} onOpenChange={() => setItemsModal(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
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
                {values.days?.[itemsModal.dayIdx]?.meals?.[itemsModal.mealIdx]?.items?.map((item, itemIdx) => (
                  <div key={itemIdx} className="border rounded-md p-3 grid grid-cols-1 md:grid-cols-6 gap-2">
                    <div className="md:col-span-2 space-y-1">
                      <Label>{t('meal_plan.items_dialog.name_label')}</Label>
                      <Input
                        value={item.name}
                        onChange={(e) =>
                          updateItem(itemsModal.dayIdx, itemsModal.mealIdx, itemIdx, (it) => ({
                            ...it,
                            name: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>{t('meal_plan.items_dialog.cal_label')}</Label>
                      <Input
                        type="number"
                        value={item.calories ?? ''}
                        onChange={(e) =>
                          updateItem(itemsModal.dayIdx, itemsModal.mealIdx, itemIdx, (it) => ({
                            ...it,
                            calories: e.target.value ? Number(e.target.value) : undefined
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>{t('meal_plan.items_dialog.protein_label')}</Label>
                      <Input
                        type="number"
                        value={item.protein ?? ''}
                        onChange={(e) =>
                          updateItem(itemsModal.dayIdx, itemsModal.mealIdx, itemIdx, (it) => ({
                            ...it,
                            protein: e.target.value ? Number(e.target.value) : undefined
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>{t('meal_plan.items_dialog.carbs_label')}</Label>
                      <Input
                        type="number"
                        value={item.carbs ?? ''}
                        onChange={(e) =>
                          updateItem(itemsModal.dayIdx, itemsModal.mealIdx, itemIdx, (it) => ({
                            ...it,
                            carbs: e.target.value ? Number(e.target.value) : undefined
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>{t('meal_plan.items_dialog.fat_label')}</Label>
                      <Input
                        type="number"
                        value={item.fat ?? ''}
                        onChange={(e) =>
                          updateItem(itemsModal.dayIdx, itemsModal.mealIdx, itemIdx, (it) => ({
                            ...it,
                            fat: e.target.value ? Number(e.target.value) : undefined
                          }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-1">
                      <Label>{t('meal_plan.items_dialog.ingredients_label')}</Label>
                      <div className="flex gap-2">
                        <Input
                          className="flex-1"
                          value={(item.ingredients || []).join(', ')}
                          onChange={(e) =>
                            updateItem(itemsModal.dayIdx, itemsModal.mealIdx, itemIdx, (it) => ({
                              ...it,
                              ingredients: e.target.value ? e.target.value.split(',').map((s) => s.trim()) : []
                            }))
                          }
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="shrink-0"
                          onClick={() => removeItem(itemsModal.dayIdx, itemsModal.mealIdx, itemIdx)}
                        >
                          {t('common.remove')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
