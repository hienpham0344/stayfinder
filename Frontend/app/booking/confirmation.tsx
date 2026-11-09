import { BookingConfirmationExperience } from '../../components/booking/BookingConfirmationExperience';
import { LiveConfirmationScreen } from '../../components/live/LiveBooking';
import { apiEnabled } from '../../services/api';

export default function ConfirmationRoute() { return apiEnabled ? <LiveConfirmationScreen /> : <BookingConfirmationExperience />; }
