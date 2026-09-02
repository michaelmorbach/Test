import { cache } from 'react';
import { redirect } from 'next/navigation';
import { readSessionPayload } from '@/lib/session';
import { findUserById, toPublicUser } from '@/lib/repo/users';
import type { PublicUser } from '@/lib/types';

export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const payload = await readSessionPayload();
  if (!payload) return null;
  const user = await findUserById(payload.userId);
  if (!user || !user.active) return null;
  return toPublicUser(user);
});

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireApprover(): Promise<PublicUser> {
  const user = await requireUser();
  if (!user.isApprover && !user.isAdmin) redirect('/reisekosten');
  return user;
}

export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireUser();
  if (!user.isAdmin) redirect('/reisekosten');
  return user;
}
