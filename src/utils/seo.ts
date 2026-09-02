import { siteConfig } from '@/utils/site';

export function getCanonical(pathname: string, site?: string) {
  const base = site ?? siteConfig.url;
  return new URL(
    pathname.startsWith('/') ? pathname : `/${pathname}`,
    `${base.replace(/\/$/, '')}/`,
  ).toString();
}

export function getPageTitle(title?: string) {
  return title ? `${title} | ${siteConfig.title}` : siteConfig.title;
}
