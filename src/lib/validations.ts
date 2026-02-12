import { z } from 'zod'

export const urlSchema = z.string().url('Please enter a valid URL')

export const createLinkSchema = z.object({
  url: urlSchema,
  x: z.number(),
  y: z.number(),
})

export const updateLinkPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
})

export const createCanvasSchema = z.object({
  name: z.string().min(1, 'Canvas name is required').max(100),
  description: z.string().max(500).optional(),
})

export const createConnectionSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  label: z.string().optional(),
  color: z.string().optional(),
  style: z.enum(['default', 'dashed', 'animated']).optional(),
})

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  color: z.string().optional(),
})
