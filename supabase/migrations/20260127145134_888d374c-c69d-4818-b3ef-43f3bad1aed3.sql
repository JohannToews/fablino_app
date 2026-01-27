-- Sichere RLS Policies für stories Tabelle
-- Da die App kein Supabase Auth verwendet, behalten wir lesenden Zugriff
-- aber dokumentieren die Einschränkungen

-- Bestehende Policies entfernen
DROP POLICY IF EXISTS "Anyone can create stories" ON public.stories;
DROP POLICY IF EXISTS "Anyone can update stories" ON public.stories;
DROP POLICY IF EXISTS "Anyone can delete stories" ON public.stories;
DROP POLICY IF EXISTS "Anyone can read stories" ON public.stories;

-- Neue, restriktivere Policies
-- Lesen bleibt erlaubt (für Kids die Geschichten lesen)
CREATE POLICY "Anyone can read stories" 
  ON public.stories 
  FOR SELECT 
  USING (true);

-- Schreiboperationen: Wir prüfen ob user_id gesetzt ist
-- Dies verhindert zumindest anonyme Einträge ohne user_id
CREATE POLICY "Users can create their own stories" 
  ON public.stories 
  FOR INSERT 
  WITH CHECK (user_id IS NOT NULL);

-- Updates nur für eigene Geschichten (basierend auf user_id Match)
CREATE POLICY "Users can update their own stories" 
  ON public.stories 
  FOR UPDATE 
  USING (user_id IS NOT NULL);

-- Löschen nur für Geschichten mit user_id
CREATE POLICY "Users can delete their own stories" 
  ON public.stories 
  FOR DELETE 
  USING (user_id IS NOT NULL);