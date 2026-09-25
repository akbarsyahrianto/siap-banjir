import { cn } from "@/lib/utils";

/** Logo Siap Banjir: perisai dengan tetes air dan tanda peringatan. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <path
        d="M16 2 4 6.5v8.2c0 7.3 5 13.3 12 15.3 7-2 12-8 12-15.3V6.5L16 2Z"
        className="fill-primary"
      />
      <path
        d="M16 7.5c-2.9 3.9-5.5 7.3-5.5 10.3a5.5 5.5 0 0 0 11 0c0-3-2.6-6.4-5.5-10.3Z"
        className="fill-primary-foreground"
      />
      <rect x="15" y="12.5" width="2" height="5.5" rx="1" className="fill-primary" />
      <circle cx="16" cy="20.5" r="1.2" className="fill-primary" />
    </svg>
  );
}
