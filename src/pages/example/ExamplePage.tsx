import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from 'react-i18next';
import Example from '@/components/example/Example';
import { api } from '@/services/api/api';

function ExamplePage() {
  const [apiResponse, setApiResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  useEffect(() => {
    api
      .get('/')
      .then((res) => {
        console.log('API response:', res.data);
        setApiResponse(typeof res.data === 'string' ? res.data : JSON.stringify(res.data));
      })
      .catch((err) => {
        setError(err.message);
        console.error('API error:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-7xl font-bold text-white mb-4">{t('hello-world')}</h1>
        <p className="text-xl text-white/80">{t('welcome')}</p>
        {/* Language Toggle Switch */}
        <div className="mt-4 flex justify-center">
          <label className="flex items-center cursor-pointer">
            <span className="mr-2 text-white font-semibold">VI</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={language === 'en'}
                onChange={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-600 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
            </div>
            <span className="ml-2 text-white font-semibold">EN</span>
          </label>
        </div>
      </div>

      {/* API Response */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white/80 rounded p-4 shadow">
          {loading && <span>Loading API...</span>}
          {error && <span className="text-red-600">Error: {error}</span>}
          {!loading && !error && (
            <>
              <span className="text-green-700">API Response: {apiResponse}</span>
            </>
          )}
        </div>
      </div>

      {/* Example Components */}
      <div className="max-w-4xl mx-auto">
        <Example />
      </div>
    </div>
  );
}

export default ExamplePage;
