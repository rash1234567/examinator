import prisma from "../prisma/client";
import { User } from "@prisma/client";
import { normalizeEmail } from "./studentIdentity";

/**
 * Finds a user by email, optionally scoped to school.
 * If school is omitted and multiple accounts share the email, returns null and `ambiguous: true`.
 */
export async function resolveUserByEmail(
  email: string,
  school?: string,
): Promise<{ user: User | null; ambiguous?: boolean }> {
  const normalized = normalizeEmail(email);

  if (school) {
    const user = await prisma.user.findUnique({
      where: {
        school_email: { school: school.trim(), email: normalized },
      },
    });
    return { user };
  }

  const users = await prisma.user.findMany({
    where: { email: normalized },
  });

  if (users.length === 0) return { user: null };
  if (users.length > 1) return { user: null, ambiguous: true };
  return { user: users[0] };
}
