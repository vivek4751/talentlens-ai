import { randomUUID } from 'node:crypto';

export function registrationError(error: unknown) {
  const reference = randomUUID();
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  const initializationFailed = error instanceof Error && error.name === 'PrismaClientInitializationError';
  if (error instanceof SyntaxError) return { status: 400, body: { message: 'Invalid registration request.' } };
  if (code === 'P2002') return { status: 409, body: { message: 'An account with these details already exists. Please sign in.' } };
  const databaseUnavailable = initializationFailed || ['P1000', 'P1001', 'P1002', 'P1003', 'P1008', 'P1011', 'P1017', 'P2024', 'P2037'].includes(code);
  const schemaMismatch = ['P2021', 'P2022'].includes(code);
  return { status: databaseUnavailable || schemaMismatch ? 503 : 500, body: {
    message: databaseUnavailable || schemaMismatch
      ? 'Account creation is temporarily unavailable. Please contact the site owner with reference ' + reference + '.'
      : 'Unable to create your account. Please contact the site owner with reference ' + reference + '.',
    reference,
  } };
}
