
import { db } from '../db';
import { salesOpportunitiesTable, usersTable } from '../db/schema';
import { type UpdateSalesOpportunityInput, type SalesOpportunity } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateSalesOpportunity(input: UpdateSalesOpportunityInput): Promise<SalesOpportunity> {
  try {
    // First, verify the opportunity exists
    const existingOpportunity = await db.select()
      .from(salesOpportunitiesTable)
      .where(eq(salesOpportunitiesTable.id, input.id))
      .execute();

    if (existingOpportunity.length === 0) {
      throw new Error(`Sales opportunity with id ${input.id} not found`);
    }

    // If assigned_to_id is being updated, verify the user exists
    if (input.assigned_to_id) {
      const user = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.assigned_to_id))
        .execute();

      if (user.length === 0) {
        throw new Error(`User with id ${input.assigned_to_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.stage !== undefined) updateData.stage = input.stage;
    if (input.amount !== undefined) updateData.amount = input.amount.toString();
    if (input.close_date !== undefined) updateData.close_date = input.close_date;
    if (input.assigned_to_id !== undefined) updateData.assigned_to_id = input.assigned_to_id;
    if (input.customer_name !== undefined) updateData.customer_name = input.customer_name;
    if (input.last_activity_date !== undefined) updateData.last_activity_date = input.last_activity_date;
    if (input.deal_probability !== undefined) updateData.deal_probability = input.deal_probability;

    // Update the opportunity
    const result = await db.update(salesOpportunitiesTable)
      .set(updateData)
      .where(eq(salesOpportunitiesTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const opportunity = result[0];
    return {
      ...opportunity,
      amount: parseFloat(opportunity.amount)
    };
  } catch (error) {
    console.error('Sales opportunity update failed:', error);
    throw error;
  }
}
