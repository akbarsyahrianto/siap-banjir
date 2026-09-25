import { expect, test } from "@playwright/test";
import { identitasUji, stubPush, WILAYAH_SIMULASI } from "./bantuan";

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
    await expect(page.getByRole("heading", { name: "Siap Banjir", level: 1 })).toBeVisible();
    await expect(page.getByText("Pilih wilayah terlebih dulu")).toBeVisible();
  });

  await test.step("aturLokasi(wilayah) → dialog izin notifikasi muncul", async () => {
    await page.getByLabel("Wilayah yang dipantau").selectOption("kota-semarang");
    await expect(page).toHaveURL(/wilayah=kota-semarang/);
    await expect(page.getByRole("dialog", { name: "Aktifkan peringatan banjir?" })).toBeVisible();
  });

  await test.step("[izin notifikasi] → daftarkanPerangkat() → aktifkan() → status aktif", async () => {
    await page.getByRole("button", { name: "Izinkan notifikasi" }).click();
    await expect(page.getByText("Peringatan aktif untuk Kota Semarang.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Peringatan aktif/ })).toBeVisible();
    expect(await statusLangganan()).toMatchObject({ status: true, idWilayah: "kota-semarang", levelMinimum: "SEDANG" });
  });

  await test.step("Beranda menampilkan cuaca, level risiko, dan grafik", async () => {
    await expect(page.getByText(/^Risiko (Rendah|Sedang|Tinggi)$/).first()).toBeVisible();
    await expect(page.getByText(/Cuaca terkini · Kota Semarang/)).toBeVisible();
    await expect(page.getByText("Curah hujan 48 jam")).toBeVisible();
    await expect(page.getByText("Data cuaca: Open-Meteo.com").first()).toBeVisible();
  });

  await test.step("Detail risiko: gauge, penanganan, checklist tersimpan", async () => {
    await page.getByRole("link", { name: "Lihat persiapan & rekomendasi" }).click();
    await expect(page).toHaveURL(/\/risiko\?wilayah=kota-semarang/);
    await expect(page.getByRole("img", { name: /Skor risiko \d+ dari 100/ })).toBeVisible();
    await expect(page.getByText(/bukan peringatan resmi/).first()).toBeVisible();

    await expect(page.getByRole("tab", { name: "Checklist Siaga" })).toHaveAttribute("aria-selected", "true");
    const pertama = page.getByRole("tabpanel").getByRole("checkbox").first();
    await pertama.check();
    await expect(pertama).toBeChecked();
    await page.reload();
    await expect(page.getByRole("tabpanel").getByRole("checkbox").first()).toBeChecked();

    await page.getByRole("tab", { name: "Detail Mitigasi" }).click();
    await expect(page.getByRole("tabpanel").getByRole("listitem").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Layanan Darurat\s*112/ })).toHaveAttribute("href", "tel:112");
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

test("Gunakan lokasi saya memilih wilayah terdekat", async ({ page, context }) => {
  await context.setGeolocation({ latitude: -6.98, longitude: 110.41 }); // Semarang
  await page.goto("/cuaca");
  await page.getByRole("button", { name: "Gunakan lokasi saya" }).click();
  await expect(page.getByText(/Wilayah terdekat: Kota Semarang/)).toBeVisible();
  await expect(page).toHaveURL(/wilayah=kota-semarang/);
  await expect(page.getByRole("heading", { name: "Prakiraan harian" })).toBeVisible();
});

test.describe("state machine risiko (wilayah disimulasikan TINGGI)", () => {
  test("Bahaya → jalur push & grafik → join → Detail Penanganan → Final (ditutup)", async ({ page }) => {
    await page.goto(`/risiko?wilayah=${WILAYAH_SIMULASI}`);
    await expect(page.getByRole("alert").filter({ hasText: /Bahaya potensi banjir terdeteksi|Ikuti langkah penanganan/ })).toBeVisible();

    // Perangkat tidak berlangganan wilayah ini → peringatan dalam aplikasi.
    await expect(page.getByText(/Risiko banjir TINGGI di Kota Pekalongan/)).toBeVisible();
    // Kedua jalur selesai → join → Detail Penanganan.
    await expect(page.getByText("Detail penanganan", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Penanganan \(risiko tinggi\)/ })).toBeFocused();
    await expect(page.getByRole("button", { name: "Aktifkan notifikasi push untuk wilayah ini" })).toBeVisible();

    await page.getByRole("button", { name: "Tutup peringatan" }).click();
    await expect(page.getByText("Peringatan ditutup")).toBeVisible();
    await expect(page.getByText("Selesai", { exact: true })).toBeVisible();
  });

  test("deep link notifikasi #penanganan langsung ke Detail Penanganan", async ({ page }) => {
    await page.goto(`/risiko?wilayah=${WILAYAH_SIMULASI}#penanganan`);
    await expect(page.getByText("Detail penanganan", { exact: true })).toBeVisible();
    await expect(page.getByText("Ikuti langkah penanganan di bawah")).toBeVisible();
  });
});

test("tidak ada scroll horizontal (mobile-first)", async ({ page }) => {
  for (const url of [
    "/?wilayah=kota-semarang",
    `/risiko?wilayah=${WILAYAH_SIMULASI}`,
    "/cuaca?wilayah=kota-semarang",
    "/informasi",
    "/pengaturan",
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
    await page.goto("/cuaca?wilayah=kota-medan");
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
