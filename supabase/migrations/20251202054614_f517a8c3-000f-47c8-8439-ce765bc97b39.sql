-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for license status
CREATE TYPE public.license_status AS ENUM ('active', 'suspended', 'expired', 'trial');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create licenses table
CREATE TABLE public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  license_key TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL UNIQUE,
  status license_status NOT NULL DEFAULT 'trial',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  suspended_at TIMESTAMP WITH TIME ZONE,
  suspended_reason TEXT
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to generate unique license key
CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS TEXT
LANGUAGE plpgsql
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

-- Create function to generate unique API key
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'sk_' || LOWER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 32));
END;
$$;

-- Create function to automatically update expired licenses
CREATE OR REPLACE FUNCTION public.update_expired_licenses()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.expiry_date < NOW() AND NEW.status != 'expired' AND NEW.status != 'suspended' THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-expiring licenses
CREATE TRIGGER check_license_expiry
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_expired_licenses();

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for licenses
CREATE POLICY "Admins can view all licenses"
  ON public.licenses FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert licenses"
  ON public.licenses FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update licenses"
  ON public.licenses FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete licenses"
  ON public.licenses FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own license"
  ON public.licenses FOR SELECT
  TO authenticated
  USING (assigned_user_id = auth.uid());