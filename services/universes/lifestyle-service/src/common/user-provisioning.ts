import { PrismaService } from '../modules/database/prisma.service';

/**
 * Idempotent user mirror provisioning.
 *
 * lifestyle-service keeps a local `users` table as the FK target for
 * polls / votes / quiz attempts / challenges / submissions. Real users live
 * in auth-service, so any write referencing a not-yet-seen user would fail
 * with `PollVote_userId_fkey`-style FK violations. The gateway forwards
 * x-user-id / x-user-email / x-user-role headers (validated JWT), and the
 * guards attach them as req.user — this helper mirrors that identity into
 * the local table on first write. Upsert = safe to call on every request.
 */
export async function ensureUser(
  prisma: PrismaService,
  user: { id: string; email?: string | null; role?: string | null }
): Promise<void> {
  if (!user?.id) return;
  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email || `${user.id}@mirrored.local`,
      role: user.role || 'user',
    },
  });
}
