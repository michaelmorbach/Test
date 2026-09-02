import { newId, nowIso, query, queryOne } from '@/lib/db';
import type { PublicUser, User } from '@/lib/types';

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  is_approver: boolean;
  is_admin: boolean;
  active: boolean;
  created_at: string;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    isApprover: row.is_approver,
    isAdmin: row.is_admin,
    active: row.active,
    createdAt: row.created_at,
  };
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isApprover: user.isApprover,
    isAdmin: user.isAdmin,
    active: user.active,
    createdAt: user.createdAt,
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const row = await queryOne<UserRow>('SELECT * FROM users WHERE email = $1', [
    email.trim().toLowerCase(),
  ]);
  return row ? mapUser(row) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const row = await queryOne<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  return row ? mapUser(row) : null;
}

export async function listUsers(): Promise<User[]> {
  const rows = await query<UserRow>('SELECT * FROM users ORDER BY name');
  return rows.map(mapUser);
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  isApprover: boolean;
  isAdmin: boolean;
}): Promise<User> {
  const id = newId();
  await query(
    `INSERT INTO users (id, name, email, password_hash, is_approver, is_admin, active, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)`,
    [
      id,
      input.name,
      input.email.trim().toLowerCase(),
      input.passwordHash,
      input.isApprover,
      input.isAdmin,
      nowIso(),
    ]
  );
  return (await findUserById(id))!;
}

export async function setUserRoles(
  id: string,
  roles: { isApprover: boolean; isAdmin: boolean }
): Promise<void> {
  await query('UPDATE users SET is_approver = $1, is_admin = $2 WHERE id = $3', [
    roles.isApprover,
    roles.isAdmin,
    id,
  ]);
}

export async function setUserActive(id: string, active: boolean): Promise<void> {
  await query('UPDATE users SET active = $1 WHERE id = $2', [active, id]);
}
