import { PaymentExperience } from '../../components/booking/PaymentExperience';
import { LiveCheckoutScreen } from '../../components/live/LiveBooking';
import { apiEnabled } from '../../services/api';

export default function CheckoutRoute() { return apiEnabled ? <LiveCheckoutScreen /> : <PaymentExperience />; }
