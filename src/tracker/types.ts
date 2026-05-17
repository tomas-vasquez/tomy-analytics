export interface Config {
  siteId: string
  supabaseUrl: string
  anonKey: string
  debug: boolean
}

export interface PageInfo {
  url: string
  path: string
  title: string
  referrer: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  screen_width: number
  screen_height: number
  language: string
}

export interface Payload {
  p_site_id: string
  p_visitor_id: string
  p_session_id: string
  p_type: string
  p_url: string
  p_path: string
  p_title: string
  p_referrer: string
  p_utm_source: string
  p_utm_medium: string
  p_utm_campaign: string
  p_user_agent: string
  p_screen_width: number
  p_screen_height: number
  p_language: string
  p_timestamp: string
  p_event_name?: string
  p_event_properties?: Record<string, unknown> | null
}
