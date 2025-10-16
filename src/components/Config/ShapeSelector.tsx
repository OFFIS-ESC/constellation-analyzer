import type { NodeShape } from '../../types';

interface ShapeSelectorProps {
  value: NodeShape;
  onChange: (shape: NodeShape) => void;
  color?: string;
}

interface ShapeOption {
  id: NodeShape;
  label: string;
  description: string;
}

const SHAPE_OPTIONS: ShapeOption[] = [
  {
    id: 'rectangle',
    label: 'Rectangle',
    description: 'Standard rectangular shape, good for general purpose use',
  },
  {
    id: 'circle',
    label: 'Circle',
    description: 'Circular shape, best for people and concepts',
  },
  {
    id: 'roundedRectangle',
    label: 'Rounded Rectangle',
    description: 'Soft rounded rectangle, suitable for teams and groups',
  },
  {
    id: 'ellipse',
    label: 'Ellipse',
    description: 'Oval shape, ideal for processes and stages',
  },
  {
    id: 'pill',
    label: 'Pill',
    description: 'Capsule shape, perfect for tags and labels',
  },
];

/**
 * ShapeSelector - Visual selector for node shapes
 *
 * Displays all available shape options with visual previews
 * and allows users to select a shape for their node type.
 */
const ShapeSelector = ({ value, onChange, color = '#3b82f6' }: ShapeSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Shape
      </label>
      <div className="grid grid-cols-3 gap-3">
        {SHAPE_OPTIONS.map((option) => {
          const isSelected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`
                relative p-3 rounded-lg border-2 transition-all
                hover:border-blue-400 hover:bg-blue-50
                ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
              `}
              title={option.description}
            >
              {/* Shape Preview */}
              <div className="flex justify-center items-center h-12 mb-2">
                <ShapePreview shape={option.id} color={color} size={40} />
              </div>

              {/* Shape Label */}
              <div className="text-xs text-center text-gray-700 font-medium">
                {option.label}
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * ShapePreview - Renders a small preview of a shape
 */
const ShapePreview = ({ shape, color, size }: { shape: NodeShape; color: string; size: number }) => {
  const svgSize = size;
  const strokeWidth = 2;

  switch (shape) {
    case 'rectangle':
      return (
        <svg width={svgSize} height={svgSize * 0.7} viewBox="0 0 60 42">
          <rect
            x={strokeWidth}
            y={strokeWidth}
            width={60 - strokeWidth * 2}
            height={42 - strokeWidth * 2}
            fill={color}
            stroke={color}
            strokeWidth={strokeWidth}
            rx="3"
          />
        </svg>
      );

    case 'circle':
      return (
        <svg width={svgSize} height={svgSize} viewBox="0 0 50 50">
          <circle
            cx="25"
            cy="25"
            r={25 - strokeWidth}
            fill={color}
            stroke={color}
            strokeWidth={strokeWidth}
          />
        </svg>
      );

    case 'roundedRectangle':
      return (
        <svg width={svgSize} height={svgSize * 0.7} viewBox="0 0 60 42">
          <rect
            x={strokeWidth}
            y={strokeWidth}
            width={60 - strokeWidth * 2}
            height={42 - strokeWidth * 2}
            fill={color}
            stroke={color}
            strokeWidth={strokeWidth}
            rx="12"
          />
        </svg>
      );

    case 'ellipse':
      return (
        <svg width={svgSize * 1.2} height={svgSize * 0.7} viewBox="0 0 60 35">
          <ellipse
            cx="30"
            cy="17.5"
            rx={30 - strokeWidth}
            ry={17.5 - strokeWidth}
            fill={color}
            stroke={color}
            strokeWidth={strokeWidth}
          />
        </svg>
      );

    case 'pill':
      return (
        <svg width={svgSize} height={svgSize * 0.5} viewBox="0 0 60 30">
          <rect
            x={strokeWidth}
            y={strokeWidth}
            width={60 - strokeWidth * 2}
            height={30 - strokeWidth * 2}
            fill={color}
            stroke={color}
            strokeWidth={strokeWidth}
            rx="15"
          />
        </svg>
      );

    default:
      return null;
  }
};

export default ShapeSelector;
