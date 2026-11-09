import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { RoomSelectionExperience } from '../../components/room/RoomSelectionExperience';
import { LiveRoomSelectionScreen } from '../../components/live/LiveCatalog';
import { apiEnabled } from '../../services/api';
import { COLORS } from '../../constants/tokens';

export default function RoomSelectionRoute() {
  const [ready, setReady] = useState(Platform.OS !== 'web');
  useEffect(() => setReady(true), []);
  // Static HTML cannot know ?id=. Mount after hydration so its first render
  // matches the server, and room selection initializes from the actual stay.
  if (!ready) return <View accessibilityLabel="Loading rooms" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgMain }}><ActivityIndicator color={COLORS.primary} /></View>;
  return apiEnabled ? <LiveRoomSelectionScreen /> : <RoomSelectionExperience />;
}
