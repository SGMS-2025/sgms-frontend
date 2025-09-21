import type { PopulatedUser } from '@/types/api/User';

// Kiểu dữ liệu cho manager, có thể là 1 hoặc nhiều hoặc undefined
export type ManagerData = PopulatedUser | PopulatedUser[] | undefined;

// Interface cho staff dùng để map với userId
export interface StaffWithUserId {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
}

// Hàm chuyển đổi dữ liệu manager (1 hoặc nhiều) sang mảng staffId
// @param managerData - Dữ liệu manager (có thể là 1 hoặc mảng hoặc undefined)
// @param staffList - Danh sách staff để đối chiếu
// @returns Mảng các staffId tương ứng với manager
export function mapManagersToStaffIds(managerData: ManagerData, staffList: StaffWithUserId[]): string[] {
  if (!managerData) {
    return [];
  }

  if (Array.isArray(managerData)) {
    // Trường hợp nhiều manager
    return managerData
      .map((manager) => staffList.find((staff) => staff.userId._id === manager._id)?._id)
      .filter(Boolean) as string[];
  } else {
    // Trường hợp chỉ có 1 manager
    const staffId = staffList.find((staff) => staff.userId._id === managerData._id)?._id;
    return staffId ? [staffId] : [];
  }
}

// Hàm chuyển đổi từ staffId sang dữ liệu manager (PopulatedUser)
// @param staffIds - Mảng staffId
// @param staffList - Danh sách staff để đối chiếu
// @returns Mảng PopulatedUser tương ứng với staffId
export function mapStaffIdsToManagers(staffIds: string[], staffList: StaffWithUserId[]): PopulatedUser[] {
  return staffIds
    .map((staffId) => {
      const staff = staffList.find((s) => s._id === staffId);
      return staff?.userId;
    })
    .filter(Boolean) as PopulatedUser[];
}

// Lấy tên hiển thị của manager (ưu tiên fullName, fallback sang email)
// @param manager - Đối tượng PopulatedUser
// @returns Chuỗi tên hiển thị
export function getManagerDisplayName(manager: PopulatedUser): string {
  return manager.fullName || manager.email || 'Unknown Manager';
}

// Lấy danh sách tên hiển thị của nhiều manager
// @param managers - Mảng PopulatedUser
// @returns Mảng chuỗi tên hiển thị
export function getManagerDisplayNames(managers: PopulatedUser[]): string[] {
  return managers.map(getManagerDisplayName);
}

// Kiểm tra một staff có phải là manager của chi nhánh không
// @param staffId - Id của staff cần kiểm tra
// @param managerData - Dữ liệu manager (1 hoặc nhiều)
// @param staffList - Danh sách staff
// @returns true nếu staff là manager, ngược lại false
export function isStaffManager(staffId: string, managerData: ManagerData, staffList: StaffWithUserId[]): boolean {
  const managerStaffIds = mapManagersToStaffIds(managerData, staffList);
  return managerStaffIds.includes(staffId);
}

// Lấy tất cả staffId của manager từ dữ liệu manager
// @param managerData - Dữ liệu manager (1 hoặc nhiều)
// @param staffList - Danh sách staff
// @returns Mảng staffId là manager
export function getManagerStaffIds(managerData: ManagerData, staffList: StaffWithUserId[]): string[] {
  return mapManagersToStaffIds(managerData, staffList);
}
