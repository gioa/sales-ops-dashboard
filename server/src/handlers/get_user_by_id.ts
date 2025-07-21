
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Failed to get user by ID:', error);
    throw error;
  }
}
