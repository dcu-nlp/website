export function GET() {
  // Crawlers must access pages to read their noindex meta tags.
  return new Response(
    `User-agent: *\nAllow: /\n`,
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    },
  );
}
