import { useEffect, useState } from 'react';
import Example from '@/components/example/Example';
import { api } from '@/services/api/api';

function ExamplePage() {
  const [apiResponse, setApiResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

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
        <h1 className="text-7xl font-bold text-white mb-4">Hello World!</h1>
        <p className="text-xl text-white/80">Welcome to sgms-frontend</p>
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
