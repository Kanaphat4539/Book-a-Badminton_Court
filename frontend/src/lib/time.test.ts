import { describe, it, expect } from 'vitest';
import { generateHourlySlots, isSlotInPast } from './time';

describe('generateHourlySlots (unit)', () => {
  it('generates zero-padded hourly slots from the start hour', () => {
    const slots = generateHourlySlots(6, 16);
    expect(slots[0]).toBe('06:00');
    expect(slots[slots.length - 1]).toBe('21:00');
    expect(slots).toHaveLength(16);
  });
});

describe('isSlotInPast (unit)', () => {
  const today = new Date('2026-09-10T13:30:00');
  const todayStr = today.toISOString().split('T')[0];

  it('marks an earlier slot today as past', () => {
    expect(isSlotInPast(todayStr, '10:00', today)).toBe(true);
  });

  it('does not mark a later slot today as past', () => {
    expect(isSlotInPast(todayStr, '15:00', today)).toBe(false);
  });

  it('never marks slots on a future date as past', () => {
    expect(isSlotInPast('2026-12-31', '06:00', today)).toBe(false);
  });

  it('returns false when no date is selected', () => {
    expect(isSlotInPast('', '10:00', today)).toBe(false);
  });
});
