import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MDEditor from '@uiw/react-md-editor';
import { Eye, Edit3 } from 'lucide-react';
import { Button } from './button';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  height?: number;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder,
  error,
  className = '',
  height = 200
}) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  const handleChange = (val?: string) => {
    onChange(val || '');
  };

  const toggleViewMode = () => {
    if (viewMode === 'edit') {
      setViewMode('preview');
    } else {
      setViewMode('edit');
    }
  };

  const getViewModeIcon = () => {
    switch (viewMode) {
      case 'edit':
        return <Eye className="h-4 w-4" />;
      case 'preview':
        return <Edit3 className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getViewModeText = () => {
    switch (viewMode) {
      case 'edit':
        return t('markdown.preview') || 'Preview';
      case 'preview':
        return t('markdown.edit') || 'Edit';
      default:
        return t('markdown.preview') || 'Preview';
    }
  };

  return (
    <div className={`markdown-editor ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded-t-lg border border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            {t('markdown.markdown_editor') || 'Markdown Editor'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button type="button" variant="outline" size="sm" onClick={toggleViewMode} className="h-8 px-3 text-xs">
            {getViewModeIcon()}
            <span className="ml-1">{getViewModeText()}</span>
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="border border-gray-200 rounded-b-lg overflow-hidden">
        <MDEditor
          value={value}
          onChange={handleChange}
          data-color-mode="light"
          height={height}
          visibleDragbar={false}
          preview={viewMode === 'preview' ? 'preview' : 'edit'}
          hideToolbar={viewMode === 'preview'}
          textareaProps={{
            placeholder: placeholder || t('markdown.placeholder') || 'Write your content in Markdown...',
            style: {
              fontSize: 14,
              lineHeight: 1.6
            }
          }}
          style={{
            backgroundColor: '#ffffff'
          }}
        />
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500">
        <p>
          {t('markdown.help_text') ||
            'Use Markdown syntax to format your text. Supports **bold**, *italic*, links, lists, and more.'}
        </p>
      </div>
    </div>
  );
};

export default MarkdownEditor;
