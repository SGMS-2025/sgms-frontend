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

export const NAVIGATION_SEARCH_ITEMS: NavigationSearchItem[] = [
  // Owner / Manager - Main
  {
    id: 'owner-dashboard',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/owner',
    labelKey: 'sidebar.dashboard',
    fallbackLabel: 'Dashboard',
    keywords: ['overview', 'home'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'owner-staff',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/staff',
    labelKey: 'sidebar.staff',
    fallbackLabel: 'Staff',
    keywords: ['employee', 'nhan vien', 'manager'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'owner-customers',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/customers',
    labelKey: 'sidebar.customers',
    fallbackLabel: 'Customers',
    keywords: ['khach hang', 'client', 'customer'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'owner-payments',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/payments',
    labelKey: 'sidebar.payments',
    fallbackLabel: 'Payments',
    keywords: ['thanh toan', 'transaction', 'invoice'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'owner-equipment',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/equipment',
    labelKey: 'sidebar.equipment',
    fallbackLabel: 'Equipment',
    keywords: ['thiet bi', 'machine'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'owner-testimonials',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/testimonials',
    labelKey: 'sidebar.testimonials',
    fallbackLabel: 'Testimonials',
    keywords: ['review', 'feedback', 'danh gia'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'owner-contracts',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/contracts',
    labelKey: 'sidebar.contracts',
    fallbackLabel: 'Contracts',
    keywords: ['hop dong', 'agreement'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  // Owner / Manager - Services
  {
    id: 'owner-pt-services',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/pt-services',
    labelKey: 'sidebar.pt_services',
    fallbackLabel: 'PT Services',
    keywords: ['personal trainer', 'pt', 'goi pt'],
    sectionKey: 'sidebar.business_services',
    sectionLabel: 'Services'
  },
  {
    id: 'owner-class-services',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/class-services',
    labelKey: 'sidebar.class_services',
    fallbackLabel: 'Class Services',
    keywords: ['lop', 'class'],
    sectionKey: 'sidebar.business_services',
    sectionLabel: 'Services'
  },
  {
    id: 'owner-promotions',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/discounts',
    labelKey: 'sidebar.promotions',
    fallbackLabel: 'Promotions',
    keywords: ['khuyen mai', 'discount'],
    sectionKey: 'sidebar.business_services',
    sectionLabel: 'Services'
  },
  {
    id: 'owner-memberships',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/memberships',
    labelKey: 'sidebar.membership_plans',
    fallbackLabel: 'Membership Plans',
    keywords: ['goi tap', 'membership'],
    sectionKey: 'sidebar.business_services',
    sectionLabel: 'Services'
  },
  // Owner / Manager - Schedule
  {
    id: 'owner-work-schedule',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/workshifts/calendar',
    labelKey: 'sidebar.work_schedule',
    fallbackLabel: 'Work Schedule',
    keywords: ['lich lam viec', 'shift'],
    sectionKey: 'sidebar.schedule',
    sectionLabel: 'Schedule'
  },
  {
    id: 'owner-timeoff',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/timeoff',
    labelKey: 'sidebar.time_off',
    fallbackLabel: 'Time Off',
    keywords: ['nghi phep', 'off'],
    sectionKey: 'sidebar.schedule',
    sectionLabel: 'Schedule'
  },
  {
    id: 'owner-pt-availability',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/pt-availability-requests',
    labelKey: 'sidebar.pt_availability_requests',
    fallbackLabel: 'PT Availability',
    keywords: ['availability', 'phe duyet pt'],
    sectionKey: 'sidebar.schedule',
    sectionLabel: 'Schedule'
  },
  {
    id: 'owner-classes',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/classes',
    labelKey: 'sidebar.classes',
    fallbackLabel: 'Classes',
    keywords: ['lop hoc', 'class'],
    sectionKey: 'sidebar.schedule',
    sectionLabel: 'Schedule'
  },
  // Owner / Manager - Finance
  {
    id: 'owner-expenses',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/expenses',
    labelKey: 'sidebar.expenses',
    fallbackLabel: 'Expenses',
    keywords: ['chi phi', 'expense'],
    sectionKey: 'sidebar.finance',
    sectionLabel: 'Finance'
  },
  {
    id: 'owner-kpi',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/kpi',
    labelKey: 'sidebar.kpi',
    fallbackLabel: 'KPI',
    keywords: ['chiso', 'target', 'kpi'],
    sectionKey: 'sidebar.finance',
    sectionLabel: 'Finance'
  },
  {
    id: 'owner-commission',
    roles: ['OWNER', 'MANAGER'],
    path: '/manage/commission-policies',
    labelKey: 'sidebar.commission_policy',
    fallbackLabel: 'Commission Policy',
    keywords: ['hoa hong', 'commission'],
    sectionKey: 'sidebar.finance',
    sectionLabel: 'Finance'
  },
  // Personal Trainer
  {
    id: 'pt-dashboard',
    roles: ['PT'],
    path: '/manage/pt',
    labelKey: 'sidebar.dashboard',
    fallbackLabel: 'Dashboard',
    keywords: ['overview'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'pt-clients',
    roles: ['PT'],
    path: '/manage/pt/clients',
    labelKey: 'pt.sidebar.clients',
    fallbackLabel: 'My Clients',
    keywords: ['khach hang', 'client', 'pt'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'pt-register-package',
    roles: ['PT'],
    path: '/manage/pt/customers',
    labelKey: 'pt.sidebar.registerPackage',
    fallbackLabel: 'Register Package',
    keywords: ['dang ky goi', 'package'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'pt-attendance',
    roles: ['PT'],
    path: '/manage/pt/attendance',
    labelKey: 'pt.sidebar.attendanceHistory',
    fallbackLabel: 'Attendance History',
    keywords: ['diem danh', 'attendance'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'pt-equipment-issues',
    roles: ['PT'],
    path: '/manage/pt/equipment-issues',
    labelKey: 'pt.sidebar.equipmentIssues',
    fallbackLabel: 'Equipment Issues',
    keywords: ['su co thiet bi', 'issue'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'pt-kpi',
    roles: ['PT'],
    path: '/manage/pt/kpi',
    labelKey: 'pt.sidebar.myKPI',
    fallbackLabel: 'My KPI',
    keywords: ['kpi', 'target'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'pt-chat',
    roles: ['PT'],
    path: '/manage/pt/chat',
    labelKey: 'pt.sidebar.aiChat',
    fallbackLabel: 'AI Chat',
    keywords: ['chat', 'assistant'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'pt-calendar',
    roles: ['PT'],
    path: '/manage/pt/calendar',
    labelKey: 'pt.sidebar.schedule',
    fallbackLabel: 'My Schedule',
    keywords: ['lich', 'schedule'],
    sectionKey: 'sidebar.schedule',
    sectionLabel: 'Schedule'
  },
  {
    id: 'pt-timeoff',
    roles: ['PT'],
    path: '/manage/pt/timeoff',
    labelKey: 'sidebar.time_off',
    fallbackLabel: 'Time Off',
    keywords: ['nghi', 'time off'],
    sectionKey: 'sidebar.schedule',
    sectionLabel: 'Schedule'
  },
  {
    id: 'pt-availability',
    roles: ['PT'],
    path: '/manage/pt/pt-availability-requests',
    labelKey: 'sidebar.pt_availability_requests',
    fallbackLabel: 'PT Availability Requests',
    keywords: ['availability', 'phe duyet'],
    sectionKey: 'sidebar.schedule',
    sectionLabel: 'Schedule'
  },
  // Technician
  {
    id: 'technician-dashboard',
    roles: ['TECHNICIAN'],
    path: '/manage/technician',
    labelKey: 'sidebar.dashboard',
    fallbackLabel: 'Dashboard',
    keywords: ['overview'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'technician-equipment',
    roles: ['TECHNICIAN'],
    path: '/manage/technician/equipment',
    labelKey: 'sidebar.equipment',
    fallbackLabel: 'Equipment',
    keywords: ['thiet bi'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'technician-inventory',
    roles: ['TECHNICIAN'],
    path: '/manage/technician/equipment-inventory',
    labelKey: 'sidebar.equipmentInventory',
    fallbackLabel: 'Equipment Inventory',
    keywords: ['kiem ke', 'inventory'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'technician-attendance',
    roles: ['TECHNICIAN'],
    path: '/manage/technician/attendance',
    labelKey: 'technician.sidebar.attendanceHistory',
    fallbackLabel: 'Attendance History',
    keywords: ['diem danh', 'attendance'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'technician-issues',
    roles: ['TECHNICIAN'],
    path: '/manage/technician/equipment-issues',
    labelKey: 'technician.sidebar.equipmentIssueHistory',
    fallbackLabel: 'Equipment Issues',
    keywords: ['su co', 'issue'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'technician-maintenance',
    roles: ['TECHNICIAN'],
    path: '/manage/technician/maintenance',
    labelKey: 'sidebar.maintenance',
    fallbackLabel: 'Maintenance',
    keywords: ['bao tri', 'maintenance'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'technician-reports',
    roles: ['TECHNICIAN'],
    path: '/manage/technician/reports',
    labelKey: 'sidebar.reports',
    fallbackLabel: 'Reports',
    keywords: ['bao cao', 'report'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'technician-calendar',
    roles: ['TECHNICIAN'],
    path: '/manage/technician/calendar',
    labelKey: 'technician.sidebar.schedule',
    fallbackLabel: 'My Schedule',
    keywords: ['lich', 'schedule'],
    sectionKey: 'sidebar.schedule',
    sectionLabel: 'Schedule'
  },
  {
    id: 'technician-timeoff',
    roles: ['TECHNICIAN'],
    path: '/manage/technician/timeoff',
    labelKey: 'sidebar.time_off',
    fallbackLabel: 'Time Off',
    keywords: ['nghi', 'time off'],
    sectionKey: 'sidebar.schedule',
    sectionLabel: 'Schedule'
  },
  // Admin
  {
    id: 'admin-dashboard',
    roles: ['ADMIN'],
    path: '/admin',
    labelKey: 'sidebar.dashboard',
    fallbackLabel: 'Dashboard',
    keywords: ['overview'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'admin-subscriptions',
    roles: ['ADMIN'],
    path: '/admin/subscriptions',
    labelKey: 'sidebar.subscriptions',
    fallbackLabel: 'Subscriptions',
    keywords: ['goi', 'subscription'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'admin-subscription-packages',
    roles: ['ADMIN'],
    path: '/admin/subscriptions/packages',
    labelKey: 'sidebar.subscription_packages',
    fallbackLabel: 'Subscription Packages',
    keywords: ['packages', 'goi'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'admin-contracts',
    roles: ['ADMIN'],
    path: '/admin/contracts',
    labelKey: 'sidebar.contracts',
    fallbackLabel: 'Contracts',
    keywords: ['hop dong'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'admin-business-verification',
    roles: ['ADMIN'],
    path: '/admin/business-verifications',
    labelKey: 'sidebar.business_verification',
    fallbackLabel: 'Business Verification',
    keywords: ['xac thuc', 'business'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'admin-users',
    roles: ['ADMIN'],
    path: '/admin/accounts',
    labelKey: 'sidebar.users',
    fallbackLabel: 'Users',
    keywords: ['tai khoan', 'account', 'user'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'admin-roles',
    roles: ['ADMIN'],
    path: '/admin/roles',
    labelKey: 'sidebar.roles_permissions',
    fallbackLabel: 'Roles & Permissions',
    keywords: ['phan quyen', 'role', 'permission'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'admin-reports',
    roles: ['ADMIN'],
    path: '/admin/reports',
    labelKey: 'sidebar.reports',
    fallbackLabel: 'Reports',
    keywords: ['bao cao', 'report'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'admin-logs',
    roles: ['ADMIN'],
    path: '/admin/logs',
    labelKey: 'sidebar.logs',
    fallbackLabel: 'System Logs',
    keywords: ['nhat ky', 'log'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'admin-settings',
    roles: ['ADMIN'],
    path: '/admin/settings',
    labelKey: 'sidebar.system_settings',
    fallbackLabel: 'System Settings',
    keywords: ['cai dat', 'setting'],
    sectionKey: 'sidebar.settings',
    sectionLabel: 'Settings'
  },
  // Customer
  {
    id: 'customer-dashboard',
    roles: ['CUSTOMER'],
    path: '/customer',
    labelKey: 'customer.sidebar.dashboard',
    fallbackLabel: 'Dashboard',
    keywords: ['overview'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'customer-progress',
    roles: ['CUSTOMER'],
    path: '/customer/progress',
    labelKey: 'customer.sidebar.progress',
    fallbackLabel: 'Progress',
    keywords: ['tien do', 'progress'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'customer-payments',
    roles: ['CUSTOMER'],
    path: '/customer/payments',
    labelKey: 'customer.sidebar.payments',
    fallbackLabel: 'Payments',
    keywords: ['thanh toan', 'payment'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'customer-membership',
    roles: ['CUSTOMER'],
    path: '/customer/membership',
    labelKey: 'customer.sidebar.membership',
    fallbackLabel: 'Membership',
    keywords: ['goi tap', 'membership'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'customer-classes',
    roles: ['CUSTOMER'],
    path: '/customer/my-classes',
    labelKey: 'customer.sidebar.my_classes',
    fallbackLabel: 'My Classes',
    keywords: ['lop', 'class'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'customer-attendance',
    roles: ['CUSTOMER'],
    path: '/customer/my-attendance',
    labelKey: 'customer.sidebar.my_attendance',
    fallbackLabel: 'My Attendance',
    keywords: ['diem danh', 'attendance'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  },
  {
    id: 'customer-contracts',
    roles: ['CUSTOMER'],
    path: '/customer/contracts',
    labelKey: 'customer.sidebar.contracts',
    fallbackLabel: 'Contracts',
    keywords: ['hop dong', 'contract'],
    sectionKey: 'sidebar.main_menu',
    sectionLabel: 'Menu'
  }
];
