'use client';

import { useEffect, useState } from 'react';
import {
  FaHeadset, FaTicketAlt, FaQuestionCircle, FaBook, FaPaperPlane,
  FaWallet, FaChartLine, FaGift, FaClock, FaShieldAlt, FaMobileAlt, FaDesktop, FaQrcode, FaCube, FaServer, FaCoins
} from 'react-icons/fa';
import { apiFetch, getUser } from '@/lib/auth';

const faqs = [
  {
    q: 'How do I start mining?',
    a: 'Connect your wallet, navigate to the Plans page from the dashboard, select a mining package, and purchase it using your platform balance or wallet.',
  },
  {
    q: 'When can I withdraw earnings?',
    a: 'You can request withdrawals anytime from the Withdrawals page. Funds are sent to your connected wallet within 24 hours after admin approval.',
  },
  {
    q: 'How are mining rewards calculated?',
    a: 'Daily earnings are calculated based on your plan hash rate and daily rate percentage. Rewards accrue in real-time and can be seen in your mining dashboard.',
  },
  {
    q: 'What wallets are supported?',
    a: 'We support Solana, Ethereum, and BNB Smart Chain wallets including Phantom, MetaMask, Trust Wallet, and WalletConnect.',
  },
  {
    q: 'What is the minimum withdrawal amount?',
    a: 'The minimum withdrawal is 10 USDT. There are no fees for internal mining withdrawals.',
  },
  {
    q: 'How does the referral program work?',
    a: 'Share your unique referral link from the Referrals page. You earn 3-8% commission on each referred user purchase, depending on your package.',
  },
  {
    q: 'What happens when my mining plan expires?',
    a: 'Your plan automatically completes and mining stops. You receive a bonus reward at completion. You can purchase a new plan from the Plans page.',
  },
  {
    q: 'Can I mine multiple plans at once?',
    a: 'No, you can only have one active mining package at a time. When it completes, you may start another.',
  },
];

const tutorials = [
  {
    title: 'Connect Your Wallet',
    icon: FaWallet,
    steps: [
      'Go to the homepage and click "Connect Wallet"',
      'Select your preferred wallet (MetaMask, Phantom, Trust Wallet, etc.)',
      'On mobile, click the wallet app icon to open your wallet app',
      'Sign the message to verify ownership',
      'Your wallet is now connected and you can access the dashboard',
    ],
  },
  {
    title: 'Buy a Mining Plan',
    icon: FaChartLine,
    steps: [
      'Ensure you have sufficient platform balance (USDT)',
      'Navigate to Dashboard → Plans',
      'Select the plan that fits your budget and duration',
      'Click "Buy Plan" — your balance is deducted and mining starts instantly',
      'Track progress on the Mining page in real-time',
    ],
  },
  {
    title: 'Withdraw Earnings',
    icon: FaGift,
    steps: [
      'Go to Dashboard → Withdrawals',
      'Enter the amount and select your chain',
      'Submit the withdrawal request',
      'Wait for admin approval (usually within 24 hours)',
      'Funds are sent to your connected wallet address',
    ],
  },
  {
    title: 'Use Hash Renting',
    icon: FaChartLine,
    steps: [
      'Navigate to Dashboard → Plans and scroll to Hash Renting',
      'Choose a hash renting package with your desired hash power',
      'Rent the hash power — mining starts immediately',
      'Earn yields directly to your platform balance',
    ],
  },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'faq' | 'knowledge' | 'tutorial' | 'tickets'>('faq');
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
        body: JSON.stringify({ subject, category, priority, message }),
      });
      setSuccess('Support ticket created successfully! Our team will respond shortly.');
      setSubject('');
      setMessage('');
      setCategory('general');
      setPriority('normal');
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
        <h1 className="text-2xl font-bold text-slate-900">Support Center</h1>
        <p className="mt-1 text-sm text-slate-500">Get help, find answers, and contact support</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 rounded-[20px] border border-slate-200/80 bg-white p-1.5 shadow-card">
        {[
          { id: 'faq', label: 'FAQ', icon: FaQuestionCircle },
          { id: 'knowledge', label: 'Knowledge Base', icon: FaBook },
          { id: 'tutorial', label: 'Tutorial', icon: FaMobileAlt },
          { id: 'tickets', label: 'My Tickets', icon: FaTicketAlt },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-cmblue-50 text-cmblue-700 shadow-[0_0_15px_rgba(17,120,250,0.15)]'
                : 'text-slate-500 hover:text-slate-800'
            }}`}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-slate-900">Frequently Asked Questions</h2>
          <div className="mt-4 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-slate-200/80 bg-slate-50 p-4 open:bg-cmblue-50/50">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-900">
                  {faq.q}
                  <span className="text-slate-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-xs text-slate-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Knowledge Base Tab */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold text-slate-900">Knowledge Base</h2>
            <p className="mt-1 text-xs text-slate-500">Guides and articles to help you get the most from CM HASH</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <FaShieldAlt className="h-4 w-4 text-cmblue-600" />
                <h3 className="text-sm font-semibold text-slate-900">Security Best Practices</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• Never share your private key or seed phrase</li>
                <li>• Always verify you are on the official CM Hash site</li>
                <li>• Enable 2FA on your wallet app when available</li>
                <li>• Use strong, unique passwords for your accounts</li>
                <li>• Never click suspicious links in emails or messages</li>
              </ul>
            </div>

            <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <FaWallet className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-slate-900">Supported Wallets</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• <span className="font-semibold text-slate-800">Ethereum:</span> MetaMask, Rainbow, Coinbase Wallet</li>
                <li>• <span className="font-semibold text-slate-800">Solana:</span> Phantom, Solflare, Trust Wallet</li>
                <li>• <span className="font-semibold text-slate-800">BNB Chain:</span> MetaMask, Trust Wallet</li>
                <li>• <span className="font-semibold text-slate-800">Mobile:</span> WalletConnect deep linking</li>
              </ul>
            </div>

            <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <FaClock className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">Mining Rewards Schedule</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• Rewards accrue every block in real-time</li>
                <li>• Daily payouts are processed automatically</li>
                <li>• Minimum payout: 0.001 USDT per session</li>
                <li>• Bonus rewards are credited on plan completion</li>
                <li>• Referral commissions are credited instantly</li>
              </ul>
            </div>

            <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <FaCube className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900">Supported Chains</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• <span className="font-semibold text-slate-800">Ethereum (ETH):</span> ERC-20 USDT</li>
                <li>• <span className="font-semibold text-slate-800">Solana (SOL):</span> SPL USDT</li>
                <li>• <span className="font-semibold text-slate-800">BNB Smart Chain:</span> BEP-20 USDT</li>
              </ul>
            </div>

            <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <FaCoins className="h-4 w-4 text-cmblue-600" />
                <h3 className="text-sm font-semibold text-slate-900">Earning Methods</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• <span className="font-semibold text-slate-800">Mining:</span> Earn from your active plan</li>
                <li>• <span className="font-semibold text-slate-800">Referrals:</span> 3-8% commission on referred purchases</li>
                <li>• <span className="font-semibold text-slate-800">Hash Renting:</span> Rent hash power for yields</li>
                <li>• <span className="font-semibold text-slate-800">Bonus Rewards:</span> Extra rewards on plan completion</li>
              </ul>
            </div>

            <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <FaServer className="h-4 w-4 text-sky-600" />
                <h3 className="text-sm font-semibold text-slate-900">Platform Fees</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• No fees for mining plan purchases</li>
                <li>• Withdrawal fee: 0.5% (min 1 USDT)</li>
                <li>• Hash renting management: Free</li>
                <li>• Support: Free 24/7 via ticket system</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Tab */}
      {activeTab === 'tutorial' && (
        <div className="space-y-6">
          <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold text-slate-900">Step-by-Step Tutorials</h2>
            <p className="mt-1 text-xs text-slate-500">Walkthroughs to help you get started fast</p>
          </div>

          <div className="space-y-4">
            {tutorials.map((tutorial) => (
              <div key={tutorial.title} className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-card">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cmblue-50 text-cmblue-600">
                    <tutorial.icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900">{tutorial.title}</h3>
                </div>
                <ol className="space-y-3">
                  {tutorial.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cmblue-50 text-xs font-bold text-cmblue-600">
                        {i + 1}
                      </span>
                      <span className="text-xs text-slate-600 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Create Ticket */}
          <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold text-slate-900">Create Support Ticket</h2>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cmblue-400 focus:ring-1 focus:ring-cmblue-200"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cmblue-400 focus:ring-1 focus:ring-cmblue-200"
                >
                  <option value="general">General</option>
                  <option value="mining">Mining</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="deposit">Deposit</option>
                  <option value="referral">Referral</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                </select>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cmblue-400 focus:ring-1 focus:ring-cmblue-200"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue in detail..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cmblue-400 focus:ring-1 focus:ring-cmblue-200"
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
          <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold text-slate-900">Your Tickets</h2>
            {tickets.length > 0 ? (
              <div className="mt-4 space-y-2">
                {tickets.map((ticket: any) => (
                  <div key={ticket.id} className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-900">{ticket.subject}</p>
                      <span className={`text-[10px] font-medium ${
                        ticket.status === 'open' ? 'text-emerald-600' :
                        ticket.status === 'pending' ? 'text-amber-600' :
                        ticket.status === 'resolved' || ticket.status === 'closed' ? 'text-slate-500' : 'text-cmblue-600'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {ticket.category} • Priority: {ticket.priority || 'Normal'} • {new Date(ticket.createdAt).toLocaleString()}
                    </p>
                    {ticket.messages && ticket.messages.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {ticket.messages.map((msg: any) => (
                          <div
                            key={msg.id}
                            className={`rounded-lg bg-white p-2 text-xs shadow-sm ${
                              msg.senderRole === 'user' ? 'ml-6' : 'mr-6 border border-cmblue-200'
                            }`}
                          >
                            <p className="text-[10px] text-slate-500 capitalize">{msg.senderRole}</p>
                            <p className="mt-0.5 text-slate-700">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">No tickets yet. Create one above if you need help.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
