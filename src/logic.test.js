import { describe, expect, it } from 'vitest';
import { calculateAverage, maintenanceStatus } from './logic.js';

describe('calculateAverage', () => {
  it('calculates and rounds km per liter', () => expect(calculateAverage(100, 8)).toBe(12.5));
  it('rejects invalid or non-positive inputs', () => {
    expect(() => calculateAverage(0, 8)).toThrow(RangeError);
    expect(() => calculateAverage(100, Infinity)).toThrow(RangeError);
  });
});

describe('maintenanceStatus', () => {
  it('classifies due, near-due and normal mileage', () => {
    expect(maintenanceStatus(11001, 1000, 10000).type).toBe('overdue');
    expect(maintenanceStatus(11000, 1000, 10000).type).toBe('overdue');
    expect(maintenanceStatus(9500, 1000, 10000).type).toBe('soon');
    expect(maintenanceStatus(5000, 1000, 10000).type).toBe('ok');
  });
  it('rejects service mileage above current odometer', () => {
    expect(() => maintenanceStatus(1000, 2000, 10000)).toThrow(RangeError);
  });
});
