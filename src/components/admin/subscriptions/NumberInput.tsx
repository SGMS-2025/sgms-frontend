import React from 'react';
import { Input } from '@/components/ui/input';

interface NumberInputProps {
  value: number | undefined;
  onChange: (value: number) => void;
  onBlur?: () => void;
  defaultValue: number;
  placeholder?: string;
  className?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  onBlur,
  defaultValue,
  placeholder,
  className
}) => {
  const [localValue, setLocalValue] = React.useState<string>(
    value === undefined || value === null ? '' : String(value)
  );

  React.useEffect(() => {
    setLocalValue(value === undefined || value === null ? '' : String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Only allow digits, filter out non-numeric characters immediately
    const numericValue = val.replace(/[^0-9]/g, '');

    // Update local value with filtered value (no letters allowed)
    setLocalValue(numericValue);

    if (numericValue === '') {
      // Allow empty while typing, don't update form yet
      return;
    } else {
      const numValue = Number(numericValue);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    }
  };

  const handleBlur = () => {
    // Normalize: remove leading zeros and set default if empty
    const trimmed = localValue.trim();
    if (trimmed === '') {
      onChange(defaultValue);
      setLocalValue(String(defaultValue));
    } else {
      const numericValue = trimmed.replace(/[^0-9]/g, '');
      if (numericValue === '') {
        onChange(defaultValue);
        setLocalValue(String(defaultValue));
      } else {
        const numValue = Number(numericValue);
        const finalValue = isNaN(numValue) ? defaultValue : numValue;
        onChange(finalValue);
        setLocalValue(String(finalValue));
      }
    }
    onBlur?.();
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
};
