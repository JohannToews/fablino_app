
-- Allow admins to see ALL consistency check results
CREATE POLICY "admin_all_consistency_checks"
ON public.consistency_check_results
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete consistency check results
CREATE POLICY "admin_delete_consistency_checks"
ON public.consistency_check_results
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
