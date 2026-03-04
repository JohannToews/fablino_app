import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, CalendarIcon, Star, FileWarning, ExternalLink, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface StoryStatRow {
  user_email: string | null;
  user_display_name: string | null;
  child_name: string | null;
  child_age: number | null;
  child_class: string | null;
  story_id: string;
  story_title: string;
  language: string | null;
  story_length: string | null;
  word_count_approx: number | null;
  difficulty: string | null;
  emotional_coloring: string | null;
  emotional_secondary: string | null;
  humor_level: number | null;
  structure_beginning: number | null;
  structure_middle: number | null;
  structure_ending: number | null;
  checker_critical: number | null;
  checker_medium: number | null;
  checker_low: number | null;
  critical_patch_failed: boolean | null;
  patch_fix_rate: number | null;
  checker_subcategories: string[] | null;
  weakest_part: string | null;
  weakness_reason: string | null;
  quality_rating: number | null;
  issues_found: number | null;
  issues_corrected: number | null;
  generation_time_ms: number | null;
  story_generation_ms: number | null;
  image_generation_ms: number | null;
  consistency_check_ms: number | null;
  story_created_at: string;
}

const FLAG: Record<string, string> = {
  de: "🇩🇪", fr: "🇫🇷", en: "🇬🇧", es: "🇪🇸", nl: "🇳🇱", it: "🇮🇹",
  bs: "🇧🇦", tr: "🇹🇷", bg: "🇧🇬", ro: "🇷🇴", pl: "🇵🇱", lt: "🇱🇹",
  hu: "🇭🇺", ca: "🏴", sl: "🇸🇮", pt: "🇵🇹", sk: "🇸🇰", uk: "🇺🇦", ru: "🇷🇺",
};

type ColumnKey = "datum" | "user" | "kind" | "story" | "lang" | "woerter" | "stufe" | "pfad" | "emotion" | "err_h" | "err_m" | "err_l" | "patch" | "detail" | "rating";

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "datum", label: "Datum" },
  { key: "user", label: "User" },
  { key: "kind", label: "Kind" },
  { key: "story", label: "Story" },
  { key: "lang", label: "🌐 Sprache" },
  { key: "woerter", label: "Wörter" },
  { key: "stufe", label: "Stufe" },
  { key: "pfad", label: "Pfad" },
  { key: "emotion", label: "Emotion" },
  { key: "err_h", label: "🔴 H" },
  { key: "err_m", label: "🟡 M" },
  { key: "err_l", label: "⚪ L" },
  { key: "patch", label: "Patch %" },
  { key: "detail", label: "Detail" },
  { key: "rating", label: "⭐ Rating" },
];

const DEFAULT_VISIBLE: Set<ColumnKey> = new Set(ALL_COLUMNS.map(c => c.key));

const useStoryStatsContent = () => {
  const [rows, setRows] = useState<StoryStatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailRow, setDetailRow] = useState<StoryStatRow | null>(null);
  const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(new Set(DEFAULT_VISIBLE));
  const [sortCol, setSortCol] = useState<ColumnKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // filters
  const [langFilter, setLangFilter] = useState("all");
  const [diffFilter, setDiffFilter] = useState("all");
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const handleSort = (col: ColumnKey) => {
    if (sortCol === col) {
      setSortDir(prev => prev === "desc" ? "asc" : "desc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const toggleCol = (key: ColumnKey) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isVis = (key: ColumnKey) => visibleCols.has(key);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.rpc as any)("admin_story_stats", {
        p_limit: 500,
        p_offset: 0,
      });
      if (error) {
        console.error("admin_story_stats error:", error);
      } else {
        setRows((data as unknown as StoryStatRow[]) || []);
      }
    } catch (e) {
      console.error("admin_story_stats crash:", e);
    }
    setLoading(false);
  };

  const languages = useMemo(() => {
    const set = new Set(rows.map((r) => r.language).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [rows]);

  const difficulties = useMemo(() => {
    const set = new Set(rows.map((r) => r.difficulty).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let result = rows.filter((r) => {
      if (langFilter !== "all" && r.language !== langFilter) return false;
      if (diffFilter !== "all" && r.difficulty !== diffFilter) return false;
      if (errorsOnly && (r.checker_critical ?? 0) === 0) return false;
      if (dateFrom && new Date(r.story_created_at) < dateFrom) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(r.story_created_at) > end) return false;
      }
      return true;
    });

    // Sorting
    if (sortCol) {
      const getVal = (r: StoryStatRow): number | string => {
        switch (sortCol) {
          case "err_h": return r.checker_critical ?? 0;
          case "err_m": return r.checker_medium ?? 0;
          case "err_l": return r.checker_low ?? 0;
          case "woerter": return r.word_count_approx ?? 0;
          case "rating": return r.quality_rating ?? 0;
          case "patch": return r.patch_fix_rate != null ? Number(r.patch_fix_rate) : -1;
          case "datum": return r.story_created_at;
          default: return 0;
        }
      };
      result = [...result].sort((a, b) => {
        const va = getVal(a);
        const vb = getVal(b);
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [rows, langFilter, diffFilter, errorsOnly, dateFrom, dateTo, sortCol, sortDir]);

  const patchColor = (rate: number | null) => {
    if (rate == null) return "text-muted-foreground";
    if (rate > 80) return "text-emerald-600 dark:text-emerald-400";
    if (rate < 50) return "text-destructive";
    return "text-orange-600 dark:text-orange-400";
  };

  const formatPath = (r: StoryStatRow) => {
    const b = r.structure_beginning;
    const m = r.structure_middle;
    const e = r.structure_ending;
    if (b == null && m == null && e == null) return "–";
    return `A${b ?? "?"}→M${m ?? "?"}→E${e ?? "?"}`;
  };


  const visibleCount = ALL_COLUMNS.filter(c => isVis(c.key)).length;

  const content = (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-card rounded-xl p-3 border">
        <Select value={langFilter} onValueChange={setLangFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Sprache" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Sprachen</SelectItem>
            {languages.map((l) => (
              <SelectItem key={l} value={l}>
                {FLAG[l] || ""} {l.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={diffFilter} onValueChange={setDiffFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Schwierigkeit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Stufen</SelectItem>
            {difficulties.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={errorsOnly} onCheckedChange={(v) => setErrorsOnly(!!v)} />
          Nur mit 🔴 Fehlern
        </label>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="mr-1 h-3.5 w-3.5" />
              {dateFrom ? format(dateFrom, "dd.MM.yy") : "Von"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={de} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="mr-1 h-3.5 w-3.5" />
              {dateTo ? format(dateTo, "dd.MM.yy") : "Bis"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={de} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>

        {(langFilter !== "all" || diffFilter !== "all" || errorsOnly || dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setLangFilter("all"); setDiffFilter("all"); setErrorsOnly(false); setDateFrom(undefined); setDateTo(undefined); }}>
            Reset
          </Button>
        )}

        {/* Column visibility toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Spalten
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {ALL_COLUMNS.map(col => (
              <DropdownMenuCheckboxItem
                key={col.key}
                checked={isVis(col.key)}
                onCheckedChange={() => toggleCol(col.key)}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-xs text-muted-foreground">{filtered.length} Stories</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-xl border bg-card overflow-x-auto max-w-full">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                {isVis("datum") && <TableHead className="whitespace-nowrap">Datum</TableHead>}
                {isVis("user") && <TableHead className="whitespace-nowrap">User</TableHead>}
                {isVis("kind") && <TableHead className="whitespace-nowrap">Kind</TableHead>}
                {isVis("story") && <TableHead className="whitespace-nowrap">Story</TableHead>}
                {isVis("lang") && <TableHead className="whitespace-nowrap">🌐</TableHead>}
                {isVis("woerter") && <TableHead className="whitespace-nowrap">Wörter</TableHead>}
                {isVis("stufe") && <TableHead className="whitespace-nowrap">Stufe</TableHead>}
                {isVis("pfad") && <TableHead className="whitespace-nowrap">Pfad</TableHead>}
                {isVis("emotion") && <TableHead className="whitespace-nowrap">Emotion</TableHead>}
                {isVis("err_h") && <TableHead className="whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort("err_h")}>🔴 H{sortCol === "err_h" ? (sortDir === "desc" ? " ↓" : " ↑") : ""}</TableHead>}
                {isVis("err_m") && <TableHead className="whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort("err_m")}>🟡 M{sortCol === "err_m" ? (sortDir === "desc" ? " ↓" : " ↑") : ""}</TableHead>}
                {isVis("err_l") && <TableHead className="whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort("err_l")}>⚪ L{sortCol === "err_l" ? (sortDir === "desc" ? " ↓" : " ↑") : ""}</TableHead>}
                {isVis("patch") && <TableHead className="whitespace-nowrap">Patch %</TableHead>}
                {isVis("detail") && <TableHead className="whitespace-nowrap">Detail</TableHead>}
                {isVis("rating") && <TableHead className="whitespace-nowrap">⭐</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleCount} className="text-center text-muted-foreground py-8">Keine Daten</TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.story_id}>
                    {isVis("datum") && <TableCell className="text-xs whitespace-nowrap">{format(new Date(r.story_created_at), "dd.MM.yy")}</TableCell>}
                    {isVis("user") && <TableCell className="text-xs max-w-[140px] truncate" title={r.user_email || ""}>{r.user_email || "–"}</TableCell>}
                    {isVis("kind") && <TableCell className="text-xs whitespace-nowrap">{r.child_name || "–"}</TableCell>}
                    {isVis("story") && (
                      <TableCell className="text-xs max-w-[180px]">
                        <Link to={`/read/${r.story_id}`} className="text-primary underline underline-offset-2 hover:no-underline truncate block" title={r.story_title}>
                          {r.story_title}
                        </Link>
                      </TableCell>
                    )}
                    {isVis("lang") && <TableCell className="text-center">{FLAG[r.language || ""] || r.language}</TableCell>}
                    {isVis("woerter") && <TableCell className="text-xs text-right">{r.word_count_approx ?? "–"}</TableCell>}
                    {isVis("stufe") && <TableCell className="text-xs">{r.difficulty || "–"}</TableCell>}
                    {isVis("pfad") && <TableCell className="text-xs whitespace-nowrap font-mono">{formatPath(r)}</TableCell>}
                    {isVis("emotion") && <TableCell className="text-xs">{r.emotional_coloring || "–"}</TableCell>}
                    {isVis("err_h") && <TableCell className={cn("text-xs text-center font-medium", (r.checker_critical ?? 0) > 0 ? "text-destructive font-bold" : "text-muted-foreground")}>{r.checker_critical ?? 0}</TableCell>}
                    {isVis("err_m") && <TableCell className={cn("text-xs text-center font-medium", (r.checker_medium ?? 0) > 0 ? "text-yellow-600 dark:text-yellow-400 font-bold" : "text-muted-foreground")}>{r.checker_medium ?? 0}</TableCell>}
                    {isVis("err_l") && <TableCell className={cn("text-xs text-center font-medium", (r.checker_low ?? 0) > 0 ? "text-foreground" : "text-muted-foreground")}>{r.checker_low ?? 0}</TableCell>}
                    {isVis("patch") && (
                      <TableCell className={cn("text-xs font-medium", patchColor(r.patch_fix_rate != null ? Number(r.patch_fix_rate) : null))}>
                        {r.patch_fix_rate != null ? `${Math.round(Number(r.patch_fix_rate) * 100)}%` : "–"}
                      </TableCell>
                    )}
                    {isVis("detail") && (
                      <TableCell>
                        {((r.checker_subcategories?.length ?? 0) > 0 || r.weakest_part || r.critical_patch_failed) ? (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setDetailRow(r)}>
                            <FileWarning className="h-3.5 w-3.5 mr-1" />Report
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">–</span>
                        )}
                      </TableCell>
                    )}
                    {isVis("rating") && (
                      <TableCell className="text-xs">
                        {r.quality_rating != null ? (
                          <span className="flex items-center gap-0.5">
                            {r.quality_rating}<Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          </span>
                        ) : "–"}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );

  // Detail Drawer
  const drawer = (
    <Sheet open={!!detailRow} onOpenChange={(open) => !open && setDetailRow(null)}>
      <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
        {detailRow && (
          <>
            <SheetHeader>
              <SheetTitle className="text-base">{detailRow.story_title}</SheetTitle>
            </SheetHeader>

            <div className="mt-4 space-y-4">
              {detailRow.critical_patch_failed && (
                <Badge variant="destructive" className="text-xs">⚠️ Critical Patch Failed</Badge>
              )}

              {(detailRow.weakest_part || detailRow.weakness_reason) && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Schwächster Teil</p>
                  {detailRow.weakest_part && <p className="text-sm font-medium">{detailRow.weakest_part}</p>}
                  {detailRow.weakness_reason && <p className="text-sm text-muted-foreground">{detailRow.weakness_reason}</p>}
                </div>
              )}

              {(detailRow.checker_subcategories?.length ?? 0) > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Checker Subcategories</p>
                  <ul className="space-y-1">
                    {detailRow.checker_subcategories!.map((cat, i) => (
                      <li key={i} className="text-sm flex items-start gap-1.5">
                        <span className="text-muted-foreground">•</span>
                        {cat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(detailRow.issues_found != null || detailRow.issues_corrected != null) && (
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Gefunden:</span>{" "}
                    <span className="font-medium">{detailRow.issues_found ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Korrigiert:</span>{" "}
                    <span className="font-medium">{detailRow.issues_corrected ?? 0}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 text-sm">
                <span>🔴 {detailRow.checker_critical ?? 0}</span>
                <span>🟡 {detailRow.checker_medium ?? 0}</span>
                <span>⚪ {detailRow.checker_low ?? 0}</span>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Patch Fix Rate: </span>
                <span className={cn("font-medium", patchColor(detailRow.patch_fix_rate != null ? Number(detailRow.patch_fix_rate) : null))}>
                  {detailRow.patch_fix_rate != null ? `${Math.round(Number(detailRow.patch_fix_rate) * 100)}%` : "–"}
                </span>
              </div>

              <Link to={`/read/${detailRow.story_id}`} className="inline-flex items-center gap-1 text-sm text-primary underline">
                <ExternalLink className="h-3.5 w-3.5" />Story öffnen
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );

  return { content, drawer };
};

/** Embeddable version for use inside tabs */
export const StoryStatsEmbed = () => {
  const { content, drawer } = useStoryStatsContent();
  return (
    <div className="space-y-4">
      {content}
      {drawer}
    </div>
  );
};

const StoryStatsPage = () => {
  const { content, drawer } = useStoryStatsContent();
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Story-Stats" backTo="/feedback-stats" />
      <div className="px-3 sm:px-6 pb-8 max-w-[1400px] mx-auto space-y-4">
        {content}
      </div>
      {drawer}
    </div>
  );
};

export default StoryStatsPage;
