import { opportunities } from '@/utils/opportunities';
import { getCollection } from 'astro:content';
export async function GET() {
  const resources = await getCollection('resources');
  return new Response(
    JSON.stringify({
      opportunities: opportunities,
      resources: resources.map((entry) => ({
        id: entry.id,
        reviewedAt: entry.data.reviewedAt,
      })),
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
}
