import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

const ReducedMotion = createContext(true);

// One OS/media subscription for the app, rather than one per button and card.
export function MotionPreferenceProvider({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      const update = () => setReduced(media.matches);
      update(); media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduced(value); }).catch(() => { if (active) setReduced(true); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; subscription.remove(); };
  }, []);
  return createElement(ReducedMotion.Provider, { value: reduced }, children);
}

export const useReducedMotion = () => useContext(ReducedMotion);
