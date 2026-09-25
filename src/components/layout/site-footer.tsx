import { TriangleAlert } from "lucide-react";
import { APP_NAME, DISCLAIMER, OPEN_METEO_ATTRIBUTION } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t bg-muted/40">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 text-sm text-muted-foreground">
        <p className="flex gap-2">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden="true" />
          <span>{DISCLAIMER}</span>
        </p>
        <p>
          <a href={OPEN_METEO_ATTRIBUTION.url} className="underline underline-offset-2 hover:text-foreground">
            {OPEN_METEO_ATTRIBUTION.label}
          </a>{" "}
          (
          <a
            href={OPEN_METEO_ATTRIBUTION.licenseUrl}
            className="underline underline-offset-2 hover:text-foreground"
          >
            {OPEN_METEO_ATTRIBUTION.licenseLabel}
          </a>
          )
        </p>
        <p>
          © {new Date().getFullYear()} {APP_NAME}. Darurat? Hubungi <strong className="text-foreground">112</strong>.
        </p>
      </div>
    </footer>
  );
}
