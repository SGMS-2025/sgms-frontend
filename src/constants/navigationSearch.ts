export type NavigationSearchRole = 'OWNER' | 'MANAGER' | 'ADMIN' | 'CUSTOMER' | 'PT' | 'TECHNICIAN';

export interface NavigationSearchItem {
  id: string;
  roles: NavigationSearchRole[];
  path: string;
  labelKey?: string;
  fallbackLabel: string;
  keywords?: string[];
  sectionKey?: string;
  sectionLabel?: string;
}

type SectionKey = 'main' | 'services' | 'schedule' | 'finance' | 'settings';

const SECTION_META: Record<SectionKey, Pick<NavigationSearchItem, 'sectionKey' | 'sectionLabel'>> = {
  main: { sectionKey: 'sidebar.main_menu', sectionLabel: 'Menu' },
  services: { sectionKey: 'sidebar.business_services', sectionLabel: 'Services' },
  schedule: { sectionKey: 'sidebar.schedule', sectionLabel: 'Schedule' },
  finance: { sectionKey: 'sidebar.finance', sectionLabel: 'Finance' },
  settings: { sectionKey: 'sidebar.settings', sectionLabel: 'Settings' }
};

type NavigationSearchGroup = {
  roles: NavigationSearchRole[];
  section: SectionKey;
  items: Omit<NavigationSearchItem, 'roles' | 'sectionKey' | 'sectionLabel'>[];
};

const NAVIGATION_GROUPS: NavigationSearchGroup[] = [
  {
    roles: ['OWNER', 'MANAGER'],
    section: 'main',
    items: [
      {
        id: 'owner-dashboard',
        path: '/manage/owner',
        labelKey: 'sidebar.dashboard',
        fallbackLabel: 'Dashboard',
        keywords: ['overview', 'home']
      },
      {
        id: 'owner-staff',
        path: '/manage/staff',
        labelKey: 'sidebar.staff',
        fallbackLabel: 'Staff',
        keywords: ['employee', 'nhan vien', 'manager']
      },
      {
        id: 'owner-customers',
        path: '/manage/customers',
        labelKey: 'sidebar.customers',
        fallbackLabel: 'Customers',
        keywords: ['khach hang', 'client', 'customer']
      },
      {
        id: 'owner-payments',
        path: '/manage/payments',
        labelKey: 'sidebar.payments',
        fallbackLabel: 'Payments',
        keywords: ['thanh toan', 'transaction', 'invoice']
      },
      {
        id: 'owner-equipment',
        path: '/manage/equipment',
        labelKey: 'sidebar.equipment',
        fallbackLabel: 'Equipment',
        keywords: ['thiet bi', 'machine']
      },
      {
        id: 'owner-testimonials',
        path: '/manage/testimonials',
        labelKey: 'sidebar.testimonials',
        fallbackLabel: 'Testimonials',
        keywords: ['review', 'feedback', 'danh gia']
      },
      {
        id: 'owner-contracts',
        path: '/manage/contracts',
        labelKey: 'sidebar.contracts',
        fallbackLabel: 'Contracts',
        keywords: ['hop dong', 'agreement']
      }
    ]
  },
  {
    roles: ['OWNER', 'MANAGER'],
    section: 'services',
    items: [
      {
        id: 'owner-pt-services',
        path: '/manage/pt-services',
        labelKey: 'sidebar.pt_services',
        fallbackLabel: 'PT Services',
        keywords: ['personal trainer', 'pt', 'goi pt']
      },
      {
        id: 'owner-class-services',
        path: '/manage/class-services',
        labelKey: 'sidebar.class_services',
        fallbackLabel: 'Class Services',
        keywords: ['lop', 'class']
      },
      {
        id: 'owner-promotions',
        path: '/manage/discounts',
        labelKey: 'sidebar.promotions',
        fallbackLabel: 'Promotions',
        keywords: ['khuyen mai', 'discount']
      },
      {
        id: 'owner-memberships',
        path: '/manage/memberships',
        labelKey: 'sidebar.membership_plans',
        fallbackLabel: 'Membership Plans',
        keywords: ['goi tap', 'membership']
      }
    ]
  },
  {
    roles: ['OWNER', 'MANAGER'],
    section: 'schedule',
    items: [
      {
        id: 'owner-work-schedule',
        path: '/manage/workshifts/calendar',
        labelKey: 'sidebar.work_schedule',
        fallbackLabel: 'Work Schedule',
        keywords: ['lich lam viec', 'shift']
      },
      {
        id: 'owner-timeoff',
        path: '/manage/timeoff',
        labelKey: 'sidebar.time_off',
        fallbackLabel: 'Time Off',
        keywords: ['nghi phep', 'off']
      },
      {
        id: 'owner-pt-availability',
        path: '/manage/pt-availability-requests',
        labelKey: 'sidebar.pt_availability_requests',
        fallbackLabel: 'PT Availability',
        keywords: ['availability', 'phe duyet pt']
      },
      {
        id: 'owner-classes',
        path: '/manage/classes',
        labelKey: 'sidebar.classes',
        fallbackLabel: 'Classes',
        keywords: ['lop hoc', 'class']
      }
    ]
  },
  {
    roles: ['OWNER', 'MANAGER'],
    section: 'finance',
    items: [
      {
        id: 'owner-expenses',
        path: '/manage/expenses',
        labelKey: 'sidebar.expenses',
        fallbackLabel: 'Expenses',
        keywords: ['chi phi', 'expense']
      },
      {
        id: 'owner-kpi',
        path: '/manage/kpi',
        labelKey: 'sidebar.kpi',
        fallbackLabel: 'KPI',
        keywords: ['chiso', 'target', 'kpi']
      },
      {
        id: 'owner-commission',
        path: '/manage/commission-policies',
        labelKey: 'sidebar.commission_policy',
        fallbackLabel: 'Commission Policy',
        keywords: ['hoa hong', 'commission']
      }
    ]
  },
  {
    roles: ['PT'],
    section: 'main',
    items: [
      {
        id: 'pt-dashboard',
        path: '/manage/pt',
        labelKey: 'sidebar.dashboard',
        fallbackLabel: 'Dashboard',
        keywords: ['overview']
      },
      {
        id: 'pt-clients',
        path: '/manage/pt/clients',
        labelKey: 'pt.sidebar.clients',
        fallbackLabel: 'My Clients',
        keywords: ['khach hang', 'client', 'pt']
      },
      {
        id: 'pt-register-package',
        path: '/manage/pt/customers',
        labelKey: 'pt.sidebar.registerPackage',
        fallbackLabel: 'Register Package',
        keywords: ['dang ky goi', 'package']
      },
      {
        id: 'pt-attendance',
        path: '/manage/pt/attendance',
        labelKey: 'pt.sidebar.attendanceHistory',
        fallbackLabel: 'Attendance History',
        keywords: ['diem danh', 'attendance']
      },
      {
        id: 'pt-equipment-issues',
        path: '/manage/pt/equipment-issues',
        labelKey: 'pt.sidebar.equipmentIssues',
        fallbackLabel: 'Equipment Issues',
        keywords: ['su co thiet bi', 'issue']
      },
      {
        id: 'pt-kpi',
        path: '/manage/pt/kpi',
        labelKey: 'pt.sidebar.myKPI',
        fallbackLabel: 'My KPI',
        keywords: ['kpi', 'target']
      },
      {
        id: 'pt-chat',
        path: '/manage/pt/chat',
        labelKey: 'pt.sidebar.aiChat',
        fallbackLabel: 'AI Chat',
        keywords: ['chat', 'assistant']
      }
    ]
  },
  {
    roles: ['PT'],
    section: 'schedule',
    items: [
      {
        id: 'pt-calendar',
        path: '/manage/pt/calendar',
        labelKey: 'pt.sidebar.schedule',
        fallbackLabel: 'My Schedule',
        keywords: ['lich', 'schedule']
      },
      {
        id: 'pt-timeoff',
        path: '/manage/pt/timeoff',
        labelKey: 'sidebar.time_off',
        fallbackLabel: 'Time Off',
        keywords: ['nghi', 'time off']
      },
      {
        id: 'pt-availability',
        path: '/manage/pt/pt-availability-requests',
        labelKey: 'sidebar.pt_availability_requests',
        fallbackLabel: 'PT Availability Requests',
        keywords: ['availability', 'phe duyet']
      }
    ]
  },
  {
    roles: ['TECHNICIAN'],
    section: 'main',
    items: [
      {
        id: 'technician-dashboard',
        path: '/manage/technician',
        labelKey: 'sidebar.dashboard',
        fallbackLabel: 'Dashboard',
        keywords: ['overview']
      },
      {
        id: 'technician-equipment',
        path: '/manage/technician/equipment',
        labelKey: 'sidebar.equipment',
        fallbackLabel: 'Equipment',
        keywords: ['thiet bi']
      },
      {
        id: 'technician-inventory',
        path: '/manage/technician/equipment-inventory',
        labelKey: 'sidebar.equipmentInventory',
        fallbackLabel: 'Equipment Inventory',
        keywords: ['kiem ke', 'inventory']
      },
      {
        id: 'technician-attendance',
        path: '/manage/technician/attendance',
        labelKey: 'technician.sidebar.attendanceHistory',
        fallbackLabel: 'Attendance History',
        keywords: ['diem danh', 'attendance']
      },
      {
        id: 'technician-issues',
        path: '/manage/technician/equipment-issues',
        labelKey: 'technician.sidebar.equipmentIssueHistory',
        fallbackLabel: 'Equipment Issues',
        keywords: ['su co', 'issue']
      },
      {
        id: 'technician-maintenance',
        path: '/manage/technician/maintenance',
        labelKey: 'sidebar.maintenance',
        fallbackLabel: 'Maintenance',
        keywords: ['bao tri', 'maintenance']
      },
      {
        id: 'technician-reports',
        path: '/manage/technician/reports',
        labelKey: 'sidebar.reports',
        fallbackLabel: 'Reports',
        keywords: ['bao cao', 'report']
      }
    ]
  },
  {
    roles: ['TECHNICIAN'],
    section: 'schedule',
    items: [
      {
        id: 'technician-calendar',
        path: '/manage/technician/calendar',
        labelKey: 'technician.sidebar.schedule',
        fallbackLabel: 'My Schedule',
        keywords: ['lich', 'schedule']
      },
      {
        id: 'technician-timeoff',
        path: '/manage/technician/timeoff',
        labelKey: 'sidebar.time_off',
        fallbackLabel: 'Time Off',
        keywords: ['nghi', 'time off']
      }
    ]
  },
  {
    roles: ['ADMIN'],
    section: 'main',
    items: [
      {
        id: 'admin-dashboard',
        path: '/admin',
        labelKey: 'sidebar.dashboard',
        fallbackLabel: 'Dashboard',
        keywords: ['overview']
      },
      {
        id: 'admin-subscriptions',
        path: '/admin/subscriptions',
        labelKey: 'sidebar.subscriptions',
        fallbackLabel: 'Subscriptions',
        keywords: ['goi', 'subscription']
      },
      {
        id: 'admin-subscription-packages',
        path: '/admin/subscriptions/packages',
        labelKey: 'sidebar.subscription_packages',
        fallbackLabel: 'Subscription Packages',
        keywords: ['packages', 'goi']
      },
      {
        id: 'admin-contracts',
        path: '/admin/contracts',
        labelKey: 'sidebar.contracts',
        fallbackLabel: 'Contracts',
        keywords: ['hop dong']
      },
      {
        id: 'admin-business-verification',
        path: '/admin/business-verifications',
        labelKey: 'sidebar.business_verification',
        fallbackLabel: 'Business Verification',
        keywords: ['xac thuc', 'business']
      },
      {
        id: 'admin-users',
        path: '/admin/accounts',
        labelKey: 'sidebar.users',
        fallbackLabel: 'Users',
        keywords: ['tai khoan', 'account', 'user']
      },
      {
        id: 'admin-roles',
        path: '/admin/roles',
        labelKey: 'sidebar.roles_permissions',
        fallbackLabel: 'Roles & Permissions',
        keywords: ['phan quyen', 'role', 'permission']
      },
      {
        id: 'admin-reports',
        path: '/admin/reports',
        labelKey: 'sidebar.reports',
        fallbackLabel: 'Reports',
        keywords: ['bao cao', 'report']
      },
      {
        id: 'admin-logs',
        path: '/admin/logs',
        labelKey: 'sidebar.logs',
        fallbackLabel: 'System Logs',
        keywords: ['nhat ky', 'log']
      }
    ]
  },
  {
    roles: ['ADMIN'],
    section: 'settings',
    items: [
      {
        id: 'admin-settings',
        path: '/admin/settings',
        labelKey: 'sidebar.system_settings',
        fallbackLabel: 'System Settings',
        keywords: ['cai dat', 'setting']
      }
    ]
  },
  {
    roles: ['CUSTOMER'],
    section: 'main',
    items: [
      {
        id: 'customer-dashboard',
        path: '/customer',
        labelKey: 'customer.sidebar.dashboard',
        fallbackLabel: 'Dashboard',
        keywords: ['overview']
      },
      {
        id: 'customer-progress',
        path: '/customer/progress',
        labelKey: 'customer.sidebar.progress',
        fallbackLabel: 'Progress',
        keywords: ['tien do', 'progress']
      },
      {
        id: 'customer-payments',
        path: '/customer/payments',
        labelKey: 'customer.sidebar.payments',
        fallbackLabel: 'Payments',
        keywords: ['thanh toan', 'payment']
      },
      {
        id: 'customer-membership',
        path: '/customer/membership',
        labelKey: 'customer.sidebar.membership',
        fallbackLabel: 'Membership',
        keywords: ['goi tap', 'membership']
      },
      {
        id: 'customer-classes',
        path: '/customer/my-classes',
        labelKey: 'customer.sidebar.my_classes',
        fallbackLabel: 'My Classes',
        keywords: ['lop', 'class']
      },
      {
        id: 'customer-attendance',
        path: '/customer/my-attendance',
        labelKey: 'customer.sidebar.my_attendance',
        fallbackLabel: 'My Attendance',
        keywords: ['diem danh', 'attendance']
      },
      {
        id: 'customer-contracts',
        path: '/customer/contracts',
        labelKey: 'customer.sidebar.contracts',
        fallbackLabel: 'Contracts',
        keywords: ['hop dong', 'contract']
      }
    ]
  }
];

export const NAVIGATION_SEARCH_ITEMS: NavigationSearchItem[] = NAVIGATION_GROUPS.flatMap(
  ({ roles, section, items }) => {
    const sectionMeta = SECTION_META[section];
    return items.map((item) => ({
      ...item,
      ...sectionMeta,
      roles
    }));
  }
);
