# NLG group Website

An Astro-powered, fully static academic research group website built with TypeScript, Tailwind CSS, MDX, and Astro Content Collections. The project is designed for GitHub Pages deployment and keeps editable content in structured collection entries rather than hardcoded page markup.

## Stack

- Astro
- TypeScript
- Tailwind CSS
- MDX
- Astro Content Collections with Zod schemas
- GitHub Actions for GitHub Pages deployment

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the local dev server:

   ```bash
   npm run dev
   ```

3. Build the site:

   ```bash
   npm run build
   ```

## Project architecture

- `src/layouts/`
  Shared page layout and document shell.
- `src/components/`
  Reusable UI components such as the header, footer, hero, cards, and CTA blocks.
- `src/data/`
  MDX content collections for `people`, `publications`, `projects`, `news`, and `teaching`.
- `src/pages/`
  Static section pages plus dynamic routes generated from collection content.
- `src/utils/`
  Site configuration, navigation, URL helpers, content utilities, and SEO helpers.
- `src/data/generated/`
  Generated publication and author-identity data refreshed by GitHub Actions.
- `public/`
  Static assets such as the favicon and Open Graph image.

## Content editing

Add or update content in these folders:

- People: `src/data/people/`
- Publications: `src/data/publications/`
- Projects: `src/data/projects/`
- News: `src/data/news/`
- Teaching: `src/data/teaching/`

Each entry is an `.mdx` file with frontmatter validated by the schemas in `src/content.config.ts`.

## Maintenance notes

- Shared site text, navigation, contact details, and partner links live in `src/utils/site.ts`.
- Shared internal and external link helpers live in `src/utils/urls.ts`.
- Generated publication data is written to `src/data/generated/` by `npm run sync:publications`; review the generated JSON before publishing if source data changes unexpectedly.
- Build output and local caches should remain untracked and are ignored via `.gitignore`.

## Replacing placeholder content

1. Update branding, navigation, contact details, and research theme copy in `src/utils/site.ts`.
2. Replace sample `.mdx` entries in `src/data/` with real content.
3. Update URLs, affiliations, social links, and biographies for real group members.
4. Replace the placeholder `public/og-image.svg` and `public/favicon.svg` if needed.
5. Set the production `site` value in `astro.config.mjs` for your deployed domain or GitHub Pages URL.

## GitHub Pages deployment

The site is configured for static deployment through `.github/workflows/deploy.yml`.

### How it works

- A push to `main` triggers the workflow.
- GitHub Actions installs dependencies with `npm ci`.
- The workflow sets repository-aware environment variables so Astro builds using the correct GitHub Pages base path.
- The generated `dist/` folder is uploaded and deployed to GitHub Pages.

### Repository settings

1. Push this project to a GitHub repository.
2. In GitHub, open `Settings > Pages`.
3. Set the source to `GitHub Actions`.
4. Ensure the default branch is `main`.

## Automated publications sync

The publications archive now supports a generated data layer that can be refreshed by GitHub Actions.

- `npm run sync:publications` fetches publication data for the authors defined in `src/data/people/`.
- The sync fetches each enabled person’s exact DBLP XML bibliography using a verified `dblpId`. Every imported record must contain that same author/editor PID. Name searches and automatic ORCID discovery are disabled.
- Verify new IDs against the researcher’s actual bibliography, never a DBLP disambiguation page.
- If any configured bibliography fails, is blocked, or contains no verified records, the sync fails before replacing the existing dataset. Review the workflow failure and retry after source access recovers.
- The September 2026 cleanup retained 46 of 100 cached imports using exact DBLP researcher labels and removed all unverified ORCID records. `generatedAt` retains the original fetch date; `reviewedAt` records the cleanup date.
- Run `npm test` to check identity matching, metadata decoding, deduplication, route collisions, and combined search filters. The deployment and sync workflows run these tests.
- Generated outputs are written to:
  - `src/data/generated/publications.json`
  - `src/data/generated/author-identities.json`
- Manual editorial controls remain in `src/data/publication-overrides.json`.

The scheduled workflow lives in `.github/workflows/sync-publications.yml` and runs weekly plus on manual dispatch.

## Security notes

- The site is fully static and keeps client-side JavaScript minimal.
- External publication syncs use public APIs and should be treated as untrusted input; the sync script now validates and constrains remote-derived fields before writing generated JSON.
- Review `npm audit` output periodically, especially for transitive Astro ecosystem advisories that may require upstream fixes.

## SEO, feeds, and metadata

- SEO tags are handled in `src/components/Seo.astro`.
- Sitemap generation is enabled through `@astrojs/sitemap`.
- News RSS is generated at `/rss.xml`.
- Robots output is generated at `/robots.txt`.

## Notes for future developers

- Homepage sections pull featured content from collection entries using the `featured` field.
- The design system is intentionally restrained: one accent color, strong typography contrast, and reusable card surfaces.
- The site is fully static and uses minimal client-side JavaScript.

## Archive and homepage updates

- Publications support title/author/venue/topic search, year/author/topic filters, list and grid layouts, and shareable query URLs. Without JavaScript the full archive remains readable.
- Paper links, author lists, and expandable plain-text citations stay available without flip-card interactions. Official titles are preserved. Curated entries take precedence over generated records matched by DOI, source ID, or normalized title and year.
- The homepage shows the three newest non-future news entries from `src/data/news/`. Keep their dates and linked sources accurate.
- Four existing JPEG portraits are used with corrected alt text, lazy loading, and consistent positioning. Sri Balaaji currently uses an initials fallback; add a genuine portrait under `public/images/team/` and set `photo` in his profile when available.
- Verified researcher bibliographies: [Brian Davis](https://dblp.org/pid/04/285-1.html), [Joachim Wagner](https://dblp.org/pid/80/5915-1.html), [Chinonso Cynthia Osuji](https://dblp.org/pid/368/7332.html), [Kanishk Verma](https://dblp.org/pid/293/4527.html), and [Sri Balaaji Natarajan Kalaivendan](https://dblp.org/pid/400/5860.html).

Six additional papers from the newer upstream sync were verified against ACL Anthology and preserved in `publication-overrides.json`. Eleven incomplete records are retained in `src/data/review/pending-publications.json` for editorial review; they are not rendered on the public site.
