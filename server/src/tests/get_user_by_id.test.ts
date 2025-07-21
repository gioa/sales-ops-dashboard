
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUserById } from '../handlers/get_user_by_id';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

describe('getUserById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when found', async () => {
    // Create a test user
    const testUserId = nanoid();
    await db.insert(usersTable)
      .values({
        id: testUserId,
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'IC'
      })
      .execute();

    const result = await getUserById(testUserId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testUserId);
    expect(result!.name).toEqual('John Doe');
    expect(result!.email).toEqual('john.doe@example.com');
    expect(result!.role).toEqual('IC');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when user not found', async () => {
    const nonExistentId = nanoid();
    
    const result = await getUserById(nonExistentId);

    expect(result).toBeNull();
  });

  it('should handle different user roles correctly', async () => {
    // Test with Executive role
    const executiveId = nanoid();
    await db.insert(usersTable)
      .values({
        id: executiveId,
        name: 'Jane Executive',
        email: 'jane.executive@example.com',
        role: 'Executive'
      })
      .execute();

    const result = await getUserById(executiveId);

    expect(result).not.toBeNull();
    expect(result!.role).toEqual('Executive');
    expect(result!.name).toEqual('Jane Executive');
  });

  it('should retrieve user from database correctly', async () => {
    // Create test user
    const testUserId = nanoid();
    await db.insert(usersTable)
      .values({
        id: testUserId,
        name: 'Database User',
        email: 'db.user@example.com',
        role: 'Front Line Manager'
      })
      .execute();

    // Retrieve via handler
    const result = await getUserById(testUserId);

    // Verify against direct database query
    const directQuery = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUserId))
      .execute();

    expect(result).not.toBeNull();
    expect(directQuery).toHaveLength(1);
    expect(result!.id).toEqual(directQuery[0].id);
    expect(result!.name).toEqual(directQuery[0].name);
    expect(result!.email).toEqual(directQuery[0].email);
    expect(result!.role).toEqual(directQuery[0].role);
  });
});
