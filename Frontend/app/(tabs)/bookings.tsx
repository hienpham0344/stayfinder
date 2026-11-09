import { MyBookingsExperience } from '../../components/bookings/MyBookingsExperience';
import { LiveBookingsScreen } from '../../components/live/LiveBooking';
import { apiEnabled } from '../../services/api';

export default function BookingsRoute() { return apiEnabled ? <LiveBookingsScreen /> : <MyBookingsExperience />; }
