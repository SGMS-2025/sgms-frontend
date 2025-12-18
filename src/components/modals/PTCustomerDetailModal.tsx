import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetFooter } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/customer-progress';
import { AlertTriangle, Calendar, Mail, Phone, Plus, Save, TrendingUp, Users, X } from 'lucide-react';
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
  const hasSessions = customer.package.totalSessions > 0;

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
      <SheetContent className="w-full sm:max-w-lg p-0 bg-background overflow-hidden">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-border bg-gradient-to-b from-primary/10 via-background to-background">
            <div className="px-5 pt-5 pb-4 pr-12">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <Avatar className="h-14 w-14 ring-2 ring-border shadow-sm">
                    <AvatarImage src={customer.avatar || '/placeholder.svg'} alt={customer.fullName} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-lg font-semibold">
                      {customer.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background shadow-sm ${
                      urgency === 'active'
                        ? 'bg-green-500'
                        : urgency === 'urgent'
                          ? 'bg-orange-500'
                          : urgency === 'expired'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-lg font-semibold text-foreground leading-tight truncate">
                        {customer.fullName}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <a
                          href={`tel:${customer.phone}`}
                          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span className="font-medium">{customer.phone}</span>
                        </a>
                        {customer.email && (
                          <a
                            href={`mailto:${customer.email}`}
                            className="inline-flex items-center gap-1 hover:text-foreground transition-colors min-w-0"
                          >
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{customer.email}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">{getStatusBadge()}</div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-medium">
                      {customer.package.name}
                    </Badge>
                    {customer.contractType === 'MEMBERSHIP_KPI' && (
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-xs font-medium">
                        {t('pt_customer.kpi_badge')}
                      </Badge>
                    )}
                    {getPaymentStatusBadge()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Contract Summary */}
            <div className="rounded-2xl border border-border bg-card/50 p-4">
              {hasSessions ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-background/60 border border-border/60 p-3">
                    <div className="text-xs text-muted-foreground">{t('pt_customer_detail.sessions_remaining')}</div>
                    <div className="mt-1 text-lg font-semibold text-foreground">
                      {customer.package.sessionsRemaining}{' '}
                      <span className="text-sm font-medium text-muted-foreground">
                        {t('pt_customer_detail.sessions_left')}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-background/60 border border-border/60 p-3">
                    <div className="text-xs text-muted-foreground">{t('pt_customer_detail.sessions_used')}</div>
                    <div className="mt-1 text-lg font-semibold text-foreground">
                      {customer.package.sessionsUsed}{' '}
                      <span className="text-sm font-medium text-muted-foreground">
                        {t('pt_customer_detail.sessions_left')}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-background/60 border border-border/60 p-3">
                    <div className="text-xs text-muted-foreground">{t('pt_customer_detail.total_sessions')}</div>
                    <div className="mt-1 text-lg font-semibold text-foreground">
                      {customer.package.totalSessions}{' '}
                      <span className="text-sm font-medium text-muted-foreground">
                        {t('pt_customer_detail.sessions_left')}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-xl bg-background/60 border border-border/60 p-3">
                    <div className="text-xs text-muted-foreground">{t('pt_customer_detail.start_date')}</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {formatDate(customer.package.startDate)}
                    </div>
                  </div>
                </div>
              )}

              {hasSessions && (
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 p-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">{t('pt_customer_detail.start_date')}</div>
                      <div className="text-sm font-medium text-foreground truncate">
                        {formatDate(customer.package.startDate)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Section */}
            <div className="rounded-2xl bg-card p-4 border border-border shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {t('pt_customer_detail.training_progress')}
                  </h3>
                </div>
                <div className="text-sm font-semibold text-foreground">{Math.round(progress)}%</div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  {hasSessions ? (
                    <span className="text-foreground">
                      {customer.package.sessionsUsed}/{customer.package.totalSessions}{' '}
                      {t('pt_customer_detail.sessions_completed')}
                    </span>
                  ) : (
                    <span className="text-foreground">
                      {t('pt_customer_detail.expires_on')} {formatDate(customer.package.endDate)}
                    </span>
                  )}
                </div>

                <Progress value={progress} className="h-2.5 w-full bg-gray-200" indicatorClassName="bg-orange-500" />

                {hasSessions && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {t('pt_customer_detail.sessions_remaining')} {customer.package.sessionsRemaining}{' '}
                      {t('pt_customer_detail.sessions_left')}
                    </span>
                    <span>
                      {t('pt_customer_detail.expires_on')} {formatDate(customer.package.endDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Information */}
            <div className="rounded-2xl bg-card p-4 border border-border shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{t('pt_customer_detail.medical_info')}</h3>
                </div>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="h-9 text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {t('pt_customer_detail.edit')}
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
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
                        className="h-10 text-sm rounded-xl"
                      />
                      <Button type="button" size="sm" onClick={handleAddAllergy} className="h-10 px-3 rounded-xl">
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
                        className="h-10 text-sm rounded-xl"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddMedicalCondition}
                        className="h-10 px-3 rounded-xl"
                      >
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

                  <div className="flex gap-2 pt-1">
                    <Button onClick={handleSave} disabled={isSaving} className="flex-1 h-10 text-sm rounded-xl">
                      <Save className="w-4 h-4 mr-1" />
                      {isSaving ? t('pt_customer_detail.saving') : t('pt_customer_detail.save')}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      disabled={isSaving}
                      className="flex-1 h-10 text-sm rounded-xl"
                    >
                      {t('pt_customer_detail.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
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
          </div>

          {/* Actions */}
          <SheetFooter className="border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex justify-center">
              <Button
                onClick={handleViewProgress}
                className="w-full max-w-sm h-11 rounded-xl bg-[#F05A29] text-white hover:bg-[#E04A1F] shadow-sm text-sm"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                {t('pt_customer_detail.training_history')}
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
};
