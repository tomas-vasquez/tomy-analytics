import type { Config } from './types'

export function getConfig(): Config | null {
  const script = document.currentScript
    ?? document.querySelector<HTMLScriptElement>('script[src*="analytics.js"]')

  const cfg: Config = {
    siteId: script?.getAttribute('data-site-id') ?? '',
    supabaseUrl: script?.getAttribute('data-supabase-url') ?? '',
    anonKey: script?.getAttribute('data-anon-key') ?? '',
    debug: script?.hasAttribute('data-debug') ?? false,
  }

  const win = window as any
  if (win.__analytics_config) {
    cfg.siteId ||= win.__analytics_config.siteId
    cfg.supabaseUrl ||= win.__analytics_config.supabaseUrl
    cfg.anonKey ||= win.__analytics_config.anonKey
    cfg.debug ||= win.__analytics_config.debug
  }

  if (!cfg.siteId || !cfg.supabaseUrl || !cfg.anonKey) {
    console.warn(
      '[Analytics] Missing data attributes. ' +
      'Set data-site-id, data-supabase-url, data-anon-key, or window.__analytics_config'
    )
    return null
  }

  return cfg
}
