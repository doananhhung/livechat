import { z } from 'zod';

export const ToolDataSchema = z.object({
  toolName: z.string().min(1, { message: 'Tool name is required' }),
  toolArgs: z.record(z.string(), z.unknown()).optional().default({}),
});

export const ConditionDataSchema = z.object({
  prompt: z
    .string()
    .min(1, { message: 'Condition prompt must strict be non-empty string' })
    .optional(),
});

const PositionSchema = z
  .object({
    x: z.number().default(0),
    y: z.number().default(0),
  })
  .default({ x: 0, y: 0 });

export const WorkflowNodeSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('start'),
      id: z.string(),
      position: PositionSchema,
      data: z.record(z.unknown()).optional().default({}),
    })
    .passthrough(),
  z
    .object({
      type: z.literal('action'),
      id: z.string(),
      position: PositionSchema,
      data: ToolDataSchema,
    })
    .passthrough(),
  z
    .object({
      type: z.literal('condition'),
      id: z.string(),
      position: PositionSchema,
      data: ConditionDataSchema,
    })
    .passthrough(),
  z
    .object({
      type: z.literal('llm'),
      id: z.string(),
      position: PositionSchema,
      data: z.record(z.unknown()).optional().default({}),
    })
    .passthrough(),
]);

export type ToolData = z.infer<typeof ToolDataSchema>;
export type ConditionData = z.infer<typeof ConditionDataSchema>;
export type ValidatedWorkflowNode = z.infer<typeof WorkflowNodeSchema>;
