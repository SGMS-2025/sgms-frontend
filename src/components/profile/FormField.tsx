import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FormFieldProps } from '@/types/components/FormFieldCustomer';

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  icon: Icon,
  value,
  placeholder,
  type = 'text',
  isEditing,
  onChange,
  isTextarea = false,
  rows = 4,
  min,
  max,
  error,
  required = false
}) => (
  <div className="space-y-3">
    <Label htmlFor={isEditing ? id : undefined} className="flex items-center gap-2 text-gray-700 font-medium">
      <Icon className="w-4 h-4 text-orange-500" />
      {label}
      {required && <span className="text-red-500">*</span>}
    </Label>
    {isEditing ? (
      <>
        {isTextarea ? (
          <Textarea
            id={id}
            value={value}
            onChange={onChange}
            rows={rows}
            className={`bg-white border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg px-4 py-3 text-base font-medium resize-none ${
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder={placeholder}
          />
        ) : (
          <Input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            className={`bg-white border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg px-4 py-3 h-12 text-base font-medium ${
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder={placeholder}
            min={min}
            max={max}
          />
        )}
        {error && (
          <p className="text-red-500 text-sm font-medium flex items-center gap-1">
            <Icon className="w-4 h-4" />
            {error}
          </p>
        )}
      </>
    ) : (
      <div
        className={`bg-white rounded-lg px-4 py-3 border border-gray-200 ${isTextarea ? 'min-h-[100px] flex items-start' : 'h-12 flex items-center'}`}
      >
        <p className="text-gray-900 font-medium">{value || 'Chưa cập nhật'}</p>
      </div>
    )}
  </div>
);
