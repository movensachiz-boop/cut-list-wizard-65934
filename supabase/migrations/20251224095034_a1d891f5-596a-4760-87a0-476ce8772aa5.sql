-- Add banking details columns to ip_company_settings
ALTER TABLE public.ip_company_settings
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_account_name text,
ADD COLUMN IF NOT EXISTS bank_account_number text,
ADD COLUMN IF NOT EXISTS bank_branch text;