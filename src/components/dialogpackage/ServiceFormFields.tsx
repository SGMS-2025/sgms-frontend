import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ValidationErrors } from './useServiceForm';

interface ServiceFormFieldsProps {
  translationKey: string;
  serviceType: 'CLASS' | 'PT';
  // Form values
  name: string;
  price: string;
  duration: string;
  sessionCount: string;
  minParticipants: string;
  maxParticipants: string;
  // Errors
  errors: ValidationErrors;
  // Handlers
  onNameChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onSessionCountChange: (value: string) => void;
  onMinParticipantsChange: (value: string) => void;
  onMaxParticipantsChange: (value: string) => void;
  onBlur: (field: string) => void;
  // Other props
  disabled?: boolean;
}

export const ServiceFormFields: React.FC<ServiceFormFieldsProps> = ({
  translationKey,
  serviceType,
  name,
  price,
  duration,
  sessionCount,
  minParticipants,
  maxParticipants,
  errors,
  onNameChange,
  onPriceChange,
  onDurationChange,
  onSessionCountChange,
  onMinParticipantsChange,
  onMaxParticipantsChange,
  onBlur,
  disabled = false
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="name">
          {t(`${translationKey}.${serviceType.toLowerCase()}_name`)} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={() => onBlur('name')}
          placeholder={t(`${translationKey}.${serviceType.toLowerCase()}_name_placeholder`)}
          disabled={disabled}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
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
            onChange={(e) => onPriceChange(e.target.value)}
            onBlur={() => onBlur('price')}
            placeholder={t(`${translationKey}.price_placeholder`)}
            disabled={disabled}
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
            onChange={(e) => onDurationChange(e.target.value)}
            onBlur={() => onBlur('duration')}
            placeholder={t(`${translationKey}.duration_placeholder`)}
            disabled={disabled}
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
          onChange={(e) => onSessionCountChange(e.target.value)}
          onBlur={() => onBlur('sessionCount')}
          placeholder={t(`${translationKey}.session_count_placeholder`)}
          disabled={disabled}
          className={errors.sessionCount ? 'border-red-500' : ''}
        />
        {errors.sessionCount && <p className="text-sm text-red-500">{errors.sessionCount}</p>}
      </div>
      {/* Min/Max Participants - Only show for CLASS type */}
      {serviceType === 'CLASS' && (
        <div className="grid gap-2 grid-cols-2 items-start">
          <div className="grid gap-2">
            <Label htmlFor="minParticipants">{t(`${translationKey}.min_participants`)}</Label>
            <Input
              id="minParticipants"
              type="number"
              value={minParticipants}
              onChange={(e) => onMinParticipantsChange(e.target.value)}
              onBlur={() => onBlur('minParticipants')}
              placeholder={t(`${translationKey}.min_participants_placeholder`)}
              disabled={disabled}
              className={errors.minParticipants ? 'border-red-500' : ''}
            />
            <div className="min-h-[1.25rem]">
              {errors.minParticipants && <p className="text-sm text-red-500">{errors.minParticipants}</p>}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="maxParticipants">{t(`${translationKey}.max_participants`)}</Label>
            <Input
              id="maxParticipants"
              type="number"
              value={maxParticipants}
              onChange={(e) => onMaxParticipantsChange(e.target.value)}
              onBlur={() => onBlur('maxParticipants')}
              placeholder={t(`${translationKey}.max_participants_placeholder`)}
              disabled={disabled}
              className={errors.maxParticipants ? 'border-red-500' : ''}
            />
            <div className="min-h-[1.25rem]">
              {errors.maxParticipants && <p className="text-sm text-red-500">{errors.maxParticipants}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
