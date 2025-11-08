import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { createServiceValidator, validateFeatureName, type ServiceFormValues } from '@/utils/serviceValidation';
import { formatPriceInput, parsePriceInput } from '@/utils/currency';

interface AddInitialDataDialogProps {
  readonly onAddFeature: (v: { name: string }) => void;
  readonly onAddService: (v: {
    name: string;
    price?: number;
    durationInMonths?: number;
    minParticipants?: number;
    maxParticipants?: number;
    sessionCount?: number;
  }) => void;
  readonly loading: boolean;
  readonly serviceType: 'CLASS' | 'PT';
  readonly defaultMinParticipants?: number;
  readonly defaultMaxParticipants?: number;
}

interface ValidationErrors {
  featureName?: string;
  serviceName?: string;
  price?: string;
  duration?: string;
  sessionCount?: string;
  minParticipants?: string;
  maxParticipants?: string;
}

export function AddInitialDataDialog({
  onAddFeature,
  onAddService,
  loading,
  serviceType,
  defaultMinParticipants = 5,
  defaultMaxParticipants = 20
}: AddInitialDataDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [featureName, setFeatureName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [duration, setDuration] = useState<string>('1');
  const [sessionCount, setSessionCount] = useState<string>('');
  const [minParticipants, setMinParticipants] = useState<string>(defaultMinParticipants.toString());
  const [maxParticipants, setMaxParticipants] = useState<string>(defaultMaxParticipants.toString());
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isClosing, setIsClosing] = useState(false);

  const translationKey = serviceType === 'CLASS' ? 'class_service' : 'pt_service';
  const serviceTypeLower = serviceType.toLowerCase();
  const validateServiceField = createServiceValidator(t, translationKey);

  // Get current form values for validation context
  const getFormValues = (): ServiceFormValues => ({
    featureName,
    serviceName,
    price,
    duration,
    sessionCount,
    minParticipants,
    maxParticipants
  });

  // Validate feature name (simple validation)
  const validateFeatureNameField = (value: string): string => {
    return validateFeatureName(value, t, translationKey);
  };

  // Validate service field (can be featureName or serviceName)
  const validateField = (field: string, value: string): string => {
    if (field === 'featureName') {
      return validateFeatureNameField(value);
    }
    // For service fields, use service validator
    return validateServiceField(field === 'serviceName' ? 'name' : field, value, getFormValues());
  };

  const handleBlur = (field: string) => {
    // Don't validate if modal is closing
    if (isClosing) return;

    const value =
      field === 'featureName'
        ? featureName
        : field === 'serviceName'
          ? serviceName
          : field === 'price'
            ? price
            : field === 'duration'
              ? duration
              : field === 'sessionCount'
                ? sessionCount
                : field === 'minParticipants'
                  ? minParticipants
                  : maxParticipants;

    // Only validate if field has been interacted with (has value or was previously touched)
    // This prevents validation when clicking elsewhere in modal right after opening
    const isDefaultValue =
      (field === 'duration' && value === '1') ||
      (field === 'minParticipants' && value === defaultMinParticipants.toString()) ||
      (field === 'maxParticipants' && value === defaultMaxParticipants.toString());

    if (!touched[field] && !value.trim() && !isDefaultValue) {
      return;
    }
    // For default values, only validate if field was previously touched
    if (!touched[field] && isDefaultValue) {
      return;
    }

    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));

    // If serviceName field is invalid when blurred, validate all service fields to show all errors
    if (field === 'serviceName' && error) {
      validateAll();
    }
  };

  const handleFeatureNameChange = (value: string) => {
    setFeatureName(value);
    if (touched.featureName) {
      const error = validateFeatureNameField(value);
      setErrors((prev) => ({ ...prev, featureName: error }));
    }
  };

  const handleServiceNameChange = (value: string) => {
    setServiceName(value);
    if (touched.serviceName) {
      const formValues = getFormValues();
      formValues.serviceName = value;
      const error = validateServiceField('name', value, formValues);
      setErrors((prev) => ({ ...prev, serviceName: error }));
    }
  };

  const handlePriceChange = (value: string) => {
    // Format the input value with dots while user types
    const formatted = formatPriceInput(value);
    setPrice(formatted);
    if (touched.price) {
      const formValues = getFormValues();
      formValues.price = formatted;
      const error = validateServiceField('price', formatted, formValues);
      setErrors((prev) => ({ ...prev, price: error }));
    }
    // Re-validate sessionCount when price changes
    if (touched.sessionCount && sessionCount.trim()) {
      const formValues = getFormValues();
      formValues.price = formatted;
      const sessionError = validateServiceField('sessionCount', sessionCount, formValues);
      setErrors((prev) => ({ ...prev, sessionCount: sessionError }));
    }
  };

  const handleDurationChange = (value: string) => {
    setDuration(value);
    if (touched.duration) {
      const formValues = getFormValues();
      formValues.duration = value;
      const error = validateServiceField('duration', value, formValues);
      setErrors((prev) => ({ ...prev, duration: error }));
    }
  };

  const handleSessionCountChange = (value: string) => {
    setSessionCount(value);
    if (touched.sessionCount) {
      const formValues = getFormValues();
      formValues.sessionCount = value;
      const error = validateServiceField('sessionCount', value, formValues);
      setErrors((prev) => ({ ...prev, sessionCount: error }));
    }
    // Re-validate price when sessionCount changes
    if (touched.price && price.trim()) {
      const formValues = getFormValues();
      formValues.sessionCount = value;
      const priceError = validateServiceField('price', price, formValues);
      setErrors((prev) => ({ ...prev, price: priceError }));
    }
  };

  const handleMinParticipantsChange = (value: string) => {
    setMinParticipants(value);
    if (touched.minParticipants) {
      const formValues = getFormValues();
      formValues.minParticipants = value;
      const error = validateServiceField('minParticipants', value, formValues);
      setErrors((prev) => ({ ...prev, minParticipants: error }));
    }
    if (touched.maxParticipants) {
      const formValues = getFormValues();
      formValues.minParticipants = value;
      const maxError = validateServiceField('maxParticipants', maxParticipants, formValues);
      setErrors((prev) => ({ ...prev, maxParticipants: maxError }));
    }
  };

  const handleMaxParticipantsChange = (value: string) => {
    setMaxParticipants(value);
    if (touched.maxParticipants) {
      const formValues = getFormValues();
      formValues.maxParticipants = value;
      const error = validateServiceField('maxParticipants', value, formValues);
      setErrors((prev) => ({ ...prev, maxParticipants: error }));
    }
    if (touched.minParticipants) {
      const formValues = getFormValues();
      formValues.maxParticipants = value;
      const minError = validateServiceField('minParticipants', minParticipants, formValues);
      setErrors((prev) => ({ ...prev, minParticipants: minError }));
    }
  };

  const validateAll = (): boolean => {
    const newErrors: ValidationErrors = {};
    const allFields = [
      'featureName',
      'serviceName',
      'price',
      'duration',
      'sessionCount',
      'minParticipants',
      'maxParticipants'
    ];
    const formValues = getFormValues();

    allFields.forEach((field) => {
      const value =
        field === 'featureName'
          ? featureName
          : field === 'serviceName'
            ? serviceName
            : field === 'price'
              ? price
              : field === 'duration'
                ? duration
                : field === 'sessionCount'
                  ? sessionCount
                  : field === 'minParticipants'
                    ? minParticipants
                    : maxParticipants;
      let error = '';
      if (field === 'featureName') {
        error = validateFeatureNameField(value);
      } else if (field === 'serviceName') {
        error = validateServiceField('name', value, formValues);
      } else {
        error = validateServiceField(field, value, formValues);
      }
      if (error) {
        newErrors[field as keyof ValidationErrors] = error;
      }
    });

    setErrors(newErrors);
    setTouched({
      featureName: true,
      serviceName: true,
      price: true,
      duration: true,
      sessionCount: true,
      minParticipants: true,
      maxParticipants: true
    });
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = () => {
    if (!validateAll()) return;

    // Add feature
    onAddFeature({ name: featureName.trim() });

    // Add service
    onAddService({
      name: serviceName.trim(),
      price: price ? parsePriceInput(price) : undefined,
      durationInMonths: Number(duration),
      sessionCount: sessionCount ? Number(sessionCount) : undefined,
      minParticipants: Number(minParticipants),
      maxParticipants: Number(maxParticipants)
    });

    // Reset form
    setOpen(false);
    setFeatureName('');
    setServiceName('');
    setPrice('');
    setDuration('1');
    setSessionCount('');
    setMinParticipants(defaultMinParticipants.toString());
    setMaxParticipants(defaultMaxParticipants.toString());
    setErrors({});
    setTouched({});
  };

  const handleClose = () => {
    setIsClosing(true);
    setErrors({});
    setTouched({});
    setOpen(false);
    setFeatureName('');
    setServiceName('');
    setPrice('');
    setDuration('1');
    setSessionCount('');
    setMinParticipants(defaultMinParticipants.toString());
    setMaxParticipants(defaultMaxParticipants.toString());
    // Reset isClosing after a short delay to allow modal to close
    setTimeout(() => setIsClosing(false), 100);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        } else {
          setOpen(isOpen);
          setIsClosing(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="px-8 py-4 text-lg font-semibold text-white border border-orange-500 rounded-full bg-orange-500 hover:bg-orange-600 hover:border-orange-600 transition-colors flex items-center leading-none shadow-lg"
          disabled={loading}
        >
          <Plus className="h-5 w-5 mr-2" />
          {t(`${translationKey}.add_initial_data`)}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto hide-scrollbar">
        <DialogHeader>
          <DialogTitle>{t(`${translationKey}.add_initial_data_title`)}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Feature Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <h3 className="text-sm font-medium text-gray-900">{t(`${translationKey}.add_feature_section`)}</h3>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="featureName">
                {t(`${translationKey}.feature_name`)} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="featureName"
                value={featureName}
                onChange={(e) => handleFeatureNameChange(e.target.value)}
                onBlur={() => handleBlur('featureName')}
                placeholder={t(`${translationKey}.feature_name_placeholder`)}
                disabled={loading}
                className={errors.featureName ? 'border-red-500' : ''}
              />
              {errors.featureName && <p className="text-sm text-red-500">{errors.featureName}</p>}
            </div>
          </div>

          {/* Service Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 className="text-sm font-medium text-gray-900">
                {t(`${translationKey}.add_${serviceTypeLower}_section`)}
              </h3>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="serviceName">
                  {t(`${translationKey}.${serviceTypeLower}_name`)} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="serviceName"
                  value={serviceName}
                  onChange={(e) => handleServiceNameChange(e.target.value)}
                  onBlur={() => handleBlur('serviceName')}
                  placeholder={t(`${translationKey}.${serviceTypeLower}_name_placeholder`)}
                  disabled={loading}
                  className={errors.serviceName ? 'border-red-500' : ''}
                />
                {errors.serviceName && <p className="text-sm text-red-500">{errors.serviceName}</p>}
              </div>
              <div className="grid gap-2 grid-cols-2 items-start">
                <div className="grid gap-2">
                  <Label htmlFor="price">
                    {t(`${translationKey}.price`)} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="text"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    onBlur={() => handleBlur('price')}
                    placeholder={t(`${translationKey}.price_placeholder`)}
                    disabled={loading}
                    className={errors.price ? 'border-red-500' : ''}
                  />
                  <div className="min-h-[1.25rem]">
                    {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">
                    {t(`${translationKey}.duration_months`)} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    onBlur={() => handleBlur('duration')}
                    placeholder={t(`${translationKey}.duration_placeholder`)}
                    disabled={loading}
                    className={errors.duration ? 'border-red-500' : ''}
                  />
                  <div className="min-h-[1.25rem]">
                    {errors.duration && <p className="text-sm text-red-500">{errors.duration}</p>}
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sessionCount">
                  {t(`${translationKey}.session_count`)} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sessionCount"
                  type="number"
                  min="1"
                  value={sessionCount}
                  onChange={(e) => handleSessionCountChange(e.target.value)}
                  onBlur={() => handleBlur('sessionCount')}
                  placeholder={t(`${translationKey}.session_count_placeholder`)}
                  disabled={loading}
                  className={errors.sessionCount ? 'border-red-500' : ''}
                />
                {errors.sessionCount && <p className="text-sm text-red-500">{errors.sessionCount}</p>}
              </div>
              <div className="grid gap-2 grid-cols-2 items-start">
                <div className="grid gap-2">
                  <Label htmlFor="minParticipants">
                    {t(`${translationKey}.min_participants`)} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="minParticipants"
                    type="number"
                    value={minParticipants}
                    onChange={(e) => handleMinParticipantsChange(e.target.value)}
                    onBlur={() => handleBlur('minParticipants')}
                    placeholder={t(`${translationKey}.min_participants_placeholder`)}
                    disabled={loading}
                    className={errors.minParticipants ? 'border-red-500' : ''}
                  />
                  <div className="min-h-[1.25rem]">
                    {errors.minParticipants && <p className="text-sm text-red-500">{errors.minParticipants}</p>}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxParticipants">
                    {t(`${translationKey}.max_participants`)} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => handleMaxParticipantsChange(e.target.value)}
                    onBlur={() => handleBlur('maxParticipants')}
                    placeholder={t(`${translationKey}.max_participants_placeholder`)}
                    disabled={loading}
                    className={errors.maxParticipants ? 'border-red-500' : ''}
                  />
                  <div className="min-h-[1.25rem]">
                    {errors.maxParticipants && <p className="text-sm text-red-500">{errors.maxParticipants}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t(`${translationKey}.cancel`)}
          </Button>
          <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600 text-white" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t(`${translationKey}.create_initial_data`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
