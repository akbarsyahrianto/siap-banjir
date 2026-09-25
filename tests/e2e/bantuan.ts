import type { Page, TestInfo } from "@playwright/test";

/** Wilayah yang disimulasikan berisiko TINGGI oleh global-setup. */
export const WILAYAH_SIMULASI = "kota-pekalongan";

/** Token perangkat & endpoint push tetap per project, agar bisa dibersihkan di teardown. */
export function identitasUji(testInfo: TestInfo) {
  const akhiran = testInfo.project.name === "mobile" ? "e2e1" : "e2e2";
  return {
    deviceToken: `00000000-0000-4000-8000-00000000${akhiran}`,
    endpoint: `https://fcm.googleapis.com/fcm/send/uji-e2e-siapbanjir-${akhiran}`,
  };
}

export const DEVICE_TOKEN_UJI = ["00000000-0000-4000-8000-00000000e2e1", "00000000-0000-4000-8000-00000000e2e2"];

/**
 * Chromium headless tidak bisa berlangganan ke push service sungguhan dan selalu melaporkan
 * izin notifikasi "denied". Notification.permission/requestPermission dan PushManager di-stub
 * dengan subscription sintetis (endpoint FCM + kunci valid secara format);
 * semua request ke server Siap Banjir tetap asli.
 */
export async function stubPush(page: Page, testInfo: TestInfo) {
  const { deviceToken, endpoint } = identitasUji(testInfo);
  await page.addInitScript(
    ({ deviceToken, endpoint }) => {
      localStorage.setItem("siapbanjir_device", deviceToken);
      const palsu = {
        endpoint,
        expirationTime: null,
        options: { userVisibleOnly: true, applicationServerKey: null },
        getKey: () => null,
        unsubscribe: async () => {
          localStorage.removeItem("e2e_langganan");
          return true;
        },
        toJSON: () => ({
          endpoint,
          expirationTime: null,
          keys: { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u", auth: "tBHItJI5svbpez7KI4CCXg" },
        }),
      };
      // Chromium headless selalu melaporkan Notification.permission = "denied".
      // Simulasikan pengguna baru: "default" sampai requestPermission() dipanggil.
      Object.defineProperty(Notification, "permission", {
        configurable: true,
        get: () => (localStorage.getItem("e2e_izin") as NotificationPermission | null) ?? "default",
      });
      Notification.requestPermission = async () => {
        localStorage.setItem("e2e_izin", "granted");
        return "granted";
      };
      PushManager.prototype.subscribe = async function () {
        localStorage.setItem("e2e_langganan", "1");
        return palsu as unknown as PushSubscription;
      };
      PushManager.prototype.getSubscription = async function () {
        return (localStorage.getItem("e2e_langganan") === "1" ? palsu : null) as unknown as PushSubscription | null;
      };
    },
    { deviceToken, endpoint },
  );
}
