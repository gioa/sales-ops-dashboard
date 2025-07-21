
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const userRoleEnum = pgEnum('user_role', ['IC', 'Front Line Manager', 'Executive']);
export const salesOpportunityStageEnum = pgEnum('sales_opportunity_stage', [
  'Prospecting',
  'Qualification',
  'Proposal', 
  'Negotiation',
  'Closed Won',
  'Closed Lost'
]);

// Users table
export const usersTable = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Sales opportunities table
export const salesOpportunitiesTable = pgTable('sales_opportunities', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  stage: salesOpportunityStageEnum('stage').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  close_date: timestamp('close_date').notNull(),
  assigned_to_id: text('assigned_to_id').notNull(),
  customer_name: text('customer_name').notNull(),
  last_activity_date: timestamp('last_activity_date').notNull(),
  deal_probability: integer('deal_probability').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  opportunities: many(salesOpportunitiesTable)
}));

export const salesOpportunitiesRelations = relations(salesOpportunitiesTable, ({ one }) => ({
  assignedTo: one(usersTable, {
    fields: [salesOpportunitiesTable.assigned_to_id],
    references: [usersTable.id]
  })
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type SalesOpportunity = typeof salesOpportunitiesTable.$inferSelect;
export type NewSalesOpportunity = typeof salesOpportunitiesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  salesOpportunities: salesOpportunitiesTable 
};
