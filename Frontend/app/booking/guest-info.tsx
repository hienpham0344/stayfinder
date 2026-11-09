import { GuestInformationExperience } from '../../components/booking/GuestInformationExperience';
import { LiveGuestInfoScreen } from '../../components/live/LiveBooking';
import { apiEnabled } from '../../services/api';

export default function GuestInfoRoute() { return apiEnabled ? <LiveGuestInfoScreen /> : <GuestInformationExperience />; }
