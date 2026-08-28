import Link from 'next/link';
import Logo from '@/components/Logo';
import { getSupportEmail } from '@/lib/legal';

/**
 * Global site footer — Terms & Conditions, Privacy Policy, Risk Disclosure
 * and Contact/Support. These pages are accessible without logging in.
 */
export default function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-sky-100/80 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="text-xs font-bold text-slate-700">MCHash.site</span>
        </div>

        <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold">
          <Link href="/terms" className="text-slate-500 transition-colors hover:text-cmblue-600">
            Terms &amp; Conditions
          </Link>
          <Link href="/privacy-policy" className="text-slate-500 transition-colors hover:text-cmblue-600">
            Privacy Policy
          </Link>
          <Link href="/risk-disclosure" className="text-slate-500 transition-colors hover:text-cmblue-600">
            Risk Disclosure
          </Link>
          <a
            href={`mailto:${getSupportEmail()}`}
            className="text-slate-500 transition-colors hover:text-cmblue-600"
          >
            Contact / Support
          </a>
        </nav>

        <p className="text-[10px] text-slate-400">© {new Date().getFullYear()} MCHash.site. All rights reserved.</p>
      </div>
    </footer>
  );
}
