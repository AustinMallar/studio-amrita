import { writeFileSync } from "node:fs";
import { PATHS } from "./config.js";
import type { ImportReportRow } from "./types.js";

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export class ImportReporter {
  private rows: ImportReportRow[] = [];

  add(row: ImportReportRow): void {
    this.rows.push(row);
  }

  write(): void {
    const headers: (keyof ImportReportRow)[] = [
      "etsy_listing_id",
      "etsy_title",
      "wc_product_id",
      "wc_slug",
      "action",
      "status",
      "warnings",
      "errors",
    ];
    const lines = [
      headers.join(","),
      ...this.rows.map((row) =>
        headers.map((h) => escapeCsv(String(row[h] ?? ""))).join(",")
      ),
    ];
    writeFileSync(PATHS.reportFile, lines.join("\n"), "utf8");
    console.log(`Wrote import report: ${PATHS.reportFile}`);
  }

  summary(): void {
    const ok = this.rows.filter((r) => r.status === "ok").length;
    const warn = this.rows.filter((r) => r.status === "warning").length;
    const err = this.rows.filter((r) => r.status === "error").length;
    console.log(`Import summary: ${ok} ok, ${warn} warning, ${err} error (${this.rows.length} total)`);
  }
}
