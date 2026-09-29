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
        className="font-medium text-primary underline underline-offset-2 hover:no-underline"
      >
        {/* Inline (bukan inline-flex) agar nama sumber yang panjang mengalir setelah "Sumber:". */}
        {nama ?? new URL(url).hostname}
        <ExternalLink className="ml-1 inline size-3.5 align-[-2px]" aria-hidden="true" />
        <span className="sr-only">(membuka tab baru)</span>
      </a>
    </p>
  );
}
