import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Building2, Upload, X, CheckCircle2, Clock, XCircle } from 'lucide-react';
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
  }, [open]);

  const fetchVerificationStatus = async () => {
    setIsLoading(true);

    const result = await businessVerificationApi.getMyVerification();
    setIsLoading(false);

    if (result.success && result.data) {
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

        // Note: Documents cũ sẽ hiển thị trực tiếp từ verification.documents
        // Không set vào documentPreviews để tránh confusion
      }
    }
  };

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
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <ScrollArea className="max-h-[80vh] pr-4">
            <DialogHeader>
              <div className="flex flex-col items-center mb-2">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center animate-pulse mb-3">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
                <DialogTitle className="text-2xl text-orange-800">
                  {t('businessVerification.status.pending', 'Đang chờ xét duyệt')}
                </DialogTitle>
                <DialogDescription className="text-orange-600 text-center">
                  {t(
                    'businessVerification.status.pendingDescription',
                    'Yêu cầu xác thực doanh nghiệp của bạn đang được admin xem xét'
                  )}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Progress Timeline */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-medium text-green-700">
                    {t('businessVerification.timeline.submitted', 'Đã gửi')}
                  </p>
                </div>

                <div className="flex-1 h-1 bg-gradient-to-r from-green-500 to-orange-500 mx-2"></div>

                <div className="flex flex-col items-center flex-1">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mb-2 animate-pulse">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-medium text-orange-700">
                    {t('businessVerification.timeline.reviewing', 'Đang xét duyệt')}
                  </p>
                </div>

                <div className="flex-1 h-1 bg-gray-300 mx-2"></div>

                <div className="flex flex-col items-center flex-1">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-6 h-6 text-gray-500" />
                  </div>
                  <p className="text-xs font-medium text-gray-500">
                    {t('businessVerification.timeline.completed', 'Hoàn tất')}
                  </p>
                </div>
              </div>

              {/* Business Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <Alert className="border-orange-200 bg-orange-50">
                  <Building2 className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-800">
                    {t('businessVerification.info.businessInfo', 'Thông tin doanh nghiệp')}
                  </AlertTitle>
                  <AlertDescription className="text-orange-700">
                    <div className="mt-3 space-y-2 text-sm">
                      {verification.logo?.url && (
                        <div className="flex justify-center mb-3">
                          <img
                            src={verification.logo.url}
                            alt="Logo"
                            className="h-20 w-20 object-contain rounded-lg border-2 border-orange-200 bg-white p-2"
                          />
                        </div>
                      )}
                      <p>
                        <strong>{t('businessVerification.field.businessName', 'Tên DN')}:</strong>{' '}
                        {verification.businessName}
                      </p>
                      <p>
                        <strong>{t('businessVerification.field.taxCode', 'Mã số thuế')}:</strong>{' '}
                        {verification.taxCode || verification.businessCode}
                      </p>
                      <p className="text-xs">
                        <strong>{t('businessVerification.field.submittedAt', 'Ngày gửi')}:</strong>{' '}
                        {new Date(verification.submittedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert className="border-blue-200 bg-blue-50">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">
                    {t('businessVerification.info.contactInfo', 'Thông tin liên hệ')}
                  </AlertTitle>
                  <AlertDescription className="text-blue-700">
                    <div className="mt-3 space-y-2 text-sm">
                      <p>
                        <strong>{t('businessVerification.field.address', 'Địa chỉ')}:</strong>{' '}
                        {verification.businessAddress}
                      </p>
                      <p>
                        <strong>{t('businessVerification.field.email', 'Email')}:</strong> {verification.businessEmail}
                      </p>
                      <p>
                        <strong>{t('businessVerification.field.phone', 'Điện thoại')}:</strong>{' '}
                        {verification.businessPhone}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Documents Preview */}
              {verification.documents && verification.documents.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {t('businessVerification.field.documents', 'Giấy tờ xác thực')} ({verification.documents.length})
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {verification.documents.map((doc, index) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group cursor-pointer"
                      >
                        <img
                          src={doc.url}
                          alt={doc.fileName || `Document ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border hover:border-orange-500 transition-colors"
                        />
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                          {index + 1}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.close', 'Đóng')}
              </Button>
            </DialogFooter>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  // APPROVED - Display approved status
  if (verification?.status === 'APPROVED') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <ScrollArea className="max-h-[80vh] pr-4">
            <DialogHeader>
              <div className="flex flex-col items-center mb-2">
                <div className="absolute top-4 right-4">
                  <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </div>
                </div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <DialogTitle className="text-2xl text-green-800">
                  {t('businessVerification.status.approved', 'Đã xác thực doanh nghiệp')}
                </DialogTitle>
                <DialogDescription className="text-green-600 text-center">
                  {t(
                    'businessVerification.status.approvedDescription',
                    'Doanh nghiệp của bạn đã được xác thực thành công'
                  )}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Completed Timeline */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-medium text-green-700">
                    {t('businessVerification.timeline.submitted', 'Đã gửi')}
                  </p>
                </div>
                <div className="flex-1 h-1 bg-green-500 mx-2"></div>
                <div className="flex flex-col items-center flex-1">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-medium text-green-700">
                    {t('businessVerification.timeline.approved', 'Đã duyệt')}
                  </p>
                </div>
                <div className="flex-1 h-1 bg-green-500 mx-2"></div>
                <div className="flex flex-col items-center flex-1">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-medium text-green-700">
                    {t('businessVerification.timeline.completed', 'Hoàn tất')}
                  </p>
                </div>
              </div>

              {/* Business Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <Alert className="border-green-200 bg-green-50">
                  <Building2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">
                    {t('businessVerification.info.businessInfo', 'Thông tin doanh nghiệp')}
                  </AlertTitle>
                  <AlertDescription className="text-green-700">
                    <div className="mt-3 space-y-2 text-sm">
                      {verification.logo?.url && (
                        <div className="flex justify-center mb-3">
                          <div className="relative">
                            <img
                              src={verification.logo.url}
                              alt="Logo"
                              className="h-24 w-24 object-contain rounded-lg border-2 border-green-200 bg-white p-2"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        </div>
                      )}
                      <p>
                        <strong>{t('businessVerification.field.businessName', 'Tên DN')}:</strong>{' '}
                        {verification.businessName}
                      </p>
                      <p>
                        <strong>{t('businessVerification.field.taxCode', 'Mã số thuế')}:</strong>{' '}
                        {verification.taxCode || verification.businessCode}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert className="border-blue-200 bg-blue-50">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">
                    {t('businessVerification.info.contactInfo', 'Thông tin liên hệ')}
                  </AlertTitle>
                  <AlertDescription className="text-blue-700">
                    <div className="mt-3 space-y-2 text-sm">
                      <p>
                        <strong>{t('businessVerification.field.address', 'Địa chỉ')}:</strong>{' '}
                        {verification.businessAddress}
                      </p>
                      <p>
                        <strong>{t('businessVerification.field.email', 'Email')}:</strong> {verification.businessEmail}
                      </p>
                      <p>
                        <strong>{t('businessVerification.field.phone', 'Điện thoại')}:</strong>{' '}
                        {verification.businessPhone}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Documents Preview */}
              {verification.documents && verification.documents.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    {t('businessVerification.field.documents', 'Giấy tờ xác thực')} ({verification.documents.length})
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {verification.documents.map((doc, index) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group cursor-pointer"
                      >
                        <img
                          src={doc.url}
                          alt={doc.fileName || `Document ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-green-200 hover:border-green-500 transition-colors"
                        />
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                          {index + 1}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} className="bg-green-600 hover:bg-green-700">
                {t('common.close', 'Đóng')}
              </Button>
            </DialogFooter>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  // REJECTED or no verification - Show form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <ScrollArea className="max-h-[80vh] pr-4">
          <DialogHeader>
            <div className="flex flex-col items-center mb-2">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                <Building2 className="w-8 h-8 text-orange-600" />
              </div>
              <DialogTitle className="text-2xl">
                {verification?.status === 'REJECTED'
                  ? t('businessVerification.title.resubmit', 'Gửi lại yêu cầu xác thực')
                  : t('businessVerification.title.submit', 'Xác thực doanh nghiệp')}
              </DialogTitle>
              <DialogDescription className="text-center">
                {verification?.status === 'REJECTED'
                  ? t('businessVerification.description.resubmit', 'Cập nhật thông tin và gửi lại yêu cầu xác thực')
                  : t('businessVerification.description.submit', 'Điền thông tin doanh nghiệp để quản lý phòng gym')}
              </DialogDescription>
            </div>
          </DialogHeader>

          {verification?.status === 'REJECTED' && verification.rejectionReason && (
            <Alert className="border-red-200 bg-red-50 mb-4">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">
                {t('businessVerification.field.rejectionReason', 'Lý do từ chối')}
              </AlertTitle>
              <AlertDescription className="text-red-700">{verification.rejectionReason}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Tax Code & Business Code */}
            <div className="grid grid-cols-2 gap-4">
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

            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="businessName">
                {t('businessVerification.field.businessName', 'Tên phòng gym')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="businessName"
                name="businessName"
                placeholder={t('businessVerification.placeholder.businessName', 'Nhập tên phòng gym')}
                value={formData.businessName}
                onChange={handleInputChange}
              />
            </div>

            {/* Business Address */}
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

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessPhone">
                  {t('businessVerification.field.phone', 'Số điện thoại')} <span className="text-red-500">*</span>
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

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label htmlFor="logo">
                {t('businessVerification.field.logo', 'Logo phòng gym')} <span className="text-red-500">*</span>
              </Label>
              {!logoPreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-500 transition-colors">
                  <input id="logo" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  <label htmlFor="logo" className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      {t('businessVerification.upload.clickToUploadLogo', 'Click để tải lên logo')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('businessVerification.upload.logoFormat', 'PNG, JPG, WebP tối đa 5MB')}
                    </p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img src={logoPreview} alt="Logo" className="w-full h-32 object-contain rounded-lg border" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={removeLogo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Documents Upload */}
            <div className="space-y-2">
              <Label htmlFor="documents">
                {t('businessVerification.field.documents', 'Giấy tờ xác thực')} (
                {t('businessVerification.field.documentsHint', 'Giấy phép kinh doanh, CMND/CCCD, v.v.')})
              </Label>

              {/* Show existing documents (read-only) if status is REJECTED */}
              {verification?.status === 'REJECTED' &&
                verification.documents &&
                verification.documents.length > 0 &&
                documentFiles.length === 0 && (
                  <div className="space-y-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-700">
                        {t(
                          'businessVerification.upload.existingDocuments',
                          'Bạn đã upload {{count}} giấy tờ. Upload mới để thay thế hoặc giữ nguyên.',
                          { count: verification.documents.length }
                        )}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {verification.documents.map((doc, index) => (
                        <a
                          key={index}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group cursor-pointer"
                        >
                          <img
                            src={doc.url}
                            alt={doc.fileName || `Document ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border hover:border-blue-500 transition-colors"
                          />
                          <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">
                            {index + 1}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-500 transition-colors">
                <input
                  id="documents"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleDocumentsChange}
                  className="hidden"
                />
                <label htmlFor="documents" className="cursor-pointer">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {verification?.status === 'REJECTED' && verification.documents && verification.documents.length > 0
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

              {/* New Document Previews (uploaded in this session) */}
              {documentFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-600">
                    {t('businessVerification.upload.newDocuments', 'Giấy tờ mới')} ({documentFiles.length}):
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {documentPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Document ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeDocument(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                {t('businessVerification.field.description', 'Mô tả')} ({t('common.optional', 'không bắt buộc')})
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder={t('businessVerification.placeholder.description', 'Mô tả về phòng gym')}
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                {t('common.cancel', 'Hủy')}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700">
                {isSubmitting
                  ? t('common.submitting', 'Đang gửi...')
                  : verification?.status === 'REJECTED'
                    ? t('common.resubmit', 'Gửi lại')
                    : t('common.submit', 'Gửi yêu cầu')}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessVerificationModal;
