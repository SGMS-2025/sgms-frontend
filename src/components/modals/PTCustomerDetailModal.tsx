import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/customer-progress';
import { Calendar, MessageSquare, Users, TrendingUp, AlertTriangle, X, Plus, Save } from 'lucide-react';
import type { PTCustomerDetailModalProps } from '@/types/components/Customer';
import { usePTCustomerUtils } from '@/hooks/usePTCustomer';
import { useTranslation } from 'react-i18next';
import { customerApi } from '@/services/api/customerApi';
import { toast } from 'sonner';

export const PTCustomerDetailModal: React.FC<PTCustomerDetailModalProps> = ({ isOpen, onClose, customer }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatDate, calculateProgress, getUrgencyLevel } = usePTCustomerUtils();

  const [isEditing, setIsEditing] = useState(false);
  const [allergies, setAllergies] = useState<string[]>(customer?.allergies || []);
  const [medicalConditions, setMedicalConditions] = useState<string[]>(customer?.medicalConditions || []);
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedicalCondition, setNewMedicalCondition] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when customer changes
  React.useEffect(() => {
    if (customer) {
      setAllergies(customer.allergies || []);
      setMedicalConditions(customer.medicalConditions || []);
      setIsEditing(false);
      setNewAllergy('');
      setNewMedicalCondition('');
    }
  }, [customer]);

  if (!customer) return null;

  const urgency = getUrgencyLevel(customer);
  const progress = calculateProgress(customer);

  const handleViewProgress = () => {
    navigate(`/manage/pt/clients/${customer._id}/progress`, {
      state: {
        serviceContractId: customer.package.contractId,
        customerName: customer.fullName
      }
    });
    onClose(); // Close the modal when navigating
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleAddMedicalCondition = () => {
    if (newMedicalCondition.trim() && !medicalConditions.includes(newMedicalCondition.trim())) {
      setMedicalConditions([...medicalConditions, newMedicalCondition.trim()]);
      setNewMedicalCondition('');
    }
  };

  const handleRemoveMedicalCondition = (index: number) => {
    setMedicalConditions(medicalConditions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await customerApi.updateCustomer(customer._id, {
        allergies,
        medicalConditions
      });
      toast.success(t('pt_customer_detail.save_success'), {
        description: t('pt_customer_detail.medical_info_updated')
      });
      setIsEditing(false);
    } catch (_error) {
      toast.error(t('pt_customer_detail.save_error'), {
        description: t('pt_customer_detail.save_error_message')
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setAllergies(customer.allergies || []);
    setMedicalConditions(customer.medicalConditions || []);
    setNewAllergy('');
    setNewMedicalCondition('');
    setIsEditing(false);
  };

  const getStatusBadge = () => {
    const variants = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: t('pt_customer_detail.status_active') },
      urgent: {
        bg: 'bg-[#F05A29] bg-opacity-10',
        text: 'text-[#F05A29]',
        label: t('pt_customer_detail.status_urgent')
      },
      pending: { bg: 'bg-gray-100', text: 'text-gray-700', label: t('pt_customer_detail.status_pending') },
      expired: { bg: 'bg-red-100', text: 'text-red-700', label: t('pt_customer_detail.status_expired') }
    };

    const variant = variants[urgency];
    return <Badge className={`${variant.bg} ${variant.text} border-0 font-medium`}>{variant.label}</Badge>;
  };

  const getPaymentStatusBadge = () => {
    const variants = {
      PAID: { bg: 'bg-green-100', text: 'text-green-700', label: t('pt_customer_detail.payment_paid') },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: t('pt_customer_detail.payment_pending') },
      PARTIAL: { bg: 'bg-orange-100', text: 'text-orange-700', label: t('pt_customer_detail.payment_partial') }
    };

    const variant = variants[customer.package.paymentStatus];
    return <Badge className={`${variant.bg} ${variant.text} border-0 font-medium`}>{variant.label}</Badge>;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-background">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="relative">
              <Avatar className="h-16 w-16 ring-2 ring-border shadow-md">
                <AvatarImage src={customer.avatar || '/placeholder.svg'} alt={customer.fullName} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xl font-semibold">
                  {customer.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {/* Status indicator */}
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background shadow-sm flex items-center justify-center ${
                  urgency === 'active'
                    ? 'bg-green-500'
                    : urgency === 'urgent'
                      ? 'bg-orange-500'
                      : urgency === 'expired'
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                }`}
              >
                <div className="w-1 h-1 rounded-full bg-white"></div>
              </div>
            </div>
            <div className="flex-1">
              <SheetTitle className="text-xl font-semibold text-foreground mb-1">{customer.fullName}</SheetTitle>
              <SheetDescription className="text-muted-foreground font-medium text-sm">
                {customer.phone}
              </SheetDescription>
              <div className="mt-2">{getStatusBadge()}</div>
            </div>
          </div>

          {/* Contract Info - Compact inline */}
          <div className="bg-card/50 rounded-lg p-3 border border-border/50">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pt_customer_detail.package_label')}</span>
                <span className="font-medium text-foreground">{customer.package.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pt_customer_detail.total_sessions')}</span>
                <span className="font-medium text-foreground">
                  {customer.package.totalSessions} {t('pt_customer_detail.sessions_left')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pt_customer_detail.sessions_used')}</span>
                <span className="font-medium text-foreground">
                  {customer.package.sessionsUsed} {t('pt_customer_detail.sessions_left')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pt_customer_detail.sessions_remaining')}</span>
                <span className="font-bold text-primary">
                  {customer.package.sessionsRemaining} {t('pt_customer_detail.sessions_left')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pt_customer_detail.start_date')}</span>
                <span className="font-medium text-foreground">{formatDate(customer.package.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pt_customer_detail.end_date')}</span>
                <span className="font-medium text-foreground">{formatDate(customer.package.endDate)}</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="text-muted-foreground">{t('pt_customer_detail.payment_status')}</span>
                {getPaymentStatusBadge()}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Progress Section */}
        <div className="mb-6">
          <div className="rounded-xl bg-card p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                <Users className="w-3 h-3 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{t('pt_customer_detail.training_progress')}</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {customer.package.sessionsUsed}/{customer.package.totalSessions}{' '}
                  {t('pt_customer_detail.sessions_completed')}
                </span>
                <span className="font-medium text-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 w-full bg-gray-200" indicatorClassName="bg-orange-500" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {t('pt_customer_detail.sessions_remaining')} {customer.package.sessionsRemaining}{' '}
                  {t('pt_customer_detail.sessions_left')}
                </span>
                <span>
                  {t('pt_customer_detail.expires_on')} {formatDate(customer.package.endDate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <div className="rounded-xl bg-card p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                <MessageSquare className="w-3 h-3 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{t('pt_customer_detail.contact_info')}</h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-muted-foreground font-medium text-sm">
                  {t('pt_customer_detail.phone_number')}
                </span>
                <span className="font-semibold text-foreground text-sm">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground font-medium text-sm">{t('pt_customer_detail.email')}</span>
                  <span className="font-semibold text-foreground text-sm">{customer.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Medical Information */}
          <div className="rounded-xl bg-card p-4 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{t('pt_customer_detail.medical_info')}</h3>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="h-8 text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  {t('pt_customer_detail.edit')}
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                {/* Allergies */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('pt_customer_detail.allergies')}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAllergy();
                        }
                      }}
                      placeholder={t('pt_customer_detail.add_allergy_placeholder')}
                      className="h-9 text-sm"
                    />
                    <Button type="button" size="sm" onClick={handleAddAllergy} className="h-9 px-3">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {allergies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {allergies.map((allergy, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                          {allergy}
                          <button
                            onClick={() => handleRemoveAllergy(index)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Medical Conditions */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('pt_customer_detail.medical_conditions')}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newMedicalCondition}
                      onChange={(e) => setNewMedicalCondition(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMedicalCondition();
                        }
                      }}
                      placeholder={t('pt_customer_detail.add_medical_condition_placeholder')}
                      className="h-9 text-sm"
                    />
                    <Button type="button" size="sm" onClick={handleAddMedicalCondition} className="h-9 px-3">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {medicalConditions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {medicalConditions.map((condition, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                          {condition}
                          <button
                            onClick={() => handleRemoveMedicalCondition(index)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1 h-9 text-sm">
                    <Save className="w-4 h-4 mr-1" />
                    {isSaving ? t('pt_customer_detail.saving') : t('pt_customer_detail.save')}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" disabled={isSaving} className="flex-1 h-9 text-sm">
                    {t('pt_customer_detail.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Display Allergies */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                    {t('pt_customer_detail.allergies')}
                  </Label>
                  {allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {allergies.map((allergy, index) => (
                        <Badge key={index} variant="secondary" className="px-2 py-1">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">{t('pt_customer_detail.no_allergies')}</p>
                  )}
                </div>

                {/* Display Medical Conditions */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                    {t('pt_customer_detail.medical_conditions')}
                  </Label>
                  {medicalConditions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {medicalConditions.map((condition, index) => (
                        <Badge key={index} variant="secondary" className="px-2 py-1">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      {t('pt_customer_detail.no_medical_conditions')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-sm">
              <Calendar className="mr-2 h-4 w-4" />
              {t('pt_customer_detail.view_schedule')}
            </Button>
            <Button
              onClick={handleViewProgress}
              className="w-full h-10 rounded-xl bg-[#F05A29] text-white hover:bg-[#E04A1F] shadow-sm text-sm"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              {t('pt_customer_detail.training_history')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
