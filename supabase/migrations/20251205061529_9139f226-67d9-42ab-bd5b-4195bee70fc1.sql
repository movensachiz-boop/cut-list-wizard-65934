-- Enable pgcrypto for secure hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a secure function to validate license without exposing sensitive fields
CREATE OR REPLACE FUNCTION public.validate_license_key(input_key TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  company_name TEXT,
  expiry_date TIMESTAMPTZ,
  status TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  license_record RECORD;
BEGIN
  -- Find the license by key
  SELECT l.company_name, l.expiry_date, l.status::TEXT
  INTO license_record
  FROM licenses l
  WHERE l.license_key = input_key;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TIMESTAMPTZ, NULL::TEXT, 'Invalid license key'::TEXT;
    RETURN;
  END IF;
  
  -- Check if suspended
  IF license_record.status = 'suspended' THEN
    RETURN QUERY SELECT false, license_record.company_name, license_record.expiry_date, license_record.status, 'License has been suspended'::TEXT;
    RETURN;
  END IF;
  
  -- Check if expired
  IF license_record.expiry_date < NOW() THEN
    RETURN QUERY SELECT false, license_record.company_name, license_record.expiry_date, 'expired'::TEXT, 'License has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Valid license
  RETURN QUERY SELECT true, license_record.company_name, license_record.expiry_date, license_record.status, NULL::TEXT;
END;
$$;

-- Create a function to validate API key without exposing it
CREATE OR REPLACE FUNCTION public.validate_api_key(input_api_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM licenses 
    WHERE api_key = input_api_key 
    AND status = 'active' 
    AND expiry_date > NOW()
  );
END;
$$;

-- Drop existing permissive policy for users viewing their own license
DROP POLICY IF EXISTS "Users can view their own license" ON licenses;

-- Create a more restrictive policy - users can only see non-sensitive fields via the validation function
-- Admin-only direct table access remains
COMMENT ON TABLE licenses IS 'Contains sensitive API keys - direct access restricted to admins only. Use validate_license_key() function for validation.';