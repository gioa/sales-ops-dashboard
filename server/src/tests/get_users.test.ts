
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users
    const testUsers = [
      {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'IC' as const
      },
      {
        id: 'user-2', 
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'Front Line Manager' as const
      },
      {
        id: 'user-3',
        name: 'Bob Executive',
        email: 'bob@example.com',
        role: 'Executive' as const
      }
    ];

    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    // Verify all users are returned
    expect(result.map(u => u.id).sort()).toEqual(['user-1', 'user-2', 'user-3']);
    
    // Check specific user data
    const johnUser = result.find(u => u.id === 'user-1');
    expect(johnUser).toBeDefined();
    expect(johnUser!.name).toEqual('John Doe');
    expect(johnUser!.email).toEqual('john@example.com');
    expect(johnUser!.role).toEqual('IC');
    expect(johnUser!.created_at).toBeInstanceOf(Date);

    const janeUser = result.find(u => u.id === 'user-2');
    expect(janeUser).toBeDefined();
    expect(janeUser!.name).toEqual('Jane Smith');
    expect(janeUser!.role).toEqual('Front Line Manager');

    const bobUser = result.find(u => u.id === 'user-3');
    expect(bobUser).toBeDefined();
    expect(bobUser!.name).toEqual('Bob Executive');
    expect(bobUser!.role).toEqual('Executive');
  });

  it('should return users with correct field types', async () => {
    const testUser = {
      id: 'user-test',
      name: 'Test User',
      email: 'test@example.com',
      role: 'IC' as const
    };

    await db.insert(usersTable)
      .values([testUser])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];
    
    expect(typeof user.id).toBe('string');
    expect(typeof user.name).toBe('string');
    expect(typeof user.email).toBe('string');
    expect(typeof user.role).toBe('string');
    expect(user.created_at).toBeInstanceOf(Date);
  });
});
