import { expect, test } from "@playwright/test";
import { DESA_TANPA_112, DESA_TANPA_112_TANPA_BPBD, DESA_UJI, identitasUji, stubPush, WILAYAH_SIMULASI } from "./bantuan";

test.beforeEach(async ({ context, page }, testInfo) => {
  await context.grantPermissions(["notifications", "geolocation"]);
  await stubPush(page, testInfo);
});

test("alur utama: pilih wilayah → lihat risiko → aktifkan notifikasi → atur notifikasi", async ({
  page,
  request,
}, testInfo) => {
  const { endpoint } = identitasUji(testInfo);
  const statusLangganan = async () => {
    const res = await request.get(`/api/push/langganan?endpoint=${encodeURIComponent(endpoint)}`);
    return res.ok() ? ((await res.json()) as { data: { status: boolean; levelMinimum: string; idWilayah: string } }).data : null;
  };

  await test.step("Beranda tanpa wilayah meminta pengguna memilih wilayah", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Siap Banjir: Beranda", level: 1 })).toBeAttached();
    await expect(page.getByText("Pilih wilayah terlebih dulu")).toBeVisible();
  });

  await test.step("aturLokasi(wilayah) lewat pencarian → dialog izin notifikasi muncul", async () => {
    await page.getByRole("combobox", { name: "Cari desa/kelurahan" }).fill("bulu lor semarang");
    await page.getByRole("option", { name: /Kelurahan Bulu Lor/ }).click();
    await expect(page).toHaveURL(new RegExp(`wilayah=${DESA_UJI.replaceAll(".", "\\.")}`));
    await expect(page.getByRole("dialog", { name: "Aktifkan peringatan banjir?" })).toBeVisible();
  });

  await test.step("[izin notifikasi] → daftarkanPerangkat() → aktifkan() → status aktif", async () => {
    await page.getByRole("button", { name: "Izinkan notifikasi" }).click();
    await expect(page.getByText("Peringatan aktif untuk Kelurahan Bulu Lor, Kota Semarang.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Peringatan dini\s*Aktif\s*Level Sedang & Tinggi/ })).toBeVisible();
    expect(await statusLangganan()).toMatchObject({ status: true, idWilayah: DESA_UJI, levelMinimum: "SEDANG" });
  });

  await test.step("Beranda menampilkan wilayah terpilih, level risiko, ilustrasi, cuaca, dan kontak", async () => {
    await expect(page.getByRole("link", { name: /Wilayah yang dipantau\s*Kelurahan Bulu Lor, Kota Semarang/ })).toHaveAttribute(
      "href",
      "/pengaturan",
    );
    await expect(page.getByText(/^Risiko (Rendah|Sedang|Tinggi)$/).first()).toBeVisible();
    await expect(page.getByRole("img", { name: /Ilustrasi 3D: air naik sampai tanda level (Rendah|Sedang|Tinggi)/ })).toBeVisible();
    await expect(page.getByRole("list", { name: "Skala level risiko" }).locator('[aria-current="step"]')).toHaveCount(1);
    await expect(page.getByRole("link", { name: /Cuaca terkini/ })).toContainText(/Hujan 24 jam: [\d,]+ mm/);
    await expect(page.getByRole("link", { name: /Kontak darurat/ })).toHaveAttribute("href", `/kontak?wilayah=${DESA_UJI}`);
    await expect(page.getByRole("banner").getByRole("link", { name: "Darurat" })).toHaveAttribute("href", "/kontak");
    await expect(page.getByText("Data cuaca: Open-Meteo.com").first()).toBeVisible();
  });

  await test.step("Detail risiko: skor, arti level, penanganan, checklist tersimpan", async () => {
    // Teks tombol mengikuti level (rendah/sedang/tinggi).
    await page.getByRole("link", { name: /^Lihat (persiapan & rekomendasi|langkah siaga|langkah penyelamatan)$/ }).click();
    await expect(page).toHaveURL(new RegExp(`/risiko\\?wilayah=${DESA_UJI.replaceAll(".", "\\.")}`));
    const konten = page.locator("#konten");
    await expect(konten.getByRole("heading", { name: "Risiko Banjir", level: 1 })).toBeVisible();
    await expect(konten.getByText("Kelurahan Bulu Lor, Kota Semarang", { exact: true })).toBeVisible();
    await expect(konten.getByRole("link", { name: "Ubah wilayah" })).toHaveAttribute("href", "/pengaturan");
    await expect(page.getByRole("img", { name: /Skor risiko \d+ dari 100/ })).toBeVisible();
    await expect(page.getByText(/bukan peringatan resmi/).first()).toBeVisible();
    await expect(page.getByText("Ada parameter yang melewati ambang Tinggi. Ikuti arahan evakuasi.")).toBeVisible();

    await expect(page.getByRole("tab", { name: "Checklist Siaga" })).toHaveAttribute("aria-selected", "true");
    const pertama = page.getByRole("tabpanel").getByRole("checkbox").first();
    await pertama.check();
    await expect(pertama).toBeChecked();
    await page.reload();
    await expect(page.getByRole("tabpanel").getByRole("checkbox").first()).toBeChecked();

    await page.getByRole("tab", { name: "Detail Mitigasi" }).click();
    await expect(page.getByRole("tabpanel").getByRole("listitem").first()).toBeVisible();
    // Kartu merah ke halaman Nomor Darurat (board Risiko, D-050).
    await expect(page.getByRole("link", { name: /Lihat nomor darurat\s*Untuk Kelurahan Bulu Lor, Kota Semarang/ })).toHaveAttribute(
      "href",
      `/kontak?wilayah=${DESA_UJI}`,
    );
  });

  await test.step("Pengaturan: level minimum & nonaktifkan notifikasi", async () => {
    await page.goto("/pengaturan");
    const sakelar = page.getByRole("switch", { name: "Peringatan banjir" });
    await expect(sakelar).toBeChecked();

    await page.getByRole("radio", { name: /Hanya Tinggi/ }).click();
    await expect(page.getByText("Level minimum disimpan.", { exact: true })).toBeVisible();
    expect(await statusLangganan()).toMatchObject({ levelMinimum: "TINGGI", status: true });

    await sakelar.click();
    await expect(page.getByText("Notifikasi dinonaktifkan.", { exact: true })).toBeVisible();
    await expect(sakelar).not.toBeChecked();
    expect(await statusLangganan()).toMatchObject({ status: false });
  });
});

test("Gunakan lokasi saya memilih desa/kelurahan terdekat", async ({ page, context }) => {
  await context.setGeolocation({ latitude: -6.98, longitude: 110.41 }); // Semarang
  await page.goto("/cuaca");
  await page.getByRole("button", { name: "Gunakan lokasi saya" }).click();
  await expect(page).toHaveURL(/wilayah=33\.74\.\d{2}\.\d{4}/);
  // Dibatasi ke konten utama: dialog izin notifikasi juga menyebut nama wilayah.
  await expect(page.locator("#konten").getByText(/^(Kelurahan|Desa) .+, Kota Semarang$/)).toBeVisible();
  // D-049: dialog izin baru dibuka setelah isi wilayah tampil, jadi prakiraan sudah ada saat dialog muncul.
  const dialog = page.getByRole("dialog", { name: "Aktifkan peringatan banjir?" });
  await expect(dialog).toBeVisible();
  expect(await page.locator("#judul-harian").count()).toBe(1);
  await dialog.getByRole("button", { name: "Nanti saja" }).click();
  await expect(page.getByRole("heading", { name: "Prakiraan harian" })).toBeVisible();
  // Setelah wilayah terpilih, halaman Cuaca tidak lagi menampilkan pemilih (board Cuaca, D-052).
  await expect(page.getByRole("button", { name: "Gunakan lokasi saya" })).toHaveCount(0);
});

test("Pengaturan: pesan hasil GPS dan pilihan bertingkat tetap tampil setelah render ulang", async ({ page, context }) => {
  await context.setGeolocation({ latitude: -6.98, longitude: 110.41 }); // Semarang
  await page.goto("/pengaturan");
  await page.getByRole("button", { name: "Gunakan lokasi saya" }).click();
  await expect(page).toHaveURL(/wilayah=33\.74\.\d{2}\.\d{4}/);
  await expect(page.getByText(/Desa\/kelurahan terdekat: (Kelurahan|Desa) .+, Kota Semarang \(±/)).toBeVisible();
  await expect(page.getByLabel("Kabupaten/Kota", { exact: true })).toHaveValue("33.74");
});

test("pilih bertingkat Provinsi → Kab/Kota → Kecamatan → Desa/Kelurahan", async ({ page }) => {
  await page.goto("/pengaturan");
  const pilih = async (label: string, opsi: string) => {
    const select = page.getByLabel(label, { exact: true });
    await expect(select).toBeEnabled();
    await expect(select.locator("option", { hasText: opsi })).toHaveCount(1);
    await select.selectOption({ label: opsi });
  };
  await pilih("Provinsi", "Jawa Tengah");
  await pilih("Kabupaten/Kota", "Kota Semarang");
  await pilih("Kecamatan", "Semarang Utara");
  await pilih("Desa/Kelurahan", "Kelurahan Bulu Lor");
  await expect(page).toHaveURL(new RegExp(`wilayah=${DESA_UJI.replaceAll(".", "\\.")}`));
  await expect(page.locator("#konten").getByText("Kelurahan Bulu Lor, Kota Semarang", { exact: true })).toBeVisible();
  // Setelah render ulang, pilihan bertingkat tetap terisi sesuai wilayah terpilih.
  await expect(page.getByLabel("Kecamatan", { exact: true })).toHaveValue("33.74.02");
});

test("halaman Cuaca: cuaca terkini, prakiraan harian, dan curah hujan per jam", async ({ page }) => {
  await page.goto(`/cuaca?wilayah=${DESA_UJI}`);
  const konten = page.locator("#konten");
  await expect(konten.getByRole("heading", { name: "Prakiraan Cuaca", level: 1 })).toBeVisible();
  await expect(konten.getByText("Kelurahan Bulu Lor, Kota Semarang", { exact: true })).toBeVisible();
  await expect(konten.getByRole("link", { name: "Ubah wilayah" })).toHaveAttribute("href", "/pengaturan");

  const kini = konten.getByRole("region", { name: "Cuaca terkini" });
  await expect(kini.getByText(/^-?[\d,]+°C$/)).toBeVisible();
  for (const label of ["Kelembapan", "Angin", "Hujan 15 mnt"]) await expect(kini.getByText(label, { exact: true })).toBeVisible();
  await expect(kini.getByText(/^Diperbarui \d{2}:\d{2} WIB · Data cuaca berlaku untuk area ±11 km/)).toBeVisible();
  await expect(kini.getByRole("link", { name: "Open-Meteo.com" })).toHaveAttribute("href", "https://open-meteo.com/");

  const harian = konten.getByRole("region", { name: "Prakiraan harian" }).getByRole("listitem");
  await expect(harian).toHaveCount(3);
  await expect(harian.first().getByRole("heading", { name: "Hari ini" })).toBeVisible();
  await expect(harian.first()).toContainText(/Curah hujan[\d,]+ mmPeluang hujan\d+%Suhu[\d,]+–[\d,]+°C/);

  const jam = konten.getByRole("region", { name: "Curah hujan per jam" });
  await expect(
    jam.getByRole("img", {
      name: /^Grafik curah hujan per jam, .+\. (Tertinggi [\d,]+ mm pada \w+ pukul \d{2}\.\d{2}|Tidak ada hujan yang diprakirakan)\.$/,
    }),
  ).toBeVisible();
  await expect(jam.getByText(/^Mulai pukul \d{2}\.\d{2} hari ini\. Satu batang = satu jam\.$/)).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Cari desa/kelurahan" })).toHaveCount(0);
});

test.describe("state machine risiko (wilayah disimulasikan TINGGI)", () => {
  test("Bahaya → jalur push & grafik → join → Detail Penanganan → Final (ditutup)", async ({ page }) => {
    await page.goto(`/risiko?wilayah=${WILAYAH_SIMULASI}`);
    await expect(page.getByRole("alert").filter({ hasText: /Bahaya potensi banjir terdeteksi|Ikuti langkah penanganan/ })).toBeVisible();

    // Perangkat tidak berlangganan wilayah ini → peringatan dalam aplikasi.
    await expect(page.getByText(/Risiko banjir TINGGI di Kelurahan Bandengan, Kota Pekalongan/)).toBeVisible();
    // Kedua jalur selesai → join → Detail Penanganan.
    await expect(page.getByText("Detail penanganan", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Penanganan \(risiko tinggi\)/ })).toBeFocused();
    await expect(page.getByRole("button", { name: "Aktifkan notifikasi push untuk wilayah ini" })).toBeVisible();
    // D-048: grafik 48 jam tampil di Bahaya dan tetap ada di Detail Penanganan.
    const judulGrafik = page.getByRole("heading", { name: "Curah hujan 48 jam" });
    await expect(judulGrafik).toBeVisible();

    await page.getByRole("button", { name: "Tutup peringatan" }).click();
    await expect(page.getByText("Peringatan ditutup")).toBeVisible();
    await expect(page.getByText("Selesai", { exact: true })).toBeVisible();
    // Final: episode Bahaya selesai, grafik tidak ditampilkan lagi.
    await expect(judulGrafik).toHaveCount(0);
  });

  test("Beranda risiko tinggi: badge, label simulasi, ajakan penyelamatan, kontak darurat", async ({ page }) => {
    await page.goto(`/?wilayah=${WILAYAH_SIMULASI}`);
    // Dibatasi ke #konten: selama streaming, isi Suspense sempat ada di template tersembunyi di akhir <body>.
    const konten = page.locator("#konten");
    await expect(konten.getByText("Risiko Tinggi", { exact: true })).toBeVisible();
    await expect(konten.getByText(/^SIMULASI: level ini hasil uji coba/)).toBeVisible();
    await expect(konten.getByRole("img", { name: "Ilustrasi 3D: air naik sampai tanda level Tinggi" })).toBeVisible();
    await expect(konten.getByRole("list", { name: "Skala level risiko" }).locator('[aria-current="step"]')).toContainText("Tinggi");
    await expect(konten.getByRole("link", { name: "Lihat langkah penyelamatan" })).toHaveAttribute(
      "href",
      `/risiko?wilayah=${WILAYAH_SIMULASI}`,
    );
    const kontak = konten.getByRole("link", { name: /Kontak darurat/ });
    await expect(kontak).toHaveCSS("background-color", "rgb(180, 20, 28)");
    await kontak.click();
    await expect(page).toHaveURL(`/kontak?wilayah=${WILAYAH_SIMULASI}`);
    await expect(page.getByRole("heading", { name: "Nomor Darurat", level: 1 })).toBeVisible();
  });

  test("deep link notifikasi #penanganan langsung ke Detail Penanganan", async ({ page }) => {
    await page.goto(`/risiko?wilayah=${WILAYAH_SIMULASI}#penanganan`);
    await expect(page.getByText("Detail penanganan", { exact: true })).toBeVisible();
    await expect(page.getByText("Ikuti langkah penanganan di bawah")).toBeVisible();
  });
});

test.describe("Nomor Darurat (D-050)", () => {
  test("112 utama; konfirmasi sebelum menelepon; BPBD tanpa nomor resmi", async ({ page }, testInfo) => {
    await page.goto(`/kontak?wilayah=${DESA_UJI}`);
    const konten = page.locator("#konten");
    await expect(konten.getByRole("heading", { name: "Nomor Darurat", level: 1 })).toBeVisible();
    await expect(konten.getByText("Kelurahan Bulu Lor, Kota Semarang", { exact: true })).toBeVisible();
    await expect(konten.getByText(/Layanan 112 Kota Semarang sudah diluncurkan sejak/)).toBeVisible();
    await expect(konten.getByRole("note")).toHaveCount(0);
    // Board: header situs tidak tampil di HP (ada tombol Kembali).
    if (testInfo.project.name === "mobile") await expect(page.getByRole("banner")).toBeHidden();

    const utama = konten.getByRole("button", { name: /^112\s*Layanan darurat terpadu$/ });
    await utama.click();
    const konfirmasi = konten.getByRole("alertdialog", { name: "Telepon 112?" });
    await expect(konfirmasi.getByRole("button", { name: "Batal" })).toBeFocused();
    await expect(konfirmasi.getByRole("link", { name: "Ya, telepon" })).toHaveAttribute("href", "tel:112");
    await page.keyboard.press("Escape");
    await expect(konfirmasi).toHaveCount(0);
    await expect(utama).toBeFocused();

    const lainnya = konten.getByRole("region", { name: "Nomor lainnya" });
    await expect(lainnya.getByRole("listitem").first()).toContainText("BPBD Kota Semarang");
    await expect(lainnya.getByRole("listitem").first()).toContainText("Nomor belum tersedia");
    // D-051: Basarnas 115 dan Kepolisian 110, masing-masing bersumber resmi.
    await expect(lainnya.getByRole("button", { name: /^Basarnas.*115$/ })).toBeVisible();
    await expect(lainnya.getByRole("button", { name: /^Kepolisian.*110$/ })).toBeVisible();
    const sumber = konten.getByRole("region", { name: "Sumber nomor darurat nasional" });
    await expect(sumber.getByRole("link", { name: /Kabasarnas: Darurat SAR, Hubungi 115!/ })).toHaveAttribute(
      "href",
      "https://basarnas.go.id/berita/kabasarnas-darurat-sar-hubungi-115",
    );
    await expect(sumber.getByRole("link", { name: /Kontak Darurat", hal\. 82/ })).toHaveAttribute("href", /#page=84$/);
    await expect(konten.getByRole("region", { name: "Hubungi juga nomor darurat nasional" })).toHaveCount(0);
    await lainnya.getByRole("button", { name: /Call Center BNPB.*117/ }).click();
    await expect(konten.getByRole("alertdialog", { name: "Telepon 117?" }).getByRole("link", { name: "Ya, telepon" })).toHaveAttribute(
      "href",
      "tel:117",
    );
  });

  test("wilayah tanpa 112: catatan status, BPBD Provinsi DIY utama, 112 tetap ada", async ({ page }) => {
    await page.goto(`/kontak?wilayah=${DESA_TANPA_112}`);
    const konten = page.locator("#konten");
    await expect(konten.getByRole("note")).toContainText("Layanan 112 Kabupaten Kulon Progo belum tercatat diluncurkan.");
    await konten.getByRole("button", { name: /^\(0274\) 555585\s*BPBD Provinsi Daerah Istimewa Yogyakarta$/ }).click();
    await expect(konten.getByRole("link", { name: "Ya, telepon" })).toHaveAttribute("href", "tel:0274555585");
    await expect(konten.getByRole("link", { name: /Situs resmi BPBD DIY/ })).toHaveAttribute("href", "https://bpbd.jogjaprov.go.id/beranda");
    const lainnya = konten.getByRole("region", { name: "Nomor lainnya" });
    await expect(lainnya.getByRole("button", { name: /Layanan darurat terpadu.*112/ })).toBeVisible();
  });

  test("112 belum diluncurkan tanpa BPBD bernomor: 112 didampingi nomor nasional di atas (D-051)", async ({ page }) => {
    await page.goto(`/kontak?wilayah=${DESA_TANPA_112_TANPA_BPBD}`);
    const konten = page.locator("#konten");
    await expect(konten.getByRole("note")).toContainText('Layanan 112 di Kabupaten Nias masih berstatus "Uji Coba".');
    await expect(konten.getByRole("button", { name: /^112\s*Layanan darurat terpadu$/ })).toBeVisible();
    const pendamping = konten.getByRole("region", { name: "Hubungi juga nomor darurat nasional" });
    await expect(pendamping.getByRole("button")).toHaveCount(5);
    await pendamping.getByRole("button", { name: /^115\s*Basarnas/ }).click();
    await expect(pendamping.getByRole("alertdialog", { name: "Telepon 115?" }).getByRole("link", { name: "Ya, telepon" })).toHaveAttribute(
      "href",
      "tel:115",
    );
    const lainnya = konten.getByRole("region", { name: "Nomor lainnya" });
    await expect(lainnya.getByRole("listitem")).toHaveCount(2);
    await expect(lainnya.getByRole("listitem").first()).toContainText("BPBD Kabupaten Nias");
    await expect(lainnya.getByRole("listitem").first()).toContainText("Nomor belum tersedia");
  });

  test("tanpa wilayah: nomor nasional dan ajakan memilih wilayah", async ({ page }) => {
    await page.goto("/kontak");
    const konten = page.locator("#konten");
    await expect(konten.getByText(/Wilayah belum dipilih/)).toBeVisible();
    await expect(konten.getByRole("button", { name: /^112\s*Layanan darurat terpadu$/ })).toBeVisible();
    await expect(konten.getByRole("region", { name: "Nomor lainnya" }).getByRole("listitem")).toHaveCount(5);
  });
});

test("Informasi: riwayat kejadian punya tautan sumber; artikel umum bertanggal terbit", async ({ page }) => {
  await page.goto("/informasi");
  const riwayat = page.getByRole("region", { name: "Riwayat kejadian banjir" });
  const sumber = riwayat.getByRole("link", { name: /BNPB, 3 Januari 2020/ });
  await expect(sumber).toHaveAttribute("href", /^https:\/\/www\.bnpb\.go\.id\/berita\//);
  await expect(sumber).toHaveAttribute("target", "_blank");
  await expect(sumber).toHaveAttribute("rel", "noopener noreferrer");

  const umum = page.getByRole("region", { name: "Informasi umum" });
  await expect(umum.getByText(/^Terbit /).first()).toBeVisible();
  await umum.getByRole("link", { name: "Mengenal Risiko Banjir Luapan Citarum di Cekungan Bandung" }).click();
  await expect(page.getByText("bukan laporan kejadian banjir pada tanggal tertentu", { exact: false })).toBeVisible();
});

test("tidak ada scroll horizontal (mobile-first)", async ({ page }) => {
  for (const url of [
    `/?wilayah=${DESA_UJI}`,
    `/risiko?wilayah=${WILAYAH_SIMULASI}`,
    `/cuaca?wilayah=${DESA_UJI}`,
    "/informasi",
    "/pengaturan",
    `/kontak?wilayah=${DESA_TANPA_112}`,
  ]) {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    const lebar = await page.evaluate(() => ({ dokumen: document.documentElement.scrollWidth, layar: window.innerWidth }));
    expect(lebar.dokumen, `lebar halaman ${url}`).toBeLessThanOrEqual(lebar.layar);
  }
});

test.describe("PWA & keamanan", () => {
  test("manifest, ikon, service worker, dan halaman offline", async ({ page, request }) => {
    const manifest = await request.get("/manifest.json");
    expect(manifest.ok()).toBe(true);
    const isi = (await manifest.json()) as { display: string; icons: { src: string; purpose: string }[] };
    expect(isi.display).toBe("standalone");
    expect(isi.icons.some((i) => i.purpose === "maskable")).toBe(true);
    for (const i of isi.icons) expect((await request.get(i.src)).ok()).toBe(true);

    await page.goto("/offline");
    await expect(page.getByRole("heading", { name: "Anda sedang offline" })).toBeVisible();

    await page.goto("/");
    const swAktif = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      return Boolean(reg.active);
    });
    expect(swAktif).toBe(true);
  });

  test("halaman yang pernah dibuka tetap tampil saat offline; halaman baru → /offline", async ({ page, context }) => {
    await page.goto("/informasi");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); // navigasi kedua lewat SW → tersimpan di cache halaman
    await expect(page.getByRole("heading", { name: "Informasi", level: 1 })).toBeVisible();

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Informasi", level: 1 })).toBeVisible();
    await page.goto("/cuaca?wilayah=13.71.01.1001");
    await expect(page.getByRole("heading", { name: "Anda sedang offline" })).toBeVisible();
    await context.setOffline(false);
  });

  test("security headers", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).not.toContain("unsafe-eval");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("endpoint cron menolak tanpa CRON_SECRET", async ({ request }) => {
    expect((await request.get("/api/cron/update-weather")).status()).toBe(401);
  });
});
