-- Add contact details columns to ip_company_settings
ALTER TABLE public.ip_company_settings
ADD COLUMN IF NOT EXISTS company_tel text,
ADD COLUMN IF NOT EXISTS company_fax text,
ADD COLUMN IF NOT EXISTS company_email text,
ADD COLUMN IF NOT EXISTS company_tax_no text;