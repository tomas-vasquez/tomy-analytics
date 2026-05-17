CREATE OR REPLACE FUNCTION create_site(p_name TEXT, p_domain TEXT DEFAULT '')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $
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
AS $
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
