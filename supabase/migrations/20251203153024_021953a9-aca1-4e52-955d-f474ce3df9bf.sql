-- Create table for tracking IP addresses
CREATE TABLE public.ip_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  license_key TEXT,
  user_agent TEXT,
  action TEXT NOT NULL DEFAULT 'access',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for blocked IPs
CREATE TABLE public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT,
  blocked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ip_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- IP logs: Admins can view all
CREATE POLICY "Admins can view IP logs"
ON public.ip_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- IP logs: Allow insert from edge functions (service role)
CREATE POLICY "Service can insert IP logs"
ON public.ip_logs
FOR INSERT
WITH CHECK (true);

-- Blocked IPs: Admins can manage
CREATE POLICY "Admins can view blocked IPs"
ON public.blocked_ips
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert blocked IPs"
ON public.blocked_ips
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blocked IPs"
ON public.blocked_ips
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster IP lookups
CREATE INDEX idx_ip_logs_ip_address ON public.ip_logs(ip_address);
CREATE INDEX idx_ip_logs_created_at ON public.ip_logs(created_at DESC);
CREATE INDEX idx_blocked_ips_ip_address ON public.blocked_ips(ip_address);