import React from 'react';
import { Input } from '@/components/ui/input';
import { useOTPInput } from '@/hooks/useOTPInput';
import { useTranslation } from 'react-i18next';

interface OTPInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
  onPaste?: (otp: string) => void;
  className?: string;
  inputClassName?: string;
  showInfo?: boolean;
  infoText?: string;
  showProgress?: boolean;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  onComplete,
  onPaste,
  className = '',
  inputClassName = '',
  showInfo = true,
  infoText,
  showProgress = true,
  disabled = false
}) => {
  const { t } = useTranslation();

  const { otpDigits, inputRefs, handleDigitChange, handleKeyDown, handlePaste, otpCode, isComplete } = useOTPInput({
    length,
    onComplete,
    onPaste
  });

  const defaultInputClassName = `w-14 h-14 bg-white text-gray-900 border-gray-300 rounded-lg text-center text-2xl font-bold font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${inputClassName}`;

  return (
    <div className={className}>
      <div className="flex justify-center space-x-3 mb-2">
        {otpDigits.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            value={digit}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={defaultInputClassName}
            maxLength={1}
            disabled={disabled}
            required
          />
        ))}
      </div>

      {showInfo && (
        <p className="text-xs text-gray-500 mt-2 flex items-center justify-center">
          <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-2">
            i
          </span>
          {infoText || t('auth.otp_info')}
        </p>
      )}

      {showProgress && (
        <>
          {otpCode.length > 0 && otpCode.length < length && (
            <p className="text-xs text-orange-500 mt-1 text-center">
              {t('auth.enter_remaining_digits', { remaining: length - otpCode.length })}
            </p>
          )}
          {isComplete && (
            <p className="text-xs text-green-500 mt-1 text-center font-semibold">✓ {t('auth.otp_complete')}</p>
          )}
        </>
      )}
    </div>
  );
};
