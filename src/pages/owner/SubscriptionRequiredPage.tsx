import { Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export const SubscriptionRequiredPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
          <Crown className="w-10 h-10 text-white" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">{t('subscription.required.title')}</h1>
        <p className="mt-3 text-gray-600">{t('subscription.required.description')}</p>

        <div className="mt-8 flex items-center justify-center">
          <Button
            onClick={() => navigate('/manage/subscriptions')}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          >
            {t('subscription.required.button')} <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>

        <div className="mt-8 rounded-xl border border-orange-200 bg-orange-50 p-4 text-left">
          <p className="text-sm text-orange-800">{t('subscription.required.note')}</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRequiredPage;
