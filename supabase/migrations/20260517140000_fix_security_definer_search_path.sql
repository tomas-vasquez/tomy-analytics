-- Fix SECURITY DEFINER functions: add SET search_path = ''

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
AS $$
DECLARE
  v_visitor_id UUID;
  v_session_id UUID;
  v_device_type TEXT;
  v_browser TEXT;
  v_os TEXT;
BEGIN
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

  INSERT INTO pageviews (site_id, session_id, visitor_id, url, path, title, referrer,
    utm_source, utm_medium, utm_campaign, device_type, browser, os,
    screen_width, screen_height, language, created_at)
  VALUES (p_site_id, v_session_id, v_visitor_id, p_url, p_path, p_title, p_referrer,
    p_utm_source, p_utm_medium, p_utm_campaign, v_device_type, v_browser, v_os,
    p_screen_width, p_screen_height, p_language, p_timestamp);

  IF p_type = 'event' THEN
    INSERT INTO events (site_id, session_id, visitor_id, event_name, properties, url, created_at)
    VALUES (p_site_id, v_session_id, v_visitor_id,
      COALESCE(p_event_name, 'unknown'), COALESCE(p_event_properties, '{}'::JSONB), p_url, p_timestamp);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_site_id UUID, p_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
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
AS $$
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
AS $$
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
AS $$
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
AS $$
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
AS $$
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
AS $$
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

CREATE OR REPLACE FUNCTION create_site(p_name TEXT, p_domain TEXT DEFAULT '')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_site_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not authenticated');
  END IF;
  INSERT INTO sites (user_id, domain, name)
  VALUES (v_user_id, COALESCE(NULLIF(p_domain, ''), 'pending'), p_name)
  RETURNING id INTO v_site_id;
  RETURN jsonb_build_object('id', v_site_id, 'name', p_name);
END;
$$;

CREATE OR REPLACE FUNCTION get_user_sites()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;
  RETURN (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'domain', domain) ORDER BY created_at ASC), '[]'::JSONB)
    FROM sites
    WHERE user_id = v_user_id
  );
END;
$$;
