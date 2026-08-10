import { formatDate } from "@/lib/format";
import { printHtml } from "@/lib/print";

export type JobStickerData = {
  jobNo: string;
  date: Date | string;
  customerName: string;
  mobileNo?: string | null;
  material?: string | null;
  accessories?: string[];
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

  const mobile = job.mobileNo?.trim();
  lines.push(
    `<div style="font-size:13px;font-weight:700">${esc(
      job.customerName,
    )}${mobile ? ` <span style="font-size:12px;font-weight:400">${esc(mobile)}</span>` : ""}</div>`,
  );

  if (job.material?.trim()) {
    lines.push(`<div style="font-size:12px">${esc(job.material)}</div>`);
  }

  const accessories = (job.accessories ?? []).filter(Boolean);
  if (accessories.length) {
    lines.push(
      `<div style="font-size:12px">${esc(accessories.join(" / "))}</div>`,
    );
  }

  printHtml({
    title: job.jobNo,
    body: `<div style="padding:8px;width:280px">${lines.join("")}</div>`,
    styles: "@page{size:auto;margin:6mm}",
  });
}
