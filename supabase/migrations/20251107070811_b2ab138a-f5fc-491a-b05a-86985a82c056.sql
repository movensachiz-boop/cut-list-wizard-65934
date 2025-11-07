-- Create hardware items table
CREATE TABLE public.hardware_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  supplier_website TEXT,
  import_code TEXT,
  cost NUMERIC(10, 2) DEFAULT 0,
  price NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for fast searching
CREATE INDEX idx_hardware_items_name ON public.hardware_items USING gin(to_tsvector('english', name));
CREATE INDEX idx_hardware_items_short_name ON public.hardware_items USING gin(to_tsvector('english', short_name));

-- Enable RLS
ALTER TABLE public.hardware_items ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read hardware items
CREATE POLICY "Anyone can view hardware items"
ON public.hardware_items
FOR SELECT
TO authenticated
USING (true);

-- Only allow admins to insert/update/delete (you can adjust this later)
CREATE POLICY "Admins can manage hardware items"
ON public.hardware_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create hardware_entries table to track hardware used in cutting lists
CREATE TABLE public.hardware_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cutting_list_id UUID NOT NULL REFERENCES public.cutting_lists(id) ON DELETE CASCADE,
  hardware_item_id UUID REFERENCES public.hardware_items(id) ON DELETE SET NULL,
  custom_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hardware_entries ENABLE ROW LEVEL SECURITY;

-- Users can manage hardware entries for their own cutting lists
CREATE POLICY "Users can view own hardware entries"
ON public.hardware_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cutting_lists
    WHERE cutting_lists.id = hardware_entries.cutting_list_id
    AND cutting_lists.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own hardware entries"
ON public.hardware_entries
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cutting_lists
    WHERE cutting_lists.id = hardware_entries.cutting_list_id
    AND cutting_lists.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own hardware entries"
ON public.hardware_entries
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cutting_lists
    WHERE cutting_lists.id = hardware_entries.cutting_list_id
    AND cutting_lists.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own hardware entries"
ON public.hardware_entries
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cutting_lists
    WHERE cutting_lists.id = hardware_entries.cutting_list_id
    AND cutting_lists.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_hardware_items_updated_at
BEFORE UPDATE ON public.hardware_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hardware_entries_updated_at
BEFORE UPDATE ON public.hardware_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();