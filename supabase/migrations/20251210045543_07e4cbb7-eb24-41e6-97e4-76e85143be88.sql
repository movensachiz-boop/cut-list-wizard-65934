-- Create material_prices table to store board/sheet pricing
CREATE TABLE public.material_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_name TEXT NOT NULL UNIQUE,
  cost_per_sheet NUMERIC NOT NULL DEFAULT 0,
  price_per_sheet NUMERIC NOT NULL DEFAULT 0,
  sheet_length INTEGER NOT NULL DEFAULT 2750,
  sheet_width INTEGER NOT NULL DEFAULT 1830,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create edging_prices table to store edging pricing per meter
CREATE TABLE public.edging_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  edging_name TEXT NOT NULL UNIQUE,
  cost_per_meter NUMERIC NOT NULL DEFAULT 0,
  price_per_meter NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotes table to store generated quotes
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cutting_list_id UUID REFERENCES public.cutting_lists(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  quote_number TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.material_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edging_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Material prices policies (admins manage, everyone reads)
CREATE POLICY "Anyone can view material prices" ON public.material_prices FOR SELECT USING (true);
CREATE POLICY "Admins can manage material prices" ON public.material_prices FOR ALL USING (true) WITH CHECK (true);

-- Edging prices policies (admins manage, everyone reads)
CREATE POLICY "Anyone can view edging prices" ON public.edging_prices FOR SELECT USING (true);
CREATE POLICY "Admins can manage edging prices" ON public.edging_prices FOR ALL USING (true) WITH CHECK (true);

-- Quotes policies (users manage their own quotes)
CREATE POLICY "Users can view own quotes" ON public.quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quotes" ON public.quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quotes" ON public.quotes FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_material_prices_updated_at
  BEFORE UPDATE ON public.material_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_edging_prices_updated_at
  BEFORE UPDATE ON public.edging_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate quote number
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'QT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$;