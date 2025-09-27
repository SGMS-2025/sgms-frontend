import React, { useState } from 'react';
import { QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QRCodeModal } from './modals/QRCodeModal';
import type { Equipment } from '../types/api/Equipment';

interface QRCodeButtonProps {
  equipment: Equipment;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  showText?: boolean;
  onQRGenerated?: (equipment: Equipment) => void;
}

export const QRCodeButton: React.FC<QRCodeButtonProps> = ({
  equipment,
  size = 'md',
  variant = 'primary',
  showText = true,
  onQRGenerated
}) => {
  const { t } = useTranslation();
  const [showQRModal, setShowQRModal] = useState(false);

  const handleClick = () => {
    setShowQRModal(true);
  };

  const handleModalClose = () => {
    setShowQRModal(false);
    // Refetch equipment list when modal closes
    if (onQRGenerated) {
      onQRGenerated(equipment);
    }
  };

  const handleQRGenerated = (updatedEquipment: Equipment) => {
    if (onQRGenerated) {
      onQRGenerated(updatedEquipment);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-500 text-white hover:bg-gray-600';
      case 'outline':
        return 'border border-blue-500 text-blue-500 hover:bg-blue-50';
      default:
        return 'bg-blue-500 text-white hover:bg-blue-600';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 14;
      case 'lg':
        return 20;
      default:
        return 16;
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`
          inline-flex items-center space-x-2 rounded-lg font-medium transition-colors
          ${getSizeClasses()}
          ${getVariantClasses()}
        `}
        title={t('equipment.qr_code')}
      >
        <QrCode size={getIconSize()} />
        {showText && <span>{t('equipment.qr_code')}</span>}
      </button>

      <QRCodeModal
        isOpen={showQRModal}
        onClose={handleModalClose}
        equipment={equipment}
        onQRGenerated={handleQRGenerated}
      />
    </>
  );
};
