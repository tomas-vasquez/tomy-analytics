DO $$BEGIN
  ALTER FUNCTION process_event SECURITY DEFINER SET search_path = 'public';
  ALTER FUNCTION get_dashboard_stats SECURITY DEFINER SET search_path = 'public';
  ALTER FUNCTION get_daily_stats SECURITY DEFINER SET search_path = 'public';
  ALTER FUNCTION get_top_pages SECURITY DEFINER SET search_path = 'public';
  ALTER FUNCTION get_referrers SECURITY DEFINER SET search_path = 'public';
  ALTER FUNCTION get_device_stats SECURITY DEFINER SET search_path = 'public';
  ALTER FUNCTION get_events SECURITY DEFINER SET search_path = 'public';
  ALTER FUNCTION get_realtime SECURITY DEFINER SET search_path = 'public';
  ALTER FUNCTION create_site SECURITY DEFINER SET search_path = 'public';
  ALTER FUNCTION get_user_sites SECURITY DEFINER SET search_path = 'public';
END$$;
