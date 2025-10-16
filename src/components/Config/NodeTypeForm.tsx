import IconSelector from './IconSelector';
import ShapeSelector from './ShapeSelector';
import type { NodeShape } from '../../types';

/**
 * NodeTypeForm - Reusable form fields for creating/editing node types
 *
 * Features:
 * - Name input
 * - Color picker (visual + text input)
 * - Shape selector
 * - Icon selector
 * - Description input
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
}

const NodeTypeForm = ({
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
}: Props) => {
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
          placeholder="e.g., Department, Role, Team"
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

      <ShapeSelector value={shape} onChange={onShapeChange} color={color} />

      <IconSelector selectedIcon={icon} onSelect={onIconChange} />

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Brief description of this actor type"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default NodeTypeForm;
