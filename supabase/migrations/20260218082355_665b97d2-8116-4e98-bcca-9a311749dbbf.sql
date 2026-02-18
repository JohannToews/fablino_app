-- Allow admins to update and insert image_styles
CREATE POLICY "admin_update_image_styles"
ON public.image_styles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_insert_image_styles"
ON public.image_styles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_delete_image_styles"
ON public.image_styles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));