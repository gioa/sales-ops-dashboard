
import { db } from '../db';
import { salesOpportunitiesTable, usersTable } from '../db/schema';
import { type CreateSalesOpportunityInput, type SalesOpportunity } from '../schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const createSalesOpportunity = async (input: CreateSalesOpportunityInput): Promise<SalesOpportunity> => {
  try {
    // Validate that assigned_to_id exists in users table
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.assigned_to_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.assigned_to_id} not found`);
    }

    // Generate unique ID
    const id = randomUUID();

    // Insert sales opportunity record
    const result = await db.insert(salesOpportunitiesTable)
      .values({
        id,
        name: input.name,
        stage: input.stage,
        amount: input.amount.toString(), // Convert number to string for numeric column
        close_date: input.close_date,
        assigned_to_id: input.assigned_to_id,
        customer_name: input.customer_name,
        last_activity_date: input.last_activity_date,
        deal_probability: input.deal_probability
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const salesOpportunity = result[0];
    return {
      ...salesOpportunity,
      amount: parseFloat(salesOpportunity.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Sales opportunity creation failed:', error);
    throw error;
  }
};
