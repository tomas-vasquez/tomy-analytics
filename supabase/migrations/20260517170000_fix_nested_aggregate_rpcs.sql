-- Fix 4 RPCs that had nested aggregate function calls
-- Bug: COUNT(*) inside jsonb_agg(... ORDER BY COUNT(*) DESC) is not allowed
-- Fix: pre-compute counts in subquery, then aggregate

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
