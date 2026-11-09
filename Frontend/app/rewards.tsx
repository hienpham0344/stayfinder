import { RewardsExperience } from '../components/rewards/RewardsExperience';
import { LiveRewardsScreen } from '../components/live/LiveAccount';
import { apiEnabled } from '../services/api';

export default function RewardsRoute() { return apiEnabled ? <LiveRewardsScreen /> : <RewardsExperience />; }
