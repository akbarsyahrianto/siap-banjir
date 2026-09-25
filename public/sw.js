/* Service worker Siap Banjir: menerima Web Push dan membuka deep link saat notifikasi diklik.
 * Cache offline (PWA) ditambahkan di Fase 5. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  /** @type {{ judul?: string, pesan?: string, url?: string, tag?: string, level?: string }} */
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { pesan: event.data.text() };
    }
  }

  const judul = data.judul || "Siap Banjir";
  event.waitUntil(
    self.registration.showNotification(judul, {
      body: data.pesan || "Ada pembaruan risiko banjir di wilayah Anda.",
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: data.tag || "siap-banjir",
      renotify: Boolean(data.tag),
      // Risiko TINGGI tetap tampil sampai pengguna menanggapinya.
      requireInteraction: data.level === "TINGGI",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const tujuan = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((jendela) => {
      for (const klien of jendela) {
        if (new URL(klien.url).origin === self.location.origin && "focus" in klien) {
          return klien.navigate(tujuan).then((k) => (k ? k.focus() : self.clients.openWindow(tujuan)));
        }
      }
      return self.clients.openWindow(tujuan);
    }),
  );
});
