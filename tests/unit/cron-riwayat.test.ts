import { describe, expect, it } from "vitest";
import { otorisasiCron, petakanTerbatas } from "@/server/cron";
import { barisDesa, rentangHariWib, susunIsiRiwayat, tambahkanDesaKeIsi } from "@/server/services/riwayat.service";

const SECRET = "rahasia-cron-yang-cukup-panjang-123";

describe("otorisasiCron", () => {
  it("menerima Bearer secret yang benar", () => {
    expect(otorisasiCron(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it.each([
    { header: null, kasus: "tanpa header" },
    { header: "Bearer salah", kasus: "secret salah" },
    { header: SECRET, kasus: "tanpa awalan Bearer" },
    { header: `Basic ${SECRET}`, kasus: "skema lain" },
    { header: `Bearer ${SECRET} `, kasus: "spasi ekstra" },
  ])("menolak: $kasus", ({ header }) => {
    expect(otorisasiCron(header, SECRET)).toBe(false);
  });

  it("menolak semua permintaan jika CRON_SECRET kosong atau terlalu pendek", () => {
    expect(otorisasiCron("Bearer ", "")).toBe(false);
    expect(otorisasiCron("Bearer x", undefined)).toBe(false);
    expect(otorisasiCron("Bearer pendek", "pendek")).toBe(false);
  });
});

describe("petakanTerbatas", () => {
  it("mempertahankan urutan dan tidak melebihi batas paralel", async () => {
    let aktif = 0;
    let puncak = 0;
    const hasil = await petakanTerbatas([5, 1, 4, 2, 3, 0], 2, async (ms) => {
      aktif++;
      puncak = Math.max(puncak, aktif);
      await new Promise((r) => setTimeout(r, ms));
      aktif--;
      return ms * 10;
    });
    expect(hasil).toEqual([50, 10, 40, 20, 30, 0]);
    expect(puncak).toBe(2);
  });

  it("daftar kosong", async () => {
    expect(await petakanTerbatas([], 4, async (x: number) => x)).toEqual([]);
  });
});

describe("riwayat", () => {
  it("rentang hari WIB: 23:30 WIB masih hari yang sama, 00:30 WIB hari berikutnya", () => {
    // 2026-09-25 23:30 WIB = 16:30 UTC
    const r1 = rentangHariWib(new Date("2026-09-25T16:30:00Z"));
    expect(r1.awal.toISOString()).toBe("2026-09-24T17:00:00.000Z");
    expect(r1.akhir.toISOString()).toBe("2026-09-25T17:00:00.000Z");
    // 2026-09-26 00:30 WIB = 2026-09-25 17:30 UTC
    expect(rentangHariWib(new Date("2026-09-25T17:30:00Z")).awal.toISOString()).toBe("2026-09-25T17:00:00.000Z");
  });

  const waktu = new Date("2026-09-25T06:00:00Z"); // 13:00 WIB
  const barisA = barisDesa("Kelurahan Tanjung Mas, Kec. Semarang Utara", waktu, "Risiko TINGGI karena curah hujan 24 jam terakhir 72 mm.");
  const barisB = barisDesa("Kelurahan Kemijen, Kec. Semarang Timur", new Date("2026-09-25T08:30:00Z"), "Risiko TINGGI karena curah hujan 1 jam terakhir 25 mm.");

  it("isi riwayat kab/kota memuat daftar desa, jam deteksi, dan catatan deteksi otomatis", () => {
    const isi = susunIsiRiwayat("Kota Semarang", waktu, [barisA]);
    expect(isi).toContain("risiko banjir TINGGI di Kota Semarang");
    expect(isi).toContain("- Kelurahan Tanjung Mas, Kec. Semarang Utara (13:00 WIB): Risiko TINGGI karena curah hujan 24 jam terakhir 72 mm.");
    expect(isi).toContain("bukan laporan kejadian banjir yang terverifikasi");
  });

  it("desa baru ditambahkan ke daftar; desa yang sudah tercantum tidak digandakan", () => {
    const isi = susunIsiRiwayat("Kota Semarang", waktu, [barisA]);
    const baru = tambahkanDesaKeIsi(isi, "Kelurahan Kemijen, Kec. Semarang Timur", barisB);
    expect(baru).not.toBeNull();
    expect(baru).toContain(`${barisA}\n${barisB}`);
    // Catatan tetap di akhir.
    expect(baru?.trimEnd().endsWith("BPBD setempat.")).toBe(true);
    expect(tambahkanDesaKeIsi(baru ?? "", "Kelurahan Kemijen, Kec. Semarang Timur", barisB)).toBeNull();
  });
});
