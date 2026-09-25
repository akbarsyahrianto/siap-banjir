import { TriangleAlert } from "lucide-react";
import { DISCLAIMER } from "@/lib/constants";

export function Disclaimer() {
  return (
    <div
      role="note"
      className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
    >
      <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <p>{DISCLAIMER}</p>
    </div>
  );
}
