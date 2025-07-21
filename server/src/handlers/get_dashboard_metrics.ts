
import { db } from '../db';
import { salesOpportunitiesTable } from '../db/schema';
import { type DashboardMetrics, type PersonaType } from '../schema';
import { eq } from 'drizzle-orm';

export async function getDashboardMetrics(userId: string, persona: PersonaType): Promise<DashboardMetrics> {
  try {
    // Get all opportunities based on persona
    let opportunities;
    
    if (persona === 'IC' || persona === 'Manager') {
      // For IC and Manager (no team relationship defined), filter by assigned user
      opportunities = await db.select()
        .from(salesOpportunitiesTable)
        .where(eq(salesOpportunitiesTable.assigned_to_id, userId))
        .execute();
    } else {
      // For Executive, include all opportunities
      opportunities = await db.select()
        .from(salesOpportunitiesTable)
        .execute();
    }

    // Convert numeric fields and calculate metrics
    const convertedOpportunities = opportunities.map(opp => ({
      ...opp,
      amount: parseFloat(opp.amount)
    }));

    // Calculate current month boundaries
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Filter opportunities by status
    const openOpportunities = convertedOpportunities.filter(opp => 
      !['Closed Won', 'Closed Lost'].includes(opp.stage)
    );
    
    const closedWonOpportunities = convertedOpportunities.filter(opp => 
      opp.stage === 'Closed Won'
    );
    
    const closedWonThisMonth = closedWonOpportunities.filter(opp =>
      opp.created_at >= currentMonthStart && opp.created_at <= currentMonthEnd
    );

    const allClosedOpportunities = convertedOpportunities.filter(opp =>
      ['Closed Won', 'Closed Lost'].includes(opp.stage)
    );

    // Calculate pipeline value (sum of all open opportunities)
    const pipelineValue = openOpportunities.reduce((sum, opp) => sum + opp.amount, 0);

    // Calculate forecasted revenue (weighted by deal probability)
    const forecastedRevenue = openOpportunities.reduce((sum, opp) => 
      sum + (opp.amount * opp.deal_probability / 100), 0
    );

    // Calculate win rate
    const winRate = allClosedOpportunities.length > 0 
      ? (closedWonOpportunities.length / allClosedOpportunities.length) * 100 
      : 0;

    // Count upcoming activities (opportunities with close_date in next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const upcomingActivities = openOpportunities.filter(opp =>
      opp.close_date <= thirtyDaysFromNow && opp.close_date >= now
    ).length;

    return {
      pipeline_value: pipelineValue,
      opportunities_won: closedWonOpportunities.length,
      activities_completed: 0, // Not tracked in current schema
      win_rate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
      open_opportunities: openOpportunities.length,
      closed_won_this_month: closedWonThisMonth.length,
      forecasted_revenue: forecastedRevenue,
      upcoming_activities: upcomingActivities
    };
  } catch (error) {
    console.error('Dashboard metrics calculation failed:', error);
    throw error;
  }
}
