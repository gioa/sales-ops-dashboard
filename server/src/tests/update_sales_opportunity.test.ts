
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salesOpportunitiesTable, usersTable } from '../db/schema';
import { type UpdateSalesOpportunityInput, type CreateUserInput } from '../schema';
import { updateSalesOpportunity } from '../handlers/update_sales_opportunity';
import { eq } from 'drizzle-orm';

// Test user data
const testUser: CreateUserInput = {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'IC'
};

const anotherTestUser: CreateUserInput = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  role: 'Front Line Manager'
};

describe('updateSalesOpportunity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a sales opportunity with partial data', async () => {
    // Create test user
    await db.insert(usersTable)
      .values({
        id: 'user_1',
        name: testUser.name,
        email: testUser.email,
        role: testUser.role
      })
      .execute();

    // Create test opportunity
    await db.insert(salesOpportunitiesTable)
      .values({
        id: 'opp_1',
        name: 'Original Opportunity',
        stage: 'Prospecting',
        amount: '5000.00',
        close_date: new Date('2024-12-31'),
        assigned_to_id: 'user_1',
        customer_name: 'Original Customer',
        last_activity_date: new Date('2024-01-01'),
        deal_probability: 50
      })
      .execute();

    // Update opportunity
    const updateInput: UpdateSalesOpportunityInput = {
      id: 'opp_1',
      name: 'Updated Opportunity',
      amount: 7500.50,
      deal_probability: 75
    };

    const result = await updateSalesOpportunity(updateInput);

    // Verify updated fields
    expect(result.id).toEqual('opp_1');
    expect(result.name).toEqual('Updated Opportunity');
    expect(result.amount).toEqual(7500.50);
    expect(result.deal_probability).toEqual(75);
    
    // Verify unchanged fields
    expect(result.stage).toEqual('Prospecting');
    expect(result.customer_name).toEqual('Original Customer');
    expect(result.assigned_to_id).toEqual('user_1');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update database record correctly', async () => {
    // Create test user
    await db.insert(usersTable)
      .values({
        id: 'user_1',
        name: testUser.name,
        email: testUser.email,
        role: testUser.role
      })
      .execute();

    // Create test opportunity
    await db.insert(salesOpportunitiesTable)
      .values({
        id: 'opp_1',
        name: 'Original Opportunity',
        stage: 'Prospecting',
        amount: '5000.00',
        close_date: new Date('2024-12-31'),
        assigned_to_id: 'user_1',
        customer_name: 'Original Customer',
        last_activity_date: new Date('2024-01-01'),
        deal_probability: 50
      })
      .execute();

    // Update opportunity
    const updateInput: UpdateSalesOpportunityInput = {
      id: 'opp_1',
      stage: 'Qualification',
      customer_name: 'Updated Customer'
    };

    await updateSalesOpportunity(updateInput);

    // Verify database record
    const opportunities = await db.select()
      .from(salesOpportunitiesTable)
      .where(eq(salesOpportunitiesTable.id, 'opp_1'))
      .execute();

    expect(opportunities).toHaveLength(1);
    const opportunity = opportunities[0];
    expect(opportunity.stage).toEqual('Qualification');
    expect(opportunity.customer_name).toEqual('Updated Customer');
    expect(opportunity.name).toEqual('Original Opportunity'); // Should remain unchanged
  });

  it('should update assigned user correctly', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          id: 'user_1',
          name: testUser.name,
          email: testUser.email,
          role: testUser.role
        },
        {
          id: 'user_2',
          name: anotherTestUser.name,
          email: anotherTestUser.email,
          role: anotherTestUser.role
        }
      ])
      .execute();

    // Create test opportunity
    await db.insert(salesOpportunitiesTable)
      .values({
        id: 'opp_1',
        name: 'Test Opportunity',
        stage: 'Prospecting',
        amount: '5000.00',
        close_date: new Date('2024-12-31'),
        assigned_to_id: 'user_1',
        customer_name: 'Test Customer',
        last_activity_date: new Date('2024-01-01'),
        deal_probability: 50
      })
      .execute();

    // Update assigned user
    const updateInput: UpdateSalesOpportunityInput = {
      id: 'opp_1',
      assigned_to_id: 'user_2'
    };

    const result = await updateSalesOpportunity(updateInput);

    expect(result.assigned_to_id).toEqual('user_2');
  });

  it('should throw error for non-existent opportunity', async () => {
    const updateInput: UpdateSalesOpportunityInput = {
      id: 'non_existent',
      name: 'Updated Name'
    };

    await expect(updateSalesOpportunity(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error for non-existent assigned user', async () => {
    // Create test user
    await db.insert(usersTable)
      .values({
        id: 'user_1',
        name: testUser.name,
        email: testUser.email,
        role: testUser.role
      })
      .execute();

    // Create test opportunity
    await db.insert(salesOpportunitiesTable)
      .values({
        id: 'opp_1',
        name: 'Test Opportunity',
        stage: 'Prospecting',
        amount: '5000.00',
        close_date: new Date('2024-12-31'),
        assigned_to_id: 'user_1',
        customer_name: 'Test Customer',
        last_activity_date: new Date('2024-01-01'),
        deal_probability: 50
      })
      .execute();

    // Try to assign to non-existent user
    const updateInput: UpdateSalesOpportunityInput = {
      id: 'opp_1',
      assigned_to_id: 'non_existent_user'
    };

    await expect(updateSalesOpportunity(updateInput)).rejects.toThrow(/User with id non_existent_user not found/i);
  });

  it('should handle all fields update correctly', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          id: 'user_1',
          name: testUser.name,
          email: testUser.email,
          role: testUser.role
        },
        {
          id: 'user_2',
          name: anotherTestUser.name,
          email: anotherTestUser.email,
          role: anotherTestUser.role
        }
      ])
      .execute();

    // Create test opportunity
    await db.insert(salesOpportunitiesTable)
      .values({
        id: 'opp_1',
        name: 'Original Opportunity',
        stage: 'Prospecting',
        amount: '5000.00',
        close_date: new Date('2024-12-31'),
        assigned_to_id: 'user_1',
        customer_name: 'Original Customer',
        last_activity_date: new Date('2024-01-01'),
        deal_probability: 50
      })
      .execute();

    // Update all fields
    const newCloseDate = new Date('2024-06-15');
    const newActivityDate = new Date('2024-02-15');
    
    const updateInput: UpdateSalesOpportunityInput = {
      id: 'opp_1',
      name: 'Completely Updated Opportunity',
      stage: 'Negotiation',
      amount: 12500.75,
      close_date: newCloseDate,
      assigned_to_id: 'user_2',
      customer_name: 'New Customer Corp',
      last_activity_date: newActivityDate,
      deal_probability: 90
    };

    const result = await updateSalesOpportunity(updateInput);

    // Verify all fields
    expect(result.id).toEqual('opp_1');
    expect(result.name).toEqual('Completely Updated Opportunity');
    expect(result.stage).toEqual('Negotiation');
    expect(result.amount).toEqual(12500.75);
    expect(result.close_date.getTime()).toEqual(newCloseDate.getTime());
    expect(result.assigned_to_id).toEqual('user_2');
    expect(result.customer_name).toEqual('New Customer Corp');
    expect(result.last_activity_date.getTime()).toEqual(newActivityDate.getTime());
    expect(result.deal_probability).toEqual(90);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(typeof result.amount).toBe('number');
  });
});
