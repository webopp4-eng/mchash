import type { Metadata } from 'next';
import LegalPageShell, { LegalSection, LegalList, LegalNote } from '@/components/legal/LegalPageShell';
import { LEGAL_VERSIONS, getJurisdictionDisplay, getSupportEmail } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'MCHash.site Terms & Conditions',
  description:
    'The Terms & Conditions governing the use of MCHash.site ” account responsibility, mining risk disclosures, transactions, withdrawals and platform policies.',
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title="MCHash.site Terms & Conditions"
      subtitle="Please read these Terms & Conditions carefully before creating an account or using the platform."
      version={LEGAL_VERSIONS.TERMS}
    >
      <LegalSection number={1} title="Acceptance of Terms">
        <p>
          By creating an account, accessing, browsing, or using MCHash.site, you confirm that you have
          read, understood, and agreed to these Terms &amp; Conditions, the{' '}
          <a href="/privacy-policy" className="font-semibold text-cmblue-600 hover:underline">Privacy Policy</a>, and the{' '}
          <a href="/risk-disclosure" className="font-semibold text-cmblue-600 hover:underline">Risk Disclosure</a>.
        </p>
        <p>Users who do not agree with these documents must not create an account or use the platform.</p>
      </LegalSection>

      <LegalSection number={2} title="Age Requirement (18+) and Eligibility">
        <p>
          MCHash.site is intended strictly for adults.{' '}
          <strong>
            You must be at least 18 years of age (or the age of legal majority
            in your jurisdiction) to create an account, access, or use the
            platform.
          </strong>
        </p>
        <p>
          By creating an account or using MCHash.site, you represent and
          warrant that you are 18 years of age or older and that you are
          legally permitted to use cryptocurrency services in your
          jurisdiction. The platform is not directed at, and must not be used
          by, minors.
        </p>
        <p>
          Accounts created by, or on behalf of, persons under the age of 18
          violate these Terms, will be terminated without notice, and any
          associated balances may be withheld. MCHash.site may require
          age-verification documentation at any time and may suspend or
          terminate any account that cannot demonstrate eligibility.
        </p>
        <LegalNote>
          <p>
            If you are accessing this platform from a jurisdiction where the
            age of majority is higher than 18, the higher age applies.
          </p>
        </LegalNote>
        <p className="mt-4 font-semibold">Eligibility and Account Responsibility</p>
        <p>Users are responsible for providing accurate and truthful information when creating and maintaining their accounts.</p>
        <p>Each user is responsible for:</p>
        <LegalList
          items={[
            'Maintaining the security of their login credentials.',
            'Protecting their passwords, wallets, devices, and account access.',
            'Ensuring that information submitted to MCHash.site is accurate.',
            'Monitoring their account activity.',
            'Immediately reporting suspected unauthorized access.',
          ]}
        />
        <p>
          MCHash.site is not responsible for losses resulting from a user’s failure to protect their
          passwords, private keys, recovery phrases, devices, or account credentials.
        </p>
        <p>Users must not share their account credentials or permit unauthorized persons to access their accounts.</p>
      </LegalSection>

      <LegalSection number={3} title="Cryptocurrency and Cloud Mining Risk Disclosure">
        <p>Users acknowledge that cryptocurrency and blockchain-related services involve inherent risks.</p>
        <p>
          The value of cryptocurrencies may fluctuate and may be affected by market conditions, network
          activity, technology developments, regulations, and other factors.
        </p>
        <p>Mining performance may also be affected by factors including, but not limited to:</p>
        <LegalList
          items={[
            'Blockchain network conditions.',
            'Mining difficulty.',
            'Network fees.',
            'Cryptocurrency market conditions.',
            'Third-party infrastructure.',
            'Technical maintenance.',
            'Service interruptions.',
            'Blockchain upgrades or changes.',
            'Regulatory developments.',
          ]}
        />
        <p>
          Any figures, estimates, examples, calculations, or projected mining information displayed on
          the platform should not be interpreted as a guaranteed financial return unless explicitly
          stated in a separate written agreement.
        </p>
        <p>
          Users should carefully consider the risks associated with cryptocurrency and cloud mining
          services before making a purchase or financial transaction.
        </p>
        <p>MCHash.site does not provide personalized financial, investment, tax, or legal advice.</p>
      </LegalSection>

      <LegalSection number={4} title="No Guarantee of Profit">
        <p>
          Mining packages, estimated earnings, historical performance, calculators, examples, or other
          figures displayed on MCHash.site must not be interpreted as a guarantee of future results
          unless expressly stated otherwise in writing.
        </p>
        <p>
          Users understand that results may vary depending on applicable technical, operational, and
          market conditions.
        </p>
      </LegalSection>

      <LegalSection number={5} title="User Transaction Responsibility">
        <p>
          Before confirming any payment, deposit, withdrawal request, wallet address, cryptocurrency
          transaction, or financial instruction, users are responsible for carefully reviewing the
          information they provide.
        </p>
        <p>This includes verifying:</p>
        <LegalList
          items={[
            'Wallet addresses.',
            'Cryptocurrency networks.',
            'Payment amounts.',
            'Bank account details.',
            'Mobile money details.',
            'Transaction references.',
            'Recipient information.',
          ]}
        />
        <p>Blockchain transactions may be irreversible once processed or confirmed on the relevant network.</p>
        <p>
          Where a loss occurs because a user provides an incorrect wallet address, selects an incorrect
          network, enters incorrect payment information, sends funds to an incorrect destination, or
          otherwise provides inaccurate transaction instructions, MCHash.site may not be able to
          recover the funds.
        </p>
        <p>
          The platform will make reasonable efforts to investigate reported technical errors where
          appropriate, but recovery of funds cannot be guaranteed where transactions have already been
          processed or completed.
        </p>
      </LegalSection>

      <LegalSection number={6} title="Incorrect or Unsupported Transactions">
        <p>
          Users must only use payment methods, cryptocurrencies, blockchain networks, and deposit
          procedures supported by MCHash.site.
        </p>
        <p>
          If a user sends an unsupported cryptocurrency, uses an incorrect blockchain network, provides
          incorrect payment details, or otherwise completes a transaction outside the instructions
          provided by the platform, recovery may not be possible.
        </p>
        <p>
          Where recovery requires technical, administrative, network, or third-party processes, the
          platform may not guarantee successful recovery.
        </p>
        <p>Users should always verify transaction details before confirming a payment.</p>
      </LegalSection>

      <LegalSection number={7} title="Manual Payments and Deposit Verification">
        <p>
          Where MCHash.site provides manual payment verification or payment methods requiring proof of
          payment, users must submit accurate and authentic transaction information.
        </p>
        <p>
          Submitting false, altered, misleading, duplicated, or fraudulent payment evidence may result
          in suspension or termination of the account.
        </p>
        <p>Deposit approval is subject to verification.</p>
        <p>The submission of a payment screenshot or transaction reference does not automatically guarantee approval.</p>
      </LegalSection>

      <LegalSection number={8} title="Withdrawals and Payouts">
        <p>
          Withdrawal requests are subject to applicable platform requirements, including minimum
          withdrawal amounts, account verification requirements, fraud prevention procedures, technical
          availability, and applicable payment provider or blockchain network conditions.
        </p>
        <p>Users are responsible for ensuring that payout details are accurate before submitting a withdrawal request.</p>
        <p>
          Once a withdrawal has been processed using the information provided by the user,
          MCHash.site may not be able to reverse or recover the transaction.
        </p>
      </LegalSection>

      <LegalSection number={9} title="Technical Errors and Platform Corrections">
        <p>
          MCHash.site may correct obvious technical, accounting, pricing, calculation, display, or
          system errors where reasonably necessary.
        </p>
        <p>
          If an account is incorrectly credited, debited, or affected because of a demonstrable system
          error, MCHash.site reserves the right to investigate and make reasonable corrections to
          restore accurate account records.
        </p>
        <LegalNote>
          <p className="font-semibold">Important:</p>
          <p>
            This section must NOT be used to arbitrarily remove legitimately earned user balances. All
            corrections are logged and supported by clear system records.
          </p>
        </LegalNote>
      </LegalSection>

      <LegalSection number={10} title="Service Availability">
        <p>MCHash.site will make reasonable efforts to maintain reliable access to the platform.</p>
        <p>However, uninterrupted service cannot be guaranteed.</p>
        <p>Services may occasionally be affected by:</p>
        <LegalList
          items={[
            'Scheduled maintenance.',
            'Technical failures.',
            'Internet disruptions.',
            'Blockchain network conditions.',
            'Third-party provider outages.',
            'Security incidents.',
            'Force majeure events.',
            'Regulatory requirements.',
          ]}
        />
        <p>MCHash.site will take reasonable steps to restore affected services where possible.</p>
      </LegalSection>

      <LegalSection number={11} title="Third-Party Services">
        <p>
          MCHash.site may rely on third-party providers for services such as payment processing,
          blockchain infrastructure, wallet services, hosting, APIs, identity verification, and other
          technical services.
        </p>
        <p>
          MCHash.site is not responsible for independent actions, failures, delays, or policies of
          third-party providers outside the reasonable control of the platform.
        </p>
        <p>Users may also be subject to the terms and conditions of applicable third-party providers.</p>
      </LegalSection>

      <LegalSection number={12} title="Fraud, Abuse, and Prohibited Activities">
        <p>Users must not:</p>
        <LegalList
          items={[
            'Create accounts using false information.',
            'Attempt to manipulate platform balances.',
            'Exploit bugs or technical vulnerabilities.',
            'Submit fraudulent payment evidence.',
            'Attempt unauthorized access to accounts or systems.',
            'Use the platform for unlawful activities.',
            'Attempt to interfere with platform operations.',
            'Create multiple accounts to abuse promotions or referral systems.',
            'Engage in money laundering or fraudulent transactions.',
          ]}
        />
        <p>
          MCHash.site reserves the right to investigate suspicious activity and restrict, suspend, or
          terminate accounts where reasonably necessary to protect users and the platform, subject to
          applicable law.
        </p>
      </LegalSection>

      <LegalSection number={13} title="Account Suspension or Termination">
        <p>MCHash.site may suspend or restrict an account where there is reasonable evidence of:</p>
        <LegalList
          items={[
            'Fraud.',
            'Security risks.',
            'Abuse.',
            'Violation of these Terms.',
            'False information.',
            'Unauthorized system activity.',
            'Legal or regulatory requirements.',
          ]}
        />
        <p>
          Where reasonably possible, users should be informed of the reason for significant account
          restrictions.
        </p>
      </LegalSection>
      <LegalSection number={14} title="Limitation of Liability">
        <p>To the maximum extent permitted by applicable law, MCHash.site shall not be liable for losses arising from:</p>
        <LegalList
          items={[
            'User errors.',
            'Incorrect wallet addresses.',
            'Incorrect blockchain network selection.',
            'Incorrect payment information.',
            'Lost passwords or compromised user credentials.',
            'Unauthorized access caused by the user’s failure to secure their account.',
            'Cryptocurrency market fluctuations.',
            'Blockchain network delays or failures.',
            'Third-party service interruptions.',
            'Events outside the reasonable control of MCHash.site.',
          ]}
        />
        <p>
          Nothing in these Terms is intended to exclude liability where such liability cannot legally
          be excluded under applicable law.
        </p>
      </LegalSection>

      <LegalSection number={15} title="User Responsibility and Indemnification">
        <p>
          Users agree to be responsible for their use of MCHash.site and for ensuring that their
          activities comply with applicable laws.
        </p>
        <p>
          To the extent permitted by law, users agree not to hold MCHash.site responsible for claims or
          losses resulting directly from their own inaccurate instructions, misuse of the platform,
          violation of these Terms, or unlawful activities.
        </p>
        <p>
          This clause should not apply where MCHash.site is legally responsible for its own misconduct
          or obligations that cannot legally be excluded.
        </p>
      </LegalSection>

      <LegalSection number={16} title="Privacy and Data Protection">
        <p>
          The collection and processing of personal information are governed by the{' '}
          <a href="/privacy-policy" className="font-semibold text-cmblue-600 hover:underline">MCHash.site Privacy Policy</a>.
        </p>
        <p>Users should be informed about:</p>
        <LegalList
          items={[
            'What information is collected.',
            'Why information is collected.',
            'How information is stored and protected.',
            'Whether information is shared with third-party service providers.',
            'User rights regarding their information.',
            'Applicable data protection practices.',
          ]}
        />
      </LegalSection>

      <LegalSection number={17} title="Taxes">
        <p>
          Users are responsible for determining and complying with any tax obligations applicable to
          their use of the platform, cryptocurrency transactions, mining rewards, or other financial
          activities.
        </p>
        <p>MCHash.site does not provide tax advice.</p>
      </LegalSection>

      <LegalSection number={18} title="Changes to the Platform">
        <p>
          MCHash.site may update, modify, improve, suspend, or discontinue features where reasonably
          necessary for technical, security, operational, or legal reasons.
        </p>
        <p>
          Material changes to these Terms should be communicated to users through the platform where
          reasonably practical.
        </p>
      </LegalSection>

      <LegalSection number={19} title="Changes to These Terms">
        <p>MCHash.site may update these Terms &amp; Conditions from time to time.</p>
        <p>
          When material changes are made, the platform will update the “Last Updated” date and, where
          appropriate, require users to accept the updated Terms before continuing to use relevant
          services.
        </p>
      </LegalSection>

      <LegalSection number={20} title="Governing Law and Dispute Resolution">
        <p>
          These Terms shall be governed by the applicable laws of{' '}
          <strong>{getJurisdictionDisplay()}</strong>, subject to mandatory consumer protection and
          other laws that may apply to the user.
        </p>
        <LegalNote>
          <p>
            Note: the governing jurisdiction is configurable by the platform administrator (via the
            LEGAL_JURISDICTION / NEXT_PUBLIC_LEGAL_JURISDICTION environment variables) and is not
            finalized until legally confirmed. Until then the placeholder “{'[JURISDICTION]'}” is
            displayed.
          </p>
        </LegalNote>
        <p>
          Where legally permitted, users should first contact{' '}
          <a href={`mailto:${getSupportEmail()}`} className="font-semibold text-cmblue-600 hover:underline">
            MCHash.site support
          </a>{' '}
          to attempt to resolve a dispute before formal legal proceedings.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
