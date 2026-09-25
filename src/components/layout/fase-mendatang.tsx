import { Hammer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Penanda sementara untuk bagian yang dibangun pada fase berikutnya. */
export function FaseMendatang({ fase, fitur }: { fase: number; fitur: string[] }) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Hammer className="size-5 text-muted-foreground" aria-hidden="true" />
          Sedang dibangun (Fase {fase})
        </CardTitle>
        <CardDescription>Bagian ini akan berisi:</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {fitur.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
