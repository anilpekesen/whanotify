import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation, useLoaderData } from "@remix-run/react";
import {
  Page,
  Card,
  Text,
  BlockStack,
  Button,
  Banner,
  List,
  InlineStack,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { storesApi } from "~/lib/api.server";

export const meta: MetaFunction = () => [
  { title: "WhatsOrder Kurulum" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Eğer store zaten varsa dashboard'a yönlendir
  try {
    const response = await storesApi.getByShopDomain(shop);
    if (response.store) {
      return redirect("/app");
    }
  } catch {
    // Store yok, kuruluma devam et
  }

  return json({ shop });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    // Shopify GraphQL API'den mağaza bilgilerini al
    const shopResponse = await admin.graphql(`
      {
        shop {
          name
          email
          currencyCode
          ianaTimezone
          myshopifyDomain
        }
      }
    `);

    const shopData = await shopResponse.json();
    const shopInfo = shopData.data?.shop;

    if (!shopInfo) {
      return json(
        { error: "Mağaza bilgileri alınamadı. Lütfen tekrar deneyin." },
        { status: 500 }
      );
    }

    // Laravel backend'e store kaydet
    await storesApi.create({
      shopify_domain: shop,
      shopify_store_id: session.id,
      shopify_access_token: session.accessToken || "",
      store_name: shopInfo.name,
      email: shopInfo.email,
      currency: shopInfo.currencyCode,
      timezone: shopInfo.ianaTimezone,
    });

    return redirect("/app");
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kurulum sırasında bir hata oluştu. Lütfen tekrar deneyin.",
      },
      { status: 500 }
    );
  }
}

export default function SetupPage() {
  const { shop } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Page title="WhatsOrder'a Hoş Geldiniz">
      <BlockStack gap="600">
        {/* Welcome Card */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text variant="headingLg" as="h2">
                Mağazanızı Kaydedin
              </Text>
              <Badge tone="info">{shop}</Badge>
            </InlineStack>

            <Text as="p" tone="subdued">
              WhatsOrder'ı kullanmaya başlamak için mağazanızın bir kez kayıt edilmesi
              gerekiyor. Bu işlem otomatik olarak gerçekleşir ve birkaç saniye sürer.
            </Text>

            <Banner tone="info">
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Kurulum tamamlandığında:</Text>
                <List>
                  <List.Item>Mağazanız WhatsOrder'a kaydedilir</List.Item>
                  <List.Item>Ücretsiz deneme planı (100 mesaj/ay) otomatik başlatılır</List.Item>
                  <List.Item>Varsayılan bildirim şablonları oluşturulur</List.Item>
                  <List.Item>WhatsApp Business hesabınızı bağlamaya hazır olursunuz</List.Item>
                </List>
              </BlockStack>
            </Banner>

            {actionData && "error" in actionData && actionData.error && (
              <Banner tone="critical">
                <Text as="p">{actionData.error}</Text>
              </Banner>
            )}

            <Form method="post">
              <Button
                submit
                variant="primary"
                size="large"
                loading={isSubmitting}
                fullWidth
              >
                {isSubmitting ? "Kurulum yapılıyor..." : "Kurulumu Başlat"}
              </Button>
            </Form>
          </BlockStack>
        </Card>

        {/* What happens next */}
        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">Sonraki Adımlar</Text>
            <List type="number">
              <List.Item>
                <Text as="span" fontWeight="semibold">WhatsApp Business Hesabı Bağla</Text>
                {" "}- Meta Business Manager'dan API bilgilerinizi girin
              </List.Item>
              <List.Item>
                <Text as="span" fontWeight="semibold">Bildirim Şablonlarını Özelleştir</Text>
                {" "}- Sipariş durumu mesajlarını kendi markanıza göre ayarlayın
              </List.Item>
              <List.Item>
                <Text as="span" fontWeight="semibold">Test Bildirimi Gönderin</Text>
                {" "}- Her şeyin düzgün çalıştığını doğrulayın
              </List.Item>
            </List>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
