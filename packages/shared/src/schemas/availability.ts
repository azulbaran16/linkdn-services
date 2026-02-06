import { z } from 'zod';

// Time format HH:mm
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const availabilityRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0=Sunday, 6=Saturday
  startTime: z.string().regex(timeRegex, 'Formato invalido. Usa HH:mm'),
  endTime: z.string().regex(timeRegex, 'Formato invalido. Usa HH:mm'),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: 'La hora de inicio debe ser anterior a la hora de fin' }
);

export const upsertAvailabilitySchema = z.object({
  rules: z.array(availabilityRuleSchema),
});

export type AvailabilityRuleInput = z.infer<typeof availabilityRuleSchema>;
export type UpsertAvailabilityInput = z.infer<typeof upsertAvailabilitySchema>;
