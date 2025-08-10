import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from 'react-i18next';
import Example from '@/components/example/Example';
import { getHealthStatus } from '@/services/api/healthApi';
import type { HealthStatusResponse } from '@/types/api/HealthStatus';

function ExamplePage() {
  const { theme, toggleTheme } = useTheme();
  const [apiResponse, setApiResponse] = useState<HealthStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const isMobile = useIsMobile();

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
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 dark:from-gray-900 dark:to-gray-800 p-8 relative ${isMobile ? 'px-2 py-4' : ''}`}
    >
      {/* Header */}
      <div className={`text-center mb-8 ${isMobile ? 'mb-4' : ''}`}>
        <h1 className={`${isMobile ? 'text-4xl' : 'text-7xl'} font-bold text-white dark:text-gray-100 mb-4`}>
          {t('hello-world')}
        </h1>
        <p className={`${isMobile ? 'text-base' : 'text-xl'} text-white/80 dark:text-gray-300`}>{t('welcome')}</p>

        {/* Language Toggle Switch */}
        <div className={`mt-4 flex flex-col items-center gap-2`}>
          <label className="flex items-center cursor-pointer">
            <span className="mr-2 text-white dark:text-gray-200 font-semibold">EN</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={language === 'vi'}
                onChange={() => setLanguage(language === 'en' ? 'vi' : 'en')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 rounded-full peer peer-checked:bg-green-600 dark:peer-checked:bg-green-500 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white dark:bg-gray-200 rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
            </div>
            <span className="ml-2 text-white dark:text-gray-200 font-semibold">VI</span>
          </label>

          {/* Theme Switcher below the language toggle button */}
          <button
            onClick={toggleTheme}
            className={`mt-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isMobile ? 'text-sm px-2 py-1' : ''}`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </div>

      {/* API Response */}
      <div className={`max-w-3xl mx-auto mb-8 ${isMobile ? 'px-1' : ''}`}>
        <div
          className={`bg-white dark:bg-gray-900 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700 ${isMobile ? 'p-2' : ''}`}
        >
          {loading && <span>Loading API...</span>}
          {error && <span className="text-red-600 dark:text-red-400">Error: {error}</span>}
          {!loading && !error && apiResponse && (
            <>
              <span className="block text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
                API Health Check
              </span>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-4">
                  <div className="bg-green-100 dark:bg-green-900 rounded px-3 py-1 text-green-800 dark:text-green-200 font-medium">
                    {apiResponse.message}
                  </div>

                  <div className="bg-blue-100 dark:bg-blue-900 rounded px-3 py-1 text-blue-800 dark:text-blue-200">
                    Version: {apiResponse.version}
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900 rounded px-3 py-1 text-purple-800 dark:text-purple-200">
                    Env: {apiResponse.environment}
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded px-3 py-1 text-gray-800 dark:text-gray-200">
                    Time: {new Date(apiResponse.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="mt-2">
                  <span className="font-semibold dark:text-gray-100">Services:</span>
                  <ul className="ml-4 list-disc">
                    <li>
                      API:{' '}
                      <span
                        className={
                          apiResponse.services.api === 'healthy'
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-red-700 dark:text-red-400'
                        }
                      >
                        {apiResponse.services.api}
                      </span>
                    </li>
                    <li>
                      Database:{' '}
                      <span
                        className={
                          apiResponse.services.database === 'healthy'
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-red-700 dark:text-red-400'
                        }
                      >
                        {apiResponse.services.database}
                      </span>
                    </li>
                  </ul>
                </div>
                {apiResponse.database && (
                  <div className="mt-2">
                    <span className="font-semibold dark:text-gray-100">Database Stats:</span>
                    <ul className="ml-4 list-disc">
                      <li>
                        Collections:{' '}
                        <span className="text-blue-700 dark:text-blue-300">{apiResponse.database.collections}</span>
                      </li>
                      <li>
                        Data Size:{' '}
                        <span className="text-blue-700 dark:text-blue-300">{apiResponse.database.dataSize}</span>
                      </li>
                      <li>
                        Storage Size:{' '}
                        <span className="text-blue-700 dark:text-blue-300">{apiResponse.database.storageSize}</span>
                      </li>
                      <li>
                        Indexes:{' '}
                        <span className="text-blue-700 dark:text-blue-300">{apiResponse.database.indexes}</span>
                      </li>
                      <li>
                        Objects:{' '}
                        <span className="text-blue-700 dark:text-blue-300">{apiResponse.database.objects}</span>
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
      <div className={`max-w-3xl mx-auto ${isMobile ? 'px-1' : ''}`}>
        <Example />
      </div>
    </div>
  );
}

export default ExamplePage;
