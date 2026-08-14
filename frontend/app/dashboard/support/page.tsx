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
    <div className="mc-page">
      <section className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Support</p>
          <h1 className="mc-title">Help & Support</h1>
          <p className="mc-subtitle">FAQs, guides, tutorials, and support tickets</p>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl bg-sky-50/50 p-1.5 ring-1 ring-sky-100">
        {[
          { id: 'faq', label: 'FAQ', icon: FaQuestionCircle },
          { id: 'knowledge', label: 'Knowledge Base', icon: FaBook },
          { id: 'tutorial', label: 'Tutorials', icon: FaMobileAlt },
          { id: 'tickets', label: 'Support Tickets', icon: FaTicketAlt },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-cmblue-500 text-white shadow-[0_10px_24px_rgba(0,130,255,0.22)]'
                : 'text-slate-600 hover:bg-white hover:text-cmblue-700'
            }}`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-[22px] border border-rose-200/80 bg-rose-50/80 p-4 backdrop-blur-xl">
          <div className="text-sm font-semibold text-rose-600">{error}</div>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-[22px] border border-emerald-200/80 bg-emerald-50/80 p-4 backdrop-blur-xl">
          <div className="text-sm font-semibold text-emerald-600">{success}</div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <section className="mc-card">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-950">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500">Quick answers to common questions</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-sky-100 bg-sky-50/50 transition-all">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 font-semibold text-slate-950 hover:text-cmblue-700">
                  <span className="text-sm">{faq.q}</span>
                  <span className="text-cmblue-500 transition-transform group-open:rotate-180">↓</span>
                </summary>
                <div className="border-t border-sky-100 px-4 py-3">
                  <p className="text-xs leading-relaxed text-slate-600">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Knowledge Base Tab */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <section className="mc-card">
              <div className="mb-3 flex items-center gap-2">
                <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
                  <FaShieldAlt className="h-4 w-4" />
                </span>
                <h3 className="font-bold text-slate-950">Security Best Practices</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• Never share your private key or seed phrase</li>
                <li>• Always verify official website URLs</li>
                <li>• Enable 2FA when available</li>
                <li>• Use strong, unique passwords</li>
                <li>• Never click suspicious links</li>
              </ul>
            </section>

            <section className="mc-card">
              <div className="mb-3 flex items-center gap-2">
                <span className="mc-stat-icon bg-purple-50 text-purple-600">
                  <FaWallet className="h-4 w-4" />
                </span>
                <h3 className="font-bold text-slate-950">Supported Wallets</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li><span className="font-semibold text-slate-800">Ethereum:</span> MetaMask, Rainbow</li>
                <li><span className="font-semibold text-slate-800">Solana:</span> Phantom, Solflare</li>
                <li><span className="font-semibold text-slate-800">BNB Chain:</span> MetaMask, Trust</li>
                <li><span className="font-semibold text-slate-800">Mobile:</span> WalletConnect</li>
              </ul>
            </section>

            <section className="mc-card">
              <div className="mb-3 flex items-center gap-2">
                <span className="mc-stat-icon bg-emerald-50 text-emerald-600">
                  <FaClock className="h-4 w-4" />
                </span>
                <h3 className="font-bold text-slate-950">Rewards Schedule</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• Rewards accrue real-time</li>
                <li>• Daily automatic payouts</li>
                <li>• Minimum: 0.001 USDT</li>
                <li>• Bonus on completion</li>
                <li>• Referrals credited instantly</li>
              </ul>
            </section>

            <section className="mc-card">
              <div className="mb-3 flex items-center gap-2">
                <span className="mc-stat-icon bg-amber-50 text-amber-600">
                  <FaCube className="h-4 w-4" />
                </span>
                <h3 className="font-bold text-slate-950">Supported Chains</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• <span className="font-semibold">Ethereum:</span> ERC-20 USDT</li>
                <li>• <span className="font-semibold">Solana:</span> SPL USDT</li>
                <li>• <span className="font-semibold">BNB:</span> BEP-20 USDT</li>
              </ul>
            </section>

            <section className="mc-card">
              <div className="mb-3 flex items-center gap-2">
                <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
                  <FaCoins className="h-4 w-4" />
                </span>
                <h3 className="font-bold text-slate-950">Earning Methods</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• <span className="font-semibold">Mining:</span> Your plan rewards</li>
                <li>• <span className="font-semibold">Referrals:</span> 3-8% commissions</li>
                <li>• <span className="font-semibold">Hash Renting:</span> Direct yields</li>
                <li>• <span className="font-semibold">Bonus:</span> Plan completion</li>
              </ul>
            </section>

            <section className="mc-card">
              <div className="mb-3 flex items-center gap-2">
                <span className="mc-stat-icon bg-sky-50 text-cmblue-600">
                  <FaServer className="h-4 w-4" />
                </span>
                <h3 className="font-bold text-slate-950">Platform Fees</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• No mining purchase fees</li>
                <li>• Withdrawal: 0.5% (min 1 USDT)</li>
                <li>• Hash renting: Free</li>
                <li>• Support: 24/7 free access</li>
              </ul>
            </section>
          </div>
        </div>
      )}

      {/* Tutorial Tab */}
      {activeTab === 'tutorial' && (
        <div className="space-y-4">
          {tutorials.map((tutorial) => (
            <section key={tutorial.title} className="mc-card">
              <div className="mb-4 flex items-center gap-3">
                <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
                  <tutorial.icon className="h-4 w-4" />
                </span>
                <h3 className="font-bold text-slate-950">{tutorial.title}</h3>
              </div>
              <ol className="space-y-3">
                {tutorial.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cmblue-50 text-xs font-bold text-cmblue-600">
                      {i + 1}
                    </span>
                    <span className="text-xs leading-relaxed text-slate-600">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Create Ticket */}
          <section className="mc-card">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-950">Create Support Ticket</h2>
              <p className="text-xs text-slate-500">Describe your issue and our team will help you</p>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's your issue?"
                className="mc-input"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mc-input"
                >
                  <option value="low">Low Priority</option>
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
                className="mc-input"
              />
              <button
                onClick={submitTicket}
                disabled={submitting || !subject || !message}
                className="mc-button w-full"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="h-3.5 w-3.5" />
                    Submit Ticket
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Existing Tickets */}
          <section className="mc-card">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-950">Your Support Tickets</h2>
              <p className="text-xs text-slate-500">Track your support requests</p>
            </div>
            {tickets.length > 0 ? (
              <div className="space-y-2">
                {tickets.map((ticket: any) => (
                  <div key={ticket.id} className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-950">{ticket.subject}</p>
                      <span className={`mc-status ${
                        ticket.status === 'open' ? 'bg-emerald-50 text-emerald-600' :
                        ticket.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                        ticket.status === 'resolved' || ticket.status === 'closed' ? 'bg-slate-100 text-slate-500' : 'bg-cmblue-50 text-cmblue-600'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {ticket.category} • Priority: {ticket.priority || 'Normal'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <FaHeadset className="mx-auto h-10 w-10 text-cmblue-200" />
                <p className="mt-3 text-sm font-semibold text-slate-500">No tickets yet</p>
                <p className="text-xs text-slate-400">Create one above if you need help</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
