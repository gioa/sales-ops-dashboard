
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salesOpportunitiesTable, usersTable } from '../db/schema';
import { type CreateSalesOpportunityInput, type User } from '../schema';
import { createSalesOpportunity } from '../handlers/create_sales_opportunity';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Test user for foreign key references
const testUser: User = {
  id: randomUUID(),
  name: 'John Doe',
  email: 'john@example.com',
  role: 'IC',
  created_at: new Date()
};

// Test input
const testInput: CreateSalesOpportunityInput = {
  name: 'Big Enterprise Deal',
  stage: 'Qualification',
  amount: 50000.99,
  close_date: new Date('2024-12-31'),
  assigned_to_id: testUser.id,
  customer_name: 'Acme Corporation',
  last_activity_date: new Date('2024-01-15'),
  deal_probability: 75
};

describe('createSalesOpportunity', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test user for foreign key reference
    await db.insert(usersTable)
      .values({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        role: testUser.role
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should create a sales opportunity', async () => {
    const result = await createSalesOpportunity(testInput);

    // Basic field validation
    expect(result.name).toEqual('Big Enterprise Deal');
    expect(result.stage).toEqual('Qualification');
    expect(result.amount).toEqual(50000.99);
    expect(typeof result.amount).toBe('number');
    expect(result.close_date).toEqual(new Date('2024-12-31'));
    expect(result.assigned_to_id).toEqual(testUser.id);
    expect(result.customer_name).toEqual('Acme Corporation');
    expect(result.last_activity_date).toEqual(new Date('2024-01-15'));
    expect(result.deal_probability).toEqual(75);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save sales opportunity to database', async () => {
    const result = await createSalesOpportunity(testInput);

    // Query using proper drizzle syntax
    const opportunities = await db.select()
      .from(salesOpportunitiesTable)
      .where(eq(salesOpportunitiesTable.id, result.id))
      .execute();

    expect(opportunities).toHaveLength(1);
    const opportunity = opportunities[0];
    expect(opportunity.name).toEqual('Big Enterprise Deal');
    expect(opportunity.stage).toEqual('Qualification');
    expect(parseFloat(opportunity.amount)).toEqual(50000.99);
    expect(opportunity.close_date).toEqual(new Date('2024-12-31'));
    expect(opportunity.assigned_to_id).toEqual(testUser.id);
    expect(opportunity.customer_name).toEqual('Acme Corporation');
    expect(opportunity.last_activity_date).toEqual(new Date('2024-01-15'));
    expect(opportunity.deal_probability).toEqual(75);
    expect(opportunity.created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const invalidInput = {
      ...testInput,
      assigned_to_id: 'non-existent-user-id'
    };

    await expect(createSalesOpportunity(invalidInput)).rejects.toThrow(/user.*not found/i);
  });

  it('should generate unique IDs for multiple opportunities', async () => {
    const result1 = await createSalesOpportunity(testInput);
    const result2 = await createSalesOpportunity({
      ...testInput,
      name: 'Another Deal'
    });

    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);
  });
});
