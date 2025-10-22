import React from 'react';

type FormNoticeVariant = 'info' | 'warning' | 'error';

interface FormNoticeProps {
  message: string;
  variant?: FormNoticeVariant;
}

const variantStyles: Record<FormNoticeVariant, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  error: 'border-red-200 bg-red-50 text-red-700'
};

export const FormNotice: React.FC<FormNoticeProps> = ({ message, variant = 'info' }) => {
  return <div className={`text-xs border rounded-md px-3 py-2 ${variantStyles[variant]}`}>{message}</div>;
};

export default FormNotice;
