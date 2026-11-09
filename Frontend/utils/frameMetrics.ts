export function summarizeFrames(intervals: number[]) {
  const values = intervals.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  const at = (quantile: number) => Math.round((values[Math.max(0, Math.ceil(values.length * quantile) - 1)] ?? 0) * 10) / 10;
  return { samples: values.length, medianMs: at(0.5), p95Ms: at(0.95), maxMs: at(1), over32Ms: values.filter((value) => value > 32).length };
}
