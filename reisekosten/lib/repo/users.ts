import { db, newId } from '@/lib/db';
import type { PublicUser, User } from '@/lib/types';

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  is_approver: number;
  is_admin: number;
  active: number;
  created_at: string;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    isApprover: !!row.is_approver,
    isAdmin: !!row.is_admin,
    active: !!row.active,
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

export function findUserByEmail(email: string): User | null {
  const row = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.trim().toLowerCase()) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function findUserById(id: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function listUsers(): User[] {
  const rows = db.prepare('SELECT * FROM users ORDER BY name').all() as UserRow[];
  return rows.map(mapUser);
}

export function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  isApprover: boolean;
  isAdmin: boolean;
}): User {
  const id = newId();
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, is_approver, is_admin, active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`
  ).run(
    id,
    input.name,
    input.email.trim().toLowerCase(),
    input.passwordHash,
    input.isApprover ? 1 : 0,
    input.isAdmin ? 1 : 0
  );
  return findUserById(id)!;
}

export function setUserRoles(id: string, roles: { isApprover: boolean; isAdmin: boolean }): void {
  db.prepare('UPDATE users SET is_approver = ?, is_admin = ? WHERE id = ?').run(
    roles.isApprover ? 1 : 0,
    roles.isAdmin ? 1 : 0,
    id
  );
}

export function setUserActive(id: string, active: boolean): void {
  db.prepare('UPDATE users SET active = ? WHERE id = ?').run(active ? 1 : 0, id);
}
