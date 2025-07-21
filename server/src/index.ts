
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';
import { 
  createUserInputSchema, 
  createSalesOpportunityInputSchema, 
  updateSalesOpportunityInputSchema,
  opportunityFiltersSchema,
  personaTypeSchema
} from './schema';
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { createSalesOpportunity } from './handlers/create_sales_opportunity';
import { getSalesOpportunities } from './handlers/get_sales_opportunities';
import { updateSalesOpportunity } from './handlers/update_sales_opportunity';
import { getDashboardMetrics } from './handlers/get_dashboard_metrics';
import { getPipelineStageData } from './handlers/get_pipeline_stage_data';
import { getUserById } from './handlers/get_user_by_id';
import { deleteSalesOpportunity } from './handlers/delete_sales_opportunity';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),
  
  getUserById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => getUserById(input.id)),

  // Sales opportunity routes
  createSalesOpportunity: publicProcedure
    .input(createSalesOpportunityInputSchema)
    .mutation(({ input }) => createSalesOpportunity(input)),
  
  getSalesOpportunities: publicProcedure
    .input(opportunityFiltersSchema.optional())
    .query(({ input }) => getSalesOpportunities(input)),
  
  updateSalesOpportunity: publicProcedure
    .input(updateSalesOpportunityInputSchema)
    .mutation(({ input }) => updateSalesOpportunity(input)),
  
  deleteSalesOpportunity: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => deleteSalesOpportunity(input.id)),

  // Dashboard routes
  getDashboardMetrics: publicProcedure
    .input(z.object({ userId: z.string(), persona: personaTypeSchema }))
    .query(({ input }) => getDashboardMetrics(input.userId, input.persona)),
  
  getPipelineStageData: publicProcedure
    .input(z.object({ userId: z.string(), persona: personaTypeSchema }))
    .query(({ input }) => getPipelineStageData(input.userId, input.persona)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
