import { CircleCheck } from "lucide-react";

export function DaftarRekomendasi({ items }: { items: { idRekomendasi: string; isiRekomendasi: string }[] }) {
  if (items.length === 0) return <p className="text-muted-foreground">Belum ada rekomendasi.</p>;
  return (
    <ol className="space-y-3">
      {items.map((r) => (
        <li key={r.idRekomendasi} className="flex gap-3">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <span>{r.isiRekomendasi}</span>
        </li>
      ))}
    </ol>
  );
}
