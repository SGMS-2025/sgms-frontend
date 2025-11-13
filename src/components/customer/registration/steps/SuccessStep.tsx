import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SuccessStepProps {
  onClose: () => void;
  message?: string;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({ onClose, message }) => {
  const { t } = useTranslation();

  return (
    <Card className="rounded-3xl border border-border bg-card shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {t('registration.success_title', 'Đăng ký thành công!')}
        </h3>

        <p className="text-sm text-gray-600 text-center mb-8 max-w-md">
          {message ||
            t(
              'registration.success_message',
              'Đã đăng ký dịch vụ thành công. Bạn có thể xem thông tin trong trang chi tiết khách hàng.'
            )}
        </p>

        <Button onClick={onClose} className="min-w-[200px]">
          {t('registration.close', 'Đóng')}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};
