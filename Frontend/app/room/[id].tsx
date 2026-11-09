import { STAY_CATALOG } from '../../constants/stayCatalog';
import { RoomDetailExperience } from '../../components/room/RoomDetailExperience';
import { LiveStayDetailScreen } from '../../components/live/LiveCatalog';
import { apiEnabled } from '../../services/api';

export function generateStaticParams() {
  return STAY_CATALOG.map((stay) => ({ id: stay.id }));
}

export default function StayDetailRoute() { return apiEnabled ? <LiveStayDetailScreen /> : <RoomDetailExperience />; }
