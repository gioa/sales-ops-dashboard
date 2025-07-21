
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateUserInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'IC'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.role).toEqual('IC');
    expect(result.id).toBeDefined();
    expect(result.id).toMatch(/^user_\d+_[a-z0-9]+$/);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('John Doe');
    expect(users[0].email).toEqual('john.doe@example.com');
    expect(users[0].role).toEqual('IC');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different user roles', async () => {
    const managerInput: CreateUserInput = {
      name: 'Jane Manager',
      email: 'jane.manager@example.com',
      role: 'Front Line Manager'
    };

    const executiveInput: CreateUserInput = {
      name: 'Bob Executive', 
      email: 'bob.executive@example.com',
      role: 'Executive'
    };

    const manager = await createUser(managerInput);
    const executive = await createUser(executiveInput);

    expect(manager.role).toEqual('Front Line Manager');
    expect(executive.role).toEqual('Executive');

    // Verify both were saved to database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });

  it('should generate unique IDs', async () => {
    const user1 = await createUser(testInput);
    const user2 = await createUser({
      ...testInput,
      email: 'different@example.com'
    });

    expect(user1.id).not.toEqual(user2.id);
    expect(user1.id).toMatch(/^user_\d+_[a-z0-9]+$/);
    expect(user2.id).toMatch(/^user_\d+_[a-z0-9]+$/);
  });
});
