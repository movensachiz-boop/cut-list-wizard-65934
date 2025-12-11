-- Create table for IP-based company settings with logo and pricing
CREATE TABLE public.ip_company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  company_name TEXT,
  company_logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for IP-based material prices
CREATE TABLE public.ip_material_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  material_name TEXT NOT NULL,
  price_per_sheet NUMERIC NOT NULL DEFAULT 0,
  cost_per_sheet NUMERIC NOT NULL DEFAULT 0,
  sheet_length INTEGER NOT NULL DEFAULT 2750,
  sheet_width INTEGER NOT NULL DEFAULT 1830,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ip_address, material_name)
);

-- Create table for IP-based edging prices
CREATE TABLE public.ip_edging_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  edging_name TEXT NOT NULL,
  price_per_meter NUMERIC NOT NULL DEFAULT 0,
  cost_per_meter NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ip_address, edging_name)
);

-- Enable RLS on all tables
ALTER TABLE public.ip_company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_material_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_edging_prices ENABLE ROW LEVEL SECURITY;

-- Policies for ip_company_settings
CREATE POLICY "Anyone can view company settings" ON public.ip_company_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert company settings" ON public.ip_company_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update company settings" ON public.ip_company_settings FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete company settings" ON public.ip_company_settings FOR DELETE USING (true);

-- Policies for ip_material_prices
CREATE POLICY "Anyone can view material prices" ON public.ip_material_prices FOR SELECT USING (true);
CREATE POLICY "Anyone can insert material prices" ON public.ip_material_prices FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update material prices" ON public.ip_material_prices FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete material prices" ON public.ip_material_prices FOR DELETE USING (true);

-- Policies for ip_edging_prices
CREATE POLICY "Anyone can view edging prices" ON public.ip_edging_prices FOR SELECT USING (true);
CREATE POLICY "Anyone can insert edging prices" ON public.ip_edging_prices FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update edging prices" ON public.ip_edging_prices FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete edging prices" ON public.ip_edging_prices FOR DELETE USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_ip_company_settings_updated_at
  BEFORE UPDATE ON public.ip_company_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ip_material_prices_updated_at
  BEFORE UPDATE ON public.ip_material_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ip_edging_prices_updated_at
  BEFORE UPDATE ON public.ip_edging_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();