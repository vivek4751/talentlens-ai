import { describe, expect, it } from 'vitest';
import { registrationError } from './registration-error';

describe('registration failure responses', () => {
  it('returns a conflict for a concurrent duplicate registration', () => {
    expect(registrationError({ code: 'P2002' }).status).toBe(409);
  });
  it.each(['P1000', 'P1001', 'P2024', 'P2021', 'P2022'])('returns a support reference without leaking the database error %s', code => {
    const response = registrationError({ code, message: 'secret database connection string' });
    expect(response.status).toBe(503);
    expect(response.body.reference).toBeTruthy();
    expect(JSON.stringify(response)).not.toContain('secret');
  });
  it('returns 400 for invalid JSON and 500 for unknown errors', () => {
    expect(registrationError(new SyntaxError()).status).toBe(400);
    expect(registrationError(new Error('unknown')).status).toBe(500);
  });
  it('recognizes the production initialization error even without an error code', () => {
    const error = new Error('tenant/user not found');
    error.name = 'PrismaClientInitializationError';
    expect(registrationError(error).status).toBe(503);
  });
});
