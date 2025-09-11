import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center animate-fade-in ${className}`}>
      <div className="flex items-center justify-center w-16 h-16 bg-red-50 border border-red-100 rounded-full mb-4 animate-bounce">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>

      <h3 className="text-lg font-semibold text-slate-900 mb-2">Có lỗi xảy ra</h3>

      <p className="text-slate-600 mb-6 max-w-md leading-relaxed">
        {message || 'Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng và thử lại.'}
      </p>

      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="flex items-center gap-2 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </Button>
      )}
    </div>
  );
};
