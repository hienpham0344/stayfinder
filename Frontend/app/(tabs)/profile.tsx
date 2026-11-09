import { ProfileExperience } from '../../components/profile/ProfileExperience';
import { LiveProfileScreen } from '../../components/live/LiveAccount';
import { apiEnabled } from '../../services/api';

export default function ProfileRoute() { return apiEnabled ? <LiveProfileScreen /> : <ProfileExperience />; }
