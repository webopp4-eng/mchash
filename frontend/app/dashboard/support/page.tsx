'use client';

import { useEffect, useState } from 'react';
import { FaHeadset, FaTicketAlt, FaQuestionCircle, FaBook, FaPaperPlane } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

const faqs = [
  { q: 'How do I start mining?', a: 'Connect your wallet, purchase a mining plan from the Plans page, and mining starts instantly.' },
  { q: 'When can I withdraw earnings?', a: 'You can request withdrawals anytime from the Withdrawals page. Funds are sent to your connected wallet.' },
  { q: 'How are rewards calculated?', a: 'Daily earnings are calculated based on your plan hash rate and daily rate percentage.' },
  { q: 'What wallets are supported?', a: 'We support Solana, Ethereum, and BNB Smart Chain wallets including Phantom, MetaMask, Trust Wallet, and more.' },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [showTickets, setShowTickets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const res = await apiFetch('/api/support/tickets');
      setTickets(res.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitTicket = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch('/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify({ subject, category, message }),
      });
      setSuccess('Support ticket created successfully!');
      setSubject('');
      setMessage('');
      setCategory('general');
      loadTickets();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="mt-1 text-sm text-slate-400">We are here to help you</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => setShowTickets(false)}
          className={`flex items-center gap-3 rounded-[20px] border p-4 text-left transition-all ${
            !showTickets ? 'border-cmblue-500/30 bg-cmblue-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
          }`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cmblue-500/20 text-cmblue-400">
            <FaQuestionCircle className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">FAQ</p>
            <p className="text-[10px] text-slate-500">Common questions</p>
          </div>
        </button>
        <button
          onClick={() => setShowTickets(true)}
          className={`flex items-center gap-3 rounded-[20px] border p-4 text-left transition-all ${
            showTickets ? 'border-cmblue-500/30 bg-cmblue-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
          }`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
            <FaTicketAlt className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Tickets</p>
            <p className="text-[10px] text-slate-500">{tickets.length} tickets</p>
          </div>
        </button>
        <button className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/5 p-4 text-left transition-all hover:bg-white/10">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <FaBook className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Knowledge Base</p>
            <p className="text-[10px] text-slate-500">Guides & tutorials</p>
          </div>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">{success}</div>
      )}

      {!showTickets ? (
        /* FAQ View */
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <h2 className="text-sm font-semibold text-cmblue-300">Frequently Asked Questions</h2>
          <div className="mt-4 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-white/10 bg-white/5 p-4">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
                  {faq.q}
                  <span className="text-slate-500 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-xs text-slate-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      ) : (
        /* Tickets View */
        <div className="space-y-4">
          {/* Create Ticket */}
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <h2 className="text-sm font-semibold text-cmblue-300">Create Support Ticket</h2>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cmblue-500/50"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cmblue-500/50"
              >
                <option value="general">General</option>
                <option value="mining">Mining</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="deposit">Deposit</option>
                <option value="technical">Technical</option>
              </select>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue..."
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cmblue-500/50"
              />
              <button
                onClick={submitTicket}
                disabled={submitting || !subject || !message}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cmblue-600 to-cmblue-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="h-4 w-4" />
                    Submit Ticket
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Existing Tickets */}
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <h2 className="text-sm font-semibold text-cmblue-300">Your Tickets</h2>
            {tickets.length > 0 ? (
              <div className="mt-4 space-y-2">
                {tickets.map((ticket: any) => (
                  <div key={ticket.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">{ticket.subject}</p>
                      <span className={`text-[10px] font-medium ${
                        ticket.status === 'open' ? 'text-emerald-400' :
                        ticket.status === 'pending' ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">{ticket.category} • {new Date(ticket.createdAt).toLocaleString()}</p>
                    {ticket.messages && ticket.messages.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {ticket.messages.map((msg: any) => (
                          <div key={msg.id} className={`rounded-lg bg-white/5 p-2 text-xs ${
                            msg.senderRole === 'user' ? 'ml-6' : 'mr-6 border border-cmblue-500/20'
                          }`}>
                            <p className="text-[10px] text-slate-500 capitalize">{msg.senderRole}</p>
                            <p className="mt-0.5 text-slate-300">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">No tickets yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}