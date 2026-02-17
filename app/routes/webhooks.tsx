import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

/**
 * Shopify Webhook Handler
 *
 * GDPR zorunlu webhook'lar (App Store şartı):
 * - APP_UNINSTALLED: Uygulama kaldırıldı
 * - CUSTOMERS_DATA_REQUEST: Müşteri verilerini talep etti
 * - CUSTOMERS_REDACT: Müşteri verilerini sil
 * - SHOP_REDACT: Tüm mağaza verilerini sil (uninstall'dan 48 saat sonra)
 *
 * Shopify webhook'ları HMAC imzasıyla doğrular, authenticate.webhook() bunu otomatik yapar.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session } = await authenticate.webhook(request);

  switch (topic) {
    case "APP_UNINSTALLED":
      // Mağaza uygulamayı kaldırdı - Laravel'e bildir ve store'u devre dışı bırak
      if (session) {
        await fetch(`${process.env.API_URL}/stores/uninstall`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop }),
        }).catch((err) => {
          console.error(`APP_UNINSTALLED webhook - Laravel bildirim hatası: ${err}`);
        });
      }
      break;

    case "CUSTOMERS_DATA_REQUEST":
      // GDPR: Müşteri kendi verilerini talep etti
      // TODO: Müşteri verilerini (notification_logs) dışa aktarın
      console.log(`[GDPR] CUSTOMERS_DATA_REQUEST for shop: ${shop}`);
      break;

    case "CUSTOMERS_REDACT":
      // GDPR: Müşteri verilerinin silinmesi talep edildi
      // TODO: notification_logs tablosundan müşteri verilerini silin
      console.log(`[GDPR] CUSTOMERS_REDACT for shop: ${shop}`);
      break;

    case "SHOP_REDACT":
      // GDPR: Tüm mağaza verilerini sil (uninstall'dan 48 saat sonra)
      // TODO: Bu mağazaya ait tüm verileri (store, logs, templates) silin
      console.log(`[GDPR] SHOP_REDACT for shop: ${shop}`);
      break;

    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  // Shopify 200 OK yanıtı bekler - boş Response döndür
  throw new Response();
};
