import { AuthDemoExperience } from '../../components/auth/AuthDemoExperience';
import { LiveAuthScreen } from '../../components/live/LiveAccount';
import { apiEnabled } from '../../services/api';

export default function AuthRoute() { return apiEnabled ? <LiveAuthScreen /> : <AuthDemoExperience />; }
