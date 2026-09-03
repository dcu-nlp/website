const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export function getSiteHref(pathname = '/') {
  if (/^(?:[a-z]+:)?\/\//i.test(pathname) || pathname.startsWith('mailto:')) {
    return pathname;
  }

  if (pathname.startsWith('#')) {
    return `${basePath}/${pathname}`;
  }

  if (pathname === '/') {
    return `${basePath}/`;
  }

  return `${basePath}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

export function getAssetHref(assetPath: string) {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  return `${base}${assetPath.replace(/^\//, '')}`;
}

export function getMailtoHref(email: string) {
  return `mailto:${email}`;
}

export function getExternalLinkAttrs() {
  return {
    target: '_blank',
    rel: 'noopener noreferrer',
  } as const;
}
