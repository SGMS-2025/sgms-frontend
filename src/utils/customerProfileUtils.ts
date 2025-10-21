// Utility functions for CustomerProfile component
import type { UpdateProfileData } from '@/types/api/User';

/**
 * Format date from YYYY-MM-DD to DD/MM/YYYY
 */
export const formatDateToVietnamese = (dateString: string): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('vi-VN');
  } catch {
    return '';
  }
};

/**
 * Format date from DD/MM/YYYY to YYYY-MM-DD
 */
export const formatDateToISO = (dateString: string): string => {
  if (!dateString) return '';

  const parts = dateString.split('/');
  if (parts.length !== 3) return '';

  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Normalize gender value for API
 */
export const normalizeGenderForApi = (gender: string): 'MALE' | 'FEMALE' | 'OTHER' => {
  const upperGender = gender.toUpperCase();
  if (['MALE', 'FEMALE', 'OTHER'].includes(upperGender)) {
    return upperGender as 'MALE' | 'FEMALE' | 'OTHER';
  }
  return 'OTHER';
};

/**
 * Normalize gender value for display
 */
export const normalizeGenderForDisplay = (gender: string): string => {
  return (gender || 'OTHER').toLowerCase();
};

/**
 * Check if form data has changes compared to original data
 */
export const hasFormChanges = (
  formData: UpdateProfileData,
  originalData: {
    name: string;
    phone: string;
    address: string;
    birthDate: string;
    gender: string;
    bio: string;
  }
): boolean => {
  return (
    (formData.fullName || '') !== originalData.name ||
    (formData.phoneNumber || '') !== originalData.phone ||
    (formData.address || '') !== originalData.address ||
    (formData.dateOfBirth || '') !== originalData.birthDate ||
    normalizeGenderForDisplay(formData.gender || 'OTHER') !== originalData.gender ||
    (formData.bio || '') !== originalData.bio
  );
};

/**
 * Clean phone number by removing spaces and special characters
 */
export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/[\s\-()]/g, '');
};

/**
 * Format phone number for display (add spaces for readability)
 */
export const formatPhoneForDisplay = (phone: string): string => {
  const cleanPhone = cleanPhoneNumber(phone);
  if (cleanPhone.length === 10) {
    return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
  }
  return phone;
};

/**
 * Get gender display text in Vietnamese
 */
export const getGenderDisplayText = (gender: string): string => {
  const normalizedGender = normalizeGenderForDisplay(gender);

  switch (normalizedGender) {
    case 'male':
      return 'Nam';
    case 'female':
      return 'Nữ';
    case 'other':
      return 'Khác';
    default:
      return 'Chưa xác định';
  }
};

/**
 * Prepare form data for API submission
 */
export const prepareFormDataForApi = (formData: UpdateProfileData): UpdateProfileData => {
  const processedData: UpdateProfileData = {
    ...formData
  };

  // Process date format
  if (formData.dateOfBirth) {
    // If it's in DD/MM/YYYY format, convert to YYYY-MM-DD
    if (formData.dateOfBirth.includes('/')) {
      processedData.dateOfBirth = formatDateToISO(formData.dateOfBirth);
    }
  }

  // Normalize gender
  if (formData.gender) {
    processedData.gender = normalizeGenderForApi(formData.gender);
  }

  // Clean phone number
  if (formData.phoneNumber) {
    processedData.phoneNumber = cleanPhoneNumber(formData.phoneNumber);
  }

  // Trim string values
  if (formData.fullName) {
    processedData.fullName = formData.fullName.trim();
  }
  if (formData.address) {
    processedData.address = formData.address.trim();
  }
  if (formData.bio) {
    processedData.bio = formData.bio.trim();
  }

  return processedData;
};

/**
 * Generate user initials for avatar fallback
 */
export const getUserInitials = (fullName: string): string => {
  if (!fullName || !fullName.trim()) return 'U';

  const names = fullName.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }

  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

/**
 * Calculate age from birth date
 */
export const calculateAge = (birthDate: string): number | null => {
  if (!birthDate) return null;

  try {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  } catch {
    return null;
  }
};

/**
 * Validate if user is adult (18+)
 */
export const isAdult = (birthDate: string): boolean => {
  const age = calculateAge(birthDate);
  return age !== null && age >= 18;
};

/**
 * Get membership duration text
 */
export const getMembershipDurationText = (
  createdAt: string,
  t?: (key: string, options?: { count?: number }) => string
): string => {
  if (!createdAt) return t ? t('customer.profile.member_new') : 'Mới tham gia';

  try {
    const joinDate = new Date(createdAt);
    const now = new Date();
    const diffInMonths = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());

    if (diffInMonths < 1) {
      return t ? t('customer.profile.member_new') : 'Mới tham gia';
    } else if (diffInMonths < 12) {
      return t ? t('customer.profile.member_months', { count: diffInMonths }) : `${diffInMonths} tháng`;
    } else {
      const years = Math.floor(diffInMonths / 12);
      return t ? t('customer.profile.member_years', { count: years }) : `${years} năm`;
    }
  } catch {
    return t ? t('customer.profile.member') : 'Thành viên';
  }
};
