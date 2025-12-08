import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import type { MealPlan, DayPlan, Meal, MealItem } from '@/types/api/MealPlan';

type MealPlanDetailProps = {
  mealPlan: MealPlan;
  onEdit: () => void;
  onDelete: () => void;
};

export function MealPlanDetail({ mealPlan, onEdit, onDelete }: Readonly<MealPlanDetailProps>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 text-sm text-[#101D33]">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="text-lg font-semibold">
            {mealPlan.name || t('progress_detail.meal_plan.card.default_name')}
          </div>
          <Badge variant="secondary" className="capitalize w-fit">
            {(mealPlan.status ?? 'unknown').toLowerCase()}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            {t('progress_detail.meal_plan.edit')}
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            {t('progress_detail.meal_plan.delete')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1 bg-gray-50 rounded-md p-3 border">
          {/* <div className="font-medium text-[#0F172A]">{t('progress_detail.meal_plan.card.focus', { focus: '' })}</div> */}
          {/* <div>{mealPlan.focus || t('common.na')}</div> */}
          <div className="font-medium text-[#0F172A]">
            {t('progress_detail.meal_plan.card.target_calories', { value: '' })}
          </div>
          <div>{mealPlan.targetCalories ?? t('common.na')} cal</div>
          {mealPlan.notes ? (
            <div className="space-y-1">
              <div className="font-medium text-[#0F172A]">
                {t('progress_detail.meal_plan.card.notes', { value: '' })}
              </div>
              <div className="bg-white border rounded p-2 whitespace-pre-wrap">{mealPlan.notes}</div>
            </div>
          ) : null}
          {mealPlan.coachingNotes ? (
            <div className="space-y-1">
              <div className="font-medium text-[#0F172A]">
                {t('progress_detail.meal_plan.card.coaching_notes', { value: '' })}
              </div>
              <div className="bg-white border rounded p-2 whitespace-pre-wrap">{mealPlan.coachingNotes}</div>
            </div>
          ) : null}
        </div>
        <div className="space-y-1 bg-gray-50 rounded-md p-3 border">
          <div className="font-medium text-[#0F172A]">
            {t('progress_detail.meal_plan.card.created_at', { value: '' })}
          </div>
          <div>{new Date(mealPlan.createdAt).toLocaleString('vi-VN')}</div>
          <div className="font-medium text-[#0F172A]">
            {t('progress_detail.meal_plan.card.updated_at', { value: '' })}
          </div>
          <div>{mealPlan.updatedAt ? new Date(mealPlan.updatedAt).toLocaleString('vi-VN') : t('common.na')}</div>
        </div>
      </div>

      {mealPlan.days?.length ? (
        <div className="space-y-2">
          <div className="font-semibold">{t('progress_detail.meal_plan.card.days')}</div>
          <div className="space-y-2">
            {mealPlan.days.map((day: DayPlan, dayIdx: number) => (
              <div key={dayIdx} className="rounded-lg border bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-[#0F172A]">{day.day}</div>
                  <div className="text-xs text-gray-600">
                    {t('progress_detail.meal_plan.card.day_total', { value: day.totalCalories ?? t('common.na') })}
                  </div>
                </div>
                {day.meals?.length ? (
                  <div className="mt-2 space-y-2">
                    {day.meals.map((meal: Meal, mealIdx: number) => (
                      <div key={mealIdx} className="rounded-md border border-dashed bg-gray-50 px-2 py-2">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-medium">{meal.mealType}</span>
                          {meal.totalCalories ? <span className="text-gray-600">{meal.totalCalories} cal</span> : null}
                          {meal.notes ? (
                            <span className="text-gray-700 italic">
                              {t('progress_detail.meal_plan.card.meal_notes', { value: meal.notes })}
                            </span>
                          ) : null}
                        </div>
                        {meal.items?.length ? (
                          <ul className="list-disc list-inside ml-4 text-[12px] text-gray-700 space-y-1 mt-1">
                            {meal.items.map((item: MealItem, itemIdx: number) => (
                              <li key={itemIdx} className="flex flex-wrap gap-1">
                                <span className="font-semibold">{item.name}</span>
                                <span className="text-gray-600">
                                  {[
                                    item.calories ? `${item.calories} cal` : null,
                                    item.protein ? `P ${item.protein}g` : null,
                                    item.carbs ? `C ${item.carbs}g` : null,
                                    item.fat ? `F ${item.fat}g` : null,
                                    item.ingredients?.length
                                      ? `${t('progress_detail.meal_plan.card.ingredients', { defaultValue: 'Ingredients' })}: ${item.ingredients.join(', ')}`
                                      : null
                                  ]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 mt-1">{t('progress_detail.meal_plan.table.no_meals')}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
