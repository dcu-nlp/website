# NLP Applications Group Website

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
- Search indexing is disabled during development through a site-wide `noindex, nofollow, noimageindex` meta tag in `src/components/Seo.astro`.
- Sitemap generation and its robots.txt advertisement are disabled. To launch, remove the robots meta tag, restore `@astrojs/sitemap` in `astro.config.mjs`, and restore the sitemap URL in `src/pages/robots.txt.ts`.
- Crawling stays allowed so search engines can read the `noindex` directive. These changes take effect after deployment; they do not make the public site private.
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

## Research links, resources, and citations

People and project pages now include related work. Group authors are matched using
verified `matchedPeople` IDs or exact normalized profile names/name variants;
project publications are matched by editorial paper URLs, rather than topic guesses.
Keep project `people` names aligned with profile names. Add paper links to a project
to associate its publications in both directions.

Publication frontmatter supports `pdfUrl`, `codeUrl`, `dataUrl`, and `bibtex`.
Supply publisher BibTeX when available; otherwise the site creates a basic `@misc`
citation without guessing publication type or DOI. BibTeX remains selectable with
JavaScript disabled or clipboard access unavailable.

The code/datasets catalogue at `/resources/` uses `src/data/resources/*.mdx`.
Every record needs `title`, `summary`, `kind` (`code`, `dataset`, `code-and-data`),
`documentationUrl`, `license`, `access`, and `reviewedAt` (YYYY-MM-DD).
Optional `repositoryUrl`, `dataUrl`, `projects`, and `publications` provide links;
relationship arrays contain content slugs. Confirm access and licence terms before
adding an entry. Unknown licences must be explicitly described, not inferred from
public repository visibility. The initial BullyBench entry was checked against its
[repository README](https://github.com/kanishk-r-verma/bully-bench#readme).

## Opportunities and content review

Advertised openings are stored in `src/data/opportunities.json` (currently empty).
Each record requires `id`, `title`, `summary`, `url`, and `reviewBy`; `deadline` is
optional. Dates use YYYY-MM-DD. Expired openings are omitted from the Join page
at build time, and the weekly workflow rebuilds for review. To update the live page
after a deadline, run the deployment workflow (scheduled validation does not deploy).

After building, `npm run review:content` creates `content-review.md`, flagging expired
openings, overdue review dates, and resource information older than 180 days.
Warnings call for editorial review without preventing unrelated fixes from shipping.

## Validation and previews

- `npm run build` validates content and generates the site.
- `npm run check:site` checks built internal links, fragments, images, and CSS assets.
- `npm run check:site -- --external` additionally checks public HTTP links; confirmed
  404/410 responses fail, while rate limiting, access restrictions, and network errors
  are reported for review.
- `npm run review:content` produces the dated-content report.

Pull requests run tests, build validation, and internal checks, then upload
`site-preview-and-reports` as a downloadable GitHub Actions artifact. This is a
reviewable build, not a hosted preview deployment. Download it and serve its `dist`
directory locally, or run `npm ci` and `npm run dev` on the PR branch to preview.
Weekly/manual validation also checks external links. Production deployment checks
internal links and assets before uploading the site.

The homepage uses a static campus image without a slideshow control bar.
Pointer parallax respects reduced-motion preferences. Mobile navigation closes on Escape, outside clicks,
and focus leaving the menu. Global controls have visible focus outlines and minimum
44px touch targets.
