'use client';

import { useState } from 'react';
import type { ChatMessage as ChatMessageType } from '@/types/chat';
import type { DebateState } from '@/types/debate';
import { Markdown } from '@/components/ui/Markdown';
import { DebatePanel } from './DebatePanel';

interface ChatMessageProps {
  message: ChatMessageType;
  debateState?: DebateState;
}

export function ChatMessage({ message, debateState }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  return (
    <>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div
          className={`max-w-[85%] ${
            isUser
              ? 'bg-spring-500 text-white rounded-2xl rounded-br-sm px-4 py-3'
              : 'text-bark-800'
          }`}
        >
          {isUser ? (
            <>
              {/* PDF attachments */}
              {message.pdfs && message.pdfs.length > 0 && (
                <div className={`flex flex-wrap gap-2 ${message.content || (message.images && message.images.length > 0) ? 'mb-2' : ''}`}>
                  {message.pdfs.map((pdf) => (
                    <div key={pdf.id} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/80 flex-shrink-0">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2v6h6M10 13h4M10 17h4M8 9h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-xs text-white/90 truncate max-w-32" title={pdf.name}>
                        {pdf.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {/* Image attachments */}
              {message.images && message.images.length > 0 && (
                <div className={`flex flex-wrap gap-2 ${message.content ? 'mb-2' : ''}`}>
                  {message.images.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setExpandedImage(`data:${img.mimeType};base64,${img.data}`)}
                      className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg"
                    >
                      <img
                        src={`data:${img.mimeType};base64,${img.data}`}
                        alt={img.name}
                        className="max-h-32 max-w-48 object-cover rounded-lg border border-white/20"
                      />
                    </button>
                  ))}
                </div>
              )}
              {message.content && <p className="text-sm">{message.content}</p>}
            </>
          ) : (
            <>
              {message.content ? (
                <Markdown content={message.content} />
              ) : debateState?.status === 'debating' ? (
                <div className="flex items-center gap-2 text-sm text-bark-500">
                  <span>Deliberating</span>
                  <span className="animate-blink">&#9608;</span>
                </div>
              ) : null}
              {debateState && <DebatePanel debateState={debateState} />}
            </>
          )}
        </div>
      </div>

      {/* Image lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="Expanded view"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl cursor-pointer"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
