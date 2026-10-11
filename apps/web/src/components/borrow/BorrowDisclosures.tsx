'use client';

import { Scale } from 'lucide-react';

const RULES = [
  'Azeebo+ is not a lender and does not decide who qualifies. Every offer on this page belongs to the partner named on the card.',
  'Your application, income details and credit information go to the partner directly. Azeebo+ never receives or stores them.',
  'Interest is shown as a range because the approved rate depends on the partner\u2019s credit assessment of you, not on this listing.',
  'Total repayment figures are illustrations at a stated rate, not quotes. Confirm the final rate, fees and total cost with the partner in writing before you accept.',
  'Applying may involve a hard or soft credit check, which can affect your credit record.',
  'Borrow only what you can repay. Late repayment attracts fees and can be reported to credit bureaus.',
];

/**
 * Standing disclosure block for the Borrow page. Kept next to the offers rather
 * than on a separate legal route because the disclosures are only meaningful
 * beside the figures they qualify.
 */
export function BorrowDisclosures(): React.JSX.Element {
  return (
    <section
      aria-labelledby="borrow-disclosures-heading"
      className="az-glass border border-az-glass-border p-6 sm:p-8"
    >
      <div className="flex items-center gap-3 mb-5">
        <Scale size={20} className="text-az-flame" />
        <h2 id="borrow-disclosures-heading" className="text-lg font-bold text-az-ink">
          Before you borrow
        </h2>
      </div>

      <ul className="space-y-3 text-sm text-az-ink/65">
        {RULES.map((rule) => (
          <li key={rule} className="flex gap-3">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-az-ink/30" aria-hidden="true" />
            <span>{rule}</span>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-xs text-az-ink/40">
        Verify a partner{'\u2019'}s licence reference — printed on its card — with the regulator{' '}
        before sharing any documents or paying any fee up front.
      </p>
    </section>
  );
}
