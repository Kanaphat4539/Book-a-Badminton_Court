import { describe, it, expect, afterEach } from 'vitest';
import api from './api';

// Reach the registered request interceptor's fulfilled handler.
const requestHandler = (api.interceptors.request as any).handlers[0].fulfilled as (
  config: any,
) => any;

describe('api request interceptor (unit)', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('uses the /api base URL', () => {
    expect(api.defaults.baseURL).toBe('/api');
  });

  it('attaches a Bearer token when one is stored', () => {
    localStorage.setItem('token', 'abc.def.ghi');
    const config = requestHandler({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  it('does not attach an Authorization header when no token is stored', () => {
    const config = requestHandler({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });
});
