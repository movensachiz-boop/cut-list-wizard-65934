-- Add policies for admin management of announcements
CREATE POLICY "Service role can manage announcements"
ON public.announcements
FOR ALL
USING (true)
WITH CHECK (true);