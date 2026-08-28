import type { Metadata } from 'next';
import LegalPageShell, { LegalSection, LegalList } from '@/components/legal/LegalPageShell';
import { LEGAL_VERSIONS, getSupportEmail } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'MCHash.site Privacy Policy',
  description:
    'How MCHash.site collects, uses, retains and protects your information, and your privacy rights.',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="MCHash.site Privacy Policy"
      subtitle="This policy explains what information MCHash.site collects, why it is collected, how it is used and protected, and the rights you have regarding your information."
      version={LEGAL_VERSIONS.PRIVACY_POLICY}
    >
      <LegalSection title="Information We Collect">
        <p>Depending on how you use the platform, we may collect:</p>
        <LegalList
          items={[
            'Account information — username, display name, country and other details you provide when creating or maintaining your account.',
            'Email addresses and authentication data — used to identify your account, secure sign-in, and deliver service-related communications.',
            'Transaction records — deposits, withdrawals, mining purchases, rewards and other platform activity, kept for operational and audit purposes.',
            'Payment verification information — where manual payment verification applies, proof-of-payment details you submit (such as transaction references and screenshots) are used solely to verify your deposit.',
            'Device and security information where applicable — IP address, browser/user-agent details and login records, used to secure accounts, prevent fraud and maintain an audit trail.',
            'Cookies and analytics where applicable — used to keep you signed in and to understand how the platform is used.',
          ]}
        />
      </LegalSection>

      <LegalSection title="How We Use Information">
        <p>We use the information we collect to:</p>
        <LegalList
          items={[
            'Operate, maintain and secure the platform.',
            'Create and manage your account and authenticate you.',
            'Process transactions, mining rewards and withdrawals.',
            'Verify payments and prevent fraud, abuse and unauthorized access.',
            'Provide customer support and respond to your requests.',
            'Meet legal, regulatory and audit requirements.',
            'Record your acceptance of our Terms & Conditions, Privacy Policy and Risk Disclosure (including the version and time of acceptance).',
          ]}
        />
      </LegalSection>

      <LegalSection title="Data Retention">
        <p>
          We retain information for as long as your account is active and as needed to provide the
          services, resolve disputes, enforce our agreements and comply with legal obligations.
        </p>
        <LegalList
          items={[
            'Account and transaction records are retained for operational and audit purposes.',
            'Legal acceptance records (which document the version, date and time of acceptance, along with IP address and device information where appropriate) are retained historically and are not overwritten when documents are updated.',
            'Payment verification information is retained as needed to verify deposits and investigate disputes.',
          ]}
        />
      </LegalSection>
      <LegalSection title="How We Share Information">
        <p>
          We do not sell your personal information. Information may be shared only in the following
          circumstances:
        </p>
        <LegalList
          items={[
            'Service providers — with third parties that help us operate the platform, such as payment processing, blockchain infrastructure, hosting, email delivery and identity verification providers, each acting on our instructions.',
            'Legal requirements — where disclosure is required by law, regulation, court order or a request from a competent authority.',
            'Protection of the platform — where reasonably necessary to prevent fraud, security incidents or violations of our Terms & Conditions.',
          ]}
        />
        <p>
          Third-party providers may have their own privacy policies, and their independent actions,
          failures, delays or policies are outside the reasonable control of MCHash.site.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We apply reasonable technical and organizational measures to protect the information we
          hold, including access controls, secure authentication and audit logging.
        </p>
        <p>
          No method of transmission or storage is completely secure, and we cannot guarantee absolute
          security. You are also responsible for keeping your credentials, wallets and devices secure
          as described in our{' '}
          <a href="/terms" className="font-semibold text-cmblue-600 hover:underline">Terms &amp; Conditions</a>.
        </p>
      </LegalSection>

      <LegalSection title="Your Privacy Rights">
        <p>Where applicable under the data protection laws that apply to you, you may have the right to:</p>
        <LegalList
          items={[
            'Access the information we hold about you.',
            'Request correction of inaccurate information.',
            'Request deletion of information where legally permitted.',
            'Object to or restrict certain processing.',
            'Withdraw consent where processing is based on consent.',
            'Lodge a complaint with a supervisory authority.',
          ]}
        />
        <p>
          These rights are not absolute and may be limited by legal, regulatory or operational
          requirements (for example, transaction records that must be retained for audit purposes).
        </p>
      </LegalSection>

      <LegalSection title="Cookies and Analytics">
        <p>
          The platform uses essential cookies (such as a secure, httpOnly sign-in cookie) to keep you
          authenticated. Analytics or optional cookies may be used where applicable to understand how
          the platform is used and to improve it. Where required, we will obtain your consent before
          placing optional cookies.
        </p>
      </LegalSection>

      <LegalSection title="Contact Us About Privacy">
        <p>
          If you have questions, requests or concerns regarding this Privacy Policy or how your
          information is handled, contact us at{' '}
          <a href={`mailto:${getSupportEmail()}`} className="font-semibold text-cmblue-600 hover:underline">
            {getSupportEmail()}
          </a>{' '}
          or through the platform’s support channel.
        </p>
        <p>
          When this policy is materially updated, we will update the “Last Updated” date and, where
          appropriate, ask you to review and accept the updated version before continuing to use the
          platform.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
