import type { ReactNode } from 'react';

/**
 * FieldHint - Tier 1 ambient microcopy
 *
 * The always-visible one-liner that sits directly under a control and states
 * the *consequence* of using it, not the mechanism. Deliberately constrained:
 *
 * - One line. If it needs two sentences, the fact belongs in a concept dialog.
 * - Names what happens to the user's analysis, not what the code does.
 * - Never the place a concept is taught (see `ConceptDialog`, Tier 3).
 *
 * `tone="caution"` is for consequences that reach beyond what the user is
 * looking at - a document-wide edit made from a single-item panel, for example.
 * It is not for errors; validation messages have their own treatment.
 */

export type FieldHintTone = 'neutral' | 'caution';

interface FieldHintProps {
  children: ReactNode;
  tone?: FieldHintTone;
  className?: string;
}

const TONE_CLASSES: Record<FieldHintTone, string> = {
  neutral: 'text-gray-500',
  caution: 'text-amber-700',
};

const FieldHint = ({ children, tone = 'neutral', className = '' }: FieldHintProps) => (
  <p className={`text-xs ${TONE_CLASSES[tone]} ${className}`}>{children}</p>
);

export default FieldHint;
