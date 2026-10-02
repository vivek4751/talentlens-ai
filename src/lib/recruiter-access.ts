import { auth } from '../auth';
import { AppError } from '../core/errors';

export async function requireRecruiter() {
  const session = await auth();
  if (!session?.user?.id) throw new AppError('Unauthorized', 401);
  if (!['recruiter', 'admin'].includes(session.user.role)) {
    throw new AppError('Recruiter access is required.', 403);
  }
  return session.user;
}

export function requireOwner(user: { id: string; role?: string }, ownerId: string) {
  if (user.role !== 'admin' && user.id !== ownerId) {
    throw new AppError('Forbidden', 403);
  }
}
