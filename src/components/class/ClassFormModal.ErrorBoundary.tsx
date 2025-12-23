/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ClassFormModalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('[ClassFormModalErrorBoundary] Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ClassFormModalErrorBoundary] Error details:', {
      error: error.toString(),
      errorInfo: errorInfo.componentStack
    });
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorBoundaryContent error={this.state.error} onRetry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

function ErrorBoundaryContent({ error, onRetry }: { error?: Error; onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md">
        <h2 className="text-lg font-bold text-red-600 mb-2">{t('class.formboundary.error_title')}</h2>
        <p className="text-sm text-gray-600 mb-4">{error?.message}</p>
        <button onClick={onRetry} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          {t('class.formboundary.error_retry')}
        </button>
      </div>
    </div>
  );
}
