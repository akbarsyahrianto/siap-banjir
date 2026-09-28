import type { TingkatWilayah } from "@prisma/client";
import { describe, expect, it } from "vitest";
import data112 from "@/data/layanan-112.json";
import { kontakDaruratWilayah, namaInduk, namaTampilan, nomorDaruratWilayah, tokenPencarian } from "@/server/services/wilayah.service";

const w = (idWilayah: string, namaWilayah: string, level: TingkatWilayah) => ({ idWilayah, namaWilayah, level });

const tangerang = [
  w("36", "Banten", "PROVINSI"),
  w("36.71", "Kota Tangerang", "KABKOTA"),
  w("36.71.01", "Tangerang", "KECAMATAN"),
  w("36.71.01.1001", "Sukarasa", "DESA"),
];

const jakartaUtara = [
  w("31", "Daerah Khusus Ibukota Jakarta", "PROVINSI"),
  w("31.72", "Kota Administrasi Jakarta Utara", "KABKOTA"),
  w("31.72.01", "Penjaringan", "KECAMATAN"),
  w("31.72.01.1001", "Penjaringan", "DESA"),
];

describe("nama wilayah", () => {
  it("namaTampilan: jenis + desa/kelurahan, kab/kota", () => {
    expect(namaTampilan(tangerang)).toBe("Kelurahan Sukarasa, Kota Tangerang");
    const dayeuhkolot = [
      w("32", "Jawa Barat", "PROVINSI"),
      w("32.04", "Kabupaten Bandung", "KABKOTA"),
      w("32.04.12", "Dayeuhkolot", "KECAMATAN"),
      w("32.04.12.2004", "Cangkuang Kulon", "DESA"),
    ];
    expect(namaTampilan(dayeuhkolot)).toBe("Desa Cangkuang Kulon, Kabupaten Bandung");
  });

  it("namaInduk: kecamatan → kab/kota → provinsi", () => {
    expect(namaInduk(tangerang)).toBe("Kec. Tangerang, Kota Tangerang, Banten");
  });
});

describe("tokenPencarian", () => {
  it("huruf kecil, pisah tanda baca, buang token < 2 huruf, maks 5 kata", () => {
    expect(tokenPencarian("Sukarasa, TANGERANG")).toEqual(["sukarasa", "tangerang"]);
    expect(tokenPencarian("a b cd")).toEqual(["cd"]);
    expect(tokenPencarian("satu dua tiga empat lima enam")).toHaveLength(5);
    expect(tokenPencarian("%_'; --")).toEqual([]);
  });
});

describe("kontakDaruratWilayah", () => {
  it("nomor nasional + BPBD kab/kota dan provinsi; tanpa sumber resmi → nomor belum tersedia", () => {
    const kontak = kontakDaruratWilayah(tangerang);
    expect(kontak.map((k) => k.telepon)).toEqual(expect.arrayContaining(["112", "117"]));
    expect(kontak.slice(-2)).toEqual([
      { id: "bpbd-kabkota", nama: "BPBD Kota Tangerang", deskripsi: "Badan Penanggulangan Bencana Daerah", telepon: null },
      { id: "bpbd-provinsi", nama: "BPBD Provinsi Banten", deskripsi: "Badan Penanggulangan Bencana Daerah", telepon: null },
    ]);
  });

  it("112 diberi keterangan status layanan kab/kota beserta sumbernya", () => {
    const k112 = kontakDaruratWilayah(tangerang).find((k) => k.telepon === "112");
    expect(k112?.keterangan).toContain("Layanan 112 Kota Tangerang sudah diluncurkan");
    expect(k112?.sumber?.url).toBe("https://layanan112.komdigi.go.id/");
    expect(k112?.sumber?.keterangan).toMatch(/^data diambil \d+ \w+ \d{4}$/);
  });

  it("kota administrasi DKI Jakarta hanya memakai BPBD Provinsi", () => {
    const kontak = kontakDaruratWilayah(jakartaUtara);
    expect(kontak.filter((k) => k.nama.startsWith("BPBD"))).toMatchObject([
      { id: "bpbd-provinsi", nama: "BPBD Provinsi Daerah Khusus Ibukota Jakarta", telepon: null },
    ]);
  });

  it("BPBD Provinsi DIY memakai nomor terverifikasi beserta sumber dan tanggal pemeriksaan", () => {
    const sleman = [w("34", "Daerah Istimewa Yogyakarta", "PROVINSI"), w("34.04", "Kabupaten Sleman", "KABKOTA")];
    const [kab, prov] = kontakDaruratWilayah(sleman).slice(-2);
    expect(kab).toMatchObject({ nama: "BPBD Kabupaten Sleman", telepon: null });
    expect(prov).toMatchObject({
      nama: "BPBD Provinsi Daerah Istimewa Yogyakarta",
      telepon: "(0274) 555585",
      sumber: { url: "https://bpbd.jogjaprov.go.id/beranda", keterangan: "diperiksa 27 September 2026" },
    });
  });
});

describe("nomorDaruratWilayah (D-050)", () => {
  const diy = w("34", "Daerah Istimewa Yogyakarta", "PROVINSI");
  const id = (k: { id: string }) => k.id;

  it("112 sudah diluncurkan → 112 utama, lalu BPBD, 117, 119, 113; tanpa catatan", () => {
    const n = nomorDaruratWilayah(tangerang);
    expect(n.utama.id).toBe("112");
    expect(n.utama.keterangan).toContain("sudah diluncurkan");
    expect(n.lainnya.map(id)).toEqual(["bpbd-kabkota", "bpbd-provinsi", "117", "119", "113"]);
    expect(n.catatan112).toBeNull();
  });

  it("112 belum diluncurkan + BPBD bernomor → BPBD utama; 112 tetap di daftar, keterangannya jadi catatan", () => {
    const n = nomorDaruratWilayah([diy, w("34.01", "Kabupaten Kulon Progo", "KABKOTA")]);
    expect(n.utama).toMatchObject({ id: "bpbd-provinsi", telepon: "(0274) 555585" });
    expect(n.lainnya.map(id)).toEqual(["112", "bpbd-kabkota", "117", "119", "113"]);
    expect(n.lainnya[0]!.keterangan).toBeUndefined();
    expect(n.lainnya[0]!.sumber?.url).toBe("https://layanan112.komdigi.go.id/");
    expect(n.catatan112?.judul).toBe("Layanan 112 Kabupaten Kulon Progo belum tercatat diluncurkan.");
    expect(n.catatan112?.isi).toContain("belum tercatat memiliki layanan 112");
    expect(n.catatan112?.isi).not.toMatch(/tidak (bisa|dapat) (dipakai|digunakan)/);
  });

  it("112 belum diluncurkan tanpa BPBD bernomor → 112 tetap utama dengan catatan", () => {
    const kab = data112.daftar.find((e) => e.status !== 1 && !e.idWilayah.startsWith("34."))!;
    const n = nomorDaruratWilayah([w(kab.idWilayah.slice(0, 2), "Provinsi X", "PROVINSI"), w(kab.idWilayah, "Kab X", "KABKOTA")]);
    expect(n.utama.id).toBe("112");
    expect(n.lainnya.map(id)).toEqual(["bpbd-kabkota", "bpbd-provinsi", "117", "119", "113"]);
    expect(n.catatan112?.isi).toContain(`berstatus "${kab.statusLabel}"`);
  });

  it("tanpa wilayah → hanya nomor nasional, 112 utama", () => {
    const n = nomorDaruratWilayah([]);
    expect(n.utama.id).toBe("112");
    expect(n.lainnya.map(id)).toEqual(["117", "119", "113"]);
    expect(n.catatan112).toBeNull();
  });
});
