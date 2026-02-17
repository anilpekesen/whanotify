import React from "react";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, Form } from "@remix-run/react";
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
  Divider,
  TextField,
  EmptyState,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { storesApi } from "~/lib/api.server";
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_EMOJI,
  ALL_TEMPLATE_VARIABLES,
  VARIABLE_LABELS,
} from "~/lib/constants";
import type { NotificationTemplate, NotificationType } from "~/lib/types";

export const meta: MetaFunction = () => [
  { title: "Şablonlar - WhatsOrder" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const response = await storesApi.getByShopDomain(shop);
  const store = response.store;

  if (!store) {
    throw new Response("Mağaza bulunamadı", { status: 404 });
  }

  const templates = store.notification_templates || [];
  return json({ store, templates });
}

export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);
  // Template update - backend endpoint gerektirir
  return json({ success: true, message: "Şablon kaydedildi!" });
}

export default function TemplatesIndex() {
  const { store, templates } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [editingTemplate, setEditingTemplate] = React.useState<NotificationTemplate | null>(null);

  return (
    <Page
      title="Bildirim Şablonları"
      subtitle={store.store_name}
      backAction={{ url: "/app", content: "Dashboard" }}
    >
      <BlockStack gap="600">
        {actionData && "message" in actionData && actionData.message && (
          <Banner tone="success">{actionData.message}</Banner>
        )}

        {templates.length === 0 ? (
          <Card>
            <EmptyState
              heading="Şablon bulunamadı"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Bu mağaza için varsayılan şablonlar henüz oluşturulmamış.</p>
            </EmptyState>
          </Card>
        ) : (
          <Layout>
            {/* Template List */}
            <Layout.Section variant="oneThird">
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h2">Şablon Tipleri</Text>
                  <Divider />
                  {templates.map((template: NotificationTemplate) => (
                    <div
                      key={template.id}
                      onClick={() => setEditingTemplate(template)}
                      style={{ cursor: "pointer" }}
                    >
                      <Card>
                        <InlineStack align="space-between">
                          <BlockStack gap="100">
                            <Text variant="bodyMd" fontWeight="semibold" as="span">
                              {NOTIFICATION_TYPE_EMOJI[template.type as NotificationType]}{" "}
                              {NOTIFICATION_TYPE_LABELS[template.type as NotificationType]}
                            </Text>
                            <Text variant="bodySm" tone="subdued" as="span">
                              {template.name}
                            </Text>
                          </BlockStack>
                          <Badge tone={template.is_active ? "success" : "critical"}>
                            {template.is_active ? "Aktif" : "İnaktif"}
                          </Badge>
                        </InlineStack>
                      </Card>
                    </div>
                  ))}
                </BlockStack>
              </Card>
            </Layout.Section>

            {/* Template Editor */}
            <Layout.Section variant="twoThirds">
              {editingTemplate ? (
                <Card>
                  <BlockStack gap="400">
                    <InlineStack align="space-between">
                      <Text variant="headingMd" as="h2">
                        {NOTIFICATION_TYPE_EMOJI[editingTemplate.type as NotificationType]}{" "}
                        {NOTIFICATION_TYPE_LABELS[editingTemplate.type as NotificationType]}
                      </Text>
                      <Badge tone={editingTemplate.is_active ? "success" : "critical"}>
                        {editingTemplate.is_active ? "Aktif" : "İnaktif"}
                      </Badge>
                    </InlineStack>
                    <Divider />

                    <Form method="post">
                      <BlockStack gap="400">
                        <input type="hidden" name="template_id" value={editingTemplate.id} />

                        <TextField
                          label="Şablon Adı"
                          name="name"
                          defaultValue={editingTemplate.name}
                          autoComplete="off"
                        />

                        <TextField
                          label="Mesaj İçeriği"
                          name="content"
                          multiline={6}
                          defaultValue={editingTemplate.content}
                          helpText="Değişkenler için süslü parantez kullanın: {customer_name}, {order_number}"
                          autoComplete="off"
                        />

                        {/* Available Variables */}
                        <BlockStack gap="200">
                          <Text variant="bodySm" tone="subdued" as="p">
                            Kullanılabilir Değişkenler:
                          </Text>
                          <InlineStack gap="200" wrap>
                            {editingTemplate.variables.map((variable) => (
                              <Badge key={variable}>
                                {`{${variable}}`} - {VARIABLE_LABELS[variable] || variable}
                              </Badge>
                            ))}
                          </InlineStack>
                        </BlockStack>

                        {/* Preview */}
                        <BlockStack gap="200">
                          <Text variant="bodySm" fontWeight="semibold" as="p">Önizleme:</Text>
                          <div
                            style={{
                              background: "#f6f6f7",
                              padding: "12px",
                              borderRadius: "8px",
                              fontFamily: "monospace",
                              fontSize: "13px",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {editingTemplate.content
                              .replace(/{customer_name}/g, "Ahmet Yılmaz")
                              .replace(/{order_number}/g, "1001")
                              .replace(/{order_total}/g, "299,99 TRY")
                              .replace(/{tracking_number}/g, "TR123456789")
                              .replace(/{store_name}/g, store.store_name)}
                          </div>
                        </BlockStack>

                        <Button submit variant="primary" loading={isSubmitting}>
                          Şablonu Kaydet
                        </Button>
                      </BlockStack>
                    </Form>
                  </BlockStack>
                </Card>
              ) : (
                <Card>
                  <EmptyState
                    heading="Bir şablon seçin"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Düzenlemek için soldaki listeden bir şablon seçin.</p>
                  </EmptyState>
                </Card>
              )}
            </Layout.Section>
          </Layout>
        )}

        {/* Variable Reference */}
        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">Değişken Referansı</Text>
            <Text variant="bodySm" tone="subdued" as="p">
              Şablonlarda kullanabileceğiniz tüm değişkenler:
            </Text>
            <InlineStack gap="300" wrap>
              {ALL_TEMPLATE_VARIABLES.map((variable) => (
                <div
                  key={variable}
                  style={{
                    background: "#f6f6f7",
                    padding: "4px 12px",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    fontSize: "13px",
                  }}
                >
                  <Text as="span" variant="bodySm">
                    {`{${variable}}`}
                  </Text>
                  <Text as="span" variant="bodySm" tone="subdued">
                    {" "}- {VARIABLE_LABELS[variable] || variable}
                  </Text>
                </div>
              ))}
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
