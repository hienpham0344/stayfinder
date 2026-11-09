import { SearchExperience } from '../../components/search/SearchExperience';
import { LiveSearchScreen } from '../../components/live/LiveCatalog';
import { apiEnabled } from '../../services/api';

export default function SearchRoute() { return apiEnabled ? <LiveSearchScreen /> : <SearchExperience />; }
