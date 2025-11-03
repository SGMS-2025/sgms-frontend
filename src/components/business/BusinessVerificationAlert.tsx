import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XCircle, Clock, X, Building2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { businessVerificationApi } from '@/services/api/businessVerificationApi';
import type { VerificationStatus } from '@/types/api/BusinessVerification';
import { BusinessVerificationStatus } from '@/types/api/BusinessVerification';

interface BusinessVerificationAlertProps {
  onOpenVerificationModal: () => void;
}

export const BusinessVerificationAlert = ({ onOpenVerificationModal }: BusinessVerificationAlertProps) => {
  const { t } = useTranslation();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    const result = await businessVerificationApi.getVerificationStatus();
    setLoading(false);

    if (result.success && result.data) {
      setVerificationStatus(result.data);

      // Auto-hide if already approved
      if (result.data.status === BusinessVerificationStatus.APPROVED) {
        setDismissed(true);
      }
    }
  };

  // Don't show if loading, dismissed, or already approved
  if (loading || dismissed || verificationStatus?.status === BusinessVerificationStatus.APPROVED) {
    return null;
  }

  // Not verified yet
  if (!verificationStatus?.hasVerification) {
    return (
      <Alert className="mb-6 border-orange-500 bg-orange-50 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>

        <Building2 className="h-5 w-5 text-orange-600" />
        <AlertTitle className="text-orange-800 font-semibold">
          {t('businessVerification.alert.notVerified.title', 'Xác thực doanh nghiệp của bạn')}
        </AlertTitle>
        <AlertDescription className="text-orange-700">
          <p className="mb-3">
            {t(
              'businessVerification.alert.notVerified.description',
              'Hoàn thành xác thực để mở khóa toàn bộ tính năng quản lý phòng gym, tạo chi nhánh và quản lý nhân viên.'
            )}
          </p>
          <Button onClick={onOpenVerificationModal} className="bg-orange-600 hover:bg-orange-700 text-white" size="sm">
            <Building2 className="h-4 w-4 mr-2" />
            {t('businessVerification.alert.notVerified.button', 'Xác thực ngay')}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Pending verification
  if (verificationStatus.status === BusinessVerificationStatus.PENDING) {
    return (
      <Alert className="mb-6 border-blue-500 bg-blue-50 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>

        <Clock className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-800 font-semibold">
          {t('businessVerification.alert.pending.title', 'Đang chờ xét duyệt')}
        </AlertTitle>
        <AlertDescription className="text-blue-700">
          <p className="mb-3">
            {t(
              'businessVerification.alert.pending.description',
              'Yêu cầu xác thực doanh nghiệp của bạn đang được admin xem xét. Chúng tôi sẽ thông báo kết quả sớm nhất.'
            )}
          </p>
          <Button
            onClick={onOpenVerificationModal}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-100"
            size="sm"
          >
            {t('businessVerification.alert.pending.button', 'Xem chi tiết')}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Rejected verification
  if (verificationStatus.status === BusinessVerificationStatus.REJECTED) {
    return (
      <Alert className="mb-6 border-red-500 bg-red-50 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>

        <XCircle className="h-5 w-5 text-red-600" />
        <AlertTitle className="text-red-800 font-semibold">
          {t('businessVerification.alert.rejected.title', 'Yêu cầu xác thực bị từ chối')}
        </AlertTitle>
        <AlertDescription className="text-red-700">
          <p className="mb-2">
            {verificationStatus.rejectionReason ||
              t('businessVerification.alert.rejected.defaultReason', 'Admin đã từ chối yêu cầu xác thực của bạn.')}
          </p>
          <p className="mb-3 text-sm">
            {t(
              'businessVerification.alert.rejected.description',
              'Vui lòng kiểm tra lại thông tin và gửi lại yêu cầu.'
            )}
          </p>
          <Button onClick={onOpenVerificationModal} className="bg-red-600 hover:bg-red-700 text-white" size="sm">
            {t('businessVerification.alert.rejected.button', 'Gửi lại yêu cầu')}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
