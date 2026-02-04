'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className = '' }: MarkdownProps) {
  // Extract summary section if present (format: <summary>...</summary>)
  const summaryMatch = content.match(/<summary>([\s\S]*?)<\/summary>/);
  const summary = summaryMatch ? summaryMatch[1].trim() : null;
  
  // Remove the summary tag and any trailing --- divider before it
  let mainContent = content
    .replace(/\n*---\n*<summary>[\s\S]*?<\/summary>/, '')
    .replace(/<summary>[\s\S]*?<\/summary>/, '')
    .trim();
  
  // Remove any trailing --- that might be left over
  mainContent = mainContent.replace(/\n*---\s*$/, '').trim();
  
  // If we have a summary, also remove any duplicate of it from mainContent
  // (sometimes the summary text appears both in the answer and in <summary> tags)
  if (summary) {
    // Normalize function for fuzzy comparison
    const normalize = (s: string) => s
      .replace(/\*+/g, '')
      .replace(/_+/g, '')
      .replace(/\$/g, '') // Remove LaTeX delimiters for comparison
      .replace(/\\[a-z]+/gi, '') // Remove LaTeX commands
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    
    const normalizedSummary = normalize(summary);
    
    // Split mainContent into paragraphs and check if trailing paragraphs match summary
    const paragraphs = mainContent.split(/\n\n+/);
    let keepUpTo = paragraphs.length;
    
    for (let i = paragraphs.length - 1; i >= 0; i--) {
      const trailingParagraphs = paragraphs.slice(i).join(' ');
      const normalizedTrailing = normalize(trailingParagraphs);
      
      // Check if this trailing content is similar to the summary
      if (normalizedSummary.length > 50 && 
          (normalizedTrailing.includes(normalizedSummary.slice(0, 50)) ||
           normalizedSummary.includes(normalizedTrailing.slice(0, 50)))) {
        keepUpTo = i;
      } else if (normalizedTrailing === normalizedSummary) {
        keepUpTo = i;
      } else {
        break;
      }
    }
    
    if (keepUpTo < paragraphs.length) {
      mainContent = paragraphs.slice(0, keepUpTo).join('\n\n').trim();
    }
    
    // Also try exact regex match for simple cases
    const summaryEscaped = summary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    mainContent = mainContent
      .replace(new RegExp(`\\n*\\*${summaryEscaped}\\*\\s*$`), '')
      .replace(new RegExp(`\\n*_${summaryEscaped}_\\s*$`), '')
      .replace(new RegExp(`\\n*${summaryEscaped}\\s*$`), '')
      .trim();
  }

  return (
    <div className={`text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
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
          hr: () => <hr className="my-4 border-spring-300" />,
        }}
      >
        {mainContent}
      </ReactMarkdown>
      
      {/* Summary section in smaller gray text with LaTeX support */}
      {summary && (
        <div className="mt-4 pt-3 border-t border-spring-200">
          <p className="text-[10px] font-bold text-bark-500 uppercase tracking-wide mb-1">
            Debate Summary
          </p>
          <div className="text-xs text-bark-500 leading-relaxed [&_p]:mb-1 [&_p:last-child]:mb-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                p: ({ children }) => <p>{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em>{children}</em>,
                code: ({ children }) => <code className="bg-spring-200/50 px-1 rounded text-[10px]">{children}</code>,
              }}
            >
              {summary}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
