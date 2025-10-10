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

/**
 * IconSelector - Icon picker component for selecting Material Design icons
 *
 * Features:
 * - Grid display of available icons
 * - Visual selection feedback
 * - Returns selected icon name
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

const IconSelector = ({ selectedIcon, onSelect }: Props) => {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-2">
        Icon (optional)
      </label>
      <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
        {/* No icon option */}
        <button
          type="button"
          onClick={() => onSelect('')}
          className={`
            p-2 rounded border-2 transition-all flex items-center justify-center
            ${!selectedIcon
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          title="No icon"
        >
          <span className="text-xs text-gray-500">—</span>
        </button>

        {/* Icon options */}
        {availableIcons.map((icon) => {
          const IconComponent = icon.component;
          return (
            <button
              key={icon.name}
              type="button"
              onClick={() => onSelect(icon.name)}
              className={`
                p-2 rounded border-2 transition-all flex items-center justify-center
                ${selectedIcon === icon.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
              title={icon.name}
            >
              <IconComponent fontSize="small" className="text-gray-700" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default IconSelector;
