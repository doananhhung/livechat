import { z } from 'zod';

export const ToolDataSchema = z.object({
  toolName: z.string().min(1, { message: 'Tool name is required' }),
  toolArgs: z.record(z.string(), z.unknown()).optional().default({}),
  prompt: z.string().optional(),
});

export const ConditionDataSchema = z.object({
  prompt: z
    .string()
    .min(1, { message: 'Condition prompt must strict be non-empty string' })
    .optional(),
});

export const SwitchCaseSchema = z.object({
  route: z.string().min(1, { message: 'Route name is required' }),
  when: z.string().min(1, { message: 'Condition is required' }),
});

export const SwitchDataSchema = z.object({
  cases: z
    .array(SwitchCaseSchema)
    .max(10, { message: 'Maximum 10 cases allowed' }),
  prompt: z.string().optional(),
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
  z
    .object({
      type: z.literal('switch'),
      id: z.string(),
      position: PositionSchema,
      data: SwitchDataSchema,
    })
    .passthrough(),
]);

export type ToolData = z.infer<typeof ToolDataSchema>;
export type ConditionData = z.infer<typeof ConditionDataSchema>;
export type SwitchCase = z.infer<typeof SwitchCaseSchema>;
export type SwitchData = z.infer<typeof SwitchDataSchema>;
export type ValidatedWorkflowNode = z.infer<typeof WorkflowNodeSchema>;
