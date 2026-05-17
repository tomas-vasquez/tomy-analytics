import type { PageInfo } from './types'

export function getPageInfo(): PageInfo {
  const params = new URLSearchParams(window.location.search)

  return {
    url: window.location.href,
    path: window.location.pathname,
    title: document.title || '',
    referrer: document.referrer || '',
    utm_source: params.get('utm_source') ?? '',
    utm_medium: params.get('utm_medium') ?? '',
    utm_campaign: params.get('utm_campaign') ?? '',
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    language: navigator.language || '',
  }
}
