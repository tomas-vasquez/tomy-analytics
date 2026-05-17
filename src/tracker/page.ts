import type { PageInfo, PageOverride } from './types'

export function getPageInfo(override?: PageOverride): PageInfo {
  const params = new URLSearchParams(window.location.search)

  return {
    url: override?.url ?? window.location.href,
    path: override?.path ?? window.location.pathname,
    title: override?.title ?? (document.title || ''),
    referrer: override?.referrer ?? (document.referrer || ''),
    utm_source: params.get('utm_source') ?? '',
    utm_medium: params.get('utm_medium') ?? '',
    utm_campaign: params.get('utm_campaign') ?? '',
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    language: navigator.language || '',
  }
}
