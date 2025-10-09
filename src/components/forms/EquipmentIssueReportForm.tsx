import React, { useState } from 'react';
import { toast } from 'sonner';
import { QrCode, Send, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { QRScannerModal } from '@/components/modals/QRScannerModal';
import { useEquipmentIssue } from '@/hooks/useEquipmentIssue';
import { useEquipmentIssueImageUpload } from '@/hooks/useEquipmentIssueImageUpload';
import { useTranslation } from 'react-i18next';
import type { Equipment } from '@/types/api/Equipment';
import type { CreateEquipmentIssueRequest, EquipmentIssueImage } from '@/types/api/EquipmentIssue';

interface EquipmentIssueReportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EquipmentIssueReportForm: React.FC<EquipmentIssueReportFormProps> = ({ onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const { createEquipmentIssue, loading } = useEquipmentIssue();
  const { uploadingImages, handleImageUpload, removeImage } = useEquipmentIssueImageUpload();
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [reason, setReason] = useState('');
  const [images, setImages] = useState<EquipmentIssueImage[]>([]);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleEquipmentScanned = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowQRScanner(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEquipment) {
      toast.error(t('equipmentIssue.equipmentRequired', 'Vui lòng quét QR code thiết bị trước khi báo cáo'));
      return;
    }

    if (!reason.trim()) {
      toast.error(t('equipmentIssue.reasonRequired', 'Vui lòng nhập lý do báo cáo'));
      return;
    }

    if (reason.trim().length < 10) {
      toast.error(t('equipmentIssue.reasonMinLength', 'Lý do báo cáo phải có ít nhất 10 ký tự'));
      return;
    }

    const issueData: CreateEquipmentIssueRequest = {
      equipment_id: selectedEquipment._id,
      reason: reason.trim(),
      images: images.length > 0 ? images : undefined
    };

    const response = await createEquipmentIssue(issueData);

    if (response?.success) {
      // Reset form
      setSelectedEquipment(null);
      setReason('');
      setImages([]);

      if (onSuccess) {
        onSuccess();
      }
    }
  };

  const handleClearEquipment = () => {
    setSelectedEquipment(null);
  };

  const handleClearReason = () => {
    setReason('');
  };

  const handleImageUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    await handleImageUpload(files, images, (newImages) => {
      setImages(newImages);
    });
  };

  const handleRemoveImage = (index: number) => {
    removeImage(index, images, (newImages) => {
      setImages(newImages);
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Equipment Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            {t('equipmentIssue.equipmentToReport', 'Thiết bị cần báo cáo')} *
          </label>

          {!selectedEquipment ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
              <QrCode className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                {t('equipmentIssue.scanQRInstruction', 'Quét QR code của thiết bị để chọn thiết bị cần báo cáo')}
              </p>
              <Button
                type="button"
                onClick={() => setShowQRScanner(true)}
                className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto"
              >
                <QrCode className="w-4 h-4 mr-2" />
                {t('equipmentIssue.scanQRCode', 'Quét QR Code')}
              </Button>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {selectedEquipment.equipmentName}
                    </h3>
                    <Badge variant="secondary" className="text-xs w-fit">
                      {selectedEquipment.equipmentCode}
                    </Badge>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">{t('equipmentIssue.equipmentType', 'Loại')}:</span>{' '}
                      {selectedEquipment.category}
                    </p>
                    <p>
                      <span className="font-medium">{t('equipmentIssue.manufacturer', 'Nhà sản xuất')}:</span>{' '}
                      {selectedEquipment.manufacturer}
                    </p>
                    <p>
                      <span className="font-medium">{t('equipmentIssue.location', 'Vị trí')}:</span>{' '}
                      {selectedEquipment.location || t('equipmentIssue.locationUnknown', 'Chưa xác định')}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearEquipment}
                  className="text-gray-400 hover:text-red-500 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Reason Input */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            {t('equipmentIssue.reasonLabel', 'Lý do báo cáo')} *
          </label>
          <div className="relative">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t(
                'equipmentIssue.reasonPlaceholder',
                'Mô tả chi tiết về vấn đề của thiết bị (tối thiểu 10 ký tự)...'
              )}
              className="min-h-[100px] sm:min-h-[120px] resize-none text-sm sm:text-base"
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-500">
                {reason.length}/1000 {t('equipmentIssue.characterCount', 'ký tự')}
              </div>
              {reason && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearReason}
                  className="text-gray-400 hover:text-red-500 h-auto p-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            {t('equipmentIssue.images')} <span className="text-gray-400">({t('equipmentIssue.optional')})</span>
          </label>

          <div className="space-y-3">
            <div className="flex space-x-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUploadChange}
                className="hidden"
                id="image-upload"
                disabled={uploadingImages}
              />
              <label
                htmlFor="image-upload"
                className="inline-flex items-center space-x-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium cursor-pointer transition-colors hover:border-orange-300 hover:text-orange-500"
              >
                {uploadingImages ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                    <span>{t('equipmentIssue.uploading_images')}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>{t('equipmentIssue.upload_images')}</span>
                  </>
                )}
              </label>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`Equipment issue image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            disabled={!selectedEquipment || !reason.trim() || loading || uploadingImages}
            className="flex-1 bg-orange-500 hover:bg-orange-600 h-10 sm:h-11"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                {t('equipmentIssue.sending', 'Đang gửi...')}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t('equipmentIssue.sendReport', 'Gửi Báo Cáo')}
              </>
            )}
          </Button>

          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-10 sm:h-11">
              {t('equipmentIssue.cancel', 'Hủy')}
            </Button>
          )}
        </div>
      </form>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onEquipmentScanned={handleEquipmentScanned}
      />
    </div>
  );
};
