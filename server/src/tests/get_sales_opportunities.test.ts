
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, salesOpportunitiesTable } from '../db/schema';
import { type CreateUserInput, type CreateSalesOpportunityInput, type OpportunityFilters } from '../schema';
import { getSalesOpportunities } from '../handlers/get_sales_opportunities';

describe('getSalesOpportunities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data
  const testUser: CreateUserInput = {
    name: 'John Doe',
    email: 'john@example.com',
    role: 'IC'
  };

  const testUser2: CreateUserInput = {
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Front Line Manager'
  };

  const testOpportunity1: CreateSalesOpportunityInput = {
    name: 'Big Enterprise Deal',
    stage: 'Proposal',
    amount: 50000,
    close_date: new Date('2024-06-01'),
    assigned_to_id: 'user-1',
    customer_name: 'Acme Corp',
    last_activity_date: new Date('2024-01-15'),
    deal_probability: 75
  };

  const testOpportunity2: CreateSalesOpportunityInput = {
    name: 'Small Business Deal',
    stage: 'Qualification',
    amount: 10000,
    close_date: new Date('2024-03-15'),
    assigned_to_id: 'user-2',
    customer_name: 'Tech Startup Inc',
    last_activity_date: new Date('2024-01-10'),
    deal_probability: 50
  };

  const testOpportunity3: CreateSalesOpportunityInput = {
    name: 'Another Acme Deal',
    stage: 'Closed Won',
    amount: 25000,
    close_date: new Date('2024-02-01'),
    assigned_to_id: 'user-1',
    customer_name: 'Acme Corp',
    last_activity_date: new Date('2024-01-05'),
    deal_probability: 100
  };

  const setupTestData = async () => {
    // Create test users
    await db.insert(usersTable).values([
      { id: 'user-1', ...testUser },
      { id: 'user-2', ...testUser2 }
    ]).execute();

    // Create test opportunities
    await db.insert(salesOpportunitiesTable).values([
      {
        id: 'opp-1',
        ...testOpportunity1,
        amount: testOpportunity1.amount.toString()
      },
      {
        id: 'opp-2',
        ...testOpportunity2,
        amount: testOpportunity2.amount.toString()
      },
      {
        id: 'opp-3',
        ...testOpportunity3,
        amount: testOpportunity3.amount.toString()
      }
    ]).execute();
  };

  it('should return all opportunities when no filters provided', async () => {
    await setupTestData();

    const result = await getSalesOpportunities();

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Big Enterprise Deal');
    expect(result[0].amount).toBe(50000);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].stage).toBe('Proposal');
    expect(result[0].assigned_to_id).toBe('user-1');
    expect(result[0].customer_name).toBe('Acme Corp');
    expect(result[0].deal_probability).toBe(75);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no opportunities exist', async () => {
    const result = await getSalesOpportunities();
    expect(result).toHaveLength(0);
  });

  it('should filter by assigned_to_id', async () => {
    await setupTestData();

    const filters: OpportunityFilters = {
      assigned_to_id: 'user-1'
    };

    const result = await getSalesOpportunities(filters);

    expect(result).toHaveLength(2);
    result.forEach(opportunity => {
      expect(opportunity.assigned_to_id).toBe('user-1');
    });
  });

  it('should filter by stage', async () => {
    await setupTestData();

    const filters: OpportunityFilters = {
      stage: 'Qualification'
    };

    const result = await getSalesOpportunities(filters);

    expect(result).toHaveLength(1);
    expect(result[0].stage).toBe('Qualification');
    expect(result[0].name).toBe('Small Business Deal');
  });

  it('should filter by customer name (case-insensitive partial match)', async () => {
    await setupTestData();

    const filters: OpportunityFilters = {
      customer_name: 'acme'
    };

    const result = await getSalesOpportunities(filters);

    expect(result).toHaveLength(2);
    result.forEach(opportunity => {
      expect(opportunity.customer_name.toLowerCase()).toContain('acme');
    });
  });

  it('should filter by amount range', async () => {
    await setupTestData();

    const filters: OpportunityFilters = {
      min_amount: 15000,
      max_amount: 40000
    };

    const result = await getSalesOpportunities(filters);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(25000);
    expect(result[0].name).toBe('Another Acme Deal');
  });

  it('should filter by close date range', async () => {
    await setupTestData();

    const filters: OpportunityFilters = {
      close_date_from: new Date('2024-02-01'),
      close_date_to: new Date('2024-04-01')
    };

    const result = await getSalesOpportunities(filters);

    expect(result).toHaveLength(2);
    result.forEach(opportunity => {
      expect(opportunity.close_date >= new Date('2024-02-01')).toBe(true);
      expect(opportunity.close_date <= new Date('2024-04-01')).toBe(true);
    });
  });

  it('should apply multiple filters correctly', async () => {
    await setupTestData();

    const filters: OpportunityFilters = {
      assigned_to_id: 'user-1',
      stage: 'Proposal',
      min_amount: 40000
    };

    const result = await getSalesOpportunities(filters);

    expect(result).toHaveLength(1);
    expect(result[0].assigned_to_id).toBe('user-1');
    expect(result[0].stage).toBe('Proposal');
    expect(result[0].amount).toBe(50000);
    expect(result[0].name).toBe('Big Enterprise Deal');
  });

  it('should return empty array when filters match no opportunities', async () => {
    await setupTestData();

    const filters: OpportunityFilters = {
      stage: 'Negotiation' // No opportunities in this stage
    };

    const result = await getSalesOpportunities(filters);
    expect(result).toHaveLength(0);
  });
});
