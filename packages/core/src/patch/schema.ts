import { z } from 'zod';
import { PhaseNumberSchema } from '../spec/types.js';

/** JSON block schema that the AI emits at end of every response. */
export const PatchEnvelopeSchema = z.object({
  patches: z
    .array(
      z.object({
        phase: PhaseNumberSchema,
        hunks: z
          .array(
            z.object({
              before: z.string(),
              after: z.string(),
              rationale: z.string().optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

export type PatchEnvelope = z.infer<typeof PatchEnvelopeSchema>;
