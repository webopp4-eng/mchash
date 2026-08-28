import Link from 'next/link';
import Logo from '@/components/Logo';
import SiteFooter from '@/components/SiteFooter';
import { LEGAL_LAST_UPDATED, getSupportEmail } from '@/lib/legal';

/**
 * Shared layout for the public legal pages (/terms, /privacy-policy,
 * /risk-disclosure). Clean, professional, readable layout using the existing
 * MCHash.site design system. These pages are accessible without logging in.
 */
export default function LegalPageShell({
  title,
  subtitle,
  version,
  children,
}: {
  title: string;
  subtitle?: string;
  version: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 bg-[radial-gradient(circle_at_top,rgba(14,161,255,0.10),transparent_28%)]">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={36} />
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-sky-100 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-cmblue-200 hover:text-cmblue-600"
            >
              ← Back to Home
            </Link>
          </div>

          <div className="mc-card !p-5 sm:!p-8">
            <header className="mb-6 border-b border-sky-100 pb-5">
              <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">{title}</h1>
              {subtitle && <p className="mt-1 text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
              <p className="mt-3 inline-flex items-center rounded-full bg-cmblue-50 px-3 py-1 text-[11px] font-bold text-cmblue-700 ring-1 ring-cmblue-100">
                Last Updated: {LEGAL_LAST_UPDATED} (version {version})
              </p>
            </header>

            <div className="legal-content space-y-6 text-sm leading-relaxed text-slate-700">{children}</div>
          </div>

          {/* Cross-links to the other legal documents */}
          <div className="mt-6 rounded-[20px] border border-sky-100/90 bg-white/80 p-4 shadow-[0_18px_50px_rgba(0,139,255,0.08)] backdrop-blur-xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Related documents</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">
              <Link href="/terms" className="text-cmblue-600 hover:text-cmblue-700">Terms &amp; Conditions</Link>
              <Link href="/privacy-policy" className="text-cmblue-600 hover:text-cmblue-700">Privacy Policy</Link>
              <Link href="/risk-disclosure" className="text-cmblue-600 hover:text-cmblue-700">Risk Disclosure</Link>
              <a href={`mailto:${getSupportEmail()}`} className="text-cmblue-600 hover:text-cmblue-700">Contact / Support</a>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

/** Numbered section heading + body used inside legal pages. */
export function LegalSection({
  number,
  title,
  children,
}: {
  number?: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-6">
      <h2 className="mb-2 text-sm font-bold text-slate-950 sm:text-base">
        {typeof number === 'number' ? `${number}. ` : ''}
        {title}
      </h2>
      <div className="space-y-2 text-slate-600">{children}</div>
    </section>
  );
}

/** Bulleted list styled for legal content. */
export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/** Emphasized call-out block (e.g. placeholders or important notes). */
export function LegalNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-cmblue-100 bg-cmblue-50/60 px-4 py-3 text-slate-700">
      {children}
    </div>
  );
}
