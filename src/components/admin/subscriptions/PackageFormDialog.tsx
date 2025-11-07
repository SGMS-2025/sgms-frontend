import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { NumberInput } from './NumberInput';
import { X } from 'lucide-react';
import type {
  CreateSubscriptionPackageRequest,
  UpdateSubscriptionPackageRequest,
  SubscriptionPackage
} from '@/types/api/Subscription';

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: SubscriptionPackage | null;
  onSubmit: (
    data: CreateSubscriptionPackageRequest | UpdateSubscriptionPackageRequest,
    setFormError: (field: string, message: string) => void
  ) => Promise<void>;
}

export const PackageFormDialog: React.FC<PackageFormDialogProps> = ({ open, onOpenChange, initialValue, onSubmit }) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Create schemas dynamically with translations
  const createPackageSchema = z.object({
    name: z
      .string()
      .min(1, t('admin.subscription_packages.validation.name_required'))
      .max(100, t('admin.subscription_packages.validation.name_max')),
    description: z.string().max(1000, t('admin.subscription_packages.validation.description_max')).optional(),
    price: z.number().min(0, t('admin.subscription_packages.validation.price_min')),
    tier: z
      .number()
      .int(t('admin.subscription_packages.validation.tier_integer'))
      .min(1, t('admin.subscription_packages.validation.tier_min'))
      .max(100, t('admin.subscription_packages.validation.tier_max')),
    duration: z
      .number()
      .int(t('admin.subscription_packages.validation.duration_integer'))
      .min(1, t('admin.subscription_packages.validation.duration_min')),
    durationUnit: z.enum(['DAY', 'MONTH', 'YEAR'], {
      message: t('admin.subscription_packages.validation.duration_unit_required')
    }),
    maxBranches: z
      .number()
      .int(t('admin.subscription_packages.validation.max_branches_integer'))
      .min(1, t('admin.subscription_packages.validation.max_branches_min')),
    maxCustomers: z
      .number()
      .int(t('admin.subscription_packages.validation.max_customers_integer'))
      .min(1, t('admin.subscription_packages.validation.max_customers_min')),
    features: z.array(z.string()).optional(),
    isActive: z.boolean().optional()
  });

  const updatePackageSchema = z.object({
    name: z
      .string()
      .min(1, t('admin.subscription_packages.validation.name_required'))
      .max(100, t('admin.subscription_packages.validation.name_max'))
      .optional(),
    description: z.string().max(1000, t('admin.subscription_packages.validation.description_max')).optional(),
    price: z.number().min(0, t('admin.subscription_packages.validation.price_min')).optional(),
    tier: z
      .number()
      .int(t('admin.subscription_packages.validation.tier_integer'))
      .min(1, t('admin.subscription_packages.validation.tier_min'))
      .max(100, t('admin.subscription_packages.validation.tier_max'))
      .optional(),
    duration: z
      .number()
      .int(t('admin.subscription_packages.validation.duration_integer'))
      .min(1, t('admin.subscription_packages.validation.duration_min'))
      .optional(),
    durationUnit: z.enum(['DAY', 'MONTH', 'YEAR']).optional(),
    maxBranches: z
      .number()
      .int(t('admin.subscription_packages.validation.max_branches_integer'))
      .min(1, t('admin.subscription_packages.validation.max_branches_min'))
      .optional(),
    maxCustomers: z
      .number()
      .int(t('admin.subscription_packages.validation.max_customers_integer'))
      .min(1, t('admin.subscription_packages.validation.max_customers_min'))
      .optional(),
    features: z.array(z.string()).optional(),
    isActive: z.boolean().optional()
  });

  const schema = initialValue ? updatePackageSchema : createPackageSchema;

  type PackageFormData = z.infer<typeof createPackageSchema> | z.infer<typeof updatePackageSchema>;

  const form = useForm<PackageFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValue?.name || '',
      description: initialValue?.description || '',
      price: initialValue?.price ?? 0,
      duration: 1, // Always 1 (user selects months when purchasing)
      durationUnit: 'MONTH', // Always MONTH
      maxBranches: initialValue?.maxBranches ?? 1,
      maxCustomers: initialValue?.maxCustomers ?? 100,
      tier: initialValue?.tier ?? 1,
      features: initialValue?.features || [],
      isActive: initialValue?.isActive ?? true
    }
  });

  React.useEffect(() => {
    if (open) {
      setIsSubmitting(false);
      form.reset({
        name: initialValue?.name || '',
        description: initialValue?.description || '',
        price: initialValue?.price ?? 0,
        duration: 1, // Always 1 (user selects months when purchasing)
        durationUnit: 'MONTH', // Always MONTH
        maxBranches: initialValue?.maxBranches ?? 1,
        maxCustomers: initialValue?.maxCustomers ?? 100,
        tier: initialValue?.tier ?? 1,
        features: initialValue?.features || [],
        isActive: initialValue?.isActive ?? true
      });
    }
  }, [open, initialValue, form]);

  const handleFormSubmit = (data: PackageFormData) => {
    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    if (initialValue) {
      // Update mode - include all fields from form (they all have values from initialValue)
      // Always get current values from form state to ensure we have the latest values
      const formValues = form.getValues();

      // Filter out empty features
      const filteredFeatures = (formValues.features || []).filter((f) => f.trim().length > 0);

      const tierValue =
        typeof formValues.tier === 'number'
          ? formValues.tier
          : formValues.tier
            ? Number(formValues.tier)
            : (initialValue.tier ?? 1);

      const payload: UpdateSubscriptionPackageRequest = {
        name: formValues.name || '',
        description: formValues.description,
        price:
          typeof formValues.price === 'number' ? formValues.price : formValues.price ? Number(formValues.price) : 0,
        tier: tierValue, // Always include tier when updating, ensure it's a number
        maxBranches:
          typeof formValues.maxBranches === 'number'
            ? formValues.maxBranches
            : formValues.maxBranches
              ? Number(formValues.maxBranches)
              : 1,
        maxCustomers:
          typeof formValues.maxCustomers === 'number'
            ? formValues.maxCustomers
            : formValues.maxCustomers
              ? Number(formValues.maxCustomers)
              : 100,
        features: filteredFeatures,
        isActive: formValues.isActive,
        // Always set these for update (they're fixed)
        duration: 1,
        durationUnit: 'MONTH'
      };

      const setFormError = (field: string, message: string) => {
        form.setError(field as keyof PackageFormData, { type: 'server', message });
      };

      onSubmit(payload, setFormError).finally(() => {
        setIsSubmitting(false);
      });
    } else {
      // Create mode - use defaults for required fields
      // Filter out empty features
      const filteredFeatures = (data.features || []).filter((f) => f.trim().length > 0);

      const payload: CreateSubscriptionPackageRequest = {
        name: data.name || '',
        price: data.price ?? 0,
        tier: data.tier ?? 1,
        duration: 1, // Always 1 (user selects months when purchasing)
        durationUnit: 'MONTH', // Always MONTH
        maxBranches: data.maxBranches ?? 1,
        maxCustomers: data.maxCustomers ?? 100,
        features: filteredFeatures,
        description: data.description,
        isActive: data.isActive
      };

      const setFormError = (field: string, message: string) => {
        form.setError(field as keyof PackageFormData, { type: 'server', message });
      };

      onSubmit(payload, setFormError).finally(() => {
        setIsSubmitting(false);
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {initialValue
              ? t('admin.subscription_packages.form.update_title')
              : t('admin.subscription_packages.form.create_title')}
          </DialogTitle>
          <DialogDescription>{t('admin.subscription_packages.form.description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t('admin.subscription_packages.form.field.name')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t('admin.subscription_packages.form.field.description')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.subscription_packages.form.field.price')}</FormLabel>
                        <FormControl>
                          <NumberInput
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            defaultValue={0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.subscription_packages.form.field.tier')}</FormLabel>
                        <FormControl>
                          <NumberInput
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            defaultValue={1}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={() => (
                      <FormItem>
                        <FormLabel>{t('admin.subscription_packages.form.field.duration')}</FormLabel>
                        <FormControl>
                          <Input
                            value={t('admin.subscription_packages.form.field.duration_value')}
                            disabled
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="durationUnit"
                    render={() => (
                      <FormItem>
                        <FormLabel>{t('admin.subscription_packages.form.field.duration_unit')}</FormLabel>
                        <FormControl>
                          <Input
                            value={t('admin.subscription_packages.form.field.duration_unit_value')}
                            disabled
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxBranches"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.subscription_packages.form.field.max_branches')}</FormLabel>
                        <FormControl>
                          <NumberInput
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            defaultValue={1}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxCustomers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.subscription_packages.form.field.max_customers')}</FormLabel>
                        <FormControl>
                          <NumberInput
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            defaultValue={1}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {initialValue && (
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3 md:col-span-2">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="!mt-0">
                            {t('admin.subscription_packages.form.field.is_active')}
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="features"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t('admin.subscription_packages.form.field.features')}</FormLabel>
                        <div className="space-y-2">
                          {field.value && field.value.length > 0 && (
                            <div className="space-y-2">
                              {field.value.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input
                                    value={feature}
                                    onChange={(e) => {
                                      const newFeatures = [...(field.value || [])];
                                      newFeatures[index] = e.target.value;
                                      field.onChange(newFeatures);
                                    }}
                                    placeholder={t('admin.subscription_packages.form.field.feature_placeholder')}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newFeatures = field.value?.filter((_, i) => i !== index) || [];
                                      field.onChange(newFeatures);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const newFeatures = [...(field.value || []), ''];
                              field.onChange(newFeatures);
                            }}
                            className="w-full"
                          >
                            {t('admin.subscription_packages.form.button.add_feature')}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 pt-4 pb-6 border-t mt-auto flex justify-end gap-2 bg-background">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                {t('admin.subscription_packages.form.button.cancel')}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? t('admin.subscription_packages.form.button.processing')
                  : initialValue
                    ? t('admin.subscription_packages.form.button.save')
                    : t('admin.subscription_packages.form.button.create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PackageFormDialog;
