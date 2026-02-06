import { z } from 'zod';

export const workspaceTypeEnum = z.enum(['PERSON', 'COMPANY']);

export const createWorkspaceSchema = z.object({
  type: workspaceTypeEnum,
  name: z.string().min(1, 'El nombre es requerido').max(100),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100).optional(),
  type: workspaceTypeEnum.optional(),
});

export type WorkspaceType = z.infer<typeof workspaceTypeEnum>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
