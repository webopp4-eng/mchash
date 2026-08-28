import type { Metadata } from 'next';
import LegalPageShell, { LegalSection, LegalList } from '@/components/legal/LegalPageShell';
import { LEGAL_VERSIONS } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'MCHash.site Risk Disclosure',
  description:
    'A balanced overview of the risks involved in cryptocurrency and cloud mining, and how to participate responsibly on MCHash.site.',
};

export default function RiskDisclosurePage() {
  return (
    <LegalPageShell
      title="MCHash.site Risk Disclosure"
      subtitle="Cryptocurrency and cloud mining can be rewarding, but it also involves risks. This page explains those risks clearly and calmly so you can make informed decisions."
      version={LEGAL_VERSIONS.RISK_DISCLOSURE}
    >
      <LegalSection title="Cryptocurrency and Mining Involve Risks">
        <p>
          Cryptocurrency and blockchain-related services, including cloud mining, involve inherent
          risks. This is normal for any emerging technology and financial market, and it means that
          outcomes can vary over time.
        </p>
      </LegalSection>

      <LegalSection title="Values and Network Conditions May Change">
        <p>
          The value of cryptocurrencies may rise or fall, and mining performance may be influenced by
          factors such as blockchain network conditions, mining difficulty, network fees, market
          conditions, third-party infrastructure, technical maintenance, service interruptions,
          blockchain upgrades and regulatory developments.
        </p>
        <p>
          Because these factors can change, actual results may differ from any estimates, examples or
          projections shown on the platform.
        </p>
      </LegalSection>

      <LegalSection title="Review Transactions Carefully">
        <p>
          Before confirming any payment, deposit, withdrawal or wallet address, take a moment to
          review the details carefully — including the wallet address, cryptocurrency network, amount
          and recipient information. Blockchain transactions may be irreversible once processed, so a
          few seconds of checking can prevent avoidable losses.
        </p>
      </LegalSection>

      <LegalSection title="Participate Responsibly">
        <p>
          You should only participate with funds you understand and can reasonably afford to put at
          risk. If a potential loss would affect your essential finances, it may be worth reconsidering
          the amount or timing of your participation.
        </p>
      </LegalSection>

      <LegalSection title="No Guaranteed Profits">
        <p>
          MCHash.site does not guarantee profits or specific financial outcomes unless expressly
          stated in a separate written agreement. Mining packages, estimated earnings, historical
          performance and calculators shown on the platform are informational and must not be
          interpreted as a promise of future results.
        </p>
      </LegalSection>

      <LegalSection title="Seek Independent Advice Where Appropriate">
        <p>
          If you are unsure whether cryptocurrency or cloud mining is suitable for your circumstances,
          consider seeking independent financial, tax or legal advice. MCHash.site does not provide
          personalized financial, investment, tax or legal advice.
        </p>
      </LegalSection>

      <LegalSection title="Our Commitment">
        <p>
          MCHash.site is committed to transparency: we explain how the platform works, keep accurate
          records, and make reasonable efforts to maintain reliable service. If you ever have
          questions about how mining works or what a figure on the platform means, our support team is
          happy to help.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
