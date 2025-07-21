
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, salesOpportunitiesTable } from '../db/schema';
import { getPipelineStageData } from '../handlers/get_pipeline_stage_data';
import { randomUUID } from 'crypto';

describe('getPipelineStageData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return pipeline data grouped by stage', async () => {
    // Create test user
    const userId = randomUUID();
    await db.insert(usersTable).values({
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
      role: 'IC'
    }).execute();

    // Create opportunities in different stages
    const opportunities = [
      {
        id: randomUUID(),
        name: 'Opportunity 1',
        stage: 'Prospecting' as const,
        amount: '10000.00',
        close_date: new Date('2024-12-31'),
        assigned_to_id: userId,
        customer_name: 'Customer 1',
        last_activity_date: new Date(),
        deal_probability: 25
      },
      {
        id: randomUUID(),
        name: 'Opportunity 2',
        stage: 'Prospecting' as const,
        amount: '15000.00',
        close_date: new Date('2024-12-31'),
        assigned_to_id: userId,
        customer_name: 'Customer 2',
        last_activity_date: new Date(),
        deal_probability: 30
      },
      {
        id: randomUUID(),
        name: 'Opportunity 3',
        stage: 'Qualification' as const,
        amount: '25000.00',
        close_date: new Date('2024-12-31'),
        assigned_to_id: userId,
        customer_name: 'Customer 3',
        last_activity_date: new Date(),
        deal_probability: 50
      }
    ];

    await db.insert(salesOpportunitiesTable).values(opportunities).execute();

    const result = await getPipelineStageData(userId, 'IC');

    // Should return data grouped by stage
    expect(result).toHaveLength(2);
    
    // Find Prospecting stage data
    const prospectingData = result.find(item => item.stage === 'Prospecting');
    expect(prospectingData).toBeDefined();
    expect(prospectingData!.count).toEqual(2);
    expect(prospectingData!.value).toEqual(25000); // 10000 + 15000
    expect(typeof prospectingData!.value).toBe('number');

    // Find Qualification stage data
    const qualificationData = result.find(item => item.stage === 'Qualification');
    expect(qualificationData).toBeDefined();
    expect(qualificationData!.count).toEqual(1);
    expect(qualificationData!.value).toEqual(25000);
    expect(typeof qualificationData!.value).toBe('number');
  });

  it('should filter opportunities for IC persona', async () => {
    // Create two users
    const user1Id = randomUUID();
    const user2Id = randomUUID();
    
    await db.insert(usersTable).values([
      {
        id: user1Id,
        name: 'User 1',
        email: 'user1@example.com',
        role: 'IC'
      },
      {
        id: user2Id,
        name: 'User 2', 
        email: 'user2@example.com',
        role: 'IC'
      }
    ]).execute();

    // Create opportunities for both users
    const opportunities = [
      {
        id: randomUUID(),
        name: 'User 1 Opportunity',
        stage: 'Prospecting' as const,
        amount: '10000.00',
        close_date: new Date('2024-12-31'),
        assigned_to_id: user1Id,
        customer_name: 'Customer 1',
        last_activity_date: new Date(),
        deal_probability: 25
      },
      {
        id: randomUUID(),
        name: 'User 2 Opportunity',
        stage: 'Prospecting' as const,
        amount: '20000.00',
        close_date: new Date('2024-12-31'),
        assigned_to_id: user2Id,
        customer_name: 'Customer 2',
        last_activity_date: new Date(),
        deal_probability: 30
      }
    ];

    await db.insert(salesOpportunitiesTable).values(opportunities).execute();

    // IC should only see their own opportunities
    const result = await getPipelineStageData(user1Id, 'IC');

    expect(result).toHaveLength(1);
    const prospectingData = result.find(item => item.stage === 'Prospecting');
    expect(prospectingData!.count).toEqual(1);
    expect(prospectingData!.value).toEqual(10000); // Only user1's opportunity
  });

  it('should show team opportunities for Manager persona', async () => {
    // Create manager and IC users
    const managerId = randomUUID();
    const icUserId = randomUUID();
    const executiveId = randomUUID();
    
    await db.insert(usersTable).values([
      {
        id: managerId,
        name: 'Manager',
        email: 'manager@example.com',
        role: 'Front Line Manager'
      },
      {
        id: icUserId,
        name: 'IC User',
        email: 'ic@example.com',
        role: 'IC'
      },
      {
        id: executiveId,
        name: 'Executive',
        email: 'exec@example.com',
        role: 'Executive'
      }
    ]).execute();

    // Create opportunities for different user types
    const opportunities = [
      {
        id: randomUUID(),
        name: 'IC Opportunity',
        stage: 'Prospecting' as const,
        amount: '10000.00',
        close_date: new Date('2024-12-31'),
        assigned_to_id: icUserId,
        customer_name: 'Customer 1',
        last_activity_date: new Date(),
        deal_probability: 25
      },
      {
        id: randomUUID(),
        name: 'Manager Opportunity',
        stage: 'Prospecting' as const,
        amount: '15000.00',
        close_date: new Date('2024-12-31'),
        assigned_to_id: managerId,
        customer_name: 'Customer 2',
        last_activity_date: new Date(),
        deal_probability: 30
      },
      {
        id: randomUUID(),
        name: 'Executive Opportunity',
        stage: 'Qualification' as const,
        amount: '25000.00',
        close_date: new Date('2024-12-31'),
        assigned_to_id: executiveId,
        customer_name: 'Customer 3',
        last_activity_date: new Date(),
        deal_probability: 50
      }
    ];

    await db.insert(salesOpportunitiesTable).values(opportunities).execute();

    // Manager should only see IC opportunities
    const result = await getPipelineStageData(managerId, 'Manager');

    expect(result).toHaveLength(1);
    const prospectingData = result.find(item => item.stage === 'Prospecting');
    expect(prospectingData!.count).toEqual(1);
    expect(prospectingData!.value).toEqual(10000); // Only IC user's opportunity
  });

  it('should show all opportunities for Executive persona', async () => {
    // Create users with different roles
    const icUserId = randomUUID();
    const managerId = randomUUID();
    const executiveId = randomUUID();
    
    await db.insert(usersTable).values([
      {
        id: icUserId,
        name: 'IC User',
        email: 'ic@example.com',
        role: 'IC'
      },
      {
        id: managerId,
        name: 'Manager',
        email: 'manager@example.com',
        role: 'Front Line Manager'
      },
      {
        id: executiveId,
        name: 'Executive',
        email: 'exec@example.com',
        role: 'Executive'
      }
    ]).execute();

    // Create opportunities for all user types
    const opportunities = [
      {
        id: randomUUID(),
        name: 'IC Opportunity',
        stage: 'Prospecting' as const,
        amount: '10000.00',
        close_date: new Date('2024-12-31'),
        assigned_to_id: icUserId,
        customer_name: 'Customer 1',
        last_activity_date: new Date(),
        deal_probability: 25
      },
      {
        id: randomUUID(),
        name: 'Manager Opportunity',
        stage: 'Prospecting' as const,
        amount: '15000.00',
        close_date: new Date('2024-12-31'),
        assigned_to_id: managerId,
        customer_name: 'Customer 2',
        last_activity_date: new Date(),
        deal_probability: 30
      },
      {
        id: randomUUID(),
        name: 'Executive Opportunity',
        stage: 'Qualification' as const,
        amount: '25000.00',
        close_date: new Date('2024-12-31'),
        assigned_to_id: executiveId,
        customer_name: 'Customer 3',
        last_activity_date: new Date(),
        deal_probability: 50
      }
    ];

    await db.insert(salesOpportunitiesTable).values(opportunities).execute();

    // Executive should see all opportunities
    const result = await getPipelineStageData(executiveId, 'Executive');

    expect(result).toHaveLength(2);
    
    const prospectingData = result.find(item => item.stage === 'Prospecting');
    expect(prospectingData!.count).toEqual(2);
    expect(prospectingData!.value).toEqual(25000); // Both prospecting opportunities

    const qualificationData = result.find(item => item.stage === 'Qualification');
    expect(qualificationData!.count).toEqual(1);
    expect(qualificationData!.value).toEqual(25000);
  });

  it('should return empty array when no opportunities exist', async () => {
    // Create test user
    const userId = randomUUID();
    await db.insert(usersTable).values({
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
      role: 'IC'
    }).execute();

    const result = await getPipelineStageData(userId, 'IC');

    expect(result).toEqual([]);
  });
});
