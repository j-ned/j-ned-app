import { z } from 'zod';

export const architectureDecisionSchema = z.strictObject({
  decision: z.string().min(1).max(150),
  rationale: z.string().min(1).max(500),
});
export type ArchitectureDecisionDto = z.infer<
  typeof architectureDecisionSchema
>;
