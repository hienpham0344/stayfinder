import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

// Keep server and first client render identical; React does not repair every
// responsive style attribute when the exported HTML hydrates at another width.
const WEB_REFERENCE = { width: 390, height: 844, scale: 1, fontScale: 1 };

export function useUserWindowDimensions() {
  const dimensions = useWindowDimensions();
  const [webDimensions, setWebDimensions] = useState(WEB_REFERENCE);

  useEffect(() => {
    if (Platform.OS === 'web' && dimensions.width > 0 && dimensions.height > 0) {
      setWebDimensions(dimensions);
    }
  }, [dimensions]);

  return Platform.OS === 'web' ? webDimensions : dimensions;
}
