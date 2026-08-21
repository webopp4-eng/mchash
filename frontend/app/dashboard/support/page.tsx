'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  FaHeadset, FaPaperPlane, FaArrowLeft, FaCheckCircle, FaClock,
  FaExclamationTriangle, FaSearch, FaPlus, FaUserCircle, FaShieldAlt
} from 'react-icons/fa';
import { apiFetch, getUser } from '@/lib/auth';

interface ChatMessage {
  id: string;
  ticketId: string;
  senderId: string | null;
  senderRole: string;
  message: string;
  readByUser: boolean;
  readByStaff: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  userId: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  unreadMessages?: number;
  SupportMessage?: ChatMessage[];
}

export default function SupportPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setUser(getUser());
    loadConversations();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Poll for new messages every 5 seconds when a conversation is open
  useEffect(() => {
    if (selectedConversation) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        loadMessages(selectedConversation.id, true);
      }, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedConversation?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await apiFetch('/api/support/tickets');
      setConversations(res.tickets || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (ticketId: string, silent = false) => {
    try {
      const res = await apiFetch(`/api/support/tickets/${ticketId}`);
      if (res.ticket) {
        setMessages(res.ticket.SupportMessage || []);
        setSelectedConversation(prev => prev ? { ...prev, status: res.ticket.status } : prev);
        // Update unread count in conversation list
        setConversations(prev => prev.map(c => 
          c.id === ticketId ? { ...c, unreadMessages: 0 } : c
        ));
      }
    } catch (err) {
      if (!silent) console.error('Failed to load messages:', err);
    }
  };

  const openConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation.id);
  };

  const createConversation = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      setError('Subject and message are required');
      return;
    }
    setError(null);
    try {
      const res = await apiFetch('/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: newSubject.trim(),
          category: newCategory,
          message: newMessage.trim(),
        }),
      });
      setShowNewChat(false);
      setNewSubject('');
      setNewMessage('');
      setNewCategory('general');
      await loadConversations();
      if (res.ticket) {
        await openConversation(res.ticket);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;
    setSending(true);
    setError(null);
    try {
      await apiFetch(`/api/support/tickets/${selectedConversation.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: messageText.trim() }),
      });
      setMessageText('');
      await loadMessages(selectedConversation.id);
      await loadConversations();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-emerald-50 text-emerald-600';
      case 'pending': return 'bg-amber-50 text-amber-600';
      case 'resolved': return 'bg-cmblue-50 text-cmblue-600';
      case 'closed': return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  return (
    <div className="mc-page">
      <section className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Support</p>
          <h1 className="mc-title">Support & Chats</h1>
          <p className="mc-subtitle">Chat with our support team</p>
        </div>
      </section>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-[22px] border border-rose-200/80 bg-rose-50/80 p-4 backdrop-blur-xl">
          <div className="text-sm font-semibold text-rose-600">{error}</div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Conversation List */}
        <section className="mc-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-sky-100 p-4">
            <div className="flex items-center gap-2">
              <FaHeadset className="h-4 w-4 text-cmblue-500" />
              <h2 className="text-sm font-bold text-slate-950">Conversations</h2>
            </div>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="mc-icon-button bg-cmblue-500 text-white hover:bg-cmblue-600"
              title="New Conversation"
            >
              <FaPlus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* New Conversation Form */}
          {showNewChat && (
            <div className="border-b border-sky-100 bg-sky-50/50 p-4">
              <div className="space-y-2">
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="What's your issue?"
                  className="mc-input"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="mc-input"
                >
                  <option value="general">General</option>
                  <option value="mining">Mining</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="deposit">Deposit</option>
                  <option value="referral">Referral</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                </select>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Describe your issue..."
                  rows={3}
                  className="mc-input resize-none"
                />
                <button
                  onClick={createConversation}
                  disabled={!newSubject.trim() || !newMessage.trim()}
                  className="mc-button w-full"
                >
                  <FaPlus className="h-3 w-3" />
                  Start Conversation
                </button>
              </div>
            </div>
          )}

          <div className="max-h-[500px] overflow-y-auto">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full border-b border-sky-50 p-4 text-left transition-all ${
                    selectedConversation?.id === conv.id
                      ? 'bg-cmblue-50'
                      : 'hover:bg-sky-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FaUserCircle className="h-5 w-5 shrink-0 text-cmblue-400" />
                        <p className="truncate text-sm font-bold text-slate-950">{conv.subject}</p>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {conv.SupportMessage?.[conv.SupportMessage.length - 1]?.message || 'No messages'}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[10px] text-slate-400">{formatDate(conv.updatedAt)}</span>
                      <span className={`mc-status ${getStatusColor(conv.status)}`}>{conv.status}</span>
                      {conv.unreadMessages ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cmblue-500 text-[10px] font-bold text-white">
                          {conv.unreadMessages}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-12 text-center">
                <FaHeadset className="mx-auto h-10 w-10 text-cmblue-200" />
                <p className="mt-3 text-sm font-semibold text-slate-500">No conversations yet</p>
                <p className="text-xs text-slate-400">Click + to start a new conversation</p>
              </div>
            )}
          </div>
        </section>

        {/* Chat Window */}
        <section className="mc-card flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50/50 p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="mc-icon-button lg:hidden"
                  >
                    <FaArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cmblue-500 text-white">
                    <FaHeadset className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950">Support Team</p>
                    <p className="text-[10px] text-slate-500">{selectedConversation.subject}</p>
                  </div>
                </div>
                <span className={`mc-status ${getStatusColor(selectedConversation.status)}`}>
                  {selectedConversation.status}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-4" style={{ minHeight: '400px', maxHeight: '500px' }}>
                {messages.length > 0 ? (
                  messages.map((msg) => {
                    const isUser = msg.senderRole === 'user';
                    return (
                      <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                          isUser
                            ? 'bg-cmblue-500 text-white rounded-br-sm'
                            : 'bg-white text-slate-900 border border-sky-100 rounded-bl-sm shadow-sm'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                          <div className={`mt-1 flex items-center gap-1 text-[10px] ${isUser ? 'text-white/70' : 'text-slate-400'}`}>
                            <span>{formatTime(msg.createdAt)}</span>
                            {isUser && (
                              <span>
                                {msg.readByStaff ? (
                                  <FaCheckCircle className="h-3 w-3 text-emerald-300" />
                                ) : (
                                  <FaClock className="h-3 w-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <FaHeadset className="mx-auto h-10 w-10 text-cmblue-200" />
                      <p className="mt-2 text-sm font-semibold text-slate-500">No messages yet</p>
                      <p className="text-xs text-slate-400">Send a message to start the conversation</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {selectedConversation.status !== 'closed' && (
                <div className="border-t border-sky-100 p-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      rows={1}
                      className="mc-input flex-1 resize-none"
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !messageText.trim()}
                      className="mc-button h-11 w-11 shrink-0 rounded-full p-0"
                      title="Send"
                    >
                      {sending ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <FaPaperPlane className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <FaHeadset className="mx-auto h-12 w-12 text-cmblue-200" />
                <p className="mt-3 text-sm font-semibold text-slate-500">Select a conversation to start chatting</p>
                <p className="text-xs text-slate-400">Or click + to create a new one</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}