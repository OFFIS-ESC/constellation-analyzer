import { KeyboardEvent } from 'react';
import IconPopover from './IconPopover';
import ShapeSelector from './ShapeSelector';
import type { NodeShape } from '../../types';

/**
 * TypeFormFields - Reusable form fields for add/edit actor types
 *
 * Features:
 * - All fields visible
 * - Keyboard accessible
 * - Consistent between add and edit modes
 */

interface Props {
  name: string;
  color: string;
  shape: NodeShape;
  icon: string;
  description: string;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onShapeChange: (value: NodeShape) => void;
  onIconChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  nameInputRef?: React.RefObject<HTMLInputElement>;
  autoFocusName?: boolean;
}

const TypeFormFields = ({
  name,
  color,
  shape,
  icon,
  description,
  onNameChange,
  onColorChange,
  onShapeChange,
  onIconChange,
  onDescriptionChange,
  onKeyDown,
  nameInputRef,
  autoFocusName = false,
}: Props) => {

  return (
    <div className="space-y-3">
      {/* Name, Color, and Icon - Single row */}
      <div>
        <div className="flex items-end gap-2">
          {/* Name */}
          <div className="flex-1 min-w-0">
            <label htmlFor="type-name" className="block text-xs font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="type-name"
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="e.g., Department"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-required="true"
              autoFocus={autoFocusName}
            />
          </div>

          {/* Color */}
          <div className="w-20 flex-shrink-0">
            <label htmlFor="type-color-picker" className="block text-xs font-medium text-gray-700 mb-1">
              Color <span className="text-red-500">*</span>
            </label>
            <input
              id="type-color-picker"
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="h-8 w-full rounded cursor-pointer border border-gray-300"
              aria-label="Color picker"
            />
          </div>

          {/* Icon */}
          <div className="flex-shrink-0">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Icon
            </label>
            <IconPopover selectedIcon={icon} onSelect={onIconChange} />
          </div>
        </div>
      </div>

      {/* Shape Selector */}
      <ShapeSelector value={shape} onChange={onShapeChange} color={color} />

      {/* Description */}
      <div>
        <label
          htmlFor="type-description"
          className="block text-xs font-medium text-gray-700 mb-1"
        >
          Description (optional)
        </label>
        <textarea
          id="type-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Brief description of this actor type"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
    </div>
  );
};

export default TypeFormFields;
