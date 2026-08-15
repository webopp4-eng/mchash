'use client';

import { useEffect, useState } from 'react';
import { FaHeadset, FaCheckCircle, FaClock, FaExclamationTriangle, FaTimes, FaSearch, FaPaperPlane } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';
import { refreshFinancialData } from '@/lib/financialData';
import { toastEmitter } from '@/components/NotificationToast';

interface SupportTicket {
  id: string;
  userId: string;
  user?: {
    id: string;
    username: string;
    walletAddress: string;
  };
  subject: string;
  category: string;
  priority: string;
  message: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  responses?: Array<{
    id: string;
    message: string;
    createdAt: Date;
    isAdmin: boolean;
  }>;
}

export default function AdminSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [responseText, setResponseText] = useState('');
  const [respondingToId, setRespondingToId] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/support/tickets');
      setTickets(res.tickets || []);
    } catch (err) {
      console.error('Failed to load support tickets:', err);
      toastEmitter.error('Failed to load tickets', 'Could not retrieve support tickets');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      await apiFetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      
      // Update local state
      setTickets(tickets.map(t => 
        t.id === ticketId ? { ...t, status: newStatus as any } : t
      ));
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus as any });
      }
      
      toastEmitter.success('Status Updated', `Ticket status changed to ${newStatus}`);
      await refreshFinancialData();
    } catch (err: any) {
      toastEmitter.error('Update Failed', err.message || 'Failed to update ticket status');
    }
  };

  const submitResponse = async (ticketId: string) => {
    if (!responseText.trim()) {
      toastEmitter.error('Empty Response', 'Please enter a response message');
      return;
    }

    try {
      setRespondingToId(ticketId);
      await apiFetch(`/api/admin/support/tickets/${ticketId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ message: responseText }),
      });
      
      setResponseText('');
      toastEmitter.success('Response Sent', 'Your response has been sent to the user');
      
      // Reload tickets to get updated messages
      await loadTickets();
      
      // If this was the selected ticket, refresh it
      if (selectedTicket?.id === ticketId) {
        const updatedTicket = tickets.find(t => t.id === ticketId);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
      }
    } catch (err: any) {
      toastEmitter.error('Send Failed', err.message || 'Failed to send response');
    } finally {
      setRespondingToId(null);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-emerald-50 text-emerald-600';
      case 'pending':
        return 'bg-amber-50 text-amber-600';
      case 'resolved':
      case 'closed':
        return 'bg-slate-100 text-slate-500';
      default:
        return 'bg-cmblue-50 text-cmblue-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return FaClock;
      case 'resolved':
      case 'closed':
        return FaCheckCircle;
      case 'pending':
        return FaExclamationTriangle;
      default:
        return FaClock;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  const openCount = tickets.filter(t => t.status === 'open').length;
  const pendingCount = tickets.filter(t => t.status === 'pending').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <div className="mc-page">
      <section className="mc-page-header">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-cmblue-600">Support System</p>
            <h1 className="mc-title">User Support Tickets</h1>
            <p className="mc-subtitle max-w-2xl">Manage user support requests, respond to tickets, and track resolutions</p>
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

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Tickets List */}
        <section className="mc-card">
          <div className="mb-4 flex flex-col gap-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mc-input pl-9 w-full"
              />
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {['all', 'open', 'pending', 'resolved'].map((status) => (
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

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left rounded-2xl border p-3 transition-all ${
                    selectedTicket?.id === ticket.id
                      ? 'border-cmblue-300 bg-cmblue-50 ring-2 ring-cmblue-200'
                      : 'border-sky-100 bg-sky-50/50 hover:border-cmblue-200 hover:bg-cmblue-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-950 line-clamp-1">{ticket.subject}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {ticket.user?.username} • {ticket.category}
                      </p>
                    </div>
                    <span className={`mc-status shrink-0 ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-8 text-center">
                <FaHeadset className="mx-auto h-8 w-8 text-cmblue-200" />
                <p className="mt-2 text-xs font-semibold text-slate-500">No tickets found</p>
              </div>
            )}
          </div>
        </section>

        {/* Ticket Details */}
        <section className="mc-card">
          {selectedTicket ? (
            <div className="space-y-4">
              <div className="border-b border-sky-100 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-950">{selectedTicket.subject}</h2>
                    <p className="text-[10px] text-slate-500 mt-1">
                      ID: {selectedTicket.id.slice(0, 8)}
                    </p>
                  </div>
                  <span className={`mc-status ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>

                <div className="mt-3 grid gap-2">
                  <div className="rounded-lg bg-sky-50/50 p-2">
                    <p className="text-[10px] font-bold uppercase text-slate-500">User</p>
                    <p className="text-sm font-semibold text-slate-950">{selectedTicket.user?.username}</p>
                  </div>
                  <div className="rounded-lg bg-sky-50/50 p-2">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Category / Priority</p>
                    <p className="text-sm font-semibold text-slate-950">
                      {selectedTicket.category} • {selectedTicket.priority || 'Normal'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-sky-50/50 p-2">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Created</p>
                    <p className="text-sm font-semibold text-slate-950">
                      {new Date(selectedTicket.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Original Message */}
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2">ORIGINAL MESSAGE</p>
                <div className="rounded-xl bg-sky-50/50 p-3 border border-sky-100">
                  <p className="text-sm text-slate-900">{selectedTicket.message}</p>
                </div>
              </div>

              {/* Responses */}
              {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2">CONVERSATION</p>
                  <div className="space-y-2">
                    {selectedTicket.responses.map((response) => (
                      <div
                        key={response.id}
                        className={`rounded-xl p-3 border ${
                          response.isAdmin
                            ? 'bg-cmblue-50 border-cmblue-100'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <p className="text-[10px] font-bold mb-1 text-slate-600">
                          {response.isAdmin ? '👨‍💼 Admin Response' : '👤 User'} •{' '}
                          {new Date(response.createdAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-900">{response.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Actions */}
              <div className="border-t border-sky-100 pt-4">
                <p className="text-xs font-bold text-slate-500 mb-2">ACTIONS</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTicket.status !== 'closed' && (
                    <>
                      {selectedTicket.status !== 'pending' && (
                        <button
                          onClick={() => updateTicketStatus(selectedTicket.id, 'pending')}
                          className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition"
                        >
                          Mark Pending
                        </button>
                      )}
                      {selectedTicket.status !== 'resolved' && (
                        <button
                          onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                          className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => updateTicketStatus(selectedTicket.id, 'closed')}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Response Form */}
              {selectedTicket.status !== 'closed' && (
                <div className="border-t border-sky-100 pt-4">
                  <p className="text-xs font-bold text-slate-500 mb-2">SEND RESPONSE</p>
                  <div className="space-y-2">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Type your response to send to the user..."
                      className="mc-input resize-none h-24"
                    />
                    <button
                      onClick={() => submitResponse(selectedTicket.id)}
                      disabled={respondingToId !== null || !responseText.trim()}
                      className="mc-button w-full"
                    >
                      {respondingToId === selectedTicket.id ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane className="h-3.5 w-3.5" />
                          Send Response
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <FaHeadset className="mx-auto h-12 w-12 text-cmblue-200" />
                <p className="mt-3 text-sm font-semibold text-slate-500">Select a ticket to view details</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
