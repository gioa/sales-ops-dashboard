
import { db } from '../db';
import { salesOpportunitiesTable } from '../db/schema';
import { type SalesOpportunity, type OpportunityFilters } from '../schema';
import { eq, gte, lte, ilike, and, type SQL } from 'drizzle-orm';

export async function getSalesOpportunities(filters?: OpportunityFilters): Promise<SalesOpportunity[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filters) {
      // Filter by assigned user
      if (filters.assigned_to_id) {
        conditions.push(eq(salesOpportunitiesTable.assigned_to_id, filters.assigned_to_id));
      }

      // Filter by stage
      if (filters.stage) {
        conditions.push(eq(salesOpportunitiesTable.stage, filters.stage));
      }

      // Filter by customer name (case-insensitive partial match)
      if (filters.customer_name) {
        conditions.push(ilike(salesOpportunitiesTable.customer_name, `%${filters.customer_name}%`));
      }

      // Filter by minimum amount
      if (filters.min_amount !== undefined) {
        conditions.push(gte(salesOpportunitiesTable.amount, filters.min_amount.toString()));
      }

      // Filter by maximum amount
      if (filters.max_amount !== undefined) {
        conditions.push(lte(salesOpportunitiesTable.amount, filters.max_amount.toString()));
      }

      // Filter by close date from
      if (filters.close_date_from) {
        conditions.push(gte(salesOpportunitiesTable.close_date, filters.close_date_from));
      }

      // Filter by close date to
      if (filters.close_date_to) {
        conditions.push(lte(salesOpportunitiesTable.close_date, filters.close_date_to));
      }
    }

    // Build and execute query
    const results = conditions.length > 0
      ? await db.select()
          .from(salesOpportunitiesTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(salesOpportunitiesTable)
          .execute();

    // Convert numeric fields back to numbers
    return results.map(opportunity => ({
      ...opportunity,
      amount: parseFloat(opportunity.amount)
    }));
  } catch (error) {
    console.error('Failed to get sales opportunities:', error);
    throw error;
  }
}
