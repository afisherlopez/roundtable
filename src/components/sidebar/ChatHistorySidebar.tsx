'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Conversation } from '@/types/chat';
import { getConversations } from '@/hooks/useChat';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewChat: () => void;
  currentConversationId: string | null;
}

export function ChatHistorySidebar({
  isOpen,
  onClose,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  currentConversationId,
}: ChatHistorySidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadConversations = useCallback(() => {
    setConversations(getConversations());
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, loadConversations]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirm === id) {
      onDeleteConversation(id);
      setDeleteConfirm(null);
      loadConversations();
    } else {
      setDeleteConfirm(id);
      // Auto-reset after 3s
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Group conversations by date
  const groupedConversations = conversations.reduce((acc, conv) => {
    const dateKey = formatDate(conv.updatedAt);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(conv);
    return acc;
  }, {} as Record<string, Conversation[]>);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-spring-50 border-r border-spring-300 z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-spring-300 bg-spring-100">
          <h2 className="text-sm font-bold text-bark-800">Chat History</h2>
          <button
            onClick={onClose}
            className="text-bark-500 hover:text-bark-800 transition-colors cursor-pointer p-1"
            aria-label="Close sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* New Chat button */}
        <div className="p-3 border-b border-spring-200">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-bark-800 bg-spring-200 hover:bg-spring-300 rounded-lg transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New Chat
          </button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {Object.keys(groupedConversations).length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-bark-500">No saved chats yet</p>
              <p className="text-xs text-bark-500/70 mt-1">
                Your conversations will appear here
              </p>
            </div>
          ) : (
            Object.entries(groupedConversations).map(([date, convs]) => (
              <div key={date} className="py-2">
                <h3 className="px-4 py-1 text-[10px] font-medium text-bark-500 uppercase tracking-wide">
                  {date}
                </h3>
                {convs.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      onSelectConversation(conv.id);
                      onClose();
                    }}
                    className={`w-full px-4 py-2 text-left flex items-center gap-2 group transition-colors cursor-pointer ${
                      currentConversationId === conv.id
                        ? 'bg-spring-200'
                        : 'hover:bg-spring-100'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-bark-800 truncate">
                        {conv.title}
                      </p>
                      <p className="text-[10px] text-bark-500">
                        {conv.messages.length} message{conv.messages.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(conv.id, e)}
                      className={`p-1 rounded transition-all cursor-pointer ${
                        deleteConfirm === conv.id
                          ? 'bg-rose-400 text-white'
                          : 'text-bark-400 opacity-0 group-hover:opacity-100 hover:text-rose-400'
                      }`}
                      aria-label={deleteConfirm === conv.id ? 'Confirm delete' : 'Delete conversation'}
                    >
                      {deleteConfirm === conv.id ? (
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-spring-200 bg-spring-100">
          <p className="text-[10px] text-bark-500 text-center">
            Chats stored locally in your browser
          </p>
        </div>
      </aside>
    </>
  );
}
