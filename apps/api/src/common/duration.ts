const DURATION_UNITS_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function durationMs(input: string): number | undefined {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(input.trim());
  const unitMs = DURATION_UNITS_MS[match?.[2]?.toLowerCase() ?? ''];
  if (!match || unitMs === undefined) return undefined;
  return Number(match[1]) * unitMs;
}

export function parseDurationMs(input: string): number {
  const ms = durationMs(input);
  if (ms === undefined) throw new Error(`Invalid duration: "${input}"`);
  return ms;
}
