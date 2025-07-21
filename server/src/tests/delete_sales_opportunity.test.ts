
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, salesOpportunitiesTable } from '../db/schema';
import { deleteSalesOpportunity } from '../handlers/delete_sales_opportunity';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'IC' as const
};

const testOpportunity = {
  id: 'opp-1',
  name: 'Test Deal',
  stage: 'Prospecting' as const,
  amount: '5000.00',
  close_date: new Date('2024-02-15'),
  assigned_to_id: 'user-1',
  customer_name: 'Test Customer',
  last_activity_date: new Date('2024-01-15'),
  deal_probability: 75
};

describe('deleteSalesOpportunity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing sales opportunity', async () => {
    // Create prerequisite user
    await db.insert(usersTable).values(testUser).execute();
    
    // Create test opportunity
    await db.insert(salesOpportunitiesTable).values(testOpportunity).execute();

    // Delete the opportunity
    const result = await deleteSalesOpportunity('opp-1');

    expect(result).toBe(true);

    // Verify opportunity was deleted from database
    const opportunities = await db.select()
      .from(salesOpportunitiesTable)
      .where(eq(salesOpportunitiesTable.id, 'opp-1'))
      .execute();

    expect(opportunities).toHaveLength(0);
  });

  it('should return false when opportunity does not exist', async () => {
    const result = await deleteSalesOpportunity('non-existent-id');

    expect(result).toBe(false);
  });

  it('should not affect other opportunities when deleting one', async () => {
    // Create prerequisite user
    await db.insert(usersTable).values(testUser).execute();
    
    // Create two test opportunities
    const opportunity2 = {
      ...testOpportunity,
      id: 'opp-2',
      name: 'Second Deal'
    };

    await db.insert(salesOpportunitiesTable)
      .values([testOpportunity, opportunity2])
      .execute();

    // Delete only the first opportunity
    const result = await deleteSalesOpportunity('opp-1');

    expect(result).toBe(true);

    // Verify only the first opportunity was deleted
    const remainingOpportunities = await db.select()
      .from(salesOpportunitiesTable)
      .execute();

    expect(remainingOpportunities).toHaveLength(1);
    expect(remainingOpportunities[0].id).toBe('opp-2');
    expect(remainingOpportunities[0].name).toBe('Second Deal');
  });

  it('should handle empty string ID', async () => {
    const result = await deleteSalesOpportunity('');

    expect(result).toBe(false);
  });
});
