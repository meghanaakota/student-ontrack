// Regression tests for the client API calls during package upgrades.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api.js';

afterEach(() => vi.unstubAllGlobals());

describe('client API requests', () => {
  it('requests the selected planner date and capacity', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ date: '2026-11-20' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await api.getPlan('2026-11-20', 4);

    expect(fetchMock).toHaveBeenCalledWith('/api/tasks/plan?date=2026-11-20&capacity=4', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: undefined,
    });
    expect(result).toEqual({ date: '2026-11-20' });
  });

  it('posts the supplied attendance values to the calculator', async () => {
    const input = { held: 40, attended: 28, upcoming: 30, holidays: 5, target: 75 };
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ mustAttend: 20 }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await api.calc(input);

    expect(fetchMock).toHaveBeenCalledWith('/api/attendance/calc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    expect(result).toEqual({ mustAttend: 20 });
  });
});
