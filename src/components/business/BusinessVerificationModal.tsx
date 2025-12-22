import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Building2, Upload, X, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { businessVerificationApi } from '@/services/api/businessVerificationApi';
import type { BusinessVerification } from '@/types/api/BusinessVerification';
import { extractAndTranslateApiError } from '@/utils/errorHandler';

interface BusinessVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const BusinessVerificationModal = ({ open, onOpenChange, onSuccess }: BusinessVerificationModalProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verification, setVerification] = useState<BusinessVerification | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [documentPreviews, setDocumentPreviews] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    taxCode: '',
    businessCode: '',
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    description: ''
  });

  const fetchVerificationStatus = useCallback(async () => {
    setIsLoading(true);

    const result = await businessVerificationApi.getMyVerification();
    setIsLoading(false);

    if (result.success) {
      // result.data can be null when user hasn't submitted verification yet (normal case)
      if (result.data) {
        setVerification(result.data);

        // Pre-fill form if rejected (allow edit and resubmit)
        if (result.data.status === 'REJECTED') {
          setFormData({
            taxCode: result.data.taxCode || '',
            businessCode: result.data.businessCode || '',
            businessName: result.data.businessName || '',
            businessAddress: result.data.businessAddress || '',
            businessPhone: result.data.businessPhone || '',
            businessEmail: result.data.businessEmail || '',
            description: result.data.description || ''
          });

          // Pre-fill logo
          if (result.data.logo?.url) {
            setLogoPreview(result.data.logo.url);
          }
        }
      } else {
        // No verification found - this is normal for new owners, don't show error
        setVerification(null);
      }
    } else if (result.success === false && result.message) {
      // Only show error for actual errors (not 404 for missing verification)
      // Check if it's the BUSINESS_VERIFICATION_NOT_FOUND error and ignore it
      if (result.message !== 'BUSINESS_VERIFICATION_NOT_FOUND') {
        toast.error(
          result.message ||
            t('businessVerification.error.loadFailed', 'Không thể tải thông tin xác thực. Vui lòng thử lại sau.')
        );
      }
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchVerificationStatus();
    } else {
      // Reset all states when modal closes
      setVerification(null);
      setLogoFile(null);
      setLogoPreview('');
      setDocumentFiles([]);
      setDocumentPreviews([]);
      setFormData({
        taxCode: '',
        businessCode: '',
        businessName: '',
        businessAddress: '',
        businessPhone: '',
        businessEmail: '',
        description: ''
      });
    }
  }, [open, fetchVerificationStatus]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
  };

  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + documentFiles.length > 10) {
      toast.error(t('businessVerification.error.maxDocuments', 'Tối đa 10 giấy tờ'));
      return;
    }

    setDocumentFiles([...documentFiles, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeDocument = (index: number) => {
    setDocumentFiles((prev) => prev.filter((_, i) => i !== index));
    setDocumentPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.businessName || !formData.businessAddress || !formData.businessPhone || !formData.businessEmail) {
      toast.error(t('businessVerification.error.requiredFields', 'Vui lòng điền đầy đủ thông tin bắt buộc'));
      return;
    }

    if (!formData.taxCode && !formData.businessCode) {
      toast.error(
        t('businessVerification.error.taxOrBusinessCode', 'Vui lòng điền mã số thuế hoặc mã số doanh nghiệp')
      );
      return;
    }

    if (!logoFile && !logoPreview) {
      toast.error(t('businessVerification.error.logoRequired', 'Vui lòng upload logo'));
      return;
    }

    setIsSubmitting(true);

    const result =
      verification?.status === 'REJECTED'
        ? await businessVerificationApi.updateVerification(formData, logoFile || undefined, documentFiles)
        : await businessVerificationApi.submitVerification(formData, logoFile!, documentFiles);

    setIsSubmitting(false);

    if (result.success) {
      toast.success(
        verification?.status === 'REJECTED'
          ? t('businessVerification.success.resubmit', 'Đã gửi lại yêu cầu xác thực thành công!')
          : t('businessVerification.success.submit', 'Gửi yêu cầu xác thực thành công!')
      );
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } else {
      // Translate error message from backend
      const errorMessage = extractAndTranslateApiError(result, t, 'businessVerification.error.submitFailed');
      toast.error(errorMessage);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex flex-col items-center justify-center py-8">
            <Building2 className="w-12 h-12 text-orange-600 animate-pulse mb-4" />
            <p className="text-lg font-medium">{t('common.loading', 'Đang tải...')}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // PENDING - Display pending status
  if (verification?.status === 'PENDING') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[92vh] border-none bg-white p-0 shadow-2xl">
          <div className="relative m-1 max-h-[88vh] overflow-hidden rounded-[28px] border border-orange-100 bg-gradient-to-br from-white via-orange-50/60 to-white shadow-[0_24px_80px_rgba(249,115,22,0.16)]">
            <div className="pointer-events-none absolute inset-x-6 top-0 h-28 rounded-[40px] bg-gradient-to-r from-orange-100/60 via-white to-amber-50/50 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 bottom-10 h-36 w-36 rounded-full bg-orange-200/30 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 top-14 h-32 w-32 rounded-full bg-amber-200/30 blur-3xl" />

            <ScrollArea className="h-[78vh] px-1 overflow-y-auto [&_[data-slot=scroll-area-scrollbar]]:hidden">
              <div className="relative px-5 py-6 sm:px-8 sm:py-8 space-y-6 pr-2">
                <DialogHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm border border-orange-100">
                      <Clock className="h-4 w-4" />
                      {t('businessVerification.status.pending', 'Đang chờ xét duyệt')}
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700 shadow-sm">
                      {t('businessVerification.timeline.reviewing', 'Đang xét duyệt')}
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-inner shadow-orange-100">
                      <Clock className="h-7 w-7 text-orange-600 animate-pulse" />
                    </div>
                    <DialogTitle className="text-2xl font-semibold text-orange-900">
                      {t('businessVerification.status.pending', 'Đang chờ xét duyệt')}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-orange-700">
                      {t(
                        'businessVerification.status.pendingDescription',
                        'Yêu cầu xác thực doanh nghiệp của bạn đang được admin xem xét'
                      )}
                    </DialogDescription>
                  </div>

                  <div className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm shadow-orange-50/80">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        {
                          label: t('businessVerification.timeline.submitted', 'Đã gửi'),
                          color: 'from-orange-500 to-amber-500',
                          icon: CheckCircle2,
                          pulse: false
                        },
                        {
                          label: t('businessVerification.timeline.reviewing', 'Đang xét duyệt'),
                          color: 'from-amber-500 to-orange-500',
                          icon: Clock,
                          pulse: true
                        },
                        {
                          label: t('businessVerification.timeline.completed', 'Hoàn tất'),
                          color: 'from-gray-200 to-gray-300',
                          icon: CheckCircle2,
                          pulse: false
                        }
                      ].map((step, index) => {
                        const Icon = step.icon;
                        return (
                          <div key={index} className="flex flex-col items-center gap-2">
                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${step.color} text-white shadow-lg shadow-orange-200/60 ${step.pulse ? 'animate-pulse' : ''}`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <p className="text-xs font-semibold text-orange-800">{step.label}</p>
                            {index < 2 && (
                              <div className="hidden sm:block h-1 w-20 rounded-full bg-gradient-to-r from-orange-200 to-orange-500" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </DialogHeader>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm shadow-orange-50/60">
                    <div className="mb-3 flex items-center gap-2 text-orange-800">
                      <Building2 className="h-4 w-4" />
                      <p className="text-sm font-semibold">
                        {t('businessVerification.info.businessInfo', 'Thông tin doanh nghiệp')}
                      </p>
                    </div>
                    <div className="space-y-3 text-sm text-orange-800">
                      {verification.logo?.url && (
                        <div className="flex justify-center">
                          <div className="relative">
                            <img
                              src={verification.logo.url}
                              alt="Logo"
                              className="h-20 w-20 object-contain rounded-xl border border-orange-100 bg-white p-2 shadow-sm"
                            />
                          </div>
                        </div>
                      )}
                      <p className="font-semibold">
                        {t('businessVerification.field.businessName', 'Tên DN')}:{' '}
                        <span className="font-normal">{verification.businessName}</span>
                      </p>
                      <p className="font-semibold">
                        {t('businessVerification.field.taxCode', 'Mã số thuế')}:{' '}
                        <span className="font-normal">{verification.taxCode || verification.businessCode}</span>
                      </p>
                      <p className="text-xs text-gray-600">
                        {t('businessVerification.field.submittedAt', 'Ngày gửi')}:{' '}
                        {new Date(verification.submittedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/70 p-4 shadow-sm shadow-blue-50/80">
                    <div className="mb-3 flex items-center justify-between text-blue-800">
                      <p className="text-sm font-semibold">
                        {t('businessVerification.info.contactInfo', 'Thông tin liên hệ')}
                      </p>
                      <div className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700 shadow-sm">
                        {t('businessVerification.section.contact', 'Liên hệ')}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p className="font-semibold">
                        {t('businessVerification.field.address', 'Địa chỉ')}:{' '}
                        <span className="font-normal">{verification.businessAddress}</span>
                      </p>
                      <p className="font-semibold">
                        {t('businessVerification.field.email', 'Email')}:{' '}
                        <span className="font-normal">{verification.businessEmail}</span>
                      </p>
                      <p className="font-semibold">
                        {t('businessVerification.field.phone', 'Điện thoại')}:{' '}
                        <span className="font-normal">{verification.businessPhone}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {verification.documents && verification.documents.length > 0 && (
                  <div className="space-y-3 rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm shadow-orange-50/80">
                    <div className="flex items-center gap-2 text-orange-800">
                      <Clock className="h-4 w-4" />
                      <p className="text-sm font-semibold">
                        {t('businessVerification.field.documents', 'Giấy tờ xác thực')} ({verification.documents.length}
                        )
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {verification.documents.map((doc, index) => (
                        <a
                          key={index}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative overflow-hidden rounded-xl border border-orange-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <img
                            src={doc.url}
                            alt={doc.fileName || `Document ${index + 1}`}
                            className="h-28 w-full object-cover transition duration-150 group-hover:scale-[1.02]"
                          />
                          <div className="absolute bottom-1 left-1 rounded bg-orange-500 px-1.5 text-[11px] font-semibold text-white shadow-sm">
                            {index + 1}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <DialogFooter className="justify-end">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="rounded-full border-gray-200 px-5 text-gray-700 hover:bg-gray-50"
                  >
                    {t('common.close', 'Đóng')}
                  </Button>
                </DialogFooter>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // APPROVED - Display approved status
  if (verification?.status === 'APPROVED') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[92vh] border-none bg-white p-0 shadow-2xl">
          <div className="relative m-1 max-h-[88vh] overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/60 to-white shadow-[0_24px_80px_rgba(16,185,129,0.16)]">
            <div className="pointer-events-none absolute inset-x-6 top-0 h-28 rounded-[40px] bg-gradient-to-r from-emerald-100/60 via-white to-emerald-50/50 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 bottom-10 h-36 w-36 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 top-14 h-32 w-32 rounded-full bg-green-200/30 blur-3xl" />

            <ScrollArea className="h-[78vh] px-1 overflow-y-auto [&_[data-slot=scroll-area-scrollbar]]:hidden">
              <div className="relative px-5 py-6 sm:px-8 sm:py-8 space-y-6 pr-2">
                <DialogHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm border border-emerald-100">
                      <CheckCircle2 className="h-4 w-4" />
                      {t('businessVerification.status.approved', 'Đã xác thực doanh nghiệp')}
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t('businessVerification.timeline.completed', 'Hoàn tất')}
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-inner shadow-emerald-100">
                      <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                    </div>
                    <DialogTitle className="text-2xl font-semibold text-emerald-900">
                      {t('businessVerification.status.approved', 'Đã xác thực doanh nghiệp')}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-emerald-700">
                      {t(
                        'businessVerification.status.approvedDescription',
                        'Doanh nghiệp của bạn đã được xác thực thành công'
                      )}
                    </DialogDescription>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm shadow-emerald-50/80">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        {
                          label: t('businessVerification.timeline.submitted', 'Đã gửi'),
                          color: 'from-emerald-500 to-green-500'
                        },
                        {
                          label: t('businessVerification.timeline.approved', 'Đã duyệt'),
                          color: 'from-green-500 to-lime-500'
                        },
                        {
                          label: t('businessVerification.timeline.completed', 'Hoàn tất'),
                          color: 'from-lime-500 to-emerald-500'
                        }
                      ].map((step, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${step.color} text-white shadow-lg shadow-emerald-200/60`}
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-semibold text-emerald-800">{step.label}</p>
                          {index < 2 && (
                            <div className="hidden sm:block h-1 w-20 rounded-full bg-gradient-to-r from-emerald-200 to-emerald-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogHeader>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm shadow-emerald-50/60">
                    <div className="mb-3 flex items-center gap-2 text-emerald-800">
                      <Building2 className="h-4 w-4" />
                      <p className="text-sm font-semibold">
                        {t('businessVerification.info.businessInfo', 'Thông tin doanh nghiệp')}
                      </p>
                    </div>
                    <div className="space-y-3 text-sm text-emerald-800">
                      {verification.logo?.url && (
                        <div className="flex justify-center">
                          <div className="relative">
                            <img
                              src={verification.logo.url}
                              alt="Logo"
                              className="h-24 w-24 object-contain rounded-xl border border-emerald-100 bg-white p-2 shadow-sm"
                            />
                            <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1.5 text-white shadow">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </div>
                      )}
                      <p className="font-semibold">
                        {t('businessVerification.field.businessName', 'Tên DN')}:{' '}
                        <span className="font-normal">{verification.businessName}</span>
                      </p>
                      <p className="font-semibold">
                        {t('businessVerification.field.taxCode', 'Mã số thuế')}:{' '}
                        <span className="font-normal">{verification.taxCode || verification.businessCode}</span>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/70 p-4 shadow-sm shadow-blue-50/80">
                    <div className="mb-3 flex items-center justify-between text-blue-800">
                      <p className="text-sm font-semibold">
                        {t('businessVerification.info.contactInfo', 'Thông tin liên hệ')}
                      </p>
                      <div className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700 shadow-sm">
                        {t('businessVerification.section.contact', 'Liên hệ')}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p className="font-semibold">
                        {t('businessVerification.field.address', 'Địa chỉ')}:{' '}
                        <span className="font-normal">{verification.businessAddress}</span>
                      </p>
                      <p className="font-semibold">
                        {t('businessVerification.field.email', 'Email')}:{' '}
                        <span className="font-normal">{verification.businessEmail}</span>
                      </p>
                      <p className="font-semibold">
                        {t('businessVerification.field.phone', 'Điện thoại')}:{' '}
                        <span className="font-normal">{verification.businessPhone}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {verification.documents && verification.documents.length > 0 && (
                  <div className="space-y-3 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm shadow-emerald-50/80">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" />
                      <p className="text-sm font-semibold">
                        {t('businessVerification.field.documents', 'Giấy tờ xác thực')} ({verification.documents.length}
                        )
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {verification.documents.map((doc, index) => (
                        <a
                          key={index}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <img
                            src={doc.url}
                            alt={doc.fileName || `Document ${index + 1}`}
                            className="h-28 w-full object-cover transition duration-150 group-hover:scale-[1.02]"
                          />
                          <div className="absolute bottom-1 left-1 rounded bg-emerald-600 px-1.5 text-[11px] font-semibold text-white shadow-sm">
                            {index + 1}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <DialogFooter className="justify-end">
                  <Button
                    onClick={() => onOpenChange(false)}
                    className="rounded-full bg-emerald-600 px-5 font-semibold text-white shadow-lg shadow-emerald-300/50 hover:bg-emerald-700"
                  >
                    {t('common.close', 'Đóng')}
                  </Button>
                </DialogFooter>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // REJECTED or no verification - Show form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] border-none bg-white p-0 shadow-2xl">
        <div className="relative m-1 max-h-[88vh] overflow-hidden rounded-[28px] border border-orange-100 bg-gradient-to-br from-white via-orange-50 to-white shadow-[0_24px_80px_rgba(244,114,40,0.18)]">
          <div className="pointer-events-none absolute inset-x-4 top-3 h-24 rounded-[32px] bg-gradient-to-r from-orange-100/40 via-amber-50/30 to-orange-100/20 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 bottom-16 h-28 w-28 rounded-full bg-orange-200/25 blur-2xl" />
          <div className="pointer-events-none absolute -right-8 top-12 h-24 w-24 rounded-full bg-amber-200/25 blur-2xl" />

          <ScrollArea className="h-[78vh] px-1 overflow-y-auto [&_[data-slot=scroll-area-scrollbar]]:hidden">
            <div className="relative px-4 py-6 sm:px-7 sm:py-8 space-y-6 pr-2">
              <DialogHeader className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-inner shadow-orange-100">
                      <Building2 className="h-7 w-7 text-orange-600" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl sm:text-2xl font-semibold text-gray-900">
                        {verification?.status === 'REJECTED'
                          ? t('businessVerification.title.resubmit', 'Gửi lại yêu cầu xác thực')
                          : t('businessVerification.title.submit', 'Xác thực doanh nghiệp')}
                      </DialogTitle>
                      <DialogDescription className="text-sm text-gray-600">
                        {verification?.status === 'REJECTED'
                          ? t(
                              'businessVerification.description.resubmit',
                              'Cập nhật thông tin chính xác hơn và gửi lại yêu cầu xác thực.'
                            )
                          : t(
                              'businessVerification.description.submit',
                              'Điền thông tin doanh nghiệp chuẩn chỉnh như các nền tảng lớn yêu cầu.'
                            )}
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 self-start rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700 shadow-sm">
                    {verification?.status === 'REJECTED'
                      ? t('common.resubmit', 'Gửi lại')
                      : t('common.submit', 'Gửi mới')}
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-orange-100 bg-white/80 p-3 shadow-sm">
                    <p className="text-xs font-semibold text-orange-700">
                      {t('businessVerification.badge.trust', 'Chuẩn doanh nghiệp')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t(
                        'businessVerification.badge.trustDescription',
                        'Định danh rõ ràng để mở khóa tính năng quản trị nâng cao.'
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-white/80 p-3 shadow-sm">
                    <p className="text-xs font-semibold text-orange-700">
                      {t('businessVerification.badge.security', 'Bảo mật & minh bạch')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t(
                        'businessVerification.badge.securityDescription',
                        'Dữ liệu được bảo vệ, giúp bạn sẵn sàng cho kiểm toán nội bộ.'
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-white/80 p-3 shadow-sm">
                    <p className="text-xs font-semibold text-orange-700">
                      {t('businessVerification.badge.speed', 'Xử lý nhanh')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t(
                        'businessVerification.badge.speedDescription',
                        'Đội ngũ xét duyệt ưu tiên hồ sơ đầy đủ, rõ ràng.'
                      )}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              {verification?.status === 'REJECTED' && verification.rejectionReason && (
                <Alert className="border-red-200 bg-red-50/90 backdrop-blur rounded-2xl">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-inner shadow-red-100">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="space-y-1">
                      <AlertTitle className="text-red-800 font-semibold">
                        {t('businessVerification.field.rejectionReason', 'Lý do từ chối')}
                      </AlertTitle>
                      <AlertDescription className="text-red-700 text-sm leading-relaxed">
                        {verification.rejectionReason}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm shadow-orange-100/60">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-orange-700 uppercase tracking-[0.12em]">
                          {t('businessVerification.section.legal', 'Thông tin pháp lý')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t(
                            'businessVerification.section.legalHint',
                            'Mã số thuế hoặc mã DN, điền tối thiểu một mục.'
                          )}
                        </p>
                      </div>
                      <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                        {t('common.required', 'Bắt buộc')}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="taxCode">{t('businessVerification.field.taxCode', 'Mã số thuế')}</Label>
                        <Input
                          id="taxCode"
                          name="taxCode"
                          placeholder={t('businessVerification.placeholder.taxCode', 'Nhập mã số thuế')}
                          value={formData.taxCode}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessCode">
                          {t('businessVerification.field.businessCode', 'Mã số doanh nghiệp')}
                        </Label>
                        <Input
                          id="businessCode"
                          name="businessCode"
                          placeholder={t('businessVerification.placeholder.businessCode', 'Nhập mã số doanh nghiệp')}
                          value={formData.businessCode}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm shadow-orange-100/60">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-orange-700 uppercase tracking-[0.12em]">
                          {t('businessVerification.section.identity', 'Thông tin định danh')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t('businessVerification.section.identityHint', 'Tên, địa chỉ và kênh liên hệ chính xác.')}
                        </p>
                      </div>
                      <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {t('businessVerification.section.contact', 'Liên hệ')}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">
                          {t('businessVerification.field.businessName', 'Tên phòng gym')}{' '}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="businessName"
                          name="businessName"
                          placeholder={t('businessVerification.placeholder.businessName', 'Nhập tên phòng gym')}
                          value={formData.businessName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessAddress">
                          {t('businessVerification.field.address', 'Địa chỉ')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="businessAddress"
                          name="businessAddress"
                          placeholder={t('businessVerification.placeholder.address', 'Nhập địa chỉ doanh nghiệp')}
                          value={formData.businessAddress}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="businessPhone">
                            {t('businessVerification.field.phone', 'Số điện thoại')}{' '}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="businessPhone"
                            name="businessPhone"
                            placeholder={t('businessVerification.placeholder.phone', 'Nhập số điện thoại')}
                            value={formData.businessPhone}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessEmail">
                            {t('businessVerification.field.email', 'Email')} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="businessEmail"
                            name="businessEmail"
                            type="email"
                            placeholder={t('businessVerification.placeholder.email', 'Nhập email')}
                            value={formData.businessEmail}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm shadow-orange-100/60 space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold text-orange-700 uppercase tracking-[0.12em]">
                        {t('businessVerification.section.files', 'Tài liệu & mô tả')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t(
                          'businessVerification.section.filesHint',
                          'Logo rõ nét, giấy tờ hợp lệ giúp duyệt nhanh hơn.'
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      {t('businessVerification.section.ready', 'File an toàn, mã hóa khi tải lên')}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="logo">
                        {t('businessVerification.field.logo', 'Logo phòng gym')} <span className="text-red-500">*</span>
                      </Label>
                      {!logoPreview ? (
                        <div className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50/60 via-white to-amber-50/60 p-4 text-center transition hover:border-orange-400 hover:shadow-lg">
                          <input
                            id="logo"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                          />
                          <label htmlFor="logo" className="flex flex-col items-center gap-2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-inner shadow-orange-100">
                              <Upload className="h-5 w-5 text-orange-500" />
                            </div>
                            <p className="text-sm font-medium text-gray-800">
                              {t('businessVerification.upload.clickToUploadLogo', 'Click để tải lên logo')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t('businessVerification.upload.logoFormat', 'PNG, JPG, WebP tối đa 5MB')}
                            </p>
                          </label>
                        </div>
                      ) : (
                        <div className="relative overflow-hidden rounded-2xl border border-orange-200 bg-white shadow">
                          <img src={logoPreview} alt="Logo" className="w-full h-40 object-contain bg-white" />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2 text-xs text-white">
                            {t('businessVerification.upload.logoPreview', 'Logo xem trước')}
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-3 right-3 h-9 w-9 rounded-full shadow-lg"
                            onClick={removeLogo}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="documents">
                        {t('businessVerification.field.documents', 'Giấy tờ xác thực')}{' '}
                        <span className="text-gray-500">
                          ({t('businessVerification.field.documentsHint', 'Giấy phép kinh doanh, CMND/CCCD, v.v.')})
                        </span>
                      </Label>

                      {verification?.status === 'REJECTED' &&
                        verification.documents &&
                        verification.documents.length > 0 &&
                        documentFiles.length === 0 && (
                          <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50/80 p-3">
                            <p className="text-sm text-blue-800">
                              {t(
                                'businessVerification.upload.existingDocuments',
                                'Bạn đã upload {{count}} giấy tờ. Upload mới để thay thế hoặc giữ nguyên.',
                                { count: verification.documents.length }
                              )}
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {verification.documents.map((doc, index) => (
                                <a
                                  key={index}
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative group cursor-pointer overflow-hidden rounded-lg border border-blue-100"
                                >
                                  <img
                                    src={doc.url}
                                    alt={doc.fileName || `Document ${index + 1}`}
                                    className="w-full h-24 object-cover transition duration-150 group-hover:scale-[1.02]"
                                  />
                                  <div className="absolute bottom-1 left-1 rounded bg-blue-600 px-1 text-xs text-white shadow-sm">
                                    {index + 1}
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                      <div className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50/60 via-white to-amber-50/60 p-4 transition hover:border-orange-400 hover:shadow-lg">
                        <input
                          id="documents"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleDocumentsChange}
                          className="hidden"
                        />
                        <label htmlFor="documents" className="flex flex-col items-center gap-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-inner shadow-orange-100">
                            <Upload className="h-5 w-5 text-orange-500" />
                          </div>
                          <p className="text-sm font-medium text-gray-800">
                            {verification?.status === 'REJECTED' &&
                            verification.documents &&
                            verification.documents.length > 0
                              ? t(
                                  'businessVerification.upload.replaceDocuments',
                                  'Click để upload giấy tờ mới (sẽ thay thế toàn bộ)'
                                )
                              : t('businessVerification.upload.clickToUploadDocuments', 'Click để tải lên giấy tờ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t('businessVerification.upload.documentsFormat', 'Tối đa 10 ảnh, mỗi ảnh tối đa 5MB')}
                          </p>
                        </label>
                      </div>

                      {documentFiles.length > 0 && (
                        <div className="space-y-2 rounded-xl border border-orange-100 bg-white/80 p-3">
                          <p className="text-sm font-semibold text-orange-700">
                            {t('businessVerification.upload.newDocuments', 'Giấy tờ mới')} ({documentFiles.length})
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {documentPreviews.map((preview, index) => (
                              <div
                                key={index}
                                className="group relative overflow-hidden rounded-lg border border-orange-100"
                              >
                                <img
                                  src={preview}
                                  alt={`Document ${index + 1}`}
                                  className="h-24 w-full object-cover transition duration-150 group-hover:scale-[1.02]"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                                  onClick={() => removeDocument(index)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                                <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-xs text-white">
                                  {index + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      {t('businessVerification.field.description', 'Mô tả')} ({t('common.optional', 'không bắt buộc')})
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder={t('businessVerification.placeholder.description', 'Mô tả về phòng gym')}
                      rows={4}
                      className="rounded-2xl border-orange-100 bg-white/90"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <DialogFooter className="mt-2 gap-2 border-t border-orange-100 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                    className="rounded-full border-gray-200 px-5 text-gray-700 hover:bg-gray-50"
                  >
                    {t('common.cancel', 'Hủy')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative overflow-hidden rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 px-6 font-semibold text-white shadow-lg shadow-orange-300/40 transition hover:shadow-orange-400/60"
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />
                    <span className="relative flex items-center gap-2">
                      {isSubmitting ? (
                        <Clock className="h-4 w-4 animate-spin" />
                      ) : verification?.status === 'REJECTED' ? (
                        <RefreshCw className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {isSubmitting
                        ? t('common.submitting', 'Đang gửi...')
                        : verification?.status === 'REJECTED'
                          ? t('common.resubmit', 'Gửi lại')
                          : t('common.submit', 'Gửi yêu cầu')}
                    </span>
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessVerificationModal;
