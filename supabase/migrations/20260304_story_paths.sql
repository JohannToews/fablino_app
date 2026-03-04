-- story_paths: Validated narrative structure paths (A→M→E combinations)
-- with age-group targeting, engagement scores, and writing instructions.

CREATE TABLE public.story_paths (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT NOT NULL UNIQUE,
  label               TEXT NOT NULL,
  min_age_group       TEXT NOT NULL CHECK (min_age_group IN ('CE1','CE2','CM1','CM2')),
  hook_score          NUMERIC(3,2),
  is_onboarding       BOOLEAN DEFAULT false,
  humor_range_min     INTEGER DEFAULT 1,
  humor_range_max     INTEGER DEFAULT 3,
  writing_instructions TEXT NOT NULL,
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.story_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_paths_read_all" ON public.story_paths
  FOR SELECT USING (true);

-- ═══ CE1 paths (youngest readers, ~5-6) ═══

INSERT INTO public.story_paths (code, label, min_age_group, hook_score, is_onboarding, humor_range_min, humor_range_max, writing_instructions) VALUES
('A3->M1->E1', 'Charakter-Eskalation', 'CE1', 4.00, true, 1, 3,
 'A: Charaktermoment – zeige die Hauptfigur in einer vertrauten Situation mit einem kleinen Wunsch oder Problem. | M: Eskalation – das Problem wird Schritt für Schritt größer, jede Hürde schwieriger als die letzte. | E: Klassisch – die Figur löst das Problem mit etwas, das sie unterwegs gelernt hat, und kehrt zufrieden zurück.'),

('A5->M1->E1', 'Dialog-Eskalation', 'CE1', 4.00, true, 2, 4,
 'A: Dialogue-Hook – starte mit einem lebhaften Gespräch, das sofort eine Frage aufwirft oder ein Ziel setzt. | M: Eskalation – die Situation spitzt sich durch wachsende Hindernisse zu. | E: Klassisch – befriedigende Auflösung, bei der das Ziel aus dem Anfangsdialog erreicht wird.'),

('A6->M1->E1', 'Alltag-zu-Abenteuer', 'CE1', 4.00, false, 1, 3,
 'A: Ordinary World – zeige einen ganz normalen Tag, bis etwas Unerwartetes passiert. | M: Eskalation – das Unerwartete zieht die Figur immer tiefer in ein Abenteuer. | E: Klassisch – Rückkehr in den Alltag, aber die Figur hat etwas Neues gelernt oder gewonnen.'),

('A3->M3->E1', 'Freundschafts-Geschichte', 'CE1', 4.00, false, 1, 3,
 'A: Charaktermoment – stelle zwei Figuren vor, die unterschiedlich sind oder ein gemeinsames Problem haben. | M: Beziehungs-Entwicklung – die Figuren lernen einander kennen, überwinden Missverständnisse, wachsen zusammen. | E: Klassisch – die Freundschaft wird gefestigt, gemeinsam wird das Problem gelöst.');

-- ═══ CE2 paths (~7-8) ═══

INSERT INTO public.story_paths (code, label, min_age_group, hook_score, is_onboarding, humor_range_min, humor_range_max, writing_instructions) VALUES
('A2->M2->E1', 'Rätsel-Reise', 'CE2', 4.54, true, 1, 3,
 'A: Rätsel-Hook – beginne mit einem Geheimnis, einer unerklärlichen Entdeckung oder einer brennenden Frage. | M: Rätsel-Schichten – jede Antwort enthüllt ein neues Rätsel, Hinweise fügen sich langsam zusammen. | E: Klassisch – das Rätsel wird gelöst, die Antwort ist überraschend aber logisch aus den Hinweisen ableitbar.'),

('A3->M1->E5', 'Heldenreise-Mini', 'CE2', 4.00, true, 1, 3,
 'A: Charaktermoment – die Figur wird in ihrer Komfortzone gezeigt, ein Ruf zum Abenteuer folgt. | M: Eskalation – wachsende Prüfungen, die Figur entwickelt neue Fähigkeiten oder Mut. | E: Rückkehr verändert – die Figur kehrt zurück, ist aber innerlich gewachsen und sieht die Welt anders.'),

('A3->M3->E5', 'Wandel-Geschichte', 'CE2', 4.00, false, 1, 3,
 'A: Charaktermoment – die Figur hat eine feste Überzeugung oder Gewohnheit, die sie einschränkt. | M: Beziehungs-Entwicklung – durch neue Begegnungen wird die alte Sichtweise hinterfragt. | E: Rückkehr verändert – die Figur erkennt, dass Veränderung gut ist, und kehrt mit neuem Blick zurück.'),

('A6->M1->E5', 'Erwachsen-Werden', 'CE2', 4.00, false, 1, 2,
 'A: Ordinary World – ein normaler Tag, ein vertrautes Umfeld, aber ein leises Unbehagen. | M: Eskalation – ein Ereignis reißt die Figur aus der Routine, Herausforderungen wachsen. | E: Rückkehr verändert – alles sieht gleich aus, aber die Figur versteht die Welt jetzt anders.');

-- ═══ CM1 paths (~9-10) ═══

INSERT INTO public.story_paths (code, label, min_age_group, hook_score, is_onboarding, humor_range_min, humor_range_max, writing_instructions) VALUES
('A1->M5->E1', 'Countdown-Thriller', 'CM1', 4.67, true, 1, 2,
 'A: In Medias Res – starte mitten in der Aktion, die Figur steckt bereits im Problem. | M: Countdown – Zeitdruck baut sich auf, die Uhr tickt, jeder Versuch verbraucht wertvolle Zeit. | E: Klassisch – in letzter Sekunde wird die Lösung gefunden, Erleichterung und Triumph.'),

('A2->M2->E2', 'Rätsel-mit-Twist', 'CM1', 4.54, true, 1, 3,
 'A: Rätsel-Hook – ein Geheimnis wird aufgeworfen, erste Hinweise deuten in eine Richtung. | M: Rätsel-Schichten – neue Hinweise widersprechen den ersten, die wahre Lösung ist komplexer. | E: Twist – die Auflösung überrascht, alles war anders als gedacht, aber rückblickend logisch.'),

('A4->M1->E5', 'Weltenbau-Abenteuer', 'CM1', 4.00, false, 1, 3,
 'A: Weltenbau – eine faszinierende Welt mit eigenen Regeln wird vorgestellt, die Figur entdeckt sie. | M: Eskalation – die Regeln der Welt erzeugen immer größere Herausforderungen. | E: Rückkehr verändert – die Figur verlässt die Welt, nimmt aber ein neues Verständnis mit.'),

('A6->M5->E1', 'Alltags-Countdown', 'CM1', 4.00, false, 1, 2,
 'A: Ordinary World – ein normaler Tag, ein scheinbar einfaches Ziel wird gesetzt. | M: Countdown – unerwartete Hindernisse und Zeitdruck verwandeln den Alltag in ein spannendes Rennen. | E: Klassisch – Ziel wird gerade noch rechtzeitig erreicht.');

-- ═══ CM2 paths (~11-12) ═══

INSERT INTO public.story_paths (code, label, min_age_group, hook_score, is_onboarding, humor_range_min, humor_range_max, writing_instructions) VALUES
('A4->M4->E2', 'Parallele-Welten', 'CM2', 4.00, false, 1, 3,
 'A: Weltenbau – zwei Perspektiven oder Handlungsstränge werden parallel eröffnet. | M: Parallele Handlungen – die Stränge entwickeln sich getrennt, zeigen verschiedene Seiten derselben Situation. | E: Twist – die Stränge treffen aufeinander und enthüllen eine überraschende Verbindung.'),

('A3->M6->E2', 'Wendepunkt-Drama', 'CM2', 4.00, true, 1, 2,
 'A: Charaktermoment – die Figur steht vor einer scheinbar klaren Entscheidung. | M: Wendepunkt-Kette – jede Entscheidung führt zu unerwarteten Konsequenzen, die Situation dreht sich mehrfach. | E: Twist – das Ende zeigt, dass die erste Einschätzung falsch war, die Figur hat dazugelernt.'),

('A2->M2->E3', 'Offenes-Rätsel', 'CM2', 4.00, false, 1, 3,
 'A: Rätsel-Hook – eine Frage wird aufgeworfen, die zum Nachdenken anregt. | M: Rätsel-Schichten – verschiedene Erklärungen werden angeboten, keine ist eindeutig die richtige. | E: Offen – die Geschichte endet mit einer Frage an den Leser, regt zum Weiterdenken an.');

-- ═══ Additional CM2 onboarding path ═══
-- A1->M6->E2 is not in the 15 validated paths but listed as onboarding Rang2 for CM2.
-- We include it as a valid path.

INSERT INTO public.story_paths (code, label, min_age_group, hook_score, is_onboarding, humor_range_min, humor_range_max, writing_instructions) VALUES
('A1->M6->E2', 'Action-Wendepunkt', 'CM2', 4.00, true, 1, 2,
 'A: In Medias Res – sofort mitten in einer spannenden Szene, die Figur muss handeln. | M: Wendepunkt-Kette – die Handlung dreht sich mehrfach, Annahmen werden widerlegt, neue Fakten tauchen auf. | E: Twist – das Ende enthüllt, dass die Ausgangssituation ganz anders war als gedacht.');
