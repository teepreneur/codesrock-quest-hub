import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminService, type ExportType } from "@/services/admin.service";

const OPTIONS: { type: ExportType; label: string }[] = [
  { type: "schools", label: "Schools" },
  { type: "teachers", label: "Teachers" },
  { type: "children", label: "Children's progress" },
];

const csvCell = (v: string | number | null) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Quote anything with separators, and neutralise spreadsheet formulas
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function downloadExport(type: ExportType, schoolId?: string) {
  const { filename, columns, rows } = await adminService.getExport(type, schoolId);
  const csv = [columns, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  // BOM so Excel opens it as UTF-8
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return rows.length;
}

/** Download CSVs; `types` picks which exports to offer */
export function ExportMenu({ schoolId, types = ["schools", "teachers", "children"] }: { schoolId?: string; types?: ExportType[] }) {
  const [busy, setBusy] = useState<ExportType | null>(null);

  const run = async (type: ExportType) => {
    setBusy(type);
    try {
      const count = await downloadExport(type, schoolId);
      toast.success(`Downloaded ${count} rows`);
    } catch {
      toast.error("Couldn't build the export. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={!!busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Export CSV
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{schoolId ? "This school" : "All schools you can see"}</DropdownMenuLabel>
        {OPTIONS.filter((o) => types.includes(o.type)).map((o) => (
          <DropdownMenuItem key={o.type} onSelect={() => run(o.type)}>{o.label}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
