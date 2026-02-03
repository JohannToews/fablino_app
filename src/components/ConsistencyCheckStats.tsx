import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle, ChevronDown, ChevronRight, AlertTriangle, Check, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Language, useTranslations } from "@/lib/translations";

interface ConsistencyCheckResult {
  id: string;
  story_title: string;
  story_length: string;
  difficulty: string;
  issues_found: number;
  issues_corrected: number;
  issue_details: string[];
  user_id: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  display_name: string;
}

interface ConsistencyCheckStatsProps {
  language: Language;
}

const ConsistencyCheckStats = ({ language }: ConsistencyCheckStatsProps) => {
  const t = useTranslations(language);
  const [results, setResults] = useState<ConsistencyCheckResult[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load consistency check results
      const { data: checkResults, error } = await supabase
        .from("consistency_check_results")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setResults(checkResults || []);

      // Load user profiles for display names
      const { data: usersData } = await supabase.functions.invoke("manage-users", {
        body: { action: "list" },
      });
      
      if (usersData?.users) {
        const userMap: Record<string, string> = {};
        usersData.users.forEach((u: UserProfile) => {
          userMap[u.id] = u.display_name;
        });
        setUsers(userMap);
      }
    } catch (error) {
      console.error("Error loading consistency check data:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US',
      { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
  };

  const getLengthLabel = (length: string) => {
    const labels: Record<string, Record<string, string>> = {
      very_short: { de: 'Sehr kurz', fr: 'Très court', en: 'Very short' },
      short: { de: 'Kurz', fr: 'Court', en: 'Short' },
      medium: { de: 'Mittel', fr: 'Moyen', en: 'Medium' },
      long: { de: 'Lang', fr: 'Long', en: 'Long' },
      very_long: { de: 'Sehr lang', fr: 'Très long', en: 'Very long' },
    };
    return labels[length]?.[language] || length;
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, Record<string, string>> = {
      easy: { de: 'Leicht', fr: 'Facile', en: 'Easy' },
      medium: { de: 'Mittel', fr: 'Moyen', en: 'Medium' },
      difficult: { de: 'Schwer', fr: 'Difficile', en: 'Difficult' },
    };
    return labels[difficulty]?.[language] || difficulty;
  };

  // Calculate summary stats
  const totalChecks = results.length;
  const totalIssuesFound = results.reduce((sum, r) => sum + r.issues_found, 0);
  const totalIssuesCorrected = results.reduce((sum, r) => sum + r.issues_corrected, 0);
  const checksWithIssues = results.filter(r => r.issues_found > 0).length;
  const correctionRate = totalIssuesFound > 0 ? Math.round((totalIssuesCorrected / totalIssuesFound) * 100) : 100;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-2 border-green-500/30">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xl">
                {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <CheckCircle className="h-5 w-5 text-green-500" />
                {language === 'de' ? 'Consistency-Check Statistik' : 
                 language === 'fr' ? 'Statistiques de Vérification' : 
                 'Consistency Check Statistics'}
              </div>
              {!isOpen && totalChecks > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalChecks} {language === 'de' ? 'Prüfungen' : language === 'fr' ? 'vérifications' : 'checks'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                {language === 'de' ? 'Aktualisieren' : language === 'fr' ? 'Actualiser' : 'Refresh'}
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold">{totalChecks}</div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'de' ? 'Prüfungen gesamt' : language === 'fr' ? 'Vérifications totales' : 'Total checks'}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-orange-500">{totalIssuesFound}</div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'de' ? 'Fehler gefunden' : language === 'fr' ? 'Erreurs trouvées' : 'Issues found'}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-green-500">{totalIssuesCorrected}</div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'de' ? 'Fehler korrigiert' : language === 'fr' ? 'Erreurs corrigées' : 'Issues corrected'}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold">{correctionRate}%</div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'de' ? 'Korrekturrate' : language === 'fr' ? 'Taux de correction' : 'Correction rate'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-500" />
              </div>
            ) : results.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {language === 'de' ? 'Noch keine Prüfungen durchgeführt' : 
                 language === 'fr' ? 'Aucune vérification effectuée' : 
                 'No checks performed yet'}
              </p>
            ) : (
              <div className="rounded-md border max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>{language === 'de' ? 'Datum' : language === 'fr' ? 'Date' : 'Date'}</TableHead>
                      <TableHead>{language === 'de' ? 'Benutzer' : language === 'fr' ? 'Utilisateur' : 'User'}</TableHead>
                      <TableHead>{language === 'de' ? 'Story-Titel' : language === 'fr' ? 'Titre' : 'Story Title'}</TableHead>
                      <TableHead>{language === 'de' ? 'Länge' : language === 'fr' ? 'Longueur' : 'Length'}</TableHead>
                      <TableHead>{language === 'de' ? 'Schwierigkeit' : language === 'fr' ? 'Difficulté' : 'Difficulty'}</TableHead>
                      <TableHead className="text-center">
                        <AlertTriangle className="h-4 w-4 inline text-orange-500" />
                      </TableHead>
                      <TableHead className="text-center">
                        <Check className="h-4 w-4 inline text-green-500" />
                      </TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(result.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {result.user_id ? users[result.user_id] || '—' : '—'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={result.story_title}>
                          {result.story_title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getLengthLabel(result.story_length)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              result.difficulty === 'easy' ? 'border-green-500 text-green-600' :
                              result.difficulty === 'difficult' ? 'border-red-500 text-red-600' :
                              'border-yellow-500 text-yellow-600'
                            }`}
                          >
                            {getDifficultyLabel(result.difficulty)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={result.issues_found > 0 ? 'text-orange-500 font-bold' : 'text-muted-foreground'}>
                            {result.issues_found}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={result.issues_corrected > 0 ? 'text-green-500 font-bold' : 'text-muted-foreground'}>
                            {result.issues_corrected}
                          </span>
                        </TableCell>
                        <TableCell>
                          {result.issue_details && result.issue_details.length > 0 && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    {language === 'de' ? 'Gefundene Probleme' : 
                                     language === 'fr' ? 'Problèmes trouvés' : 
                                     'Issues Found'}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-2 max-h-[400px] overflow-auto">
                                  <p className="text-sm font-medium text-muted-foreground mb-2">
                                    {result.story_title}
                                  </p>
                                  <ul className="list-disc pl-5 space-y-1">
                                    {result.issue_details.map((issue, idx) => (
                                      <li key={idx} className="text-sm">{issue}</li>
                                    ))}
                                  </ul>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {language === 'de' 
                ? `${checksWithIssues} von ${totalChecks} Geschichten hatten Probleme (${Math.round((checksWithIssues / Math.max(totalChecks, 1)) * 100)}%)`
                : language === 'fr'
                ? `${checksWithIssues} sur ${totalChecks} histoires avaient des problèmes (${Math.round((checksWithIssues / Math.max(totalChecks, 1)) * 100)}%)`
                : `${checksWithIssues} of ${totalChecks} stories had issues (${Math.round((checksWithIssues / Math.max(totalChecks, 1)) * 100)}%)`}
            </p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default ConsistencyCheckStats;
