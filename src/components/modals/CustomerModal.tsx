import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X, Upload, Camera, Plus, CalendarIcon, User, Percent, Clock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, formatDate } from '@/utils/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useBranch } from '@/contexts/BranchContext';
import { packageApi } from '@/services/api/packageApi';
import { discountCampaignApi } from '@/services/api/discountApi';
import { staffApi } from '@/services/api/staffApi';
import { customerApi } from '@/services/api/customerApi';
import { membershipApi } from '@/services/api/membershipApi';
import { paymentApi, type PayOSPaymentData } from '@/services/api/paymentApi';
import { PayOSPaymentModal } from '@/components/modals/PayOSPaymentModal';

// Currency formatting utilities
const formatCurrency = (value: string | number): string => {
  if (!value || value === '') return '';

  const strValue = String(value).replaceAll(/[^\d]/g, '');

  if (!strValue) return '';

  // Convert to number for formatting
  const numValue = Number.parseInt(strValue, 10);

  if (Number.isNaN(numValue)) return '';

  // Use toLocaleString with proper options for Vietnamese formatting
  return numValue.toLocaleString('vi-VN');
};

const parseCurrency = (value: string): string => {
  if (!value) return '';
  // Remove all non-numeric characters
  const cleaned = value.replaceAll(/[^\d]/g, '');
  return cleaned;
};
import type { ServicePackage } from '@/types/api/Package';
import type { DiscountCampaign } from '@/types/api/Discount';
import type { Staff } from '@/types/api/Staff';
import type { MembershipPlan } from '@/types/api/Membership';
import type {
  CustomerModalProps,
  CustomerFormData,
  ApiResponse,
  ServiceContract,
  MembershipContract,
  CustomerDetail,
  StaffWithDetails,
  PackageWithPricing,
  PromotionWithDiscount,
  BranchWithAddress,
  GenderType
} from '@/types/api/Customer';

type ServiceRegistrationContractPayload = {
  serviceContract?: { _id?: string };
  membershipContract?: { _id?: string };
  contract?: { _id?: string };
};

const getDurationOptions = (t: (key: string) => string) => [
  { value: '1', label: '1 tháng' },
  { value: '3', label: '3 tháng' },
  { value: '6', label: '6 tháng' },
  { value: '12', label: '12 tháng' },
  { value: 'custom', label: t('customer_modal.custom_duration') }
];

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  isEditMode = false,
  onCustomerUpdate
}) => {
  const { t } = useTranslation();
  const { branches, currentBranch } = useBranch();

  const [activeTab, setActiveTab] = useState<'basic' | 'service'>('basic');
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [promotions, setPromotions] = useState<DiscountCampaign[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Date picker states
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [activationDate, setActivationDate] = useState<Date | undefined>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    password: '',
    gender: 'male',
    isLoyalCustomer: false,
    cardId: '',
    address: '',
    notes: '',
    dateOfBirth: '',
    branchId: currentBranch?._id || '',
    avatar: null,
    selectedServicePackage: '',
    selectedMembershipPlan: '',
    promotionId: '',
    duration: '',
    customDuration: '',
    referrerStaffId: '',
    activationDate: new Date().toISOString().split('T')[0],
    price: '',
    discount: '',
    totalAmount: '',
    amountPaid: '',
    remainingDebt: '',
    serviceNotes: '',
    paymentMethod: 'CASH' // New: Payment method selection
  });

  // PayOS payment modal state
  const [payosModal, setPayosModal] = useState<{
    isOpen: boolean;
    paymentData: PayOSPaymentData | null;
    branchId?: string;
    contractId?: string;
  }>({
    isOpen: false,
    paymentData: null,
    branchId: undefined,
    contractId: undefined
  });

  // Validation errors state
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});

  // Load data when modal opens
  useEffect(() => {
    const initializeModal = async () => {
      if (isOpen) {
        setActiveTab('basic');
        await loadData();
        if (customer && isEditMode) {
          await populateFormData();
        } else if (!isEditMode) {
          // Reset form data when opening modal for new customer
          resetFormData();
        }
      } else {
        // Reset form data when modal closes
        resetFormData();
        // Reset active tab to basic
        setActiveTab('basic');
      }
    };

    initializeModal();
  }, [isOpen, customer, isEditMode]);

  // Sync activation date with formData
  useEffect(() => {
    if (activationDate) {
      handleInputChange('activationDate', activationDate.toISOString().split('T')[0]);
    }
  }, [activationDate]);

  // Load staff when branch changes
  useEffect(() => {
    if (formData.branchId) {
      loadStaffByBranch(formData.branchId);
    } else {
      setStaffList([]);
    }
  }, [formData.branchId]);

  // Update branchId when currentBranch changes
  useEffect(() => {
    if (currentBranch?._id && currentBranch._id !== formData.branchId) {
      handleInputChange('branchId', currentBranch._id);
    }
  }, [currentBranch]);

  const loadStaffByBranch = async (branchId: string) => {
    if (!branchId) {
      setStaffList([]);
      return;
    }

    const staffResponse = await Promise.race([
      staffApi.getStaffListByBranch(branchId, {
        limit: 100
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);
    if (staffResponse && (staffResponse as ApiResponse<Staff[]>).success) {
      const staffData = (staffResponse as ApiResponse<Staff[]>).data || [];
      setStaffList(staffData);
    } else {
      setStaffList([]);
    }
  };

  const loadData = async () => {
    setDataLoading(true);

    // Load packages with timeout - use branch-specific packages if available
    const packagesResponse = await Promise.race([
      currentBranch?._id ? packageApi.getActivePackagesByBranch(currentBranch._id) : packageApi.getActivePackages(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);
    if (packagesResponse && (packagesResponse as ApiResponse<ServicePackage[]>).success) {
      setPackages((packagesResponse as ApiResponse<ServicePackage[]>).data || []);
    } else {
      setPackages([]);
    }

    // Load membership plans with timeout
    if (currentBranch?._id) {
      const membershipResponse = await Promise.race([
        membershipApi.getMembershipPlans(
          {
            branchId: currentBranch._id,
            isActive: true,
            limit: 100
          },
          [currentBranch._id]
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      if (membershipResponse && (membershipResponse as ApiResponse<{ plans: MembershipPlan[] }>).success) {
        setMembershipPlans((membershipResponse as ApiResponse<{ plans: MembershipPlan[] }>).data?.plans || []);
      } else {
        setMembershipPlans([]);
      }
    } else {
      setMembershipPlans([]);
    }

    // Load promotions with timeout - use branch-specific campaigns if available
    const promotionsResponse = await Promise.race([
      currentBranch?._id
        ? discountCampaignApi.getActiveCampaignsByBranch(currentBranch._id)
        : discountCampaignApi.getActiveCampaigns(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);
    if (promotionsResponse && (promotionsResponse as ApiResponse<DiscountCampaign[]>).success) {
      setPromotions((promotionsResponse as ApiResponse<DiscountCampaign[]>).data || []);
    } else {
      setPromotions([]);
    }

    // Load staff for selected branch if available
    if (formData.branchId) {
      await loadStaffByBranch(formData.branchId);
    }

    setDataLoading(false);
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      password: '',
      gender: 'male',
      isLoyalCustomer: false,
      cardId: '',
      address: '',
      notes: '',
      dateOfBirth: '',
      branchId: currentBranch?._id || '',
      avatar: null,
      selectedServicePackage: '',
      selectedMembershipPlan: '',
      promotionId: '',
      duration: '',
      customDuration: '',
      referrerStaffId: '',
      activationDate: new Date().toISOString().split('T')[0],
      price: '',
      discount: '',
      totalAmount: '',
      amountPaid: '',
      remainingDebt: '',
      serviceNotes: '',
      paymentMethod: 'CASH'
    });

    // Reset date states
    setDateOfBirth(undefined);
    setActivationDate(new Date());
    setDatePickerOpen(false);

    // Clear all errors
    setErrors({});

    // Reset password visibility
    setShowPassword(false);
  };

  // Helper function to create basic form data structure
  const createBasicFormData = (
    customerDetail: CustomerDetail,
    latestServiceContract: ServiceContract | undefined,
    latestMembershipContract: MembershipContract | undefined
  ): CustomerFormData => {
    const getReferrerStaffId = () => {
      const serviceStaffId = latestServiceContract?.referrerStaffId?._id;
      const membershipStaffId = latestMembershipContract?.referrerStaffId?._id;
      const customerStaffId = customerDetail.referrerStaffId;
      const staffId = serviceStaffId || membershipStaffId || customerStaffId;
      return staffId || '';
    };

    return {
      name: customerDetail.name || '',
      phone: customerDetail.phone || '',
      email: customerDetail.email || '',
      password: '',
      gender: ['male', 'female', 'other'].includes(customerDetail.gender?.toLowerCase() || '')
        ? (customerDetail.gender?.toLowerCase() as GenderType)
        : 'male',
      isLoyalCustomer: customerDetail.isLoyal || false,
      cardId: customerDetail.cardCode || '',
      address: customerDetail.address || '',
      notes: customerDetail.notes || '',
      dateOfBirth: customerDetail.dateOfBirth || '',
      branchId: currentBranch?._id || customerDetail.branches?.[0]?._id || '',
      avatar: null,
      selectedServicePackage: latestServiceContract ? `package-${latestServiceContract.servicePackageId._id}` : '',
      selectedMembershipPlan: latestMembershipContract
        ? `membership-${latestMembershipContract.membershipPlanId._id}`
        : '',
      promotionId:
        latestServiceContract?.discountCampaignId?._id || latestMembershipContract?.discountCampaignId?._id || '',
      duration: latestServiceContract?.customMonths ? 'custom' : latestServiceContract?.duration || '',
      customDuration: latestServiceContract?.customMonths?.toString() || '',
      referrerStaffId: getReferrerStaffId(),
      activationDate:
        latestServiceContract?.startDate ||
        latestMembershipContract?.startDate ||
        new Date().toISOString().split('T')[0],
      price: '0',
      discount: '0',
      totalAmount: '0',
      amountPaid: (
        latestServiceContract?.initialPaidAmount ||
        latestMembershipContract?.initialPaidAmount ||
        0
      ).toString(),
      remainingDebt: '0',
      serviceNotes: latestServiceContract?.notes || latestMembershipContract?.notes || '',
      paymentMethod: 'CASH'
    };
  };

  // Helper function to set date states
  const setDateStates = (
    customerDetail: CustomerDetail,
    latestServiceContract: ServiceContract | undefined,
    latestMembershipContract: MembershipContract | undefined
  ) => {
    if (customerDetail.dateOfBirth) {
      setDateOfBirth(new Date(customerDetail.dateOfBirth));
    } else {
      setDateOfBirth(undefined);
    }

    const startDate = latestServiceContract?.startDate || latestMembershipContract?.startDate;
    if (startDate) {
      setActivationDate(new Date(startDate));
    } else {
      setActivationDate(new Date());
    }

    setDatePickerOpen(false);
  };

  // Helper function to calculate pricing
  const calculateAndSetPricing = (basicFormData: CustomerFormData) => {
    const calculatedPrice = calculateTotalPrice('', '', basicFormData);
    basicFormData.price = calculatedPrice.toString();

    const calculatedDiscount = calculateDiscountFromPromotion(basicFormData.promotionId, basicFormData);
    basicFormData.discount = calculatedDiscount.toString();

    const totalAmount = calculatedPrice - calculatedDiscount;
    const amountPaid = parseInt(String(basicFormData.amountPaid), 10) || 0;
    const remainingDebt = totalAmount - amountPaid;

    basicFormData.totalAmount = totalAmount.toString();
    basicFormData.remainingDebt = remainingDebt.toString();
  };

  const populateFormData = async () => {
    if (!customer?.id) {
      return;
    }

    // Use customer data passed from CustomerManagement instead of making another API call
    // This prevents duplicate API calls and duplicate error toasts
    const customerDetail = customer;

    const latestServiceContract = customerDetail.latestServiceContract;
    const latestMembershipContract = customerDetail.latestMembershipContract;

    const basicFormData = createBasicFormData(customerDetail, latestServiceContract, latestMembershipContract);
    calculateAndSetPricing(basicFormData);

    setFormData(basicFormData);
    setDateStates(customerDetail, latestServiceContract, latestMembershipContract);

    const customerBranchId = currentBranch?._id || customerDetail.branches?.[0]?._id || '';
    if (customerBranchId) {
      await loadStaffByBranch(customerBranchId);
    }
  };

  // Validation helper functions
  const validateName = (value: string | number | boolean): string => {
    if (!String(value)?.trim()) return t('customer_modal.validation.name_required');
    return '';
  };

  const validatePhone = (value: string | number | boolean): string => {
    const strValue = String(value);
    if (!strValue?.trim()) return t('customer_modal.validation.phone_required');
    if (strValue.trim().length > 15) return t('customer_modal.validation.phone_length');
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(strValue.replace(/\s/g, ''))) return t('customer_modal.validation.phone_format');
    return '';
  };

  const validateEmail = (value: string | number | boolean): string => {
    const strValue = String(value);
    if (!strValue?.trim()) return t('customer_modal.validation.email_required');
    if (strValue.trim().length > 100) return t('customer_modal.validation.email_length');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(strValue)) return t('customer_modal.validation.email_format');
    return '';
  };

  const validatePassword = (value: string | number | boolean): string => {
    const strValue = String(value);
    if (!isEditMode) {
      if (!strValue?.trim()) return t('customer_modal.validation.password_required');
      if (strValue.length < 8) return t('customer_modal.validation.password_length');
      if (!/[A-Z]/.test(strValue)) return t('customer_modal.validation.password_uppercase');
      if (!/[0-9]/.test(strValue)) return t('customer_modal.validation.password_number');
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(strValue)) return t('customer_modal.validation.password_special');
    }
    return '';
  };

  const validateCardId = (value: string | number | boolean): string => {
    const strValue = String(value);
    if (!strValue?.trim()) return t('customer_modal.validation.card_required');
    if (strValue.trim().length < 2) return t('customer_modal.validation.card_min_length');
    if (strValue.trim().length > 20) return t('customer_modal.validation.card_max_length');
    const cardIdRegex = /^[a-zA-Z0-9_-]+$/;
    if (!cardIdRegex.test(strValue.trim())) return t('customer_modal.validation.card_format');
    return '';
  };

  const validateDateOfBirth = (value: string | number | boolean): string => {
    const strValue = String(value);
    if (strValue?.trim()) {
      const birthDate = new Date(strValue);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (birthDate > today) return t('customer_modal.validation.birth_date_future');

      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      if (actualAge < 5) return t('customer_modal.validation.age_requirement');
    }
    return '';
  };

  const validateNumericField = (value: string | number | boolean, fieldName: string): string => {
    const strValue = String(value);
    if (strValue && strValue !== '') {
      const numValue = parseInt(strValue.replace(/[^\d]/g, ''), 10);
      if (isNaN(numValue) || numValue < 0) return `${fieldName} ${t('customer_modal.validation.positive_number')}`;
    }
    return '';
  };

  const validateCustomDuration = (value: string | number | boolean): string => {
    const strValue = String(value);
    if (strValue && strValue !== '') {
      const numValue = parseInt(strValue.replace(/[^\d]/g, ''), 10);
      if (isNaN(numValue) || numValue < 1) return t('customer_modal.validation.custom_duration_positive');
      if (numValue > 60) return t('customer_modal.validation.custom_duration_max');
    }
    return '';
  };

  // Main validation function
  const validateField = (field: keyof CustomerFormData, value: string | number | boolean): string => {
    switch (field) {
      case 'name':
        return validateName(value);
      case 'phone':
        return validatePhone(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      case 'cardId':
        return validateCardId(value);
      case 'dateOfBirth':
        return validateDateOfBirth(value);
      case 'price':
        return validateNumericField(value, 'Giá');
      case 'discount':
        return validateNumericField(value, 'Giảm giá');
      case 'amountPaid':
        return validateNumericField(value, 'Số tiền trả');
      case 'customDuration':
        return validateCustomDuration(value);
      default:
        return '';
    }
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string | number | boolean | File) => {
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }

    // Clear customDuration error when duration changes from 'custom' to something else
    if (field === 'duration' && value !== 'custom' && errors.customDuration) {
      setErrors((prev) => ({ ...prev, customDuration: '' }));
    }

    // Real-time validation for cardId, email, phone, name
    if (
      (field === 'cardId' || field === 'email' || field === 'phone' || field === 'name') &&
      typeof value === 'string' &&
      value.trim()
    ) {
      const error = validateField(field, value);
      if (error) {
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    }

    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Auto-calculate price when service package or membership plan changes
      if (field === 'selectedServicePackage' || field === 'selectedMembershipPlan') {
        // Clear the other selection when one is chosen
        if (field === 'selectedServicePackage' && value) {
          newData.selectedMembershipPlan = '';
        } else if (field === 'selectedMembershipPlan' && value) {
          newData.selectedServicePackage = '';
          newData.duration = '';
          newData.customDuration = '';
        }

        const calculatedPrice = calculateTotalPrice(String(value), field, prev);
        newData.price = calculatedPrice.toString();

        // Recalculate totals with new price
        const newDiscount = prev.discount === '' ? 0 : parseInt(String(prev.discount), 10) || 0;
        const newTotal = calculatedPrice - newDiscount;

        // For membership plans, auto-set amountPaid = totalAmount (full payment required)
        if (field === 'selectedMembershipPlan' && value) {
          newData.amountPaid = newTotal.toString();
          newData.remainingDebt = '0';
        } else {
          const newRemaining = newTotal - (prev.amountPaid === '' ? 0 : parseInt(String(prev.amountPaid), 10) || 0);
          newData.remainingDebt = newRemaining.toString();
        }

        newData.totalAmount = newTotal.toString();
      }

      // Auto-calculate discount when promotion changes
      if (field === 'promotionId') {
        const calculatedDiscount = calculateDiscountFromPromotion(String(value), prev);
        newData.discount = calculatedDiscount.toString();

        // Recalculate totals with new discount
        const currentPrice = prev.price === '' ? 0 : parseInt(String(prev.price), 10) || 0;
        const newTotal = currentPrice - calculatedDiscount;
        const newRemaining = newTotal - (prev.amountPaid === '' ? 0 : parseInt(String(prev.amountPaid), 10) || 0);

        newData.totalAmount = newTotal.toString();
        newData.remainingDebt = newRemaining.toString();
      }

      // Auto-calculate totals when discount changes (price is now read-only)
      if (field === 'discount') {
        const currentPrice = prev.price === '' ? 0 : parseInt(String(prev.price), 10) || 0;
        const newDiscount = value === '' ? 0 : parseInt(String(value), 10) || 0;
        const newTotal = currentPrice - newDiscount;
        const newRemaining = newTotal - (prev.amountPaid === '' ? 0 : parseInt(String(prev.amountPaid), 10) || 0);

        newData.totalAmount = newTotal.toString();
        newData.remainingDebt = newRemaining.toString();
      }

      // Auto-calculate remaining debt when amount paid changes
      if (field === 'amountPaid') {
        const newRemaining =
          (prev.totalAmount === '' ? 0 : parseInt(String(prev.totalAmount), 10) || 0) -
          (value === '' ? 0 : parseInt(String(value), 10) || 0);
        newData.remainingDebt = newRemaining.toString();
      }

      return newData;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleInputChange('avatar', file);
    }
  };

  // Calculate total price based on selected packages
  const calculateTotalPrice = (newValue: string, field: string, prevFormData: CustomerFormData): number => {
    let totalPrice = 0;

    // Get current selections (including the new value)
    const currentServicePackage = field === 'selectedServicePackage' ? newValue : prevFormData.selectedServicePackage;
    const currentMembershipPlan = field === 'selectedMembershipPlan' ? newValue : prevFormData.selectedMembershipPlan;

    // Calculate service package price
    if (currentServicePackage && currentServicePackage.startsWith('package-')) {
      const packageId = currentServicePackage.replace('package-', '');
      const selectedPackage = packages.find((pkg) => pkg._id === packageId);
      if (selectedPackage) {
        // Use branch-specific price if available, otherwise use default price
        const packageWithPricing = selectedPackage as PackageWithPricing;
        const packagePrice = packageWithPricing.finalPrice || packageWithPricing.defaultPriceVND || 0;
        totalPrice += packagePrice;
      }
    }

    // Calculate membership plan price
    if (currentMembershipPlan && currentMembershipPlan.startsWith('membership-')) {
      const membershipId = currentMembershipPlan.replace('membership-', '');
      const selectedMembership = membershipPlans.find((plan) => plan._id === membershipId);
      if (selectedMembership) {
        totalPrice += selectedMembership.price;
      }
    }

    return totalPrice;
  };

  // Calculate discount from promotion
  const calculateDiscountFromPromotion = (promotionId: string, prevFormData: CustomerFormData): number => {
    if (!promotionId || promotionId === 'none') {
      return 0;
    }

    const selectedPromotion = promotions.find((promo) => promo._id === promotionId);
    if (!selectedPromotion) {
      return 0;
    }

    // Get current price to calculate discount
    const currentPrice = prevFormData.price === '' ? 0 : parseInt(String(prevFormData.price), 10) || 0;
    const promotionWithDiscount = selectedPromotion as PromotionWithDiscount;
    const discountPercentage = promotionWithDiscount.discountPercentage || 0;

    const calculatedDiscount = Math.round((currentPrice * discountPercentage) / 100);

    return calculatedDiscount;
  };

  // Helper functions for package selection
  const clearServicePackageSelection = () => {
    handleInputChange('selectedServicePackage', '');
  };

  const clearMembershipPlanSelection = () => {
    handleInputChange('selectedMembershipPlan', '');
  };

  // Handle date selection for date of birth
  const handleDateOfBirthSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      handleInputChange('dateOfBirth', formattedDate);
      setDateOfBirth(date);
      setDatePickerOpen(false);

      // Trigger validation for dateOfBirth
      const error = validateField('dateOfBirth', formattedDate);
      if (error) {
        setErrors((prev) => ({ ...prev, dateOfBirth: error }));
      } else {
        setErrors((prev) => ({ ...prev, dateOfBirth: '' }));
      }
    }
  };

  // Validation for Basic Information tab
  const validateBasicInfo = (): Partial<Record<keyof CustomerFormData, string>> => {
    const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};

    // Required fields for basic info
    const requiredFields: (keyof CustomerFormData)[] = ['name', 'phone', 'email', 'cardId'];
    if (!isEditMode) {
      requiredFields.push('password');
    }

    requiredFields.forEach((field) => {
      const fieldValue = formData[field];
      if (fieldValue !== null && fieldValue !== undefined && !(fieldValue instanceof File)) {
        const error = validateField(field, fieldValue as string | number | boolean);
        if (error) {
          newErrors[field] = error;
        }
      }
    });

    // Validate optional dateOfBirth if it has value
    if (formData.dateOfBirth && formData.dateOfBirth !== '') {
      const error = validateField('dateOfBirth', formData.dateOfBirth);
      if (error) {
        newErrors.dateOfBirth = error;
      }
    }

    // Validate branchId
    if (!formData.branchId && !currentBranch?._id) {
      newErrors.branchId = t('customer_modal.validation.branch_required');
    }

    return newErrors;
  };

  // Validation for Service Registration tab
  const validateServiceRegistration = (): Partial<Record<keyof CustomerFormData, string>> => {
    const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};

    // Validate optional fields if they have values
    if (formData.price && formData.price !== '') {
      const error = validateField('price', formData.price);
      if (error) {
        newErrors.price = error;
      }
    }

    if (formData.discount && formData.discount !== '') {
      const error = validateField('discount', formData.discount);
      if (error) {
        newErrors.discount = error;
      }
    }

    if (formData.amountPaid && formData.amountPaid !== '') {
      const error = validateField('amountPaid', formData.amountPaid);
      if (error) {
        newErrors.amountPaid = error;
      }
    }

    // Special validation: if duration is 'custom', customDuration is required
    if (formData.duration === 'custom') {
      if (!formData.customDuration || formData.customDuration.trim() === '') {
        newErrors.customDuration = t('customer_modal.validation.custom_duration_required');
      } else {
        const error = validateField('customDuration', formData.customDuration);
        if (error) {
          newErrors.customDuration = error;
        }
      }
    }

    return newErrors;
  };

  // Submit Basic Information only
  const handleSubmitBasicInfo = async () => {
    setLoading(true);

    // Validate basic info
    const newErrors = validateBasicInfo();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(t('customer_modal.validation.check_info'));
      setLoading(false);
      return;
    }

    setErrors({});

    const basicData = {
      // User data for backend
      username: formData.phone,
      email: formData.email,
      fullName: formData.name,
      phoneNumber: formData.phone,
      gender: formData.gender.toUpperCase(),
      dateOfBirth: formData.dateOfBirth || null,
      address: formData.address || null,

      // Customer specific data
      isLoyal: formData.isLoyalCustomer,
      cardCode: formData.cardId || null,
      referrerStaffId: formData.referrerStaffId || null,
      notes: formData.notes || null,
      branchId: formData.branchId || currentBranch?._id
    };

    // Only include password for new customers
    if (!isEditMode) {
      (basicData as typeof basicData & { password: string }).password = formData.password;
    }

    try {
      if (isEditMode && customer) {
        await customerApi.updateBasicInfo(customer.id, basicData);
        toast.success(t('customer_modal.success.basic_info_updated'));
      } else {
        const response = await customerApi.createCustomer(basicData, formData.avatar || undefined);

        // Check if response is an error
        if (!response.success) {
          const errorResponse = response as ApiResponse<unknown>;
          const errorMessage = errorResponse.message || 'Không thể tạo khách hàng';
          const statusCode = errorResponse.statusCode;
          const errorCode = errorResponse.code;

          // Handle duplicate key errors
          if (statusCode === 409 || errorCode === 'MONGO_DUPLICATE_KEY' || errorCode === 'CONFLICT') {
            const errorMeta = errorResponse.error?.meta;
            if (errorMeta && errorMeta.field) {
              const field = errorMeta.field;
              const fieldMessage = errorMessage || `${field} đã tồn tại trong hệ thống`;
              setErrors((prev) => ({ ...prev, [field]: fieldMessage }));
              toast.error(fieldMessage);
            } else {
              if (errorMessage.includes('cardCode_1')) {
                setErrors((prev) => ({ ...prev, cardId: 'Mã thẻ đã tồn tại' }));
                toast.error('Mã thẻ đã tồn tại');
              } else if (errorMessage.includes('email_1')) {
                setErrors((prev) => ({ ...prev, email: 'Email đã tồn tại' }));
                toast.error('Email đã tồn tại');
              } else if (errorMessage.includes('phoneNumber_1')) {
                setErrors((prev) => ({ ...prev, phone: 'Số điện thoại đã tồn tại' }));
                toast.error('Số điện thoại đã tồn tại');
              } else {
                toast.error('Dữ liệu đã tồn tại trong hệ thống');
              }
            }
            setLoading(false);
            return;
          } else {
            toast.error(errorMessage);
            setLoading(false);
            return;
          }
        }

        toast.success(t('customer_modal.success.create'));
      }

      onCustomerUpdate?.();
      onClose();
    } catch (error) {
      console.error('Error updating basic info:', error);
      toast.error('Có lỗi xảy ra khi cập nhật thông tin cơ bản');
    } finally {
      setLoading(false);
    }
  };

  // Submit Service Registration only
  const handleSubmitServiceRegistration = async () => {
    if (!isEditMode || !customer) {
      toast.error('Vui lòng tạo khách hàng trước khi đăng ký dịch vụ');
      return;
    }

    setLoading(true);

    // Validate service registration
    const newErrors = validateServiceRegistration();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(t('customer_modal.validation.check_info'));
      setLoading(false);
      return;
    }

    setErrors({});

    const serviceData = {
      branchId: formData.branchId || currentBranch?._id,
      selectedServicePackage: formData.selectedServicePackage || null,
      selectedMembershipPlan: formData.selectedMembershipPlan || null,
      promotionId: formData.promotionId || null,
      duration: formData.duration === 'custom' ? formData.customDuration : formData.duration,
      activationDate: formData.activationDate || null,
      price: formData.price === '' ? 0 : parseInt(String(formData.price), 10) || 0,
      discount: formData.discount === '' ? 0 : parseInt(String(formData.discount), 10) || 0,
      totalAmount: formData.totalAmount === '' ? 0 : parseInt(String(formData.totalAmount), 10) || 0,
      amountPaid: formData.amountPaid === '' ? 0 : parseInt(String(formData.amountPaid), 10) || 0,
      remainingDebt: formData.remainingDebt === '' ? 0 : parseInt(String(formData.remainingDebt), 10) || 0,
      serviceNotes: formData.serviceNotes || null,
      referrerStaffId: formData.referrerStaffId || null,
      paymentMethod: formData.paymentMethod // Add payment method
    };

    const isBankTransfer = formData.paymentMethod === 'BANK_TRANSFER';
    const intendedTransferAmount =
      serviceData.amountPaid > 0
        ? serviceData.amountPaid
        : serviceData.remainingDebt > 0
          ? serviceData.remainingDebt
          : serviceData.totalAmount;

    const payload = { ...serviceData };

    if (isBankTransfer) {
      payload.amountPaid = 0;
      payload.remainingDebt = payload.totalAmount;
    }

    try {
      // First, create/update the service registration contract
      const response = await customerApi.updateServiceRegistration(customer.id, payload);

      // If payment method is BANK_TRANSFER, trigger PayOS flow
      if (isBankTransfer && intendedTransferAmount > 0) {
        // Extract contract from the nested response structure
        const contractData = response.data?.contract as ServiceRegistrationContractPayload | null | undefined;
        const serviceContract = contractData?.serviceContract;
        const membershipContract = contractData?.membershipContract;
        const actualContract = serviceContract ?? membershipContract ?? contractData?.contract;

        const contractId = actualContract?._id;
        const contractType = formData.selectedServicePackage ? 'service' : 'membership';

        if (!contractId) {
          console.error('Contract response:', response.data);
          throw new Error('Contract ID not found in response');
        }

        if (!payload.branchId) {
          throw new Error('Branch ID is required for payment');
        }

        // Create PayOS payment link
        // PayOS requires description to be max 25 characters
        const shortDescription =
          contractType === 'service' ? `DV ${customer.name.substring(0, 20)}` : `TV ${customer.name.substring(0, 20)}`;

        // Use amountPaid if specified, otherwise use full remaining debt
        const paymentAmount = intendedTransferAmount;

        const paymentResponse = await paymentApi.createPayOSPaymentLink({
          customerId: customer.id,
          branchId: payload.branchId,
          contractId: contractId,
          contractType: contractType,
          amount: paymentAmount,
          description: shortDescription.substring(0, 25) // Ensure max 25 chars
        });

        if (paymentResponse.success && paymentResponse.data) {
          // Open PayOS payment modal
          setPayosModal({
            isOpen: true,
            paymentData: paymentResponse.data,
            branchId: payload.branchId,
            contractId: contractId
          });

          toast.success(t('customer_modal.success.service_registration_updated'));
          // Don't close the modal yet - wait for payment completion
        }
      } else {
        // For other payment methods, just show success and close
        toast.success(t('customer_modal.success.service_registration_updated'));
        onCustomerUpdate?.();
        onClose();
      }
    } catch (error) {
      console.error('Error updating service registration:', error);
      toast.error('Có lỗi xảy ra khi cập nhật đăng ký dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  // Handle PayOS payment success
  const handlePaymentSuccess = () => {
    onCustomerUpdate?.();
    // Close both modals
    setPayosModal({ isOpen: false, paymentData: null, branchId: undefined, contractId: undefined });
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="bg-orange-500 text-white rounded-t-lg -m-6 mb-0 p-6">
            <DialogTitle className="text-xl font-semibold">
              {isEditMode ? t('customer_modal.edit_customer') : t('customer_modal.create_customer')}
            </DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'basic'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => {
                setActiveTab('basic');
              }}
            >
              {t('customer_modal.basic_info')}
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'service'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => {
                setActiveTab('service');
              }}
            >
              {t('customer_modal.service_registration')}
            </button>
          </div>

          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 p-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Avatar Upload */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">{t('customer_modal.avatar')}</Label>
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                      {formData.avatar ? (
                        <img
                          src={URL.createObjectURL(formData.avatar)}
                          alt="Avatar"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <User className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        <Upload className="w-4 h-4" />
                        <span>{t('customer_modal.upload')}</span>
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="flex items-center space-x-2">
                        <Camera className="w-4 h-4" />
                        <span>{t('customer_modal.take_photo')}</span>
                      </Button>
                    </div>
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                {/* Grid for form fields */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Customer Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      {t('customer_modal.customer_name')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder={t('customer_modal.customer_name_placeholder')}
                      className={`w-full ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">{t('customer_modal.gender')}</Label>
                    <RadioGroup
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange('gender', value)}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male">{t('customer_modal.male')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female">{t('customer_modal.female')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other">{t('customer_modal.other')}</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Loyal Customer */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="loyal"
                      checked={formData.isLoyalCustomer}
                      onCheckedChange={(checked) => handleInputChange('isLoyalCustomer', checked)}
                    />
                    <Label htmlFor="loyal" className="text-sm font-medium text-gray-700">
                      {t('customer_modal.loyal_customer')}
                    </Label>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      {t('customer_modal.phone')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder={t('customer_modal.phone_placeholder')}
                      className={`w-full ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      {t('customer_modal.email')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder={t('customer_modal.email_placeholder')}
                      type="email"
                      className={`w-full ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      {t('customer_modal.password')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder={t('customer_modal.password_placeholder')}
                        type={showPassword ? 'text' : 'password'}
                        className={`w-full pr-10 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">{t('customer_modal.date_of_birth')}</Label>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal bg-white border-gray-200 hover:bg-gray-50 focus:border-orange-500',
                            !dateOfBirth && 'text-muted-foreground',
                            errors.dateOfBirth && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateOfBirth
                            ? format(dateOfBirth, 'dd/MM/yyyy', { locale: vi })
                            : t('customer_modal.select_birth_date')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg" align="start">
                        <Calendar
                          mode="single"
                          selected={dateOfBirth}
                          onSelect={handleDateOfBirthSelect}
                          autoFocus
                          locale={vi}
                          className="bg-white border-0"
                          fromYear={1950}
                          toYear={new Date().getFullYear()}
                          captionLayout="dropdown"
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.dateOfBirth && <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth}</p>}
                  </div>

                  {/* Branch */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">{t('customer_modal.branch')}</Label>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {currentBranch?.branchName || t('customer_modal.no_branch_selected')}
                        </p>
                        <p className="text-xs text-gray-500">{(currentBranch as BranchWithAddress)?.address}</p>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>

                  {/* Card ID */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      {t('customer_modal.card_id')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.cardId}
                      onChange={(e) => handleInputChange('cardId', e.target.value)}
                      placeholder={t('customer_modal.card_id_placeholder')}
                      className={`w-full ${errors.cardId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors.cardId && <p className="text-sm text-red-500 mt-1">{errors.cardId}</p>}
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">{t('customer_modal.address')}</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder={t('customer_modal.address_placeholder')}
                      className="w-full"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">{t('customer_modal.notes')}</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder={t('customer_modal.notes_placeholder')}
                      className="w-full"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Service Registration Tab */}
          {activeTab === 'service' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 p-6">
              {dataLoading ? (
                <div className="col-span-2 flex items-center justify-center py-12">
                  <div className="text-center">
                    <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
                    <p className="text-gray-600">{t('customer_modal.loading_data')}</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {/* Service Package */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          {t('customer_modal.service_package')}
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={formData.selectedServicePackage}
                            onValueChange={(value) => {
                              if (value === 'none') {
                                clearServicePackageSelection();
                              } else {
                                handleInputChange('selectedServicePackage', value);
                              }
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={t('customer_modal.select_service_package')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <span className="text-gray-500">{t('customer_modal.deselect')}</span>
                              </SelectItem>
                              {packages && packages.length > 0 ? (
                                packages.map((pkg) => (
                                  <SelectItem key={`package-${pkg._id}`} value={`package-${pkg._id}`}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{pkg.name}</span>
                                      <span className="text-xs text-gray-500">
                                        {(
                                          (pkg as PackageWithPricing).finalPrice ||
                                          (pkg as PackageWithPricing).defaultPriceVND ||
                                          0
                                        ).toLocaleString()}{' '}
                                        VNĐ
                                        {(pkg as PackageWithPricing).finalPrice &&
                                          (pkg as PackageWithPricing).finalPrice !==
                                            (pkg as PackageWithPricing).defaultPriceVND && (
                                            <span className="text-orange-500 ml-1">(Branch price)</span>
                                          )}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-packages" disabled>
                                  {t('customer_modal.no_service_packages')}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {formData.selectedServicePackage && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={clearServicePackageSelection}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Membership Plan */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          {t('customer_modal.membership_plan')}
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={formData.selectedMembershipPlan}
                            onValueChange={(value) => {
                              if (value === 'none') {
                                clearMembershipPlanSelection();
                              } else {
                                handleInputChange('selectedMembershipPlan', value);
                              }
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={t('customer_modal.select_membership_plan')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <span className="text-gray-500">{t('customer_modal.deselect')}</span>
                              </SelectItem>
                              {membershipPlans && membershipPlans.length > 0 ? (
                                membershipPlans.map((plan) => (
                                  <SelectItem key={`membership-${plan._id}`} value={`membership-${plan._id}`}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{plan.name}</span>
                                      <span className="text-xs text-gray-500">
                                        {plan.price.toLocaleString()} {plan.currency} ({plan.durationInMonths} tháng)
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-membership" disabled>
                                  {t('customer_modal.no_membership_plans')}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {formData.selectedMembershipPlan && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={clearMembershipPlanSelection}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Promotion */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t('customer_modal.promotion')}</Label>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={formData.promotionId}
                            onValueChange={(value) => {
                              if (value === 'none') {
                                handleInputChange('promotionId', '');
                              } else {
                                handleInputChange('promotionId', value);
                              }
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={t('customer_modal.select_promotion')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <span className="text-gray-500">{t('customer_modal.deselect')}</span>
                              </SelectItem>
                              {promotions && promotions.length > 0 ? (
                                promotions.map((promo) => (
                                  <SelectItem key={promo._id} value={promo._id}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{(promo as PromotionWithDiscount).name}</span>
                                      <span className="text-xs text-gray-500">
                                        Giảm {(promo as PromotionWithDiscount).discountPercentage}%
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-promotions" disabled>
                                  {t('customer_modal.no_promotions')}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {formData.promotionId && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleInputChange('promotionId', '')}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Duration - Only for Service Packages */}
                      {formData.selectedServicePackage && !formData.selectedMembershipPlan && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">{t('customer_modal.duration')}</Label>
                          <div className="flex items-center space-x-2">
                            <Select
                              value={formData.duration}
                              onValueChange={(value) => {
                                if (value === 'none') {
                                  handleInputChange('duration', '');
                                } else {
                                  handleInputChange('duration', value);
                                }
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder={t('customer_modal.select_duration')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  <span className="text-gray-500">{t('customer_modal.deselect')}</span>
                                </SelectItem>
                                {getDurationOptions(t).map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {formData.duration && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleInputChange('duration', '');
                                  handleInputChange('customDuration', '');
                                }}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          {formData.duration === 'custom' && (
                            <div className="mt-2">
                              <Input
                                value={formData.customDuration}
                                onChange={(e) => handleInputChange('customDuration', e.target.value)}
                                placeholder={t('customer_modal.enter_months')}
                                className={`w-full ${errors.customDuration ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                              />
                              {errors.customDuration && (
                                <p className="text-sm text-red-500 mt-1">{errors.customDuration}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Membership Info - Duration is fixed based on plan */}
                      {formData.selectedMembershipPlan && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Thời hạn gói</Label>
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                              Gói membership có thời hạn cố định theo gói đã chọn. Không thể thay đổi thời hạn.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Referrer Staff */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          {t('customer_modal.referrer_staff')}
                          {formData.branchId && (
                            <span className="text-xs text-gray-500 ml-2">
                              (
                              {branches.find((b) => b._id === formData.branchId)?.branchName ||
                                t('customer_modal.branch')}
                              )
                            </span>
                          )}
                        </Label>
                        <Select
                          value={formData.referrerStaffId}
                          onValueChange={(value) => handleInputChange('referrerStaffId', value)}
                          disabled={!formData.branchId}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !formData.branchId
                                  ? t('customer_modal.select_branch_first')
                                  : t('customer_modal.select_referrer_staff')
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {staffList && staffList.length > 0 ? (
                              staffList.map((staff) => (
                                <SelectItem key={staff._id} value={staff._id}>
                                  {(staff as StaffWithDetails).name} - {(staff as StaffWithDetails).jobTitle}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-staff" disabled>
                                {!formData.branchId
                                  ? t('customer_modal.select_branch_first')
                                  : t('customer_modal.no_staff')}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Activation Date */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          {t('customer_modal.activation_date')}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !activationDate && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {activationDate ? (
                                formatDate(activationDate)
                              ) : (
                                <span>{t('customer_modal.select_activation_date')}</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={activationDate}
                              onSelect={setActivationDate}
                              disabled={(date) => date < new Date()}
                              autoFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t('customer_modal.service_notes')}</Label>
                        <Textarea
                          value={formData.serviceNotes}
                          onChange={(e) => handleInputChange('serviceNotes', e.target.value)}
                          placeholder={t('customer_modal.service_notes_placeholder')}
                          className="w-full"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {/* Price */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          {t('customer_modal.price')}{' '}
                          <span className="text-xs text-gray-500">{t('customer_modal.auto_calculated')}</span>
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="text"
                            value={formatCurrency(formData.price)}
                            readOnly
                            placeholder="0"
                            className="flex-1 bg-gray-50 text-gray-700"
                          />
                          <span className="text-sm text-gray-600">VNĐ</span>
                        </div>
                        <p className="text-xs text-gray-500">{t('customer_modal.price_helper')}</p>
                      </div>

                      {/* Discount */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          {t('customer_modal.discount')}{' '}
                          <span className="text-xs text-gray-500">{t('customer_modal.auto_calculated')}</span>
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="text"
                            value={formatCurrency(formData.discount)}
                            readOnly
                            placeholder="0"
                            className="flex-1 bg-gray-50 text-gray-700"
                          />
                          <span className="text-sm text-gray-600">VNĐ</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="bg-green-500 text-white hover:bg-green-600"
                          >
                            <Percent className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">{t('customer_modal.discount_helper')}</p>
                      </div>

                      {/* Total Amount */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t('customer_modal.total_amount')}</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="text"
                            value={formatCurrency(formData.totalAmount)}
                            readOnly
                            className="flex-1 bg-gray-50"
                          />
                          <span className="text-sm text-gray-600">VNĐ</span>
                        </div>
                      </div>

                      {/* Amount Paid */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t('customer_modal.amount_paid')}</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="text"
                            value={formatCurrency(formData.amountPaid)}
                            onChange={(e) => {
                              const parsed = parseCurrency(e.target.value);
                              handleInputChange('amountPaid', parsed);
                            }}
                            placeholder={t('customer_modal.enter_amount')}
                            className={`w-32 ${errors.amountPaid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${formData.selectedMembershipPlan ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            disabled={!!formData.selectedMembershipPlan}
                            readOnly={!!formData.selectedMembershipPlan}
                          />
                          <Select
                            value={formData.paymentMethod}
                            onValueChange={(value) => handleInputChange('paymentMethod', value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CASH">{t('customer_modal.cash')}</SelectItem>
                              <SelectItem value="CREDIT_CARD">{t('customer_modal.card')}</SelectItem>
                              <SelectItem value="BANK_TRANSFER">{t('customer_modal.transfer')}</SelectItem>
                              <SelectItem value="EWALLET">{t('customer_modal.ewallet')}</SelectItem>
                              <SelectItem value="OTHER">{t('customer_modal.other')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.selectedMembershipPlan && (
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-xs text-blue-800">
                              Membership yêu cầu thanh toán đủ 100% tại thời điểm đăng ký. Số tiền trả tự động = Tổng
                              tiền.
                            </p>
                          </div>
                        )}
                        {errors.amountPaid && <p className="text-sm text-red-500 mt-1">{errors.amountPaid}</p>}
                      </div>

                      {/* Remaining Debt */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          {t('customer_modal.remaining_debt')}
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="text"
                            value={formatCurrency(formData.remainingDebt)}
                            readOnly
                            className="flex-1 bg-gray-50"
                          />
                          <span className="text-sm text-gray-600">VNĐ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end space-x-3 p-6 bg-gray-50 rounded-b-lg -m-6 mt-0">
            {/* Show different buttons based on active tab */}
            {activeTab === 'basic' ? (
              <Button
                onClick={handleSubmitBasicInfo}
                disabled={loading}
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                {loading ? <Clock className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {isEditMode ? t('customer_modal.update_basic_info') : t('customer_modal.create')}
              </Button>
            ) : (
              <Button
                onClick={handleSubmitServiceRegistration}
                disabled={loading || !isEditMode}
                className="bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-400"
                title={!isEditMode ? 'Vui lòng tạo khách hàng trước' : ''}
              >
                {loading ? <Clock className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {t('customer_modal.update_service_registration')}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-gray-500 text-white hover:bg-gray-600 border-gray-500"
            >
              {t('customer_modal.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PayOS Payment Modal */}
      {payosModal.isOpen && payosModal.paymentData && customer && payosModal.branchId && payosModal.contractId && (
        <PayOSPaymentModal
          isOpen={payosModal.isOpen}
          onClose={() =>
            setPayosModal({ isOpen: false, paymentData: null, branchId: undefined, contractId: undefined })
          }
          paymentData={payosModal.paymentData}
          onPaymentSuccess={handlePaymentSuccess}
          customerId={customer.id!}
          branchId={payosModal.branchId}
          contractId={payosModal.contractId}
          contractType={formData.selectedServicePackage ? 'service' : 'membership'}
        />
      )}
    </>
  );
};
