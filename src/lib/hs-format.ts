import type { ReactNode } from "react";
import { createElement, Fragment } from "react";

/** ממיר עיצוב וואטסאפ (*מודגש*, _נטוי_, ~קו חוצה~, ```קוד```) ל-JSX */
export function renderWhatsApp(text: string): ReactNode {
  const lines = text.split("\n");
  return createElement(
    Fragment,
    null,
    ...lines.map((line, i) =>
      createElement(
        Fragment,
        { key: i },
        ...formatLine(line),
        i < lines.length - 1 ? createElement("br") : null,
      ),
    ),
  );
}

const PATTERN = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`)/g;

function formatLine(line: string): ReactNode[] {
  const parts = line.split(PATTERN).filter((p) => p !== "");
  return parts.map((part, idx) => {
    const inner = part.slice(1, -1);
    if (/^\*[^*]+\*$/.test(part))
      return createElement("strong", { key: idx, className: "font-bold" }, inner);
    if (/^_[^_]+_$/.test(part)) return createElement("em", { key: idx }, inner);
    if (/^~[^~]+~$/.test(part))
      return createElement("span", { key: idx, className: "line-through opacity-80" }, inner);
    if (/^`[^`]+`$/.test(part))
      return createElement(
        "code",
        { key: idx, className: "rounded bg-muted px-1 font-mono text-[0.85em]" },
        inner,
      );
    return createElement(Fragment, { key: idx }, part);
  });
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return "972" + digits.slice(1);
  return digits;
}

export function prettyPhone(id: string) {
  if (id.startsWith("972")) return "0" + id.slice(3).replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
  return id;
}
