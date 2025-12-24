-- Add quote validity period column to ip_company_settings
ALTER TABLE public.ip_company_settings
ADD COLUMN IF NOT EXISTS quote_validity_days integer DEFAULT 30;