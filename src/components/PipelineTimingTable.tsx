import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TimingRow {
  story_id: string;
  story_title: string;
  story_length: string | null;
  planner_ms: number | null;
  story_generation_ms: number | null;
  consistency_check_only_ms: number | null;
  patch_ms: number | null;
  recheck_ms: number | null;
  image_generation_ms: number | null;
  story_created_at: string;
  checker_critical: number | null;
  checker_medium: number | null;
  checker_low: number | null;
  issues_found: number | null;
  issues_corrected: number | null;
}

interface PipelineTimingTableProps {
  rows: TimingRow[];
}

const fmtSec = (ms: number | null): string => {
  if (ms == null) return "–";
  return `${(ms / 1000).toFixed(1)}s`;
};

const totalMs = (r: TimingRow): number | null => {
  const vals = [r.story_generation_ms, r.planner_ms, r.consistency_check_only_ms, r.patch_ms, r.recheck_ms, r.image_generation_ms];
  const valid = vals.filter((v) => v != null) as number[];
  return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) : null;
};

const totalColor = (ms: number | null): string => {
  if (ms == null) return "text-muted-foreground";
  const sec = ms / 1000;
  if (sec < 60) return "text-emerald-600 dark:text-emerald-400";
  if (sec <= 90) return "text-orange-600 dark:text-orange-400";
  return "text-destructive";
};

const PipelineTimingTable = ({ rows }: PipelineTimingTableProps) => {
  const timingRows = useMemo(() => {
    return rows.filter(
      (r) =>
        r.story_generation_ms != null ||
        r.planner_ms != null ||
        r.consistency_check_only_ms != null ||
        r.patch_ms != null ||
        r.recheck_ms != null ||
        r.image_generation_ms != null
    );
  }, [rows]);

  if (timingRows.length === 0) return null;

  return (
    <div className="overflow-x-auto max-w-full">
      <Table className="min-w-[950px]">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Datum</TableHead>
              <TableHead className="whitespace-nowrap">Story</TableHead>
              <TableHead className="whitespace-nowrap">Length</TableHead>
              <TableHead className="whitespace-nowrap text-right">Story Gen</TableHead>
              <TableHead className="whitespace-nowrap text-right">Planner</TableHead>
              <TableHead className="whitespace-nowrap text-right">Check</TableHead>
              <TableHead className="whitespace-nowrap text-center">Fehler</TableHead>
              <TableHead className="whitespace-nowrap text-center">nach Patch</TableHead>
              <TableHead className="whitespace-nowrap text-right">Patch</TableHead>
              <TableHead className="whitespace-nowrap text-right">ReCheck</TableHead>
              <TableHead className="whitespace-nowrap text-right">Bilder</TableHead>
              <TableHead className="whitespace-nowrap text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timingRows.map((r) => {
              const total = totalMs(r);
              return (
                <TableRow key={r.story_id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {format(new Date(r.story_created_at), "dd.MM.yy")}
                  </TableCell>
                  <TableCell className="text-xs max-w-[180px]">
                    <Link
                      to={`/read/${r.story_id}`}
                      className="text-primary underline underline-offset-2 hover:no-underline truncate block"
                      title={r.story_title}
                    >
                      {r.story_title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">{r.story_length || "–"}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{fmtSec(r.story_generation_ms)}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{fmtSec(r.consistency_check_only_ms)}</TableCell>
                  <TableCell className="text-xs text-center font-mono">
                    {r.issues_found != null && r.issues_found > 0 ? (
                      <span className="text-destructive font-semibold">{r.issues_found}</span>
                    ) : "–"}
                  </TableCell>
                  <TableCell className="text-xs text-center font-mono">
                    {r.issues_found != null && r.issues_corrected != null ? (
                      (() => {
                        const remaining = r.issues_found - r.issues_corrected;
                        return remaining > 0
                          ? <span className="text-destructive font-semibold">{remaining}</span>
                          : <span className="text-emerald-600 dark:text-emerald-400">0</span>;
                      })()
                    ) : "–"}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">{fmtSec(r.patch_ms)}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{fmtSec(r.recheck_ms)}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{fmtSec(r.image_generation_ms)}</TableCell>
                  <TableCell className={cn("text-xs text-right font-mono font-semibold", totalColor(total))}>
                    {fmtSec(total)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
      </Table>
    </div>
  );
};

export default PipelineTimingTable;
