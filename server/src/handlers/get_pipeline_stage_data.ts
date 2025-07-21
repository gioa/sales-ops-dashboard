
import { db } from '../db';
import { salesOpportunitiesTable, usersTable } from '../db/schema';
import { type PipelineStageData, type PersonaType } from '../schema';
import { eq, sql } from 'drizzle-orm';

export async function getPipelineStageData(userId: string, persona: PersonaType): Promise<PipelineStageData[]> {
  try {
    // Build the base query based on persona type
    if (persona === 'IC') {
      // IC sees only their own opportunities
      const results = await db
        .select({
          stage: salesOpportunitiesTable.stage,
          count: sql<number>`count(*)::integer`,
          value: sql<string>`sum(${salesOpportunitiesTable.amount})`
        })
        .from(salesOpportunitiesTable)
        .where(eq(salesOpportunitiesTable.assigned_to_id, userId))
        .groupBy(salesOpportunitiesTable.stage)
        .orderBy(salesOpportunitiesTable.stage)
        .execute();

      return results.map(result => ({
        stage: result.stage,
        count: result.count,
        value: parseFloat(result.value || '0')
      }));

    } else if (persona === 'Manager') {
      // Manager sees opportunities from their team (users with role 'IC')
      const results = await db
        .select({
          stage: salesOpportunitiesTable.stage,
          count: sql<number>`count(*)::integer`,
          value: sql<string>`sum(${salesOpportunitiesTable.amount})`
        })
        .from(salesOpportunitiesTable)
        .innerJoin(usersTable, eq(salesOpportunitiesTable.assigned_to_id, usersTable.id))
        .where(eq(usersTable.role, 'IC'))
        .groupBy(salesOpportunitiesTable.stage)
        .orderBy(salesOpportunitiesTable.stage)
        .execute();

      return results.map(result => ({
        stage: result.stage,
        count: result.count,
        value: parseFloat(result.value || '0')
      }));

    } else {
      // Executive sees all opportunities (no additional filter needed)
      const results = await db
        .select({
          stage: salesOpportunitiesTable.stage,
          count: sql<number>`count(*)::integer`,
          value: sql<string>`sum(${salesOpportunitiesTable.amount})`
        })
        .from(salesOpportunitiesTable)
        .groupBy(salesOpportunitiesTable.stage)
        .orderBy(salesOpportunitiesTable.stage)
        .execute();

      return results.map(result => ({
        stage: result.stage,
        count: result.count,
        value: parseFloat(result.value || '0')
      }));
    }
  } catch (error) {
    console.error('Pipeline stage data query failed:', error);
    throw error;
  }
}
