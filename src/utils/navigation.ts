import type { Role } from '@/types/api/User';
import type { StaffJobTitle } from '@/types/api/Staff';

export const getProfileSettingsPath = (role?: Role, jobTitle?: StaffJobTitle | null, currentPath?: string) => {
  if (!role) return '/profile';

  if (role === 'OWNER') {
    return '/manage/setting';
  }

  if (role === 'STAFF') {
    if (jobTitle === 'Manager') return '/manage/setting';
    if (jobTitle === 'Personal Trainer') return '/manage/pt/setting';
    if (jobTitle === 'Technician') return '/manage/technician/setting';

    if (currentPath) {
      if (currentPath.startsWith('/manage/pt')) return '/manage/pt/setting';
      if (currentPath.startsWith('/manage/technician')) return '/manage/technician/setting';
      if (currentPath.startsWith('/manage')) return '/manage/setting';
    }
  }

  return '/profile';
};
