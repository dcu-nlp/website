export function GET() {
  return new Response(
    JSON.stringify({
      name: 'NLP Applications Group',
      short_name: 'NLP',
      start_url: '.',
      display: 'standalone',
      background_color: '#f3fbfc',
      theme_color: '#003135',
      icons: [
        {
          src: 'favicon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
        },
      ],
    }),
    {
      headers: {
        'Content-Type': 'application/manifest+json',
      },
    },
  );
}
