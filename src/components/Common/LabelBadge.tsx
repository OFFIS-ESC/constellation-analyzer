import { getContrastColor } from '../../utils/colorUtils';

/**
 * LabelBadge - Displays a single label as a colored badge
 *
 * Features:
 * - Pill-shaped design
 * - Auto-contrast text color
 * - Truncation with ellipsis
 * - Tooltip on hover (via title attribute)
 */

interface Props {
  name: string;
  color: string;
  maxWidth?: string;
  size?: 'sm' | 'md';
}

const LabelBadge = ({ name, color, maxWidth = '120px', size = 'sm' }: Props) => {
  const textColor = getContrastColor(color);

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-block rounded-full font-medium whitespace-nowrap overflow-hidden text-ellipsis ${sizeClasses}`}
      style={{
        backgroundColor: color,
        color: textColor,
        maxWidth,
      }}
      title={name}
    >
      {name}
    </span>
  );
};

export default LabelBadge;
