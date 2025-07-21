
import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['IC', 'Front Line Manager', 'Executive']);
export type UserRole = z.infer<typeof userRoleSchema>;

// User schema
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Sales opportunity stage enum
export const salesOpportunityStageSchema = z.enum([
  'Prospecting',
  'Qualification', 
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost'
]);
export type SalesOpportunityStage = z.infer<typeof salesOpportunityStageSchema>;

// Sales opportunity schema
export const salesOpportunitySchema = z.object({
  id: z.string(),
  name: z.string(),
  stage: salesOpportunityStageSchema,
  amount: z.number().positive(),
  close_date: z.coerce.date(),
  assigned_to_id: z.string(),
  customer_name: z.string(),
  last_activity_date: z.coerce.date(),
  deal_probability: z.number().int().min(0).max(100),
  created_at: z.coerce.date()
});

export type SalesOpportunity = z.infer<typeof salesOpportunitySchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for creating sales opportunities
export const createSalesOpportunityInputSchema = z.object({
  name: z.string(),
  stage: salesOpportunityStageSchema,
  amount: z.number().positive(),
  close_date: z.coerce.date(),
  assigned_to_id: z.string(),
  customer_name: z.string(),
  last_activity_date: z.coerce.date(),
  deal_probability: z.number().int().min(0).max(100)
});

export type CreateSalesOpportunityInput = z.infer<typeof createSalesOpportunityInputSchema>;

// Input schema for updating sales opportunities
export const updateSalesOpportunityInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  stage: salesOpportunityStageSchema.optional(),
  amount: z.number().positive().optional(),
  close_date: z.coerce.date().optional(),
  assigned_to_id: z.string().optional(),
  customer_name: z.string().optional(),
  last_activity_date: z.coerce.date().optional(),
  deal_probability: z.number().int().min(0).max(100).optional()
});

export type UpdateSalesOpportunityInput = z.infer<typeof updateSalesOpportunityInputSchema>;

// Dashboard metrics schemas
export const dashboardMetricsSchema = z.object({
  pipeline_value: z.number(),
  opportunities_won: z.number().int(),
  activities_completed: z.number().int(),
  win_rate: z.number().min(0).max(100),
  open_opportunities: z.number().int(),
  closed_won_this_month: z.number().int(),
  forecasted_revenue: z.number(),
  upcoming_activities: z.number().int()
});

export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;

// Pipeline stage data schema
export const pipelineStageDataSchema = z.object({
  stage: salesOpportunityStageSchema,
  count: z.number().int(),
  value: z.number()
});

export type PipelineStageData = z.infer<typeof pipelineStageDataSchema>;

// Query filters schema
export const opportunityFiltersSchema = z.object({
  assigned_to_id: z.string().optional(),
  stage: salesOpportunityStageSchema.optional(),
  customer_name: z.string().optional(),
  min_amount: z.number().optional(),
  max_amount: z.number().optional(),
  close_date_from: z.coerce.date().optional(),
  close_date_to: z.coerce.date().optional()
});

export type OpportunityFilters = z.infer<typeof opportunityFiltersSchema>;

// Persona type schema
export const personaTypeSchema = z.enum(['IC', 'Manager', 'Executive']);
export type PersonaType = z.infer<typeof personaTypeSchema>;
