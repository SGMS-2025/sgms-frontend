import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';
import type { CSSProperties, ComponentPropsWithoutRef, ReactNode } from 'react';

type CodeProps = ComponentPropsWithoutRef<'code'> & {
  inline?: boolean;
  children?: ReactNode;
};
type HeadingProps = ComponentPropsWithoutRef<'h1'> & { children?: ReactNode };
type ParagraphProps = ComponentPropsWithoutRef<'p'> & { children?: ReactNode };
type AnchorProps = ComponentPropsWithoutRef<'a'> & { children?: ReactNode };
type ListProps = ComponentPropsWithoutRef<'ul'> & { children?: ReactNode };
type OrderedListProps = ComponentPropsWithoutRef<'ol'> & { children?: ReactNode };
type ListItemProps = ComponentPropsWithoutRef<'li'> & { children?: ReactNode };
type BlockquoteProps = ComponentPropsWithoutRef<'blockquote'> & { children?: ReactNode };
type StrongProps = ComponentPropsWithoutRef<'strong'> & { children?: ReactNode };
type EmProps = ComponentPropsWithoutRef<'em'> & { children?: ReactNode };

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const childrenToString = (children: unknown): string => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return children.toString();
  if (typeof children === 'boolean') return '';
  if (children == null) return '';
  if (Array.isArray(children)) return children.map(childrenToString).join('');

  if (typeof children === 'object' && 'props' in children) {
    const props = children.props as { children?: unknown };
    return childrenToString(props.children);
  }

  return '';
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const components: Components = useMemo(
    () => ({
      code({ className, children, inline }: CodeProps) {
        const match = /language-(\w+)/.exec(className ?? '');

        if (!inline && match) {
          const code = childrenToString(children).replace(/\n$/, '');
          return (
            <SyntaxHighlighter style={oneLight as { [key: string]: CSSProperties }} language={match[1]} PreTag="div">
              {code}
            </SyntaxHighlighter>
          );
        }

        return <code className={className ?? ''}>{children}</code>;
      },
      h1: ({ children }: HeadingProps) => (
        <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0">{children}</h1>
      ),
      h2: ({ children }: HeadingProps) => (
        <h2 className="text-xl font-bold text-gray-900 mb-3 mt-5 first:mt-0">{children}</h2>
      ),
      h3: ({ children }: HeadingProps) => (
        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4 first:mt-0">{children}</h3>
      ),
      p: ({ children }: ParagraphProps) => <p className="text-gray-700 mb-3 leading-relaxed">{children}</p>,
      ul: ({ children }: ListProps) => (
        <ul className="list-disc list-inside mb-3 text-gray-700 space-y-1">{children}</ul>
      ),
      ol: ({ children }: OrderedListProps) => (
        <ol className="list-decimal list-inside mb-3 text-gray-700 space-y-1">{children}</ol>
      ),
      li: ({ children }: ListItemProps) => <li className="text-gray-700">{children}</li>,
      blockquote: ({ children }: BlockquoteProps) => (
        <blockquote className="border-l-4 border-orange-200 pl-4 py-2 mb-3 bg-orange-50 text-gray-700 italic">
          {children}
        </blockquote>
      ),
      a: ({ href, children }: AnchorProps) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-600 hover:text-orange-700 underline"
        >
          {children}
        </a>
      ),
      strong: ({ children }: StrongProps) => <strong className="font-semibold text-gray-900">{children}</strong>,
      em: ({ children }: EmProps) => <em className="italic text-gray-800">{children}</em>,
      hr: () => <hr className="border-gray-200 my-4" />
    }),
    []
  );

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
