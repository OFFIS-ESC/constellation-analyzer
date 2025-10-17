import type { LabelScope } from '../../types';

/**
 * LabelForm - Reusable form fields for creating/editing labels
 *
 * Features:
 * - Name input
 * - Color picker (visual + text input)
 * - Scope selector (actors/relations/both)
 * - Description input
 */

interface Props {
  name: string;
  color: string;
  appliesTo: LabelScope;
  description: string;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onAppliesToChange: (value: LabelScope) => void;
  onDescriptionChange: (value: string) => void;
}

const LabelForm = ({
  name,
  color,
  appliesTo,
  description,
  onNameChange,
  onColorChange,
  onAppliesToChange,
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
          placeholder="e.g., Team, Lead, Important"
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
          Applies To *
        </label>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="appliesTo"
              value="actors"
              checked={appliesTo === 'actors'}
              onChange={(e) => onAppliesToChange(e.target.value as LabelScope)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Actors only</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="appliesTo"
              value="relations"
              checked={appliesTo === 'relations'}
              onChange={(e) => onAppliesToChange(e.target.value as LabelScope)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Relations only</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="appliesTo"
              value="both"
              checked={appliesTo === 'both'}
              onChange={(e) => onAppliesToChange(e.target.value as LabelScope)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Both actors and relations</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Brief description of this label"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default LabelForm;
