'use client';

import { useEffect, useState, useRef } from 'react';
import {
  FaHeadset, FaPaperPlane, FaArrowLeft, FaCheckCircle, FaClock,
  FaSearch, FaUserCircle, FaShieldAlt, FaUserTie
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
  isAdmin?: boolean;
}

interface Conversation {
  id: string;
  userId: string;
  user?: {
    id: string;
    username: string;
    walletAddress: string;
    email: string;
  };
  subject: string;
  category: string;
  priority: string;
  status: string;
  assignedStaffId?: string | null;
  createdAt: string;
  updatedAt: string;
  unreadStaffMessages?: number;
  responses?: ChatMessage[];
}

export default function AdminSupport() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [responseText, setResponseText] = useState('');
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setUser(getUser());
    loadTickets();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Poll for new messages every 5 seconds
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

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/support/tickets');
      setConversations(res.tickets || []);
    } catch (err) {
      console.error('Failed to load support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (ticketId: string, silent = false) => {
    try {
      const res = await apiFetch(`/api/admin/support/tickets/${ticketId}`);
      if (res.ticket) {
        setMessages(res.ticket.SupportMessage || []);
        setSelectedConversation(prev => prev ? { ...prev, status: res.ticket.status } : prev);
        // Update unread count
        setConversations(prev => prev.map(c => 
          c.id === ticketId ? { ...c, unreadStaffMessages: 0 } : c
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

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      await apiFetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setConversations(prev => prev.map(t => 
        t.id === ticketId ? { ...t, status: newStatus } : t
      ));
      if (selectedConversation?.id === ticketId) {
        setSelectedConversation({ ...selectedConversation, status: newStatus });
      }
    } catch (err: any) {
      console.error('Failed to update status:', err);
    }
  };

  const sendResponse = async () => {
    if (!responseText.trim() || !selectedConversation) return;
    setSending(true);
    try {
      await apiFetch(`/api/admin/support/tickets/${selectedConversation.id}/respond`, {
        method: 'POST',
        body: JSON.stringify({ message: responseText.trim() }),
      });
      setResponseText('');
      await loadMessages(selectedConversation.id);
      await loadTickets();
    } catch (err: any) {
      console.error('Failed to send response:', err);
    } finally {
      setSending(false);
    }
  };

  const filteredTickets = conversations.filter(ticket => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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

  const openCount = conversations.filter(t => t.status === 'open').length;
  const pendingCount = conversations.filter(t => t.status === 'pending').length;
  const resolvedCount = conversations.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <div className="mc-page">
      <section className="mc-page-header">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-cmblue-600">Support System</p>
            <h1 className="mc-title">Support Conversations</h1>
            <p className="mc-subtitle max-w-2xl">Manage user support conversations, reply to messages, and track resolutions</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-[10px] font-bold uppercase text-emerald-600">Open</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-950">{openCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-[10px] font-bold uppercase text-amber-600">Pending</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-950">{pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase text-slate-600">Resolved</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-950">{resolvedCount}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Conversation List */}
        <section className="mc-card overflow-hidden">
          <div className="border-b border-sky-100 p-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mc-input pl-9 w-full"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['all', 'open', 'pending', 'resolved', 'closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                    filterStatus === status
                      ? 'bg-cmblue-500 text-white'
                      : 'bg-sky-50/50 text-slate-600 hover:bg-sky-100'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => openConversation(ticket)}
                  className={`w-full border-b border-sky-50 p-4 text-left transition-all ${
                    selectedConversation?.id === ticket.id
                      ? 'bg-cmblue-50'
                      : 'hover:bg-sky-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FaUserCircle className="h-5 w-5 shrink-0 text-cmblue-400" />
                        <p className="truncate text-sm font-bold text-slate-950">{ticket.subject}</p>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {ticket.user?.username} • {ticket.category}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">
                        {ticket.responses?.[ticket.responses.length - 1]?.message || 'No messages'}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[10px] text-slate-400">{formatDate(ticket.updatedAt)}</span>
                      <span className={`mc-status ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                      {ticket.unreadStaffMessages ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cmblue-500 text-[10px] font-bold text-white">
                          {ticket.unreadStaffMessages}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-8 text-center">
                <FaHeadset className="mx-auto h-8 w-8 text-cmblue-200" />
                <p className="mt-2 text-xs font-semibold text-slate-500">No conversations found</p>
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
                    <FaUserCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950">{selectedConversation.user?.username || 'User'}</p>
                    <p className="text-[10px] text-slate-500">
                      {selectedConversation.subject} • {selectedConversation.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`mc-status ${getStatusColor(selectedConversation.status)}`}>
                    {selectedConversation.status}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-4" style={{ minHeight: '400px', maxHeight: '500px' }}>
                {messages.length > 0 ? (
                  messages.map((msg) => {
                    const isStaff = msg.senderRole !== 'user';
                    return (
                      <div key={msg.id} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                          isStaff
                            ? 'bg-cmblue-500 text-white rounded-br-sm'
                            : 'bg-white text-slate-900 border border-sky-100 rounded-bl-sm shadow-sm'
                        }`}>
                          <div className={`mb-1 flex items-center gap-1 text-[10px] font-bold ${isStaff ? 'text-white/70' : 'text-slate-400'}`}>
                            {isStaff ? (
                              <>
                                <FaShieldAlt className="h-3 w-3" />
                                {msg.senderRole === 'admin' ? 'Admin' : 'Employee'}
                              </>
                            ) : (
                              <>
                                <FaUserCircle className="h-3 w-3" />
                                User
                              </>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                          <div className={`mt-1 flex items-center gap-1 text-[10px] ${isStaff ? 'text-white/70' : 'text-slate-400'}`}>
                            <span>{formatTime(msg.createdAt)}</span>
                            {!isStaff && (
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
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Actions */}
              <div className="border-t border-sky-100 p-3">
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedConversation.status !== 'closed' && (
                    <>
                      {selectedConversation.status !== 'pending' && (
                        <button
                          onClick={() => updateTicketStatus(selectedConversation.id, 'pending')}
                          className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition"
                        >
                          Mark Pending
                        </button>
                      )}
                      {selectedConversation.status !== 'resolved' && (
                        <button
                          onClick={() => updateTicketStatus(selectedConversation.id, 'resolved')}
                          className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => updateTicketStatus(selectedConversation.id, 'closed')}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                      >
                        Close
                      </button>
                    </>
                  )}
                  {selectedConversation.status === 'closed' && (
                    <button
                      onClick={() => updateTicketStatus(selectedConversation.id, 'open')}
                      className="rounded-lg bg-cmblue-50 px-3 py-1.5 text-xs font-bold text-cmblue-700 hover:bg-cmblue-100 transition"
                    >
                      Reopen
                    </button>
                  )}
                </div>

                {/* Response Input */}
                {selectedConversation.status !== 'closed' && (
                  <div className="flex items-end gap-2">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendResponse();
                        }
                      }}
                      placeholder="Type a response..."
                      rows={1}
                      className="mc-input flex-1 resize-none"
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                    <button
                      onClick={sendResponse}
                      disabled={sending || !responseText.trim()}
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
                )}
              </div>
            </>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <FaHeadset className="mx-auto h-12 w-12 text-cmblue-200" />
                <p className="mt-3 text-sm font-semibold text-slate-500">Select a conversation to view details</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}