-- Fix function search paths for security

CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_prefix TEXT := 'SRL';
  random_part TEXT;
  full_key TEXT;
BEGIN
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 12));
  full_key := key_prefix || '-' || 
              SUBSTRING(random_part FROM 1 FOR 4) || '-' ||
              SUBSTRING(random_part FROM 5 FOR 4) || '-' ||
              SUBSTRING(random_part FROM 9 FOR 4);
  RETURN full_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'sk_' || LOWER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 32));
END;
$$;

CREATE OR REPLACE FUNCTION public.update_expired_licenses()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.expiry_date < NOW() AND NEW.status != 'expired' AND NEW.status != 'suspended' THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$;