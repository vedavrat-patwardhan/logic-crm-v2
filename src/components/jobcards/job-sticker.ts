import { formatDate } from "@/lib/format";
import { printHtml } from "@/lib/print";

export type JobStickerData = {
  jobNo: string;
  date: Date | string;
  customerName: string;
  material?: string | null;
  accessories?: string[];
  problem?: string | null;
};

function esc(value?: string | null): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ((
        {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        } as Record<string, string>
      )[c] ?? c),
  );
}

export function printJobSticker(job: JobStickerData): void {
  const lines: string[] = [];

  lines.push(
    `<div style="font-size:18px;font-weight:800">${esc(
      job.jobNo,
    )} | ${esc(formatDate(job.date))}</div>`,
  );

  lines.push(
    `<div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden">${esc(
      job.customerName,
    )}</div>`,
  );

  // Material + accessories share one clipped line so the sticker never
  // grows beyond the label height.
  const accessories = (job.accessories ?? []).filter(Boolean);
  const details = [job.material?.trim(), accessories.join(" / ")]
    .filter(Boolean)
    .join(" — ");
  if (details) {
    lines.push(
      `<div style="font-size:11px;white-space:nowrap;overflow:hidden">${esc(details)}</div>`,
    );
  }

  if (job.problem?.trim()) {
    lines.push(
      `<div style="font-size:11px;white-space:nowrap;overflow:hidden">${esc(job.problem)}</div>`,
    );
  }

  printHtml({
    title: job.jobNo,
    body: `<div style="padding:4px;width:280px;overflow:hidden">${lines.join("")}</div>`,
    styles: "@page{size:auto;margin:3mm}",
  });
}
