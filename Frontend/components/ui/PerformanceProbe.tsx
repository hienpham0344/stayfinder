import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { summarizeFrames } from '../../utils/frameMetrics';

// Explicit diagnostic URL only; normal browsing does not sample frames.
export function PerformanceProbe() {
  const [result, setResult] = useState('');
  useEffect(() => {
    if (Platform.OS !== 'web' || !new URLSearchParams(window.location.search).has('measureMotion')) return;
    const intervals: number[] = [];
    const started = performance.now();
    let previous = 0;
    let frame = 0;
    let longTasks = 0;
    let longTaskMs = 0;
    let observer: PerformanceObserver | undefined;
    try {
      observer = new PerformanceObserver((list) => { for (const entry of list.getEntries()) { longTasks += 1; longTaskMs += entry.duration; } });
      observer.observe({ entryTypes: ['longtask'] });
    } catch { /* Long Tasks API is optional; frame intervals remain measurable. */ }
    const sample = (now: number) => {
      if (previous) intervals.push(now - previous);
      previous = now;
      if (now - started < 5000) { frame = requestAnimationFrame(sample); return; }
      observer?.disconnect();
      const measured = JSON.stringify({ mode: __DEV__ ? 'development' : 'production', visibility: document.visibilityState, ...summarizeFrames(intervals), longTasks, longTaskMs: Math.round(longTaskMs) });
      setResult(measured);
      console.info('STAYFINDER_FRAME_SAMPLE', measured);
    };
    frame = requestAnimationFrame(sample);
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); };
  }, []);
  return result ? <View testID="motion-metrics" dataSet={{ metrics: result }} style={{ display: 'none' }} /> : null;
}
