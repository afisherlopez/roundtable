'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { useApiKeys } from '@/hooks/useApiKeys';
import { useRoundtable } from '@/hooks/useRoundtable';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { ProgressIndicator } from '@/components/debate/ProgressIndicator';
import { IconButton } from '@/components/ui/IconButton';
import { ChatHistorySidebar } from '@/components/sidebar/ChatHistorySidebar';
import type { ImageAttachment, PdfAttachment } from '@/types/chat';
import type { ImageInput, PdfInput } from '@/lib/ai/types';

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { 
    messages, 
    conversationId,
    addMessage, 
    updateMessage, 
    clearMessages,
    saveConversation,
    loadConversation,
    deleteConversation,
  } = useChat();
  const { apiKeys, saveKeys, getKeySource, hasAllKeys } = useApiKeys();
  const { debateState, startDebate, resetDebate } = useRoundtable();

  const activeDebateMessageIdRef = useRef<string | null>(null);

  const handleSubmit = useCallback(
    async (prompt: string, images?: ImageAttachment[], pdfs?: PdfAttachment[]) => {
      if (!hasAllKeys()) {
        setSettingsOpen(true);
        return;
      }

      addMessage('user', prompt, undefined, images, pdfs);
      const assistantId = addMessage('assistant', '');
      activeDebateMessageIdRef.current = assistantId;

      // Convert attachments to API format
      const imageInputs: ImageInput[] | undefined = images?.map(img => ({
        data: img.data,
        mimeType: img.mimeType,
      }));

      const pdfInputs: PdfInput[] | undefined = pdfs?.map(pdf => ({
        data: pdf.data,
        mimeType: pdf.mimeType,
        name: pdf.name,
      }));

      await startDebate(prompt, apiKeys, imageInputs, pdfInputs);
    },
    [addMessage, apiKeys, hasAllKeys, startDebate]
  );

  // Update assistant message when debate completes and auto-save
  useEffect(() => {
    const msgId = activeDebateMessageIdRef.current;
    if (!msgId) return;

    if (debateState.status === 'complete' && debateState.finalAnswer) {
      updateMessage(msgId, debateState.finalAnswer);
      // Auto-save conversation when debate completes
      setTimeout(() => saveConversation(), 100);
    } else if (debateState.status === 'error' && debateState.error) {
      updateMessage(msgId, `Error: ${debateState.error}`);
    }
  }, [debateState.status, debateState.finalAnswer, debateState.error, updateMessage, saveConversation]);

  const handleNewChat = useCallback(() => {
    resetDebate();
    clearMessages();
    activeDebateMessageIdRef.current = null;
  }, [resetDebate, clearMessages]);

  const handleSelectConversation = useCallback((id: string) => {
    resetDebate();
    loadConversation(id);
    activeDebateMessageIdRef.current = null;
  }, [resetDebate, loadConversation]);

  const isLoading = debateState.status === 'debating';

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-spring-300 bg-spring-100">
        <div className="flex items-center gap-3">
          <IconButton label="Chat history" onClick={() => setSidebarOpen(true)}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 4h12M2 8h12M2 12h12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </IconButton>
          <h1 className="text-sm font-bold text-bark-800">Roundtable</h1>
          <span className="text-[10px] text-bark-500">
            3 models &middot; 1 answer
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <ProgressIndicator
              currentRound={debateState.currentRound}
              currentModel={debateState.currentModel}
              status={debateState.status}
            />
          )}
          <IconButton label="New chat" onClick={handleNewChat}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </IconButton>
          <IconButton
            label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.5 2h3l.5 2 1.5.87 2-.5 1.5 2.6-1.5 1.5v1.06l1.5 1.5-1.5 2.6-2-.5L10 14l-.5 2h-3L6 14l-1.5-.87-2 .5-1.5-2.6 1.5-1.5V8.47L1 6.97l1.5-2.6 2 .5L6 4l.5-2z"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinejoin="round"
              />
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1" />
            </svg>
          </IconButton>
        </div>
      </header>

      {/* Chat area */}
      <ChatContainer>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h2 className="text-lg font-bold text-bark-800 mb-2">
              Roundtable
            </h2>
            <p className="text-sm text-bark-500 max-w-md">
              Because they can&apos;t all be wrong... right?
            </p>
            <p className="text-xs text-bark-500/70 mt-2 max-w-sm">
              
            </p>
            {!hasAllKeys() && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="mt-4 text-xs text-spring-500 hover:text-spring-400 underline cursor-pointer"
              >
                Add API keys to get started
              </button>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              debateState={
                msg.id === activeDebateMessageIdRef.current
                  ? debateState
                  : undefined
              }
            />
          ))
        )}
      </ChatContainer>

      {/* Input */}
      <ChatInput
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />

      {/* Settings */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKeys={apiKeys}
        onSave={saveKeys}
        getKeySource={getKeySource}
      />

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={deleteConversation}
        onNewChat={handleNewChat}
        currentConversationId={conversationId}
      />

      {/* Tomato link */}
      <a
        href="https://annafisherlopez.com"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 left-4 z-50 text-poppy-400 hover:scale-110 transition-transform cursor-pointer"
        aria-label="Visit annafisherlopez.com"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Tomato body */}
          <ellipse cx="12" cy="14" rx="9" ry="8" fill="currentColor"/>
          {/* Stem */}
          <path d="M12 6V4" stroke="#5a923a" strokeWidth="2" strokeLinecap="round"/>
          {/* Leaves */}
          <path d="M9 6c-2-1-3 0-3 0s1 2 3 1" fill="#5a923a"/>
          <path d="M15 6c2-1 3 0 3 0s-1 2-3 1" fill="#5a923a"/>
          <path d="M12 7c0-2 1-3 1-3s1 1 0 3" fill="#5a923a"/>
          {/* Highlight */}
          <ellipse cx="9" cy="12" rx="2" ry="1.5" fill="white" fillOpacity="0.3"/>
        </svg>
      </a>
    </div>
  );
}
