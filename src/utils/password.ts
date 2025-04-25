// utils/password.ts
import bcrypt from "bcrypt";

/**
 * Hashes a plain-text password with a salt.
 */
export async function saltAndHashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compares a plain-text password to a bcrypt hash.
 */
export async function comparePasswords(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Alias for comparePasswords so legacy imports of `verifyPassword` continue to work.
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return comparePasswords(password, hashedPassword);
}
