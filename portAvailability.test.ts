import { describe, it, expect } from 'vitest';
import { resolveAvailablePort } from './env.js';

describe('resolveAvailablePort', () => {
  it('returns a valid port when the caller asks for an ephemeral port', async () => {
    const port = await resolveAvailablePort(0);

    expect(port).toBeGreaterThan(0);
  });

  it('returns a valid port even when the preferred port value is invalid', async () => {
    const port = await resolveAvailablePort(Number.NaN);

    expect(port).toBeGreaterThan(0);
  });
});
