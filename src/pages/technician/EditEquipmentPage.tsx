import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { equipmentApi } from '../../services/api/equipmentApi';
import { branchApi } from '../../services/api/branchApi';
import { validateEquipmentForm } from '../../utils/equipmentValidation';
import type { Equipment, UpdateEquipmentRequest, CreateEquipmentRequest } from '../../types/api/Equipment';
import type { Branch } from '../../types/api/Branch';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { NotFoundMessage } from '../../components/common/NotFoundMessage';
import { EquipmentForm } from '../../components/equipment/EquipmentForm';

// Helper function to extract branch ID safely
const extractBranchId = (branchId: string | { _id: string } | undefined): string | undefined => {
  if (typeof branchId === 'string') {
    return branchId;
  }
  if (branchId && typeof branchId === 'object' && '_id' in branchId) {
    return branchId._id;
  }
  return undefined;
};

export const EditEquipmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState<UpdateEquipmentRequest>({});
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // Load branches
  const loadBranches = useCallback(async () => {
    setBranchesLoading(true);
    const response = await branchApi.getBranchesWithAuth({ limit: 100 });
    if (response.success && response.data) {
      const branchesData = response.data.branches || [];
      setBranches(branchesData);
    } else {
      // Fallback to public API if authenticated API fails
      const fallbackResponse = await branchApi.getBranches({ limit: 100 });
      if (fallbackResponse.success && fallbackResponse.data) {
        const branchesData = fallbackResponse.data.branches || [];
        setBranches(branchesData);
      }
    }
    setBranchesLoading(false);
  }, []);

  const loadEquipment = useCallback(async () => {
    setLoading(true);
    const response = await equipmentApi.getEquipmentById(id!);
    if (response.success && response.data) {
      const data = response.data;
      setEquipment(data);

      const branchIdString = extractBranchId(data.branchId);

      setFormData({
        equipmentCode: data.equipmentCode,
        equipmentName: data.equipmentName,
        category: data.category,
        branchId: branchIdString,
        manufacturer: data.manufacturer,
        price: data.price,
        dateOfPurchase: data.dateOfPurchase ? new Date(data.dateOfPurchase).toISOString().split('T')[0] : '',
        warrantyExpirationDate: data.warrantyExpirationDate,
        status: data.status,
        location: data.location,
        images: data.images
      });
    }
    setLoading(false);
  }, [id, branches.length]);

  useEffect(() => {
    if (id) {
      loadBranches();
      loadEquipment();
    }
  }, [id, loadEquipment, loadBranches]);

  // Update formData when branches are loaded and equipment data is available
  useEffect(() => {
    if (equipment && branches.length > 0 && !formData.branchId) {
      const branchIdString = extractBranchId(equipment.branchId);
      setFormData((prev) => ({
        ...prev,
        equipmentCode: equipment.equipmentCode,
        equipmentName: equipment.equipmentName,
        category: equipment.category,
        branchId: branchIdString,
        manufacturer: equipment.manufacturer,
        price: equipment.price,
        dateOfPurchase: equipment.dateOfPurchase ? new Date(equipment.dateOfPurchase).toISOString().split('T')[0] : '',
        warrantyExpirationDate: equipment.warrantyExpirationDate,
        status: equipment.status,
        location: equipment.location,
        images: equipment.images
      }));
    }
  }, [equipment, branches, formData.branchId]);

  const handleFormDataChange = (data: CreateEquipmentRequest | UpdateEquipmentRequest) => {
    setFormData(data as UpdateEquipmentRequest);
  };

  const validateForm = (): boolean => {
    const validation = validateEquipmentForm({
      ...formData,
      branchId: formData.branchId || ''
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
    const response = await equipmentApi.updateEquipment(id!, formData);

    if (response.success && response.data) {
      toast.success(t('equipment.update_success'));
      navigate('/manage/technician/equipment');
    } else {
      toast.error(t('error.equipment_update_failed'));
    }

    setLoading(false);
  };

  if (loading && !equipment) {
    return <LoadingSpinner />;
  }

  if (!equipment) {
    return <NotFoundMessage />;
  }

  return (
    <EquipmentForm
      mode="edit"
      formData={formData}
      onFormDataChange={handleFormDataChange}
      onSubmit={handleSubmit}
      loading={loading}
      branches={branches}
      branchesLoading={branchesLoading}
    />
  );
};
