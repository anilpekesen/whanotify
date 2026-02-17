import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  BlockStack,
  Text,
  Badge,
  Divider,
  InlineStack,
} from "@shopify/polaris";
import { z } from "zod";
import { authenticate } from "~/shopify.server";
import { storesApi, whatsappApi } from "~/lib/api.server";
import { formatPhoneNumber, formatDate } from "~/lib/utils/formatters";

export const meta: MetaFunction = () => [
  { title: "WhatsApp Yapılandırma - WhatsOrder" },
];

const WhatsAppSchema = z.object({
  business_account_id: z.string().min(1, "Business Account ID gerekli"),
  phone_number_id: z.string().min(1, "Phone Number ID gerekli"),
  phone_number: z
    .string()
    .min(10, "Geçerli telefon numarası girin")
    .regex(/^\d+$/, "Sadece rakam girin (örn: 905551234567)"),
  access_token: z.string().min(1, "Access Token gerekli"),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const response = await storesApi.getByShopDomain(shop);
  const store = response.store;

  if (!store) {
    throw new Response("Mağaza bulunamadı", { status: 404 });
  }

  const whatsapp = store.whatsapp_account || null;
  return json({ store, whatsapp });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const storeResponse = await storesApi.getByShopDomain(shop);
  const store = storeResponse.store;

  if (!store) {
    throw new Response("Mağaza bulunamadı", { status: 404 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // Handle test message
  if (intent === "test_message") {
    const phone = formData.get("test_phone") as string;
    const message = formData.get("test_message") as string;
    try {
      await whatsappApi.testMessage({ store_id: store.id, phone, message });
      return json({ success: true, message: "Test mesajı gönderildi!" });
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : "Hata oluştu" },
        { status: 400 }
      );
    }
  }

  // Handle deactivate
  if (intent === "deactivate") {
    await whatsappApi.deactivate(store.id);
    return json({ success: true, message: "WhatsApp hesabı devre dışı bırakıldı" });
  }

  // Handle configure/update
  const rawData = {
    business_account_id: formData.get("business_account_id") as string,
    phone_number_id: formData.get("phone_number_id") as string,
    phone_number: formData.get("phone_number") as string,
    access_token: formData.get("access_token") as string,
  };

  const result = WhatsAppSchema.safeParse(rawData);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      if (issue.path[0]) errors[issue.path[0] as string] = issue.message;
    });
    return json({ errors, values: rawData }, { status: 400 });
  }

  try {
    await whatsappApi.configure({
      store_id: store.id,
      ...result.data,
    });
    return json({ success: true, message: "WhatsApp yapılandırması kaydedildi!" });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Hata oluştu" },
      { status: 500 }
    );
  }
}

export default function WhatsAppConfig() {
  const { store, whatsapp } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const errors = (actionData && "errors" in actionData) ? actionData.errors : {};
  const values = (actionData && "values" in actionData) ? actionData.values : {};

  return (
    <Page
      title="WhatsApp Yapılandırma"
      subtitle={store.store_name}
      backAction={{ url: "/app", content: "Dashboard" }}
    >
      <BlockStack gap="600">
        {/* Success/Error Messages */}
        {actionData && "message" in actionData && actionData.message && (
          <Banner tone="success">{actionData.message}</Banner>
        )}
        {actionData && "error" in actionData && actionData.error && (
          <Banner tone="critical">{actionData.error}</Banner>
        )}

        <Layout>
          {/* Configuration Form */}
          <Layout.Section variant="twoThirds">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  {whatsapp ? "WhatsApp Hesabını Güncelle" : "WhatsApp Hesabı Bağla"}
                </Text>
                <Banner tone="info">
                  Meta Business Manager üzerinden aşağıdaki bilgileri alabilirsiniz.
                  WhatsApp Business API kullanmak için onaylı bir hesabınız olmalıdır.
                </Banner>
                <Form method="post">
                  <FormLayout>
                    <TextField
                      label="Business Account ID"
                      name="business_account_id"
                      defaultValue={(values as any)?.business_account_id || whatsapp?.business_account_id || ""}
                      error={(errors as any)?.business_account_id}
                      placeholder="123456789012345"
                      helpText="Meta Business Manager > WhatsApp > Hesap"
                      autoComplete="off"
                    />
                    <TextField
                      label="Phone Number ID"
                      name="phone_number_id"
                      defaultValue={(values as any)?.phone_number_id || whatsapp?.phone_number_id || ""}
                      error={(errors as any)?.phone_number_id}
                      placeholder="123456789012345"
                      helpText="WhatsApp Business hesabınıza bağlı telefon numarasının ID'si"
                      autoComplete="off"
                    />
                    <TextField
                      label="Telefon Numarası"
                      name="phone_number"
                      defaultValue={(values as any)?.phone_number || whatsapp?.phone_number || ""}
                      error={(errors as any)?.phone_number}
                      placeholder="905551234567"
                      helpText="Uluslararası formatta, başında + olmadan (örn: 905551234567)"
                      autoComplete="off"
                    />
                    <TextField
                      label="Access Token"
                      name="access_token"
                      type="password"
                      defaultValue=""
                      error={(errors as any)?.access_token}
                      helpText="Meta Business Manager > WhatsApp > API Yapılandırması"
                      autoComplete="off"
                    />
                    <Button submit variant="primary" loading={isSubmitting}>
                      {whatsapp ? "Güncelle" : "Bağla"}
                    </Button>
                  </FormLayout>
                </Form>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Status & Test */}
          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              {/* Current Status */}
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h2">Mevcut Durum</Text>
                  <Divider />
                  {whatsapp ? (
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text tone="subdued" as="span">Doğrulama</Text>
                        <Badge tone={whatsapp.is_verified ? "success" : "attention"}>
                          {whatsapp.is_verified ? "Doğrulandı" : "Bekliyor"}
                        </Badge>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text tone="subdued" as="span">Durum</Text>
                        <Badge tone={whatsapp.is_active ? "success" : "critical"}>
                          {whatsapp.is_active ? "Aktif" : "İnaktif"}
                        </Badge>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text tone="subdued" as="span">Telefon</Text>
                        <Text as="span">{formatPhoneNumber(whatsapp.phone_number)}</Text>
                      </InlineStack>
                      {whatsapp.verified_at && (
                        <InlineStack align="space-between">
                          <Text tone="subdued" as="span">Doğrulanma</Text>
                          <Text as="span">{formatDate(whatsapp.verified_at)}</Text>
                        </InlineStack>
                      )}
                      <Divider />
                      {whatsapp.is_active && (
                        <Form method="post">
                          <input type="hidden" name="intent" value="deactivate" />
                          <Button submit tone="critical" loading={isSubmitting} fullWidth>
                            Devre Dışı Bırak
                          </Button>
                        </Form>
                      )}
                    </BlockStack>
                  ) : (
                    <Banner tone="attention">
                      Henüz WhatsApp hesabı bağlanmamış.
                    </Banner>
                  )}
                </BlockStack>
              </Card>

              {/* Test Message */}
              {whatsapp && whatsapp.is_active && (
                <Card>
                  <BlockStack gap="300">
                    <Text variant="headingMd" as="h2">Test Mesajı Gönder</Text>
                    <Form method="post">
                      <FormLayout>
                        <input type="hidden" name="intent" value="test_message" />
                        <TextField
                          label="Test Telefon Numarası"
                          name="test_phone"
                          placeholder="905551234567"
                          autoComplete="off"
                        />
                        <TextField
                          label="Test Mesajı"
                          name="test_message"
                          multiline={3}
                          defaultValue="Merhaba! Bu WhatsOrder'dan bir test mesajıdır. 🎉"
                          autoComplete="off"
                        />
                        <Button submit loading={isSubmitting} fullWidth>
                          Test Gönder
                        </Button>
                      </FormLayout>
                    </Form>
                  </BlockStack>
                </Card>
              )}
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
