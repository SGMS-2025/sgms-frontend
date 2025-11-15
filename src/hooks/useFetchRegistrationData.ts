import { useState, useEffect } from 'react';
import { packageApi } from '@/services/api/packageApi';
import { discountCampaignApi } from '@/services/api/discountApi';
import { staffApi } from '@/services/api/staffApi';
import type { ServicePackage, PackageType } from '@/types/api/Package';
import type { DiscountCampaign } from '@/types/api/Discount';
import type { Staff, StaffListResponse } from '@/types/api/Staff';
import type { ApiResponse } from '@/types/api/Api';

export interface UseFetchRegistrationDataOptions {
  isOpen: boolean;
  branchId: string | undefined;
  packageType: PackageType;
  fetchTrainers?: boolean; // Only fetch trainers for PT packages
}

export interface UseFetchRegistrationDataReturn {
  packages: ServicePackage[];
  promotions: DiscountCampaign[];
  trainers: Staff[];
  loading: boolean;
  error: string | null;
}

export const useFetchRegistrationData = ({
  isOpen,
  branchId,
  packageType,
  fetchTrainers = false
}: UseFetchRegistrationDataOptions): UseFetchRegistrationDataReturn => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [promotions, setPromotions] = useState<DiscountCampaign[]>([]);
  const [trainers, setTrainers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !branchId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // Fetch packages and promotions in parallel (always needed)
      const [packagesRes, promotionsRes] = await Promise.all([
        packageApi.getActivePackagesByBranch(branchId),
        discountCampaignApi.getActiveCampaignsByBranch(branchId)
      ]);

      // Set packages filtered by type (critical - registration can't proceed without packages)
      if (packagesRes.success && packagesRes.data) {
        setPackages(packagesRes.data.filter((pkg: ServicePackage) => pkg.type === packageType));
      } else if (!packagesRes.success) {
        setError(packagesRes.message || 'Không thể tải danh sách gói dịch vụ');
      }

      // Set promotions (non-critical - registration can proceed without promotions)
      if (promotionsRes.success && promotionsRes.data) {
        setPromotions(promotionsRes.data);
      }
      // Note: Promotions failure is not critical, so we don't set error for it

      // Fetch trainers separately if needed (different return type)
      if (fetchTrainers) {
        const trainersRes: ApiResponse<StaffListResponse> = await staffApi.getStaffList({ branchId });
        if (trainersRes.success && trainersRes.data) {
          setTrainers(trainersRes.data.staffList.filter((staff: Staff) => staff.jobTitle === 'Personal Trainer'));
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [isOpen, branchId, packageType, fetchTrainers]);

  return {
    packages,
    promotions,
    trainers,
    loading,
    error
  };
};
