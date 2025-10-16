import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import ComputerIcon from '@mui/icons-material/Computer';
import CloudIcon from '@mui/icons-material/Cloud';
import StorageIcon from '@mui/icons-material/Storage';
import DevicesIcon from '@mui/icons-material/Devices';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CategoryIcon from '@mui/icons-material/Category';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import StoreIcon from '@mui/icons-material/Store';
import FactoryIcon from '@mui/icons-material/Factory';
import EngineeringIcon from '@mui/icons-material/Engineering';
import ScienceIcon from '@mui/icons-material/Science';
import PublicIcon from '@mui/icons-material/Public';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import CloseIcon from '@mui/icons-material/Close';

/**
 * IconPopover - Floating popover icon picker
 *
 * Features:
 * - Button trigger with current icon preview
 * - Floating popover (no nested scrolling)
 * - Grid display of available icons
 * - Visual selection feedback
 * - Keyboard accessible (Escape to close, Arrow keys to navigate)
 * - Click outside to close
 * - ARIA compliant
 */

interface Props {
  selectedIcon?: string;
  onSelect: (iconName: string) => void;
}

// Available icons with their names
const availableIcons = [
  { name: 'Person', component: PersonIcon },
  { name: 'Group', component: GroupIcon },
  { name: 'Business', component: BusinessIcon },
  { name: 'Computer', component: ComputerIcon },
  { name: 'Cloud', component: CloudIcon },
  { name: 'Storage', component: StorageIcon },
  { name: 'Devices', component: DevicesIcon },
  { name: 'AccountTree', component: AccountTreeIcon },
  { name: 'Category', component: CategoryIcon },
  { name: 'Lightbulb', component: LightbulbIcon },
  { name: 'Work', component: WorkIcon },
  { name: 'School', component: SchoolIcon },
  { name: 'LocalHospital', component: LocalHospitalIcon },
  { name: 'AccountBalance', component: AccountBalanceIcon },
  { name: 'Store', component: StoreIcon },
  { name: 'Factory', component: FactoryIcon },
  { name: 'Engineering', component: EngineeringIcon },
  { name: 'Science', component: ScienceIcon },
  { name: 'Public', component: PublicIcon },
  { name: 'LocationCity', component: LocationCityIcon },
];

const IconPopover = ({ selectedIcon, onSelect }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Find the selected icon component
  const selectedIconObj = availableIcons.find((icon) => icon.name === selectedIcon);
  const SelectedIconComponent = selectedIconObj?.component;

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSelectIcon = (iconName: string) => {
    onSelect(iconName);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent, iconName: string, index: number) => {
    const gridCols = 8;
    const totalItems = availableIcons.length + 1; // +1 for "no icon" option

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleSelectIcon(iconName);
        break;
      case 'ArrowRight':
        e.preventDefault();
        setFocusedIndex(Math.min(index + 1, totalItems - 1));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIndex(Math.max(index - 1, 0));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(Math.min(index + gridCols, totalItems - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(Math.max(index - gridCols, 0));
        break;
    }
  };

  // Auto-focus when navigating with keyboard
  useEffect(() => {
    if (focusedIndex >= 0 && popoverRef.current) {
      const buttons = popoverRef.current.querySelectorAll('button');
      const button = buttons[focusedIndex] as HTMLButtonElement;
      button?.focus();
    }
  }, [focusedIndex]);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={selectedIcon ? `Selected icon: ${selectedIcon}. Click to change` : 'No icon selected. Click to choose'}
      >
        {SelectedIconComponent ? (
          <>
            <SelectedIconComponent fontSize="small" className="text-gray-700" />
            <span className="text-sm text-gray-700">{selectedIcon}</span>
          </>
        ) : (
          <span className="text-sm text-gray-500">No icon</span>
        )}
        <CloseIcon
          fontSize="small"
          className="text-gray-400 ml-auto"
          style={{ transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-[9999] p-3"
          style={{
            width: '320px',
            top: buttonRef.current ? `${buttonRef.current.getBoundingClientRect().bottom + 4}px` : '0',
            left: buttonRef.current ? `${buttonRef.current.getBoundingClientRect().left}px` : '0',
          }}
          role="dialog"
          aria-label="Icon picker"
        >
          <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
            {/* No icon option */}
            <button
              type="button"
              onClick={() => handleSelectIcon('')}
              onKeyDown={(e) => handleKeyDown(e, '', 0)}
              className={`
                p-2 rounded border-2 transition-all flex items-center justify-center
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                ${!selectedIcon
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
              title="No icon"
              aria-label="No icon"
              aria-pressed={!selectedIcon}
            >
              <span className="text-xs text-gray-500">—</span>
            </button>

            {/* Icon options */}
            {availableIcons.map((icon, index) => {
              const IconComponent = icon.component;
              const actualIndex = index + 1; // +1 because "no icon" is at index 0
              return (
                <button
                  key={icon.name}
                  type="button"
                  onClick={() => handleSelectIcon(icon.name)}
                  onKeyDown={(e) => handleKeyDown(e, icon.name, actualIndex)}
                  className={`
                    p-2 rounded border-2 transition-all flex items-center justify-center
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                    ${selectedIcon === icon.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                  title={icon.name}
                  aria-label={icon.name}
                  aria-pressed={selectedIcon === icon.name}
                >
                  <IconComponent fontSize="small" className="text-gray-700" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default IconPopover;
