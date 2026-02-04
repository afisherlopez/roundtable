'use client';

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, ImageAttachment, PdfAttachment, Conversation } from '@/types/chat';

const STORAGE_KEY = 'roundtable_chats';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  const addMessage = useCallback(
    (role: 'user' | 'assistant', content: string, debateId?: string, images?: ImageAttachment[], pdfs?: PdfAttachment[]) => {
      // Ensure we have a stable conversation id for this chat session
      if (!conversationIdRef.current) {
        const newId = crypto.randomUUID();
        conversationIdRef.current = newId;
        setConversationId(newId);
      }

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
    conversationIdRef.current = null;
  }, []);

  const saveConversation = useCallback((title?: string) => {
    if (messages.length === 0) return null;
    
    const id = conversationIdRef.current || conversationId || crypto.randomUUID();
    if (!conversationIdRef.current) {
      conversationIdRef.current = id;
      setConversationId(id);
    }

    const firstUserMsg = messages.find(m => m.role === 'user');
    const autoTitle = title || firstUserMsg?.content.slice(0, 50) || 'Untitled';

    const existing = getConversations();
    const existingConversation = existing.find(c => c.id === id);
    
    const conversation: Conversation = {
      id,
      title: autoTitle,
      messages,
      createdAt: existingConversation?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    const filtered = existing.filter(c => c.id !== id);
    const updated = dedupeConversations([conversation, ...filtered]);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    return id;
  }, [messages, conversationId]);

  const loadConversation = useCallback((id: string) => {
    const conversations = getConversations();
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setMessages(conversation.messages);
      setConversationId(id);
      conversationIdRef.current = id;
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
    const parsed = JSON.parse(stored) as Conversation[];
    // Dedupe on read to clean up any older duplicates caused by repeated saves
    return dedupeConversations(parsed);
  } catch {
    return [];
  }
}

function dedupeConversations(conversations: Conversation[]): Conversation[] {
  const byId = new Map<string, Conversation>();
  for (const conv of conversations) {
    const existing = byId.get(conv.id);
    if (!existing || (conv.updatedAt ?? 0) > (existing.updatedAt ?? 0)) {
      byId.set(conv.id, conv);
    }
  }

  // Also dedupe identical chats saved under different ids (common when auto-save was retriggered)
  const bySignature = new Map<string, Conversation>();
  for (const conv of byId.values()) {
    const signature = buildConversationSignature(conv);
    const existing = bySignature.get(signature);
    if (!existing || (conv.updatedAt ?? 0) > (existing.updatedAt ?? 0)) {
      bySignature.set(signature, conv);
    }
  }

  return Array.from(bySignature.values()).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

function buildConversationSignature(conv: Conversation): string {
  // Message ids are stable within a chat session; duplicates from repeated saves will share these.
  const ids = conv.messages.map((m) => m.id).join(',');
  return `${conv.messages.length}|${ids}`;
}
