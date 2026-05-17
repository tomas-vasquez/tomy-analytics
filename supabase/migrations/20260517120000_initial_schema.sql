-- ============================================================
-- Tomy Analytics: Schema + RPCs + RLS
-- Run this in your Supabase SQL editor
-- ============================================================

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_sites" ON sites
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Visitors
CREATE TABLE IF NOT EXISTS visitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  total_sessions INT DEFAULT 1,
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, visitor_id)
);

ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert_via_rpc" ON visitors FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "select_via_rpc" ON visitors FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sites WHERE id = site_id AND user_id = auth.uid()));

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  referrer TEXT DEFAULT '',
  utm_source TEXT DEFAULT '',
  utm_medium TEXT DEFAULT '',
  utm_campaign TEXT DEFAULT '',
  device_type TEXT DEFAULT '',
  browser TEXT DEFAULT '',
  os TEXT DEFAULT '',
  entry_page TEXT DEFAULT '',
  exit_page TEXT DEFAULT '',
  pageviews INT DEFAULT 1,
  is_bounce BOOLEAN DEFAULT true,
  start_time TIMESTAMPTZ DEFAULT now(),
  end_time TIMESTAMPTZ DEFAULT now(),
  duration_seconds INT DEFAULT 0,
  UNIQUE(site_id, session_id)
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert_via_rpc" ON sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "update_via_rpc" ON sessions FOR UPDATE TO anon USING (true);
CREATE POLICY "select_via_rpc" ON sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sites WHERE id = site_id AND user_id = auth.uid()));

-- Pageviews
CREATE TABLE IF NOT EXISTS pageviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  url TEXT DEFAULT '',
  path TEXT DEFAULT '',
  title TEXT DEFAULT '',
  referrer TEXT DEFAULT '',
  utm_source TEXT DEFAULT '',
  utm_medium TEXT DEFAULT '',
  utm_campaign TEXT DEFAULT '',
  country TEXT DEFAULT '',
  region TEXT DEFAULT '',
  city TEXT DEFAULT '',
  device_type TEXT DEFAULT '',
  browser TEXT DEFAULT '',
  os TEXT DEFAULT '',
  screen_width INT DEFAULT 0,
  screen_height INT DEFAULT 0,
  language TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pageviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert_via_rpc" ON pageviews FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "select_via_rpc" ON pageviews FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sites WHERE id = site_id AND user_id = auth.uid()));

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL DEFAULT '',
  properties JSONB DEFAULT '{}',
  url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert_via_rpc" ON events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "select_via_rpc" ON events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sites WHERE id = site_id AND user_id = auth.uid()));

-- ============================================================
-- RPC: process_event (called by analytics.js tracker)
-- ============================================================
CREATE OR REPLACE FUNCTION process_event(
  p_site_id UUID,
  p_visitor_id TEXT,
  p_session_id TEXT,
  p_type TEXT,
  p_url TEXT DEFAULT '',
  p_path TEXT DEFAULT '',
  p_title TEXT DEFAULT '',
  p_referrer TEXT DEFAULT '',
  p_utm_source TEXT DEFAULT '',
  p_utm_medium TEXT DEFAULT '',
  p_utm_campaign TEXT DEFAULT '',
  p_user_agent TEXT DEFAULT '',
  p_screen_width INT DEFAULT 0,
  p_screen_height INT DEFAULT 0,
  p_language TEXT DEFAULT '',
  p_event_name TEXT DEFAULT NULL,
  p_event_properties JSONB DEFAULT NULL,
  p_timestamp TIMESTAMPTZ DEFAULT now()
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $
DECLARE
  v_visitor_id UUID;
  v_session_id UUID;
  v_device_type TEXT;
  v_browser TEXT;
  v_os TEXT;
BEGIN
  -- Parse user agent
  v_device_type := CASE
    WHEN p_user_agent ~* 'mobile|iphone|ipod|android.*mobile|windows phone' THEN 'mobile'
    WHEN p_user_agent ~* 'ipad|android(?!.*mobile)|tablet' THEN 'tablet'
    ELSE 'desktop'
  END;
  v_browser := CASE
    WHEN p_user_agent ~* 'Chrome' AND p_user_agent !~* 'Edg' THEN 'Chrome'
    WHEN p_user_agent ~* 'Firefox' THEN 'Firefox'
    WHEN p_user_agent ~* 'Safari' AND p_user_agent !~* 'Chrome' THEN 'Safari'
    WHEN p_user_agent ~* 'Edg' THEN 'Edge'
    WHEN p_user_agent ~* 'OPR|Opera' THEN 'Opera'
    ELSE 'unknown'
  END;
  v_os := CASE
    WHEN p_user_agent ~* 'Windows' THEN 'Windows'
    WHEN p_user_agent ~* 'Mac OS' THEN 'macOS'
    WHEN p_user_agent ~* 'Linux' AND p_user_agent !~* 'Android' THEN 'Linux'
    WHEN p_user_agent ~* 'Android' THEN 'Android'
    WHEN p_user_agent ~* 'iPhone|iPad' THEN 'iOS'
    ELSE 'unknown'
  END;

  -- Upsert visitor
  INSERT INTO visitors (site_id, visitor_id, total_sessions, first_seen, last_seen)
  VALUES (p_site_id, p_visitor_id, 1, p_timestamp, p_timestamp)
  ON CONFLICT (site_id, visitor_id) DO UPDATE SET
    last_seen = p_timestamp,
    total_sessions = visitors.total_sessions + CASE
      WHEN NOT EXISTS (
        SELECT 1 FROM sessions
        WHERE site_id = p_site_id AND session_id = p_session_id
      ) THEN 1 ELSE 0
    END
  RETURNING id INTO v_visitor_id;

  -- Upsert session
  INSERT INTO sessions (site_id, visitor_id, session_id, referrer, utm_source, utm_medium, utm_campaign,
    device_type, browser, os, entry_page, exit_page, pageviews, is_bounce, start_time, end_time, duration_seconds)
  VALUES (p_site_id, v_visitor_id, p_session_id, p_referrer, p_utm_source, p_utm_medium, p_utm_campaign,
    v_device_type, v_browser, v_os, p_path, p_path, 1, true, p_timestamp, p_timestamp, 0)
  ON CONFLICT (site_id, session_id) DO UPDATE SET
    pageviews = sessions.pageviews + 1,
    is_bounce = false,
    end_time = p_timestamp,
    exit_page = p_path,
    duration_seconds = EXTRACT(EPOCH FROM (p_timestamp - sessions.start_time))::INT
  RETURNING id INTO v_session_id;

  -- Insert pageview
  INSERT INTO pageviews (site_id, session_id, visitor_id, url, path, title, referrer,
    utm_source, utm_medium, utm_campaign, device_type, browser, os,
    screen_width, screen_height, language, created_at)
  VALUES (p_site_id, v_session_id, v_visitor_id, p_url, p_path, p_title, p_referrer,
    p_utm_source, p_utm_medium, p_utm_campaign, v_device_type, v_browser, v_os,
    p_screen_width, p_screen_height, p_language, p_timestamp);

  -- Insert event if type = 'event'
  IF p_type = 'event' THEN
    INSERT INTO events (site_id, session_id, visitor_id, event_name, properties, url, created_at)
    VALUES (p_site_id, v_session_id, v_visitor_id,
      COALESCE(p_event_name, 'unknown'), COALESCE(p_event_properties, '{}'::JSONB), p_url, p_timestamp);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- RPC: Dashboard queries
-- ============================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_site_id UUID, p_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $
DECLARE
  since TIMESTAMPTZ := now() - (p_days || ' days')::INTERVAL;
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'uniqueVisitors', (SELECT COUNT(DISTINCT visitor_id) FROM pageviews WHERE site_id = p_site_id AND created_at >= since),
    'totalPageviews', (SELECT COUNT(*) FROM pageviews WHERE site_id = p_site_id AND created_at >= since),
    'totalSessions', (SELECT COUNT(*) FROM sessions WHERE site_id = p_site_id AND start_time >= since),
    'avgDuration', COALESCE((SELECT ROUND(AVG(duration_seconds))::INT FROM sessions WHERE site_id = p_site_id AND start_time >= since), 0),
    'bounceRate', COALESCE((SELECT ROUND((COUNT(*) FILTER (WHERE is_bounce))::NUMERIC / NULLIF(COUNT(*), 0) * 100)::INT FROM sessions WHERE site_id = p_site_id AND start_time >= since), 0)
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION get_daily_stats(p_site_id UUID, p_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $
DECLARE
  since TIMESTAMPTZ := now() - (p_days || ' days')::INTERVAL;
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'date', to_char(d, 'YYYY-MM-DD'),
      'unique_visitors', (SELECT COUNT(DISTINCT visitor_id) FROM pageviews WHERE site_id = p_site_id AND created_at::DATE = d),
      'total_pageviews', (SELECT COUNT(*) FROM pageviews WHERE site_id = p_site_id AND created_at::DATE = d),
      'total_sessions', (SELECT COUNT(*) FROM sessions WHERE site_id = p_site_id AND start_time::DATE = d),
      'avg_duration_seconds', COALESCE((SELECT ROUND(AVG(duration_seconds))::INT FROM sessions WHERE site_id = p_site_id AND start_time::DATE = d), 0),
      'bounce_rate', COALESCE((SELECT ROUND((COUNT(*) FILTER (WHERE is_bounce))::NUMERIC / NULLIF(COUNT(*), 0) * 100)::INT FROM sessions WHERE site_id = p_site_id AND start_time::DATE = d), 0)
    ) ORDER BY d), '[]'::JSONB)
    FROM generate_series(since::DATE, now()::DATE, '1 day'::INTERVAL) d
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_top_pages(p_site_id UUID, p_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $
DECLARE
  since TIMESTAMPTZ := now() - (p_days || ' days')::INTERVAL;
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'path', path,
      'pageviews', pageviews,
      'unique_visitors', unique_visitors
    ) ORDER BY pageviews DESC), '[]'::JSONB)
    FROM (
      SELECT path, COUNT(*)::int AS pageviews, COUNT(DISTINCT visitor_id)::int AS unique_visitors
      FROM pageviews
      WHERE site_id = p_site_id AND created_at >= since
      GROUP BY path
      LIMIT 20
    ) sub
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_referrers(p_site_id UUID, p_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $
DECLARE
  since TIMESTAMPTZ := now() - (p_days || ' days')::INTERVAL;
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'source', source,
      'visits', visits,
      'unique_visitors', unique_visitors
    ) ORDER BY visits DESC), '[]'::JSONB)
    FROM (
      SELECT COALESCE(NULLIF(referrer, ''), 'direct') AS source, COUNT(*)::int AS visits, COUNT(DISTINCT visitor_id)::int AS unique_visitors
      FROM pageviews
      WHERE site_id = p_site_id AND created_at >= since
      GROUP BY COALESCE(NULLIF(referrer, ''), 'direct')
      LIMIT 20
    ) sub
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_device_stats(p_site_id UUID, p_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $
DECLARE
  since TIMESTAMPTZ := now() - (p_days || ' days')::INTERVAL;
BEGIN
  RETURN jsonb_build_object(
    'devices', (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', device_type, 'value', cnt) ORDER BY cnt DESC), '[]'::JSONB) FROM (SELECT device_type, COUNT(*)::int AS cnt FROM pageviews WHERE site_id = p_site_id AND created_at >= since GROUP BY device_type) sub),
    'browsers', (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', browser, 'value', cnt) ORDER BY cnt DESC), '[]'::JSONB) FROM (SELECT browser, COUNT(*)::int AS cnt FROM pageviews WHERE site_id = p_site_id AND created_at >= since GROUP BY browser) sub),
    'os', (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', os, 'value', cnt) ORDER BY cnt DESC), '[]'::JSONB) FROM (SELECT os, COUNT(*)::int AS cnt FROM pageviews WHERE site_id = p_site_id AND created_at >= since GROUP BY os) sub)
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_events(p_site_id UUID, p_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $
DECLARE
  since TIMESTAMPTZ := now() - (p_days || ' days')::INTERVAL;
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'event_name', event_name,
      'count', cnt
    ) ORDER BY cnt DESC), '[]'::JSONB)
    FROM (
      SELECT event_name, COUNT(*)::int AS cnt
      FROM events
      WHERE site_id = p_site_id AND created_at >= since
      GROUP BY event_name
      LIMIT 50
    ) sub
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_realtime(p_site_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $
DECLARE
  since TIMESTAMPTZ := now() - INTERVAL '5 minutes';
BEGIN
  RETURN jsonb_build_object(
    'activeVisitors', (SELECT COUNT(DISTINCT visitor_id) FROM pageviews WHERE site_id = p_site_id AND created_at >= since),
    'pageviews', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'path', path, 'title', title, 'device_type', device_type, 'created_at', created_at
      ) ORDER BY created_at DESC)
      FROM pageviews
      WHERE site_id = p_site_id AND created_at >= since
      LIMIT 50
    ), '[]'::JSONB)
  );
END;
$$;
