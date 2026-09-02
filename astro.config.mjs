import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const repository =
  process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'brian-davis-research-group';
const isPages = process.env.GITHUB_ACTIONS === 'true';
const base = isPages ? `/${repository}` : '/';
const site = isPages
  ? `https://${process.env.GITHUB_REPOSITORY_OWNER ?? 'example'}.github.io/${repository}`
  : 'https://example.github.io/brian-davis-research-group';

export default defineConfig({
  site,
  base,
  output: 'static',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
