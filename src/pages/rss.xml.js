import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '@/utils/site';
import { getEntrySlug } from '@/utils/content';

export async function GET(context) {
  const news = await getCollection('news');
  const sortedNews = news.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site,
    items: sortedNews.map((item) => ({
      title: item.data.title,
      description: item.data.summary,
      pubDate: item.data.date,
      link: `/news/${getEntrySlug(item)}/`,
    })),
  });
}
