
-- Allow admins to update app_settings
DROP POLICY IF EXISTS "No public update to app_settings" ON public.app_settings;
CREATE POLICY "Admins can update app_settings" ON public.app_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "No public write to app_settings" ON public.app_settings;
CREATE POLICY "Admins can insert app_settings" ON public.app_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
