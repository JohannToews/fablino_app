-- Allow admins to insert and update age_rules
CREATE POLICY "admin_insert_age_rules" ON public.age_rules
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_update_age_rules" ON public.age_rules
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_delete_age_rules" ON public.age_rules
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));