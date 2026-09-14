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
          src: 'nlp-icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: 'nlp-icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
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
