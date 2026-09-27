import { z } from 'zod';

export const createIncidentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['LOW', 'MEDIUM', 'CRITICAL']),
  affectedServices: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid service ID')).min(1, 'Select at least one affected service'),
});

export const updateIncidentStatusSchema = z.object({
  status: z.enum(['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED']),
  description: z.string().optional(),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentStatusInput = z.infer<typeof updateIncidentStatusSchema>;
