import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { authApi } from '@/services/api/authApi';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Link2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { userApi } from '@/services/api/userApi';
import { useAuthActions } from '@/hooks/useAuth';

export function ZaloAccountSection() {
  const { t } = useTranslation();
  const { state } = useAuth();
  const { updateUser } = useAuthActions();
  const [isLinking, setIsLinking] = useState(false);
  const [hasZaloLinked, setHasZaloLinked] = useState(false);

  useEffect(() => {
    // Check if user has Zalo linked from state
    if (state.user?.zaloUserId) {
      setHasZaloLinked(true);
    }

    // Check URL params for callback status
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const source = params.get('source');
    const message = params.get('message');

    if (source === 'zalo-link') {
      if (status === 'success') {
        toast.success(message || 'Zalo account linked successfully!');
        setHasZaloLinked(true);

        // Refresh user data
        refreshUserProfile();

        // Clean URL
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      } else if (status === 'error') {
        const error = params.get('error');
        toast.error(message || error || 'Failed to link Zalo account');

        // Clean URL
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      }
    }
  }, [state.user]);

  const refreshUserProfile = async () => {
    try {
      const response = await userApi.getProfile();
      if (response.success && response.data) {
        updateUser(response.data);
        setHasZaloLinked(!!response.data.zaloUserId);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const handleLinkZalo = () => {
    try {
      setIsLinking(true);
      authApi.linkZaloAccount();
      // User will be redirected to Zalo OAuth
    } catch {
      toast.error('Failed to initiate Zalo linking');
      setIsLinking(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
        <h1 className="text-3xl font-bold text-orange-500 mb-2 leading-tight">{t('profile.zalo_account')}</h1>
        <p className="text-gray-600 text-base">
          {hasZaloLinked ? t('profile.zalo_linked_description') : t('profile.zalo_link_description')}
        </p>
      </div>

      {/* Zalo Status Card */}
      <Card className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${hasZaloLinked ? 'bg-green-100' : 'bg-gray-100'}`}>
              {hasZaloLinked ? (
                <Check className="h-6 w-6 text-green-600" />
              ) : (
                <Link2 className="h-6 w-6 text-gray-600" />
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">
                {hasZaloLinked ? t('profile.zalo_status_linked') : t('profile.zalo_status_not_linked')}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {hasZaloLinked ? t('profile.zalo_benefits_linked') : t('profile.zalo_benefits_not_linked')}
              </p>

              {!hasZaloLinked && (
                <>
                  <div className="flex items-start gap-2 mb-4 text-sm text-gray-600">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{t('profile.zalo_link_note')}</span>
                  </div>

                  <Button
                    onClick={handleLinkZalo}
                    disabled={isLinking}
                    className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md transition-all duration-200"
                  >
                    {isLinking ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {t('common.processing')}
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-2" />
                        {t('profile.link_zalo_account')}
                      </>
                    )}
                  </Button>
                </>
              )}

              {hasZaloLinked && state.user?.zaloUserId && (
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{t('profile.zalo_id')}:</span>{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded">{state.user.zaloUserId}</code>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits List */}
      {!hasZaloLinked && (
        <div className="mt-6 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
          <h4 className="font-semibold mb-3">{t('profile.why_link_zalo')}</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>{t('profile.zalo_benefit_1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>{t('profile.zalo_benefit_2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>{t('profile.zalo_benefit_3')}</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
