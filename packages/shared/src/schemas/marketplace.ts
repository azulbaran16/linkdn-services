import { z } from 'zod';

export const marketplaceSearchSchema = z.object({
  city: z.string().optional(),
  category: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type MarketplaceSearchInput = z.infer<typeof marketplaceSearchSchema>;
