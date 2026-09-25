import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MapPin } from "lucide-react";
import { TanggalInformasi } from "@/components/informasi/tanggal-informasi";
import { TautanSumber } from "@/components/informasi/tautan-sumber";
import { lihatDetailInformasi } from "@/server/services/content.service";

type Props = { params: Promise<{ id: string }> };

// cuid: huruf kecil + angka. Tolak id aneh sebelum menyentuh DB.
const idValid = (id: string) => /^[a-z0-9]{1,40}$/.test(id);

async function ambil(id: string) {
  return idValid(id) ? lihatDetailInformasi(id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const info = await ambil((await params).id);
  return { title: info?.judul ?? "Informasi tidak ditemukan" };
}

export default async function InformasiDetailPage({ params }: Props) {
  const info = await ambil((await params).id);
  if (!info) notFound();

  return (
    <article className="mx-auto max-w-prose space-y-4">
      <Link href="/informasi" className="inline-flex items-center gap-1 text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke Informasi
      </Link>
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">
        {info.kategori === "RIWAYAT_KEJADIAN" ? "Riwayat kejadian" : "Informasi umum"}
      </p>
      <h1 className="text-3xl font-bold leading-tight">{info.judul}</h1>
      <p className="flex flex-wrap gap-x-3 text-muted-foreground">
        <TanggalInformasi kategori={info.kategori} tanggal={info.tanggal} panjang />
        {info.wilayah ? (
          <span className="flex items-center gap-1">
            <MapPin className="size-4" aria-hidden="true" />
            {info.wilayah.namaWilayah}
          </span>
        ) : null}
      </p>
      <div className="space-y-4 text-lg leading-relaxed">
        {info.isi.split("\n\n").map((paragraf, i) =>
          paragraf.includes("\n- ") || paragraf.startsWith("- ") ? (
            <ParagrafDaftar key={i} teks={paragraf} />
          ) : (
            <p key={i}>{paragraf}</p>
          ),
        )}
      </div>
      <TautanSumber nama={info.sumberNama} url={info.sumberUrl} className="border-t pt-4 text-base" />
    </article>
  );
}

/** Paragraf berisi baris "- item" dirender sebagai daftar. */
function ParagrafDaftar({ teks }: { teks: string }) {
  const baris = teks.split("\n");
  const pembuka = baris.filter((b) => !b.startsWith("- "));
  const item = baris.filter((b) => b.startsWith("- ")).map((b) => b.slice(2));
  return (
    <div>
      {pembuka.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <ul className="mt-2 list-disc space-y-1 pl-6">
        {item.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
