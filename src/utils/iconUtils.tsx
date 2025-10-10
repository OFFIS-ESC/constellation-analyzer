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
 * Icon map for Material Design icons
 * Used to get icon component by name
 */
const iconMap: Record<string, React.ComponentType<{ fontSize?: 'small' | 'medium' | 'large'; className?: string }>> = {
  Person: PersonIcon,
  Group: GroupIcon,
  Business: BusinessIcon,
  Computer: ComputerIcon,
  Cloud: CloudIcon,
  Storage: StorageIcon,
  Devices: DevicesIcon,
  AccountTree: AccountTreeIcon,
  Category: CategoryIcon,
  Lightbulb: LightbulbIcon,
  Work: WorkIcon,
  School: SchoolIcon,
  LocalHospital: LocalHospitalIcon,
  AccountBalance: AccountBalanceIcon,
  Store: StoreIcon,
  Factory: FactoryIcon,
  Engineering: EngineeringIcon,
  Science: ScienceIcon,
  Public: PublicIcon,
  LocationCity: LocationCityIcon,
};

/**
 * Get icon component by name
 */
export const getIconComponent = (iconName?: string): React.ComponentType<{ fontSize?: 'small' | 'medium' | 'large'; className?: string }> | null => {
  if (!iconName) return null;
  return iconMap[iconName] || null;
};
