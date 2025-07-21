
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, salesOpportunitiesTable } from '../db/schema';
import { type CreateUserInput, type CreateSalesOpportunityInput } from '../schema';
import { getDashboardMetrics } from '../handlers/get_dashboard_metrics';

const testUser: CreateUserInput = {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'IC'
};

const testManager: CreateUserInput = {
  name: 'Jane Manager',
  email: 'jane@example.com',
  role: 'Front Line Manager'
};

const testExecutive: CreateUserInput = {
  name: 'Bob Executive',
  email: 'bob@example.com',
  role: 'Executive'
};

describe('getDashboardMetrics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should calculate metrics for IC persona', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user1',
      name: testUser.name,
      email: testUser.email,
      role: testUser.role
    }).execute();

    // Create test opportunities
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + 15);

    await db.insert(salesOpportunitiesTable).values([
      {
        id: 'opp1',
        name: 'Open Deal 1',
        stage: 'Qualification',
        amount: '10000.00',
        close_date: futureDate,
        assigned_to_id: 'user1',
        customer_name: 'Customer A',
        last_activity_date: now,
        deal_probability: 50
      },
      {
        id: 'opp2',
        name: 'Won Deal',
        stage: 'Closed Won',
        amount: '5000.00',
        close_date: now,
        assigned_to_id: 'user1',
        customer_name: 'Customer B',
        last_activity_date: now,
        deal_probability: 100
      },
      {
        id: 'opp3',
        name: 'Lost Deal',
        stage: 'Closed Lost',
        amount: '3000.00',
        close_date: now,
        assigned_to_id: 'user1',
        customer_name: 'Customer C',
        last_activity_date: now,
        deal_probability: 0
      }
    ]).execute();

    const metrics = await getDashboardMetrics('user1', 'IC');

    expect(metrics.pipeline_value).toEqual(10000);
    expect(metrics.opportunities_won).toEqual(1);
    expect(metrics.activities_completed).toEqual(0);
    expect(metrics.win_rate).toEqual(50); // 1 won out of 2 closed = 50%
    expect(metrics.open_opportunities).toEqual(1);
    expect(metrics.forecasted_revenue).toEqual(5000); // 10000 * 50% = 5000
    expect(metrics.upcoming_activities).toEqual(1); // One deal closes within 30 days
  });

  it('should calculate metrics for Manager persona', async () => {
    // Create test manager
    await db.insert(usersTable).values({
      id: 'manager1',
      name: testManager.name,
      email: testManager.email,
      role: testManager.role
    }).execute();

    // Create opportunities for manager (same logic as IC since no team relationship)
    await db.insert(salesOpportunitiesTable).values({
      id: 'opp1',
      name: 'Manager Deal',
      stage: 'Proposal',
      amount: '25000.00',
      close_date: new Date(),
      assigned_to_id: 'manager1',
      customer_name: 'Customer D',
      last_activity_date: new Date(),
      deal_probability: 75
    }).execute();

    const metrics = await getDashboardMetrics('manager1', 'Manager');

    expect(metrics.pipeline_value).toEqual(25000);
    expect(metrics.open_opportunities).toEqual(1);
    expect(metrics.forecasted_revenue).toEqual(18750); // 25000 * 75%
  });

  it('should calculate metrics for Executive persona', async () => {
    // Create test users
    await db.insert(usersTable).values([
      {
        id: 'user1',
        name: 'User 1',
        email: 'user1@example.com',
        role: 'IC'
      },
      {
        id: 'user2',
        name: 'User 2',
        email: 'user2@example.com',
        role: 'IC'
      },
      {
        id: 'exec1',
        name: testExecutive.name,
        email: testExecutive.email,
        role: testExecutive.role
      }
    ]).execute();

    // Create opportunities assigned to different users
    await db.insert(salesOpportunitiesTable).values([
      {
        id: 'opp1',
        name: 'Deal 1',
        stage: 'Qualification',
        amount: '15000.00',
        close_date: new Date(),
        assigned_to_id: 'user1',
        customer_name: 'Customer A',
        last_activity_date: new Date(),
        deal_probability: 60
      },
      {
        id: 'opp2',
        name: 'Deal 2',
        stage: 'Closed Won',
        amount: '20000.00',
        close_date: new Date(),
        assigned_to_id: 'user2',
        customer_name: 'Customer B',
        last_activity_date: new Date(),
        deal_probability: 100
      }
    ]).execute();

    const metrics = await getDashboardMetrics('exec1', 'Executive');

    // Executive sees all opportunities regardless of assignment
    expect(metrics.pipeline_value).toEqual(15000); // Only open deals
    expect(metrics.opportunities_won).toEqual(1);
    expect(metrics.open_opportunities).toEqual(1);
    expect(metrics.forecasted_revenue).toEqual(9000); // 15000 * 60%
    expect(metrics.win_rate).toEqual(100); // 1 won out of 1 closed = 100%
  });

  it('should handle empty dataset', async () => {
    // Create user with no opportunities
    await db.insert(usersTable).values({
      id: 'user1',
      name: 'Empty User',
      email: 'empty@example.com',
      role: 'IC'
    }).execute();

    const metrics = await getDashboardMetrics('user1', 'IC');

    expect(metrics.pipeline_value).toEqual(0);
    expect(metrics.opportunities_won).toEqual(0);
    expect(metrics.activities_completed).toEqual(0);
    expect(metrics.win_rate).toEqual(0);
    expect(metrics.open_opportunities).toEqual(0);
    expect(metrics.closed_won_this_month).toEqual(0);
    expect(metrics.forecasted_revenue).toEqual(0);
    expect(metrics.upcoming_activities).toEqual(0);
  });

  it('should calculate closed won this month correctly', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'IC'
    }).execute();

    // Create opportunities won this month and last month
    const thisMonth = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    await db.insert(salesOpportunitiesTable).values([
      {
        id: 'opp1',
        name: 'This Month Win',
        stage: 'Closed Won',
        amount: '10000.00',
        close_date: thisMonth,
        assigned_to_id: 'user1',
        customer_name: 'Customer A',
        last_activity_date: thisMonth,
        deal_probability: 100,
        created_at: thisMonth
      },
      {
        id: 'opp2',
        name: 'Last Month Win',
        stage: 'Closed Won',
        amount: '5000.00',
        close_date: lastMonth,
        assigned_to_id: 'user1',
        customer_name: 'Customer B',
        last_activity_date: lastMonth,
        deal_probability: 100,
        created_at: lastMonth
      }
    ]).execute();

    const metrics = await getDashboardMetrics('user1', 'IC');

    expect(metrics.opportunities_won).toEqual(2); // Total won
    expect(metrics.closed_won_this_month).toEqual(1); // Only this month
  });
});
