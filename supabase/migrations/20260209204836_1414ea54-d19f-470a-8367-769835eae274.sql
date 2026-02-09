
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if a profile already exists for this auth_id (migrated users)
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE auth_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_profiles (auth_id, username, display_name, email, admin_language, app_language, text_language, password_hash)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, ''), '@', 1), 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'admin_language', 'de'),
    COALESCE(NEW.raw_user_meta_data->>'app_language', 'fr'),
    COALESCE(NEW.raw_user_meta_data->>'text_language', 'fr'),
    'supabase_auth'
  );
  RETURN NEW;
END;
$function$;
