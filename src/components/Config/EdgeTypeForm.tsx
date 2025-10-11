import type { EdgeDirectionality } from '../../types';

/**
 * EdgeTypeForm - Reusable form fields for creating/editing edge types
 *
 * Features:
 * - Name input
 * - Color picker (visual + text input)
 * - Line style selector (solid/dashed/dotted)
 * - Default directionality selector
 * - Visual style preview
 */

interface Props {
  name: string;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  defaultDirectionality?: EdgeDirectionality;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onStyleChange: (value: 'solid' | 'dashed' | 'dotted') => void;
  onDefaultDirectionalityChange?: (value: EdgeDirectionality) => void;
}

const EdgeTypeForm = ({
  name,
  color,
  style,
  defaultDirectionality = 'directed',
  onNameChange,
  onColorChange,
  onStyleChange,
  onDefaultDirectionalityChange,
}: Props) => {
  const renderStylePreview = (lineStyle: 'solid' | 'dashed' | 'dotted', lineColor: string) => {
    const strokeDasharray = {
      solid: '0',
      dashed: '8,4',
      dotted: '2,4',
    }[lineStyle];

    return (
      <svg width="100%" height="20" className="mt-1">
        <line
          x1="0"
          y1="10"
          x2="100%"
          y2="10"
          stroke={lineColor}
          strokeWidth="3"
          strokeDasharray={strokeDasharray}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., Supervises, Communicates With"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Color *
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="h-10 w-20 rounded cursor-pointer"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            placeholder="#6366f1"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Line Style *
        </label>
        <select
          value={style}
          onChange={(e) => onStyleChange(e.target.value as 'solid' | 'dashed' | 'dotted')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
        {renderStylePreview(style, color)}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Default Directionality *
        </label>
        <select
          value={defaultDirectionality}
          onChange={(e) => onDefaultDirectionalityChange?.(e.target.value as EdgeDirectionality)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="directed">Directed (→) - One-way</option>
          <option value="bidirectional">Bidirectional (↔) - Two-way</option>
          <option value="undirected">Undirected (—) - No direction</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          New relations of this type will use this directionality by default
        </p>
      </div>
    </div>
  );
};

export default EdgeTypeForm;
