'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { findUserByEmail } from '@/lib/repo/users';
import { createSession, deleteSession } from '@/lib/session';

const LoginSchema = z.object({
  email: z.string().min(1, 'E-Mail wird benötigt.'),
  password: z.string().min(1, 'Passwort wird benötigt.'),
});

export interface LoginState {
  error?: string;
}

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const validated = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!validated.success) {
    return { error: 'Bitte E-Mail und Passwort angeben.' };
  }

  const user = await findUserByEmail(validated.data.email);
  if (!user || !user.active) {
    return { error: 'E-Mail oder Passwort ist falsch.' };
  }

  const passwordMatches = await bcrypt.compare(validated.data.password, user.passwordHash);
  if (!passwordMatches) {
    return { error: 'E-Mail oder Passwort ist falsch.' };
  }

  await createSession(user.id);
  redirect('/reisekosten');
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/login');
}
