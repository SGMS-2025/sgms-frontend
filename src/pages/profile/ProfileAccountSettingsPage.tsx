import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, Camera, Shield, FileText, Eye, Download } from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { userApi } from '@/services/api/userApi';
import { useAuthActions, useAuthState } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { contractDocumentApi } from '@/services/api/contractDocumentApi';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import type { ContractDocument } from '@/types/api/ContractDocument';
import EmbeddedDocumentViewer from '@/components/contracts/EmbeddedDocumentViewer';

const ProfileAccountSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const {
    userData,
    profile,
    isUploading,
    setIsUploading,
    setUserData,
    formData,
    dateInputValue,
    validationErrors,
    handleFieldChange,
    handleDateChange,
    handleSaveProfile,
    handleCancelEdit,
    handleDeleteAvatar,
    isLoading,
    isSaving,
    setIsEditing,
    isEditing,
    passwordForm,
    setPasswordForm,
    isChangingPassword,
    handlePasswordChange
  } = useProfileData();
  const { updateUser } = useAuthActions();
  const authState = useAuthState();
  const currentUser = authState.user; // Get user from state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeNav, setActiveNav] = useState<'edit-profile' | 'security' | 'contracts'>('edit-profile');

  // Contracts state
  const [contracts, setContracts] = useState<ContractDocument[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [embeddedViewerOpen, setEmbeddedViewerOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractDocument | null>(null);
  const [embeddedIframeUrl, setEmbeddedIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    setIsEditing(true);
  }, [setIsEditing]);

  // Fetch owner's signed subscription contracts
  const fetchContracts = useCallback(async () => {
    if (!currentUser?._id) {
      return;
    }

    setLoadingContracts(true);
    try {
      const ownerUserId = (() => {
        const userId = currentUser._id;
        return typeof userId === 'string' ? userId : String(userId);
      })();

      // Fetch subscription history to get subscription IDs
      const subscriptionHistory = await subscriptionApi.getSubscriptionHistory({ includeExpired: true, limit: 100 });
      const subscriptionIds =
        subscriptionHistory.success && subscriptionHistory.data
          ? subscriptionHistory.data.map((sub) => {
              const subId = sub._id;
              return typeof subId === 'string' ? subId : String(subId);
            })
          : [];

      // Fetch all subscription contracts
      let result = await contractDocumentApi.listDocuments({
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        status: 'all',
        type: 'contracts',
        tags: ['subscription']
      });

      // If no results, try without tags filter
      if (!result.success || !result.data || (Array.isArray(result.data) && result.data.length === 0)) {
        result = await contractDocumentApi.listDocuments({
          page: 1,
          limit: 100,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          status: 'all',
          type: 'contracts'
        });
      }

      if (result.success && result.data) {
        const documents = Array.isArray(result.data) ? result.data : [];

        // Filter contracts that belong to owner and are signed
        const ownerContracts = documents.filter((doc: ContractDocument) => {
          // Check if it's a subscription contract:
          // 1. Has subscription tag, OR
          // 2. Has contractId (subscription contracts have contractId = subscriptionId), OR
          // 3. customerId is null (subscription contracts don't have customerId)
          const hasSubscriptionTag = doc.tags && doc.tags.some((tag: string) => tag.toLowerCase() === 'subscription');
          const hasContractId = !!doc.contractId;
          const noCustomerId = !doc.customerId;

          const isSubscriptionContract = hasSubscriptionTag || (hasContractId && noCustomerId);

          if (!isSubscriptionContract) {
            return false;
          }

          // Check if contract belongs to owner:
          // 1. createdBy matches owner userId, OR
          // 2. contractId matches one of owner's subscription IDs
          const docCreatedBy = doc.createdBy
            ? typeof doc.createdBy === 'string'
              ? doc.createdBy
              : typeof doc.createdBy === 'object' && doc.createdBy !== null && '_id' in doc.createdBy
                ? (() => {
                    const createdById = (doc.createdBy as { _id: unknown })._id;
                    return typeof createdById === 'string' ? createdById : String(createdById);
                  })()
                : String(doc.createdBy)
            : null;

          const docContractId = doc.contractId
            ? typeof doc.contractId === 'string'
              ? doc.contractId
              : String(doc.contractId)
            : null;

          const belongsToOwner =
            docCreatedBy === ownerUserId || (docContractId && subscriptionIds.includes(docContractId));

          if (!belongsToOwner) {
            return false;
          }

          // Check if contract is signed:
          // 1. status === 'signed', OR
          // 2. all signers have signed (status includes 'signed', 'completed', 'fulfilled')
          const isSigned =
            doc.status === 'signed' ||
            (doc.signers &&
              doc.signers.length > 0 &&
              doc.signers.every((s) => {
                const signerStatus = (s.status || '').toLowerCase();
                const signer = s as { status?: string; signed?: boolean; is_signed?: boolean; completed?: boolean };
                return (
                  signerStatus === 'signed' ||
                  signerStatus === 'completed' ||
                  signerStatus === 'fulfilled' ||
                  signerStatus === 'signed_completed' ||
                  signerStatus === 'completed_signed' ||
                  signer.signed === true ||
                  signer.is_signed === true ||
                  signer.completed === true
                );
              }));

          return isSigned;
        });

        setContracts(ownerContracts);
      } else {
        setContracts([]);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      toast.error(t('settings.error.load_contracts'));
      setContracts([]);
    } finally {
      setLoadingContracts(false);
    }
  }, [currentUser?._id]);

  useEffect(() => {
    if (activeNav === 'contracts') {
      fetchContracts();
    }
  }, [activeNav, fetchContracts]);

  // Handle view contract
  const handleViewContract = async (contract: ContractDocument) => {
    try {
      const response = await contractDocumentApi.createEmbeddedView(contract._id, {
        redirectUrl: `${window.location.origin}/signnow/callback`
      });

      if (response.success && response.data?.link) {
        setSelectedContract(contract);
        setEmbeddedIframeUrl(response.data.link);
        setEmbeddedViewerOpen(true);
      } else {
        toast.error(t('settings.error.open_contract'));
      }
    } catch (error) {
      console.error('Failed to open contract:', error);
      toast.error('Không thể mở hợp đồng');
    }
  };

  // Handle download contract
  const handleDownloadContract = async (contract: ContractDocument) => {
    try {
      const blob = await contractDocumentApi.downloadDocument(contract._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contract.title || 'contract'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('settings.success.download_contract'));
    } catch (error) {
      console.error('Failed to download contract:', error);
      toast.error(t('settings.error.download_contract'));
    }
  };

  const initials = useMemo(() => {
    if (userData.name) {
      return userData.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return profile?.username?.slice(0, 2)?.toUpperCase() || 'GM';
  }, [userData.name, profile?.username]);

  const handleAvatarUpload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('settings.error.select_image'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('settings.error.image_too_large'));
      return;
    }

    setIsUploading(true);
    const response = await userApi.uploadAvatar(file);
    if (response.success && response.data) {
      setUserData((prev) => ({ ...prev, avatar: response.data.avatar?.url || '' }));
      updateUser(response.data);
      toast.success(t('settings.success.update_avatar'));
    }
    setIsUploading(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f4f5fb]">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          <span>{t('settings.loading.profile')}</span>
        </div>
      </div>
    );
  }

  const navItems: { key: 'edit-profile' | 'security' | 'contracts'; label: string }[] = [
    { key: 'edit-profile', label: t('settings.nav.edit_profile') },
    { key: 'security', label: t('settings.nav.security') },
    { key: 'contracts', label: t('settings.nav.contracts') }
  ];

  const handleNavClick = (key: 'edit-profile' | 'security' | 'contracts') => {
    setActiveNav(key);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h1 className="text-lg font-semibold text-gray-900">{t('settings.title')}</h1>
            <p className="text-sm text-gray-500">{t('settings.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
            <div className="border-r border-gray-100 bg-[#fafafa] p-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavClick(item.key)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    activeNav === item.key
                      ? 'bg-white shadow-sm border border-gray-200 text-gray-900'
                      : 'text-gray-600 hover:bg-white hover:border hover:border-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              <div className="max-w-3xl">
                {activeNav === 'edit-profile' && (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">{t('settings.profile.section')}</p>
                        <h2 className="text-xl font-semibold text-gray-900">{t('settings.profile.title')}</h2>
                      </div>
                      <Badge variant="outline" className="text-xs border-gray-200 text-gray-700 bg-white">
                        {isEditing ? t('settings.profile.editing') : t('settings.profile.view_only')}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                      />
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={userData.avatar} alt={userData.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{userData.name || profile?.username}</p>
                          <p className="text-xs text-gray-500">{profile?.username}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 rounded-full border-gray-200 text-gray-700"
                          onClick={handleAvatarClick}
                          disabled={isUploading}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          {isUploading ? t('settings.profile.uploading') : t('settings.profile.change_avatar')}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">{t('settings.profile.full_name')}</Label>
                        <Input
                          id="fullName"
                          className="rounded-full border-gray-200 h-11"
                          value={formData.fullName || ''}
                          onChange={(e) => handleFieldChange('fullName', e.target.value)}
                          placeholder={t('settings.profile.full_name_placeholder')}
                          disabled={!isEditing}
                          aria-invalid={Boolean(validationErrors.fullName)}
                        />
                        {validationErrors.fullName && (
                          <p className="text-sm text-red-600">{validationErrors.fullName}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>{t('settings.profile.email')}</Label>
                          <Input
                            className="rounded-full border-gray-200 h-11 bg-gray-50"
                            value={userData.email}
                            disabled
                          />
                          <p className="text-xs text-gray-400 mt-1">{t('settings.profile.email_description')}</p>
                        </div>
                        <div>
                          <Label>{t('settings.profile.username')}</Label>
                          <Input
                            className="rounded-full border-gray-200 h-11 bg-gray-50"
                            value={profile?.username || ''}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">{t('settings.profile.phone')}</Label>
                          <Input
                            id="phone"
                            className="rounded-full border-gray-200 h-11"
                            value={formData.phoneNumber || ''}
                            onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                            placeholder={t('settings.profile.phone_placeholder')}
                            disabled={!isEditing}
                            aria-invalid={Boolean(validationErrors.phoneNumber)}
                          />
                          {validationErrors.phoneNumber && (
                            <p className="text-sm text-red-600">{validationErrors.phoneNumber}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="dateOfBirth">{t('settings.profile.date_of_birth')}</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            className="rounded-full border-gray-200 h-11"
                            value={dateInputValue}
                            onChange={(e) => handleDateChange(e.target.value)}
                            disabled={!isEditing}
                            aria-invalid={Boolean(validationErrors.dateOfBirth)}
                          />
                          {validationErrors.dateOfBirth && (
                            <p className="text-sm text-red-600">{validationErrors.dateOfBirth}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>{t('settings.profile.gender')}</Label>
                          <div className="flex gap-2 mt-2">
                            {['MALE', 'FEMALE', 'OTHER'].map((gender) => (
                              <Button
                                key={gender}
                                type="button"
                                variant={formData.gender === gender ? 'default' : 'outline'}
                                className={`rounded-full ${
                                  formData.gender === gender
                                    ? 'bg-gray-900 hover:bg-black text-white border-gray-900'
                                    : 'border-gray-200 text-gray-700'
                                }`}
                                onClick={() => handleFieldChange('gender', gender)}
                                disabled={!isEditing}
                              >
                                {gender === 'MALE'
                                  ? t('settings.profile.gender_male')
                                  : gender === 'FEMALE'
                                    ? t('settings.profile.gender_female')
                                    : t('settings.profile.gender_other')}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="address">{t('settings.profile.address')}</Label>
                          <Input
                            id="address"
                            className="rounded-full border-gray-200 h-11"
                            value={formData.address || ''}
                            onChange={(e) => handleFieldChange('address', e.target.value)}
                            placeholder={t('settings.profile.address_placeholder')}
                            disabled={!isEditing}
                            aria-invalid={Boolean(validationErrors.address)}
                          />
                          {validationErrors.address && (
                            <p className="text-sm text-red-600">{validationErrors.address}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="bio">{t('settings.profile.bio')}</Label>
                        <Textarea
                          id="bio"
                          rows={4}
                          className="rounded-2xl border-gray-200"
                          value={formData.bio || ''}
                          onChange={(e) => handleFieldChange('bio', e.target.value)}
                          placeholder={t('settings.profile.bio_placeholder')}
                          disabled={!isEditing}
                          aria-invalid={Boolean(validationErrors.bio)}
                        />
                        {validationErrors.bio && <p className="text-sm text-red-600">{validationErrors.bio}</p>}
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <Button variant="outline" className="rounded-full border-gray-200" onClick={handleCancelEdit}>
                          {t('common.cancel')}
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="rounded-full bg-gray-900 hover:bg-black text-white"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {t('common.saving')}
                            </>
                          ) : (
                            t('settings.profile.save_changes')
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {activeNav === 'security' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          {t('settings.security.section')}
                        </p>
                        <h2 className="text-xl font-semibold text-gray-900">{t('settings.security.title')}</h2>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white/60 p-5 space-y-4">
                      <form className="space-y-3" onSubmit={handlePasswordChange}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="currentPassword">{t('settings.security.current_password')}</Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              className="rounded-full border-gray-200 h-11"
                              value={passwordForm.currentPassword}
                              onChange={(e) =>
                                setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                              }
                              placeholder={t('settings.security.current_password_placeholder')}
                            />
                          </div>
                          <div>
                            <Label htmlFor="newPassword">{t('settings.security.new_password')}</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              className="rounded-full border-gray-200 h-11"
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                              placeholder={t('settings.security.new_password_placeholder')}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="confirmPassword">{t('settings.security.confirm_password')}</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              className="rounded-full border-gray-200 h-11"
                              value={passwordForm.confirmNewPassword}
                              onChange={(e) =>
                                setPasswordForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))
                              }
                              placeholder={t('settings.security.confirm_password_placeholder')}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="submit"
                              disabled={isChangingPassword}
                              className="rounded-full bg-gray-900 hover:bg-black text-white w-full"
                            >
                              {isChangingPassword ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  {t('settings.security.updating')}
                                </>
                              ) : (
                                <>
                                  <Shield className="w-4 h-4 mr-2" />
                                  {t('settings.security.change_password')}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {activeNav === 'contracts' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          {t('settings.contracts.section')}
                        </p>
                        <h2 className="text-xl font-semibold text-gray-900">{t('settings.contracts.title')}</h2>
                        <p className="text-sm text-gray-500 mt-1">{t('settings.contracts.description')}</p>
                      </div>
                    </div>

                    {loadingContracts ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-3 text-gray-600">
                          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                          <span>{t('settings.contracts.loading')}</span>
                        </div>
                      </div>
                    ) : contracts.length === 0 ? (
                      <div className="rounded-2xl border border-gray-200 bg-white/60 p-8 text-center">
                        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600">{t('settings.contracts.empty')}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {contracts.map((contract) => (
                          <div
                            key={contract._id}
                            className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">{contract.title}</h3>
                                <p className="text-sm text-gray-500 mb-2">
                                  {contract.description || t('settings.contracts.default_description')}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>
                                    {contract.createdAt
                                      ? new Date(contract.createdAt).toLocaleDateString('vi-VN', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })
                                      : '-'}
                                  </span>
                                  {contract.fileSize && (
                                    <>
                                      <span>•</span>
                                      <span>{(contract.fileSize / 1024).toFixed(2)} KB</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full border-gray-200"
                                  onClick={() => handleViewContract(contract)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  {t('common.view')}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full border-gray-200"
                                  onClick={() => handleDownloadContract(contract)}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  {t('common.download')}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-800">
              {t('settings.dialog.delete_avatar_title')}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-gray-600 px-4">{t('settings.dialog.delete_avatar_message')}</p>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAvatar}
              className="bg-red-500 hover:bg-red-600 rounded-lg flex items-center gap-2"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
              {isUploading ? t('settings.dialog.deleting') : t('settings.dialog.delete_avatar')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Embedded Document Viewer */}
      {embeddedViewerOpen && selectedContract && (
        <EmbeddedDocumentViewer
          open={embeddedViewerOpen}
          onOpenChange={(open) => {
            setEmbeddedViewerOpen(open);
            if (!open) {
              setEmbeddedIframeUrl(null);
              setSelectedContract(null);
            }
          }}
          documentId={selectedContract._id}
          iframeUrl={embeddedIframeUrl}
          documentTitle={selectedContract.title}
          mode="view"
        />
      )}
    </div>
  );
};

export default ProfileAccountSettingsPage;
