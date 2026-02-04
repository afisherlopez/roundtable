'use client';

import { useState, useCallback } from 'react';
import type { ChatMessage, ImageAttachment, PdfAttachment, Conversation } from '@/types/chat';

const STORAGE_KEY = 'roundtable_chats';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const addMessage = useCallback(
    (role: 'user' | 'assistant', content: string, debateId?: string, images?: ImageAttachment[], pdfs?: PdfAttachment[]) => {
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        role,
        content,
        timestamp: Date.now(),
        debateId,
        images,
        pdfs,
      };
      setMessages((prev) => [...prev, message]);
      return message.id;
    },
    []
  );

  const updateMessage = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content } : m))
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  const saveConversation = useCallback((title?: string) => {
    if (messages.length === 0) return null;
    
    const id = conversationId || crypto.randomUUID();
    const firstUserMsg = messages.find(m => m.role === 'user');
    const autoTitle = title || firstUserMsg?.content.slice(0, 50) || 'Untitled';
    
    const conversation: Conversation = {
      id,
      title: autoTitle,
      messages,
      createdAt: conversationId ? getConversations().find(c => c.id === id)?.createdAt || Date.now() : Date.now(),
      updatedAt: Date.now(),
    };

    const existing = getConversations();
    const filtered = existing.filter(c => c.id !== id);
    const updated = [conversation, ...filtered];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setConversationId(id);
    
    return id;
  }, [messages, conversationId]);

  const loadConversation = useCallback((id: string) => {
    const conversations = getConversations();
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setMessages(conversation.messages);
      setConversationId(id);
      return conversation;
    }
    return null;
  }, []);

  const deleteConversation = useCallback((id: string) => {
    const existing = getConversations();
    const filtered = existing.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    if (conversationId === id) {
      clearMessages();
    }
  }, [conversationId, clearMessages]);

  return {
    messages,
    conversationId,
    addMessage,
    updateMessage,
    clearMessages,
    saveConversation,
    loadConversation,
    deleteConversation,
    getConversations,
  };
}

export function getConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}
