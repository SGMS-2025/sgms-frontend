import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from 'react-i18next';
import Example from '@/components/example/Example';
import { getHealthStatus } from '@/services/api/healthApi';
import type { HealthStatusResponse } from '@/types/api/HealthStatus';

function ExamplePage() {
  const [apiResponse, setApiResponse] = useState<HealthStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  useEffect(() => {
    getHealthStatus()
      .then((data) => {
        setApiResponse(data);
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
            <span className="mr-2 text-white font-semibold">EN</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={language === 'vi'}
                onChange={() => setLanguage(language === 'en' ? 'vi' : 'en')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-600 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
            </div>
            <span className="ml-2 text-white font-semibold">VI</span>
          </label>
        </div>
      </div>

      {/* API Response */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white rounded-lg p-4 shadow">
          {loading && <span>Loading API...</span>}
          {error && <span className="text-red-600">Error: {error}</span>}
          {!loading && !error && apiResponse && (
            <>
              <span className="block text-lg font-semibold text-green-700 mb-2">API Health Check</span>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-4">
                  <div className="bg-green-100 rounded px-3 py-1 text-green-800 font-medium">{apiResponse.message}</div>
                  <div className="bg-blue-100 rounded px-3 py-1 text-blue-800">Version: {apiResponse.version}</div>
                  <div className="bg-purple-100 rounded px-3 py-1 text-purple-800">Env: {apiResponse.environment}</div>
                  <div className="bg-gray-100 rounded px-3 py-1 text-gray-800">
                    Time: {new Date(apiResponse.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="mt-2">
                  <span className="font-semibold">Services:</span>
                  <ul className="ml-4 list-disc">
                    <li>
                      API:{' '}
                      <span className={apiResponse.services.api === 'healthy' ? 'text-green-700' : 'text-red-700'}>
                        {apiResponse.services.api}
                      </span>
                    </li>
                    <li>
                      Database:{' '}
                      <span className={apiResponse.services.database === 'healthy' ? 'text-green-700' : 'text-red-700'}>
                        {apiResponse.services.database}
                      </span>
                    </li>
                  </ul>
                </div>
                {apiResponse.database && (
                  <div className="mt-2">
                    <span className="font-semibold">Database Stats:</span>
                    <ul className="ml-4 list-disc">
                      <li>
                        Collections: <span className="text-blue-700">{apiResponse.database.collections}</span>
                      </li>
                      <li>
                        Data Size: <span className="text-blue-700">{apiResponse.database.dataSize}</span>
                      </li>
                      <li>
                        Storage Size: <span className="text-blue-700">{apiResponse.database.storageSize}</span>
                      </li>
                      <li>
                        Indexes: <span className="text-blue-700">{apiResponse.database.indexes}</span>
                      </li>
                      <li>
                        Objects: <span className="text-blue-700">{apiResponse.database.objects}</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
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
