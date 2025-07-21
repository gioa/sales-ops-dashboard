
import { db } from '../db';
import { salesOpportunitiesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteSalesOpportunity(id: string): Promise<boolean> {
  try {
    const result = await db.delete(salesOpportunitiesTable)
      .where(eq(salesOpportunitiesTable.id, id))
      .execute();

    // Check if any rows were affected (deleted)
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Sales opportunity deletion failed:', error);
    throw error;
  }
}
