/**
 * Print an arbitrary HTML fragment via a hidden iframe.
 * Avoids extra deps and keeps the print output free of app chrome.
 */
export function printHtml(opts: {
  title: string;
  body: string;
  styles?: string;
}): void {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${opts.title}</title>` +
      `<style>*{box-sizing:border-box;font-family:ui-sans-serif,system-ui,Arial,sans-serif;}${opts.styles ?? ""}</style>` +
      `</head><body>${opts.body}</body></html>`,
  );
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 800);
  }, 350);
}
