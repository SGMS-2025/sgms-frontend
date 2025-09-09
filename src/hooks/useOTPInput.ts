import { useState, useRef, useEffect, useCallback } from 'react';

interface UseOTPInputOptions {
  length?: number;
  onComplete?: (otp: string) => void;
  onPaste?: (otp: string) => void;
}

interface UseOTPInputReturn {
  otpDigits: string[];
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handleDigitChange: (index: number, value: string) => void;
  handleKeyDown: (index: number, e: React.KeyboardEvent) => void;
  handlePaste: (e: React.ClipboardEvent) => void;
  clearOTP: () => void;
  focusFirstInput: () => void;
  otpCode: string;
  isComplete: boolean;
}

export const useOTPInput = (options: UseOTPInputOptions = {}): UseOTPInputReturn => {
  const { length = 6, onComplete, onPaste } = options;

  const [otpDigits, setOtpDigits] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otpCode = otpDigits.join('');
  const isComplete = otpCode.length === length;

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      // Only allow single digit
      const digit = value.replace(/\D/g, '').slice(0, 1);

      setOtpDigits((prev) => {
        const newOtpDigits = [...prev];
        newOtpDigits[index] = digit;
        return newOtpDigits;
      });

      // Auto focus to next input
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [length]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      // Handle backspace
      if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otpDigits]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);

      setOtpDigits((prev) => {
        const newOtpDigits = [...prev];
        for (let i = 0; i < pastedData.length && i < length; i++) {
          newOtpDigits[i] = pastedData[i];
        }
        return newOtpDigits;
      });

      // Focus on the next empty input or the last input
      const nextEmptyIndex = pastedData.length < length ? pastedData.length : length - 1;
      inputRefs.current[nextEmptyIndex]?.focus();

      // Call onPaste callback if provided
      if (onPaste) {
        onPaste(pastedData);
      }
    },
    [length, onPaste]
  );

  const clearOTP = useCallback(() => {
    setOtpDigits(new Array(length).fill(''));
    inputRefs.current[0]?.focus();
  }, [length]);

  const focusFirstInput = useCallback(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Call onComplete when OTP is complete
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete(otpCode);
    }
  }, [isComplete, otpCode, onComplete]);

  return {
    otpDigits,
    inputRefs,
    handleDigitChange,
    handleKeyDown,
    handlePaste,
    clearOTP,
    focusFirstInput,
    otpCode,
    isComplete
  };
};
