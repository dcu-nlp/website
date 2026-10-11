import { z } from 'astro:content';
import records from '@/data/opportunities.json';
export const opportunities = z
  .array(
    z.object({
      id: z.string(),
      title: z.string(),
      summary: z.string(),
      url: z.string().url(),
      deadline: z.coerce.date().optional(),
      reviewBy: z.coerce.date(),
    }),
  )
  .parse(records);
