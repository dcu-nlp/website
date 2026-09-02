interface Props {
  site: URL;
}

export function GET({ site }: Props) {
  const sitemap = new URL('sitemap-index.xml', site);

  return new Response(
    `User-agent: *\nAllow: /\nSitemap: ${sitemap.toString()}\n`,
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    },
  );
}
