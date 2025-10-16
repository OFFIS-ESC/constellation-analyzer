import { KeyboardEvent } from 'react';
import type { EdgeDirectionality } from '../../types';

/**
 * EdgeTypeFormFields - Reusable form fields for add/edit relation types
 *
 * Features:
 * - All fields visible
 * - Compact single-row layout for name and color
 * - Keyboard accessible
 * - Consistent between add and edit modes
 */

interface Props {
  name: string;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  defaultDirectionality: EdgeDirectionality;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onStyleChange: (value: 'solid' | 'dashed' | 'dotted') => void;
  onDefaultDirectionalityChange: (value: EdgeDirectionality) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  nameInputRef?: React.RefObject<HTMLInputElement>;
  autoFocusName?: boolean;
}

const EdgeTypeFormFields = ({
  name,
  color,
  style,
  defaultDirectionality,
  onNameChange,
  onColorChange,
  onStyleChange,
  onDefaultDirectionalityChange,
  onKeyDown,
  nameInputRef,
  autoFocusName = false,
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
      {/* Name, Color, and Line Style - Single row */}
      <div>
        <div className="flex items-end gap-2">
          {/* Name */}
          <div className="flex-1 min-w-0">
            <label htmlFor="edge-type-name" className="block text-xs font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edge-type-name"
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="e.g., Supervises"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-required="true"
              autoFocus={autoFocusName}
            />
          </div>

          {/* Color */}
          <div className="w-20 flex-shrink-0">
            <label htmlFor="edge-type-color-picker" className="block text-xs font-medium text-gray-700 mb-1">
              Color <span className="text-red-500">*</span>
            </label>
            <input
              id="edge-type-color-picker"
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="h-8 w-full rounded cursor-pointer border border-gray-300"
              aria-label="Color picker"
            />
          </div>

          {/* Line Style */}
          <div className="w-32 flex-shrink-0">
            <label htmlFor="edge-type-style" className="block text-xs font-medium text-gray-700 mb-1">
              Style <span className="text-red-500">*</span>
            </label>
            <select
              id="edge-type-style"
              value={style}
              onChange={(e) => onStyleChange(e.target.value as 'solid' | 'dashed' | 'dotted')}
              onKeyDown={onKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Line Style Preview */}
      <div>
        {renderStylePreview(style, color)}
      </div>

      {/* Default Directionality */}
      <div>
        <label htmlFor="edge-type-directionality" className="block text-xs font-medium text-gray-700 mb-1">
          Default Directionality <span className="text-red-500">*</span>
        </label>
        <select
          id="edge-type-directionality"
          value={defaultDirectionality}
          onChange={(e) => onDefaultDirectionalityChange(e.target.value as EdgeDirectionality)}
          onKeyDown={onKeyDown}
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

export default EdgeTypeFormFields;
