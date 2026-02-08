-- Allow admins to see all story ratings
CREATE POLICY "admin_can_select_all_ratings"
ON public.story_ratings
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete any rating (for cleanup)
CREATE POLICY "admin_can_delete_all_ratings"
ON public.story_ratings
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);