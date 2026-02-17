import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Button,
  Banner,
  ProgressBar,
  EmptyState,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { storesApi } from "~/lib/api.server";
import { formatNumber, formatDate } from "~/lib/utils/formatters";
import { STATUS_LABELS, STATUS_TONES, PLANS } from "~/lib/constants";

export const meta: MetaFunction = () => [
  { title: "WhatsOrder Dashboard" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  // Shopify OAuth authentication - session.shop mağaza domain'ini verir
  const { session } = await authenticate.admin(request);
  const shop = session.shop; // örn: "merchant.myshopify.com"

  try {
    const response = await storesApi.getByShopDomain(shop);
    const store = response.store || null;

    if (!store) {
      // İlk kurulum - store henüz Laravel'de yok
      return redirect("/app/setup");
    }

    const subscription = store.subscription;
    const usagePercent = subscription
      ? Math.round(
          (subscription.messages_sent_this_month / subscription.monthly_message_limit) * 100
        )
      : 0;

    return json({ store, shop, usagePercent });
  } catch (error: unknown) {
    // 404 → store yok, kurulum sayfasına yönlendir
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("404") || msg.includes("not found")) {
      return redirect("/app/setup");
    }
    // Diğer hatalar (Laravel kapalı vb.) - kullanıcıya göster
    return json({ store: null, shop, usagePercent: 0 });
  }
}

export default function AppIndex() {
  const { store, shop, usagePercent } = useLoaderData<typeof loader>();

  if (!store) {
    return (
      <Page title="Hoş Geldiniz">
        <Card>
          <EmptyState
            heading="WhatsOrder kurulumu tamamlanmamış"
            action={{ content: "Kurulumu Başlat", url: "/app/setup" }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>
              <strong>{shop}</strong> mağazası için WhatsApp bildirimleri henüz
              yapılandırılmamış. Başlamak için kurulum adımlarını tamamlayın.
            </p>
          </EmptyState>
        </Card>
      </Page>
    );
  }

  const subscription = store.subscription;
  const whatsapp = store.whatsapp_account;

  return (
    <Page title="Dashboard">
      <BlockStack gap="600">
        {/* Durum Kartları */}
        <Layout>
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text variant="bodySm" tone="subdued" as="p">
                  Mağaza Durumu
                </Text>
                <Badge tone={store.is_active ? "success" : "critical"}>
                  {store.is_active ? "Aktif" : "İnaktif"}
                </Badge>
                <Text variant="bodySm" as="p">{shop}</Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text variant="bodySm" tone="subdued" as="p">
                  WhatsApp
                </Text>
                <Badge tone={whatsapp?.is_verified ? "success" : "attention"}>
                  {whatsapp?.is_verified ? "Bağlı ✓" : "Bağlı Değil"}
                </Badge>
                {!whatsapp && (
                  <Link to="/app/whatsapp">
                    <Button variant="primary" size="slim">
                      Bağla
                    </Button>
                  </Link>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text variant="bodySm" tone="subdued" as="p">
                  Bu Ay Mesaj
                </Text>
                <Text variant="heading2xl" as="p">
                  {formatNumber(subscription?.messages_sent_this_month || 0)}
                </Text>
                <Text variant="bodySm" as="p">
                  / {formatNumber(subscription?.monthly_message_limit || 0)} limit
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Kullanım Çubuğu */}
        {subscription && (
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text variant="headingMd" as="h2">
                  Mesaj Kullanımı
                </Text>
                <InlineStack gap="200">
                  <Badge tone={STATUS_TONES[subscription.status]}>
                    {STATUS_LABELS[subscription.status]}
                  </Badge>
                  <Badge>{PLANS[subscription.plan]?.name}</Badge>
                </InlineStack>
              </InlineStack>
              <ProgressBar
                progress={usagePercent}
                tone={
                  usagePercent > 90
                    ? "critical"
                    : usagePercent > 70
                    ? "attention"
                    : "success"
                }
              />
              <Text variant="bodySm" tone="subdued" as="p">
                {formatNumber(
                  subscription.monthly_message_limit -
                    subscription.messages_sent_this_month
                )}{" "}
                mesaj kaldı · {usagePercent}% kullanıldı
              </Text>
            </BlockStack>
          </Card>
        )}

        {/* Eksik Yapılandırma Uyarısı */}
        {!whatsapp && (
          <Banner tone="warning">
            <BlockStack gap="200">
              <Text variant="headingMd" as="h2">
                WhatsApp yapılandırması gerekli
              </Text>
              <Text as="p">
                Sipariş bildirimlerini göndermek için WhatsApp Business hesabınızı
                bağlamanız gerekiyor.
              </Text>
              <Link to="/app/whatsapp">
                <Button variant="primary">WhatsApp Bağla</Button>
              </Link>
            </BlockStack>
          </Banner>
        )}

        {/* Hızlı Erişim */}
        <Layout>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">
                  Hızlı Erişim
                </Text>
                <BlockStack gap="200">
                  <Link to="/app/whatsapp">
                    <Button fullWidth>WhatsApp Yapılandır</Button>
                  </Link>
                  <Link to="/app/templates">
                    <Button fullWidth>Şablonları Düzenle</Button>
                  </Link>
                  <Link to="/app/subscription">
                    <Button fullWidth>Abonelik Yönet</Button>
                  </Link>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Mağaza Bilgisi
                </Text>
                <Text variant="bodySm" tone="subdued" as="p">
                  Eklenme: {formatDate(store.created_at)}
                </Text>
                <Text variant="bodySm" tone="subdued" as="p">
                  Para Birimi: {store.currency}
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
