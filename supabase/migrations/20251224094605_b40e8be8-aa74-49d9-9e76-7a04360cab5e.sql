-- Add company address column to ip_company_settings
ALTER TABLE public.ip_company_settings
ADD COLUMN IF NOT EXISTS company_address text;