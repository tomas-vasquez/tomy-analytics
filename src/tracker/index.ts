import type { Payload } from './types'
import { getConfig } from './config'
import { getVisitorId, getSessionId } from './id'
import { getPageInfo } from './page'
import { send } from './api'
import { handleClick, on } from './events'
import { monitorSPA } from './navigation'

function init(): void {
  const config = getConfig()
  if (!config) return

  const { siteId, supabaseUrl, anonKey } = config
  const apiUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/process_event`

  function track(type: string, data?: { event_name?: string; properties?: Record<string, unknown> }) {
    const page = getPageInfo()

    const payload: Payload = {
      p_site_id: siteId,
      p_visitor_id: getVisitorId(),
      p_session_id: getSessionId(),
      p_type: type,
      p_url: page.url,
      p_path: page.path,
      p_title: page.title,
      p_referrer: page.referrer,
      p_utm_source: page.utm_source,
      p_utm_medium: page.utm_medium,
      p_utm_campaign: page.utm_campaign,
      p_user_agent: navigator.userAgent,
      p_screen_width: page.screen_width,
      p_screen_height: page.screen_height,
      p_language: page.language,
      p_timestamp: new Date().toISOString(),
    }

    if (data) {
      payload.p_event_name = data.event_name
      payload.p_event_properties = data.properties ?? null
    }

    send(apiUrl, anonKey, payload)
  }

  function trackEvent(name: string, properties?: Record<string, unknown>) {
    track('event', { event_name: name, properties: properties ?? {} })
  }

  on(e => handleClick(e, trackEvent))
  monitorSPA(() => track('pageview'))
  track('pageview')

  ;(window as any).__analytics = {
    track,
    trackEvent,
    trackPageview: () => track('pageview'),
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
