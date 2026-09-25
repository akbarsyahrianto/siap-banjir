import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/** Rujukan asli sebuah informasi; dibuka di tab baru tanpa mengirim referrer. */
export function TautanSumber({
  nama,
  url,
  className,
}: {
  nama: string | null;
  url: string | null;
  className?: string;
}) {
  if (!url) return null;
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      Sumber:{" "}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-2 hover:no-underline"
      >
        {nama ?? new URL(url).hostname}
        <ExternalLink className="size-3.5" aria-hidden="true" />
        <span className="sr-only">(membuka tab baru)</span>
      </a>
    </p>
  );
}
