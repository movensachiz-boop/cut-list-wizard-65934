-- Add location columns to ip_logs table
ALTER TABLE public.ip_logs 
ADD COLUMN country TEXT,
ADD COLUMN city TEXT,
ADD COLUMN region TEXT,
ADD COLUMN isp TEXT;