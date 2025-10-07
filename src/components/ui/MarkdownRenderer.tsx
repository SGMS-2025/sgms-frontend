import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';
import type { CSSProperties } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const components: Components = {
    code: ({ className, children }) => {
      const match = /language-(\w+)/.exec(className || '');
      const inline = !match;
      return !inline && match ? (
        <SyntaxHighlighter style={oneLight as { [key: string]: CSSProperties }} language={match[1]} PreTag="div">
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className}>{children}</code>
      );
    },
    h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-bold text-gray-900 mb-3 mt-5 first:mt-0">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4 first:mt-0">{children}</h3>,
    p: ({ children }) => <p className="text-gray-700 mb-3 leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-3 text-gray-700 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 text-gray-700 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="text-gray-700">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-orange-200 pl-4 py-2 mb-3 bg-orange-50 text-gray-700 italic">
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-orange-600 hover:text-orange-700 underline"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
    em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
    hr: () => <hr className="border-gray-200 my-4" />
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
