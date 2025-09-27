import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { equipmentApi } from '../../services/api/equipmentApi';
import { staffApi } from '../../services/api/staffApi';
import { branchApi } from '../../services/api/branchApi';
import { validateEquipmentForm } from '../../utils/equipmentValidation';
import type { CreateEquipmentRequest, UpdateEquipmentRequest, Equipment } from '../../types/api/Equipment';
import type { Staff } from '../../types/api/Staff';
import type { Branch } from '../../types/api/Branch';
import { QRCodeModal } from '../../components/modals/QRCodeModal';
import { ExcelImportModal } from '../../components/modals/ExcelImportModal';
import { EquipmentForm } from '../../components/equipment/EquipmentForm';

export const AddEquipmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [staffInfo, setStaffInfo] = useState<Staff | null>(null);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [createdEquipment, setCreatedEquipment] = useState<Equipment | null>(null);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [formData, setFormData] = useState<CreateEquipmentRequest>({
    equipmentName: '',
    category: 'STRENGTH',
    branchId: '',
    manufacturer: '',
    price: '',
    dateOfPurchase: '',
    warrantyExpirationDate: '',
    status: 'ACTIVE',
    location: '',
    images: []
  });

  // Load branches with role-based filtering
  const loadBranches = async () => {
    setBranchesLoading(true);
    const response = await branchApi.getBranchesWithAuth({ limit: 100 });
    if (response.success && response.data) {
      setBranches(response.data.branches || []);
    } else {
      // Fallback to public API if authenticated API fails
      const fallbackResponse = await branchApi.getBranches({ limit: 100 });
      if (fallbackResponse.success && fallbackResponse.data) {
        setBranches(fallbackResponse.data.branches || []);
      }
    }
    setBranchesLoading(false);
  };

  // Load staff info on mount
  useEffect(() => {
    const loadStaffInfo = async () => {
      setStaffLoading(true);
      setStaffError(null);
      const response = await staffApi.getMyStaffInfo();
      if (response.success && response.data) {
        setStaffInfo(response.data);

        // Luôn load danh sách branches cho tất cả user
        await loadBranches();
      } else {
        setStaffError('Không thể tải thông tin nhân viên');
      }
      setStaffLoading(false);
    };

    loadStaffInfo();
  }, []);

  const handleFormDataChange = (data: CreateEquipmentRequest | UpdateEquipmentRequest) => {
    setFormData(data as CreateEquipmentRequest);
  };

  const validateForm = (): boolean => {
    const validation = validateEquipmentForm({
      ...formData,
      branchId: formData.branchId
    });

    if (!validation.isValid) {
      validation.errors.forEach((error) => {
        toast.error(t(`error.${error}`));
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const response = await equipmentApi.createEquipment(formData);

    if (response.success && response.data) {
      setCreatedEquipment(response.data);
      setShowQRModal(true);
      toast.success(t('success.equipment_created'));
    } else {
      toast.error(t('error.equipment_creation_failed'));
    }

    setLoading(false);
  };

  const handleQRModalClose = () => {
    setShowQRModal(false);
    setCreatedEquipment(null);
    // Reset form sau khi đóng modal
    setFormData({
      equipmentCode: '',
      equipmentName: '',
      category: 'STRENGTH',
      branchId: '',
      manufacturer: '',
      price: '',
      dateOfPurchase: '',
      warrantyExpirationDate: '',
      status: 'ACTIVE',
      location: '',
      images: []
    });
    // Navigate về trang danh sách thiết bị
    navigate('/manage/technician/equipment');
  };

  const handleQRGenerated = (equipment: Equipment) => {
    setCreatedEquipment(equipment);
  };

  return (
    <>
      <EquipmentForm
        mode="add"
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onSubmit={handleSubmit}
        loading={loading}
        staffInfo={staffInfo}
        staffLoading={staffLoading}
        staffError={staffError}
        branches={branches}
        branchesLoading={branchesLoading}
        onShowExcelImport={() => setShowExcelImportModal(true)}
      />

      {/* QR Code Modal */}
      {showQRModal && createdEquipment && (
        <QRCodeModal
          isOpen={showQRModal}
          equipment={createdEquipment}
          onClose={handleQRModalClose}
          onQRGenerated={handleQRGenerated}
          showSuccessToast={true}
        />
      )}

      {/* Excel Import Modal */}
      {showExcelImportModal && (
        <ExcelImportModal
          isOpen={showExcelImportModal}
          branches={branches}
          onClose={() => setShowExcelImportModal(false)}
          onImportSuccess={() => {
            setShowExcelImportModal(true);
          }}
        />
      )}
    </>
  );
};
