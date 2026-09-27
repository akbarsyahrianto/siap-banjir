import type { TingkatWilayah } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { kontakDaruratWilayah, namaInduk, namaTampilan, tokenPencarian } from "@/server/services/wilayah.service";

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
      { nama: "BPBD Kota Tangerang", telepon: null },
      { nama: "BPBD Provinsi Banten", telepon: null },
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
    expect(kontak.filter((k) => k.nama.startsWith("BPBD"))).toEqual([
      { nama: "BPBD Provinsi Daerah Khusus Ibukota Jakarta", telepon: null },
    ]);
  });

  it("BPBD Provinsi DIY memakai nomor terverifikasi beserta sumber dan tanggal pemeriksaan", () => {
    const sleman = [w("34", "Daerah Istimewa Yogyakarta", "PROVINSI"), w("34.04", "Kabupaten Sleman", "KABKOTA")];
    const [kab, prov] = kontakDaruratWilayah(sleman).slice(-2);
    expect(kab).toEqual({ nama: "BPBD Kabupaten Sleman", telepon: null });
    expect(prov).toMatchObject({
      nama: "BPBD Provinsi Daerah Istimewa Yogyakarta",
      telepon: "(0274) 555585",
      sumber: { url: "https://bpbd.jogjaprov.go.id/beranda", keterangan: "diperiksa 27 September 2026" },
    });
  });
});
