import { WishlistExperience } from '../../components/wishlist/WishlistExperience';
import { LiveWishlistScreen } from '../../components/live/LiveAccount';
import { apiEnabled } from '../../services/api';

export default function WishlistRoute() { return apiEnabled ? <LiveWishlistScreen /> : <WishlistExperience />; }
