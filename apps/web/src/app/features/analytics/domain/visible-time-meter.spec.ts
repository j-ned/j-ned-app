import { describe, it, expect } from 'vitest';
import { VisibleTimeMeter } from './visible-time-meter';

function meterStartedAt(now: number, visible = true): VisibleTimeMeter {
  const meter = new VisibleTimeMeter();
  meter.start(now, visible);
  return meter;
}

describe('VisibleTimeMeter', () => {
  it('Given a visible start When drained 40 s later Then it returns 40 000 ms', () => {
    const meter = meterStartedAt(1_000);

    expect(meter.drain(41_000)).toBe(40_000);
  });

  it('Given a pause between 10 s and 25 s When drained at 30 s Then only visible time counts', () => {
    const meter = meterStartedAt(0);

    meter.pause(10_000);
    meter.resume(25_000);

    expect(meter.drain(30_000)).toBe(15_000);
  });

  it('Given a running meter When drained twice Then the second drain only returns time since the first', () => {
    const meter = meterStartedAt(0);

    expect([meter.drain(5_000), meter.drain(8_000)]).toEqual([5_000, 3_000]);
  });

  it('Given a paused meter When drained Then it returns the accumulated time and the next drain starts from zero', () => {
    const meter = meterStartedAt(0);

    meter.pause(4_000);
    const whilePaused = meter.drain(10_000);
    meter.resume(12_000);

    expect([whilePaused, meter.drain(15_000)]).toEqual([4_000, 3_000]);
  });

  it('Given a hidden start When the page becomes visible later Then hidden time is not counted', () => {
    const meter = meterStartedAt(0, false);

    const beforeVisible = meter.drain(20_000);
    meter.resume(20_000);

    expect([beforeVisible, meter.drain(26_000)]).toEqual([0, 6_000]);
  });

  it('Given a meter already paused When paused again Then the second pause changes nothing', () => {
    const meter = meterStartedAt(0);

    meter.pause(10_000);
    meter.pause(20_000);

    expect(meter.drain(30_000)).toBe(10_000);
  });

  it('Given a running meter When resumed again Then the running segment is not restarted', () => {
    const meter = meterStartedAt(0);

    meter.resume(5_000);

    expect(meter.drain(9_000)).toBe(9_000);
  });
});
