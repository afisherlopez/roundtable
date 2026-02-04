'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className = '' }: MarkdownProps) {
  return (
    <div className={`text-sm leading-relaxed ${className}`}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 text-bark-800">{children}</p>,
        h1: ({ children }) => (
          <h1 className="text-lg font-bold text-bark-800 mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold text-bark-800 mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold text-bark-800 mb-1">{children}</h3>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 text-bark-800">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 text-bark-800">{children}</ol>
        ),
        li: ({ children }) => <li className="mb-0.5">{children}</li>,
        code: ({ className: codeClassName, children, ...props }) => {
          const isInline = !codeClassName;
          if (isInline) {
            return (
              <code
                className="bg-spring-200 text-spring-500 px-1.5 py-0.5 rounded text-xs"
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              className={`block bg-spring-100 border border-spring-300 rounded p-3 text-xs overflow-x-auto mb-2 text-bark-800 ${codeClassName}`}
              {...props}
            >
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="mb-2">{children}</pre>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-spring-500 pl-3 italic text-bark-500 mb-2">
            {children}
          </blockquote>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            className="text-sky-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        strong: ({ children }) => (
          <strong className="font-bold text-bark-800">{children}</strong>
        ),
        table: ({ children }) => (
          <table className="border-collapse border border-spring-300 mb-2 text-xs w-full">
            {children}
          </table>
        ),
        th: ({ children }) => (
          <th className="border border-spring-300 bg-spring-200 px-2 py-1 text-left text-bark-800">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-spring-300 px-2 py-1 text-bark-600">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
